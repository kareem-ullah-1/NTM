import type { PoolClient } from "pg";
import { PaymentModel, type PaymentRecord } from "../models/payment.model";
import { withTransaction } from "../config/db";
import { ApiError } from "../utils/ApiError";
import { providerForOrderPaymentMethod } from "../payment/providers";
import { OrderModel } from "../models/order.model";
import { ProductModel } from "../models/product.model";
import { InventoryMovementModel } from "../models/inventory-movement.model";
import type { UpdatePaymentStatusInput } from "../validators/payment.validator";

function serializePayment(payment: PaymentRecord) {
  return {
    id: payment.id,
    orderId: payment.order_id,
    provider: payment.provider,
    status: payment.status,
    amount: parseFloat(payment.amount),
    currency: payment.currency,
    transactionRef: payment.transaction_ref,
    failureReason: payment.failure_reason,
    paidAt: payment.paid_at,
    createdAt: payment.created_at
  };
}

export const PaymentService = {
    async createForOrder(client: PoolClient, input: { orderId: string; paymentMethod: string; amount: number }) {
    const provider = providerForOrderPaymentMethod(input.paymentMethod);

    if (!provider.isConfigured()) {
      throw ApiError.badRequest(
        `${input.paymentMethod} isn't available right now — please choose a different payment method.`
      );
    }

    const result = await provider.initiate({ orderId: input.orderId, amount: input.amount, currency: "PKR" });

    const payment = await PaymentModel.create(client, {
      orderId: input.orderId,
      provider: provider.name,
      status: result.status,
      amount: input.amount,
      gatewayResponse: result.gatewayResponse
    });

    return payment;
  },

  async getForOrder(orderId: string) {
    const payment = await PaymentModel.findByOrderId(orderId);
    if (!payment) throw ApiError.notFound(`No payment record found for order ${orderId}`);
    return serializePayment(payment);
  },

    async updateStatus(paymentId: string, input: UpdatePaymentStatusInput) {
    const existing = await PaymentModel.findById(paymentId);
    if (!existing) throw ApiError.notFound("Payment not found");

    if (existing.provider === "cod") {
      throw ApiError.badRequest(
        "Cash on Delivery payments can only be marked as collected — use the payment-collection action instead."
      );
    }

    if (existing.status === "paid" && input.status !== "refunded") {
      throw ApiError.badRequest("This payment is already marked as paid");
    }
    if (existing.status === "refunded") {
      throw ApiError.badRequest("This payment has already been refunded");
    }

    const updated = await withTransaction(async (client) => {
      const result = await client.query<PaymentRecord>(
        `UPDATE payments SET
           status = $1,
           transaction_ref = COALESCE($2, transaction_ref),
           failure_reason = $3,
           gateway_response = COALESCE($4, gateway_response),
           paid_at = CASE WHEN $1::varchar = 'paid' THEN now() ELSE paid_at END,
           updated_at = now()
         WHERE id = $5
         RETURNING *`,
        [
          input.status,
          input.transactionRef ?? null,
          input.status === "failed" ? input.note ?? "Marked failed by admin" : null,
          input.note ? JSON.stringify({ note: input.note }) : null,
          paymentId
        ]
      );
      const paymentUpdated = result.rows[0];
      if (!paymentUpdated) throw ApiError.notFound("Payment not found");

      await client.query(`UPDATE orders SET payment_status = $1, updated_at = now() WHERE id = $2`, [
        paymentUpdated.status,
        paymentUpdated.order_id
      ]);

      if (paymentUpdated.status === "failed" || paymentUpdated.status === "cancelled") {
        const order = await OrderModel.findByIdForUpdate(client, paymentUpdated.order_id);
        if (order && !order.stock_restored) {
          const items = await OrderModel.findItemsByOrderIdWithClient(client, paymentUpdated.order_id);
          for (const item of items) {
            if (!item.product_id) continue;
            const productUpdated = await ProductModel.incrementStockWithClient(client, item.product_id, item.quantity);
            if (productUpdated) {
              await InventoryMovementModel.create(client, {
                productId: item.product_id,
                previousStock: productUpdated.stock - item.quantity,
                quantityChange: item.quantity,
                newStock: productUpdated.stock,
                movementType: "cancellation",
                orderId: paymentUpdated.order_id,
                reason: `Payment marked ${paymentUpdated.status} by admin — reserved stock released`
              });
            }
          }
          await OrderModel.setStockRestoredWithClient(client, paymentUpdated.order_id, true);
        }
      }

      return paymentUpdated;
    });

    return serializePayment(updated);
  },

    async markPaidOnDelivery(client: PoolClient, orderId: string) {
    const existing = await PaymentModel.findByOrderId(orderId);
    if (!existing || existing.provider !== "cod" || existing.status === "paid") return;

    await PaymentModel.updateStatusByOrderIdWithClient(client, orderId, "paid");
    await client.query(`UPDATE orders SET payment_status = 'paid', updated_at = now() WHERE id = $1`, [orderId]);
  },

  async collectCodPayment(paymentId: string) {
    const existing = await PaymentModel.findById(paymentId);
    if (!existing) throw ApiError.notFound("Payment not found");

    if (existing.provider !== "cod") {
      throw ApiError.badRequest("Only Cash on Delivery payments can be marked as collected through this action.");
    }
    if (existing.status === "paid") {
      throw ApiError.badRequest("This payment has already been marked as collected.");
    }
    if (existing.status !== "pending") {
      throw ApiError.badRequest(
        `This payment cannot be marked as collected from its current status ("${existing.status}").`
      );
    }

    const updated = await withTransaction(async (client) => {
      const result = await client.query<PaymentRecord>(
        `UPDATE payments SET status = 'paid', paid_at = now(), updated_at = now() WHERE id = $1 RETURNING *`,
        [paymentId]
      );
      const paymentUpdated = result.rows[0];
      if (!paymentUpdated) throw ApiError.notFound("Payment not found");

      await client.query(`UPDATE orders SET payment_status = 'paid', updated_at = now() WHERE id = $1`, [
        paymentUpdated.order_id
      ]);

      return paymentUpdated;
    });

    return serializePayment(updated);
  }
};
