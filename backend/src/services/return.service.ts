import { ReturnModel, type ReturnRequestRecord, type ReturnStatus } from "../models/return.model";
import { OrderModel } from "../models/order.model";
import { PaymentModel } from "../models/payment.model";
import { ProductModel } from "../models/product.model";
import { InventoryMovementModel } from "../models/inventory-movement.model";
import { ApiError } from "../utils/ApiError";
import { buildMeta } from "../utils/pagination";
import { query, withTransaction } from "../config/db";
import { NotificationService } from "../notifications/notification.service";
import { WalletService } from "./wallet.service";

function serializeReturn(ret: ReturnRequestRecord) {
  return {
    id: ret.id,
    orderId: ret.order_id,
    orderItemId: ret.order_item_id,
    userId: ret.user_id,
    reason: ret.reason,
    customerNotes: ret.customer_notes,
    adminNotes: ret.admin_notes,
    status: ret.status,
    restockedAt: ret.restocked_at,
    createdAt: ret.created_at,
    updatedAt: ret.updated_at
  };
}

async function restockForReturn(ret: ReturnRequestRecord): Promise<ReturnRequestRecord | null> {
  return withTransaction(async (client) => {
    const marked = await ReturnModel.markRestockedWithClient(client, ret.id);
    if (!marked) return null;

    const items = await OrderModel.findItemsByOrderIdWithClient(client, ret.order_id);
    const itemsToRestock = ret.order_item_id ? items.filter((item) => item.id === ret.order_item_id) : items;

    for (const item of itemsToRestock) {
      if (item.product_id) {
        const updated = await ProductModel.incrementStockForColor(client, item.product_id, item.quantity, item.color);
        if (updated) {
          await InventoryMovementModel.create(client, {
            productId: item.product_id,
            previousStock: updated.stock - item.quantity,
            quantityChange: item.quantity,
            newStock: updated.stock,
            movementType: "return",
            orderId: ret.order_id,
            reason: `Return ${ret.id} received`
          });
        }
      }
    }

    return marked;
  });
}

const ADMIN_TRANSITIONS: Record<ReturnStatus, ReturnStatus[]> = {
  requested: ["approved", "rejected"],
  approved: ["shipped_back", "cancelled"],
  rejected: [],
  shipped_back: ["received"],
  received: ["refunded"],
  refunded: [],
  cancelled: []
};

export const ReturnService = {
  async requestReturn(input: {
    orderId: string;
    orderItemId?: string;
    userId: string;
    reason: string;
    customerNotes?: string;
  }) {
    const order = await OrderModel.findById(input.orderId);
    if (!order) throw ApiError.notFound(`Order ${input.orderId} not found`);
    if (order.user_id !== input.userId) {
      throw ApiError.forbidden("You do not have permission to request a return for this order");
    }
    if (order.status !== "Delivered") {
      throw ApiError.badRequest("Only delivered orders are eligible for a return");
    }

    if (input.orderItemId) {
      const items = await OrderModel.findItemsByOrderId(input.orderId);
      if (!items.some((item) => item.id === input.orderItemId)) {
        throw ApiError.badRequest("That item does not belong to this order");
      }
    }

    const existing = await ReturnModel.findByOrderId(input.orderId);
    const activeExisting = existing.find((r) => !["rejected", "cancelled", "refunded"].includes(r.status));
    if (activeExisting && !input.orderItemId) {
      throw ApiError.badRequest("A return request is already in progress for this order");
    }

    const created = await ReturnModel.create({
      orderId: input.orderId,
      orderItemId: input.orderItemId ?? null,
      userId: input.userId,
      reason: input.reason,
      customerNotes: input.customerNotes ?? null
    });
    return serializeReturn(created);
  },

  async listMine(userId: string) {
    const returns = await ReturnModel.findByUserId(userId);
    return returns.map(serializeReturn);
  },

  async list(query_: { status?: ReturnStatus; page?: number; limit?: number }) {
    const page = query_.page ?? 1;
    const limit = query_.limit ?? 20;
    const offset = (page - 1) * limit;
    const { rows, total } = await ReturnModel.findMany({ status: query_.status, limit, offset });
    return { data: rows.map(serializeReturn), meta: buildMeta(page, limit, total) };
  },

  async getById(id: string, requesterId: string | null, isAdmin: boolean) {
    const ret = await ReturnModel.findById(id);
    if (!ret) throw ApiError.notFound("Return request not found");
    if (!isAdmin && ret.user_id !== requesterId) {
      throw ApiError.forbidden("You do not have permission to view this return request");
    }
    return serializeReturn(ret);
  },

  async cancel(id: string, userId: string) {
    const ret = await ReturnModel.findById(id);
    if (!ret) throw ApiError.notFound("Return request not found");
    if (ret.user_id !== userId) throw ApiError.forbidden("You do not have permission to cancel this return");
    if (ret.status !== "requested") {
      throw ApiError.badRequest("Only a pending return request can be cancelled");
    }
    const updated = await ReturnModel.updateStatus(id, { status: "cancelled" });
    return serializeReturn(updated!);
  },

  async updateStatus(
    id: string,
    status: ReturnStatus,
    adminNotes?: string,
    refundMethod: "original" | "wallet" = "original"
  ) {
    const ret = await ReturnModel.findById(id);
    if (!ret) throw ApiError.notFound("Return request not found");

    const allowed = ADMIN_TRANSITIONS[ret.status] ?? [];
    if (!allowed.includes(status)) {
      throw ApiError.badRequest(`A return in "${ret.status}" status cannot move to "${status}"`);
    }

    const updated = await ReturnModel.updateStatus(id, { status, adminNotes });
    if (!updated) throw ApiError.notFound("Return request not found");

    if (status === "received") {
      const restocked = await restockForReturn(updated);
      if (restocked) updated.restocked_at = restocked.restocked_at;
    }

    if (status === "refunded") {
      if (refundMethod === "wallet") {
        if (!updated.user_id) {
          throw ApiError.badRequest("This return has no associated customer account to credit");
        }
        const order = await OrderModel.findById(updated.order_id);
        if (!order) throw ApiError.notFound(`Order ${updated.order_id} not found`);
        await WalletService.creditReturnRefund(updated.user_id, parseFloat(order.amount), updated.order_id);

        const payment = await PaymentModel.findByOrderId(updated.order_id);
        if (payment && payment.status !== "refunded") {
          await query("UPDATE payments SET status = 'refunded', updated_at = now() WHERE id = $1", [payment.id]);
          await query("UPDATE orders SET payment_status = 'refunded' WHERE id = $1", [updated.order_id]);
        }
      } else {
        const payment = await PaymentModel.findByOrderId(updated.order_id);
        if (payment && payment.status !== "refunded") {
          await query("UPDATE payments SET status = 'refunded', updated_at = now() WHERE id = $1", [payment.id]);
          await query("UPDATE orders SET payment_status = 'refunded' WHERE id = $1", [updated.order_id]);
        }
      }
    }

    const order = await OrderModel.findById(updated.order_id);
    if (order) {
      NotificationService.returnStatusChanged(
        order.id,
        updated.id,
        { name: order.customer_name, email: order.customer_email, phone: order.customer_phone },
        status
      ).catch((err) => {
        console.error(`[Return ${updated.id}] Failed to send status notification:`, err);
      });
    }

    return serializeReturn(updated);
  }
};
