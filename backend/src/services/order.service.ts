import { withTransaction } from "../config/db";
import { OrderModel, type OrderRecord, type OrderItemRecord, type OrderStatus } from "../models/order.model";
import { ProductModel } from "../models/product.model";
import { ProductDropModel } from "../models/product-drop.model";
import { InventoryMovementModel } from "../models/inventory-movement.model";
import { ApiError } from "../utils/ApiError";
import { buildMeta } from "../utils/pagination";
import { PaymentService } from "./payment.service";
import { CouponService } from "./coupon.service";
import { WalletService } from "./wallet.service";
import { PromotionService } from "./promotion.service";
import { PromotionModel } from "../models/promotion.model";
import { colorStock, findColor } from "../utils/color-stock";
import { NotificationService } from "../notifications/notification.service";
import type { CreateOrderInput } from "../validators/order.validator";

function serializeOrder(order: OrderRecord, items: OrderItemRecord[]) {
  return {
    id: order.id,
    customerName: order.customer_name,
    customerPhone: order.customer_phone,
    customerEmail: order.customer_email,
    address: order.address,
    city: order.city,
    region: order.region,
    postalCode: order.postal_code,
    deliveryNotes: order.delivery_notes,
    paymentMethod: order.payment_method,
    status: order.status,
    subtotal: parseFloat(order.subtotal_amount),
    discountAmount: parseFloat(order.discount_amount),
    couponCode: order.coupon_code,
    promoId: (order as unknown as { promo_id: string | null }).promo_id,
    promoDiscount: parseFloat((order as unknown as { promo_discount: string }).promo_discount ?? "0"),
    walletAmountUsed: parseFloat(order.wallet_amount_used),
    amount: parseFloat(order.amount),
    paymentStatus: order.payment_status,
    userId: order.user_id,
    date: order.created_at.toISOString().slice(0, 10),
    createdAt: order.created_at,
    dropId: (order as unknown as { drop_id: string | null }).drop_id,
    items: items.map((item) => ({
      id: item.id,
      productId: item.product_id,
      name: item.name,
      color: item.color,
      length: item.length,
      quantity: item.quantity,
      unitPrice: parseFloat(item.unit_price),
      promoId: item.promo_id,
      originalUnitPrice: item.original_unit_price ? parseFloat(item.original_unit_price) : null,
      promoDiscount: parseFloat(item.promo_discount ?? "0")
    }))
  };
}

const ELIGIBLE_FOR_RETURN_STATUSES = new Set<OrderStatus>(["Delivered"]);

const ADMIN_ORDER_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  Pending: ["Confirmed", "Cancelled"],
  Confirmed: ["Shipped", "Cancelled"],
  Shipped: ["Delivered"],
  Delivered: [],
  Cancelled: []
};

const CUSTOMER_CANCELLABLE_STATUSES = new Set<OrderStatus>(["Pending", "Confirmed"]);

export const OrderService = {
  async create(input: CreateOrderInput, userId?: string | null) {
    const order = await withTransaction(async (client) => {
      let subtotal = 0;
      let originalSubtotal = 0;

      const dropItemMap = new Map<string, string>();

      const candidateItems: Array<{
        productId: string;
        name: string;
        color: string | null;
        length: string | null;
        quantity: number;
        basePrice: number;
        category: string;
        fabricType: string;
      }> = [];

      for (const item of input.items) {
        const product = await ProductModel.findByIdForUpdate(client, item.productId);
        if (!product) {
          throw ApiError.badRequest(`One of the items in your cart is no longer available.`);
        }

        const colors = product.colors ?? [];
        if (item.color) {
          const match = findColor(colors, item.color);
          if (!match) {
            throw ApiError.badRequest(`"${item.color}" is not an available color for "${product.name}".`);
          }
          if (colors.length > 0) {
            const available = colorStock(match);
            if (available < item.quantity) {
              throw ApiError.badRequest(
                available === 0
                  ? `"${item.color}" of "${product.name}" is sold out.`
                  : `Only ${available} unit(s) of "${product.name}" (${item.color}) are left in stock (you requested ${item.quantity}).`
              );
            }
          } else if (product.stock < item.quantity) {
            throw ApiError.badRequest(
              `Only ${product.stock} unit(s) of "${product.name}" are left in stock (you requested ${item.quantity}).`
            );
          }
        } else if (colors.length > 0) {
          throw ApiError.badRequest(`Please select a colour for "${product.name}".`);
        } else if (product.stock < item.quantity) {
          throw ApiError.badRequest(
            `Only ${product.stock} unit(s) of "${product.name}" are left in stock (you requested ${item.quantity}).`
          );
        }

        if (item.length) {
          const validLengths = product.available_lengths ?? [];
          if (!validLengths.includes(item.length)) {
            throw ApiError.badRequest(`"${item.length}" is not an available length for "${product.name}".`);
          }
        }

        let basePrice = parseFloat(product.price);

        const activeDrop = await ProductDropModel.findByProductId(product.id);
        if (activeDrop) {
          const lockedDrop = await ProductDropModel.findByIdForUpdate(client, activeDrop.id);
          if (lockedDrop && lockedDrop.is_active) {
            const now = new Date();
            if (now >= new Date(lockedDrop.starts_at) && now <= new Date(lockedDrop.ends_at)) {
              if (lockedDrop.sold_quantity < lockedDrop.max_quantity) {
                const dropRemaining = lockedDrop.max_quantity - lockedDrop.sold_quantity;
                if (item.quantity > dropRemaining) {
                  throw ApiError.badRequest(
                    dropRemaining === 0
                      ? `"${lockedDrop.name}" has sold out`
                      : `Only ${dropRemaining} unit(s) of "${lockedDrop.name}" remain (you requested ${item.quantity})`
                  );
                }

                if (userId && lockedDrop.per_customer_limit > 0) {
                  const alreadyPurchased = await ProductDropModel.countDropPurchasesByUserWithClient(
                    client,
                    lockedDrop.id,
                    userId
                  );
                  if (alreadyPurchased + item.quantity > lockedDrop.per_customer_limit) {
                    throw ApiError.badRequest(
                      `You have reached the purchase limit for "${lockedDrop.name}". You can purchase at most ${lockedDrop.per_customer_limit} unit(s).`
                    );
                  }
                }

                if (lockedDrop.special_price !== null) {
                  basePrice = parseFloat(lockedDrop.special_price);
                }

                dropItemMap.set(product.id, lockedDrop.id);
              }
            }
          }
        }

        originalSubtotal += basePrice * item.quantity;

        candidateItems.push({
          productId: product.id,
          name: product.name,
          color: item.color ?? null,
          length: item.length ?? null,
          quantity: item.quantity,
          basePrice,
          category: product.category,
          fabricType: product.fabric_type
        });
      }

      let promoResult = await PromotionService.computeDiscountForOrder(
        candidateItems.map((item) => ({
          productId: item.productId,
          category: item.category,
          fabricType: item.fabricType,
          basePrice: item.basePrice,
          quantity: item.quantity
        })),
        userId ?? null,
        client
      );

      if (promoResult.promoId) {
        const reserved = await PromotionModel.tryReserveUsage(client, promoResult.promoId);
        if (!reserved) {
          promoResult = {
            promoId: null,
            promoName: null,
            perItemUnitDiscount: candidateItems.map(() => 0),
            totalDiscount: 0
          };
        }
      }

      const resolvedItems = candidateItems.map((item, index) => {
        const unitDiscount = promoResult.perItemUnitDiscount[index] ?? 0;
        const unitPrice = Math.max(0, item.basePrice - unitDiscount);
        subtotal += unitPrice * item.quantity;
        return {
          productId: item.productId,
          name: item.name,
          color: item.color,
          length: item.length,
          quantity: item.quantity,
          unitPrice,
          promoId: unitDiscount > 0 ? promoResult.promoId : null,
          originalUnitPrice: unitDiscount > 0 ? item.basePrice : null,
          promoDiscount: unitDiscount
        };
      });

      let discountAmount = 0;
      let couponCode: string | null = null;

      const initialAmount = Math.max(0, subtotal);

      const createdOrder = await OrderModel.create(client, {
        customerName: input.fullName,
        customerPhone: input.phone,
        customerEmail: input.email,
        address: input.address,
        city: input.city,
        region: input.region,
        postalCode: input.postalCode,
        deliveryNotes: input.deliveryNotes ?? null,
        paymentMethod: input.paymentMethod,

        subtotalAmount: originalSubtotal,
        discountAmount: promoResult.totalDiscount,
        couponCode: null,
        amount: initialAmount,
        userId: userId ?? null
      });

      if (promoResult.promoId) {
        await PromotionModel.recordUsageRow(client, promoResult.promoId, userId ?? null, createdOrder.id, promoResult.totalDiscount);
        await client.query(
          `UPDATE orders SET promo_id = $1, promo_discount = $2, updated_at = now() WHERE id = $3`,
          [promoResult.promoId, promoResult.totalDiscount, createdOrder.id]
        );
      }

      let primaryDropId: string | null = null;
      for (const [productId, dropId] of dropItemMap.entries()) {
        const item = resolvedItems.find((r) => r.productId === productId);
        if (item) {
          await ProductDropModel.recordPurchaseWithClient(
            client,
            dropId,
            userId ?? null,
            createdOrder.id,
            item.quantity
          );

          const updatedDrop = await ProductDropModel.decrementQuantityWithClient(
            client,
            dropId,
            item.quantity
          );
          if (!updatedDrop) {
            throw ApiError.badRequest("Product drop sold out during checkout");
          }

          if (!primaryDropId) {
            primaryDropId = dropId;
          }
        }
      }

      if (primaryDropId) {
        await client.query(
          `UPDATE orders SET drop_id = $1, updated_at = now() WHERE id = $2`,
          [primaryDropId, createdOrder.id]
        );
      }

      if (input.couponCode) {
        const applied = await CouponService.applyToOrder(client, {
          code: input.couponCode,
          subtotal,
          userId: userId ?? null,
          orderId: createdOrder.id
        });
        discountAmount = applied.discountAmount;
        couponCode = applied.couponCode;

        const finalAmount = Math.max(0, subtotal - discountAmount);
        await client.query(
          `UPDATE orders SET discount_amount = $1, coupon_code = $2, amount = $3, updated_at = now() WHERE id = $4`,
          [promoResult.totalDiscount + discountAmount, couponCode, finalAmount, createdOrder.id]
        );
        createdOrder.discount_amount = String(promoResult.totalDiscount + discountAmount);
        createdOrder.coupon_code = couponCode;
        createdOrder.amount = String(finalAmount);
      }

      let walletAmountUsed = 0;
      if (input.walletAmountUsed && input.walletAmountUsed > 0 && userId) {
        const postDiscountSubtotal = subtotal - discountAmount;
        const cap = await WalletService.maxRedeemable(userId, postDiscountSubtotal);
        walletAmountUsed = Math.min(input.walletAmountUsed, cap);

        if (walletAmountUsed > 0) {
          await WalletService.redeemForOrder(client, userId, walletAmountUsed, createdOrder.id);

          const finalAmount = Math.max(0, parseFloat(createdOrder.amount) - walletAmountUsed);
          await client.query(`UPDATE orders SET wallet_amount_used = $1, amount = $2, updated_at = now() WHERE id = $3`, [
            walletAmountUsed,
            finalAmount,
            createdOrder.id
          ]);
          createdOrder.wallet_amount_used = String(walletAmountUsed);
          createdOrder.amount = String(finalAmount);
        }
      }

      for (const item of resolvedItems) {
        await client.query(
          `INSERT INTO order_items (order_id, product_id, name, color, length, quantity, unit_price, promo_id, original_unit_price, promo_discount)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
          [
            createdOrder.id,
            item.productId,
            item.name,
            item.color,
            item.length,
            item.quantity,
            item.unitPrice,
            item.promoId,
            item.originalUnitPrice,
            item.promoDiscount
          ]
        );
      }

      for (const item of resolvedItems) {
        const updated = await ProductModel.decrementStockForOrder(
          client,
          item.productId,
          item.quantity,
          item.color
        );
        if (!updated) {
          throw ApiError.badRequest(
            item.color
              ? `"${item.name}" (${item.color}) sold out while your order was being placed.`
              : `"${item.name}" sold out while your order was being placed.`
          );
        }

        await InventoryMovementModel.create(client, {
          productId: item.productId,
          previousStock: updated.stock + item.quantity,
          quantityChange: -item.quantity,
          newStock: updated.stock,
          movementType: "sale",
          orderId: createdOrder.id,
          reason: "Order placed"
        });
      }

      await PaymentService.createForOrder(client, {
        orderId: createdOrder.id,
        paymentMethod: createdOrder.payment_method,
        amount: parseFloat(createdOrder.amount)
      });

      return createdOrder;
    });

    // Re-read order + items after commit so email reflects final totals (coupon, wallet, promo).
    const items = await OrderModel.findItemsByOrderId(order.id);
    const freshOrder = (await OrderModel.findById(order.id)) ?? order;

    // Fire-and-forget: never block or roll back the successful order on email failure.
    // setImmediate keeps the work off the request tick while the Node process stays alive under Express.
    setImmediate(() => {
      NotificationService.orderConfirmed(freshOrder, items).catch((err) => {
        console.error(
          `[Order ${order.id}] Failed to send confirmation notification:`,
          err instanceof Error ? err.message : err
        );
      });
    });

    if (userId) {
      WalletService.rewardReferrerOnFirstOrder(userId, order.id).catch((err) => {
        console.error(`[Order ${order.id}] Failed to reward referrer:`, err);
      });
    }

    return serializeOrder(order, items);
  },

  async list(query: Record<string, unknown>) {
    const page = (query.page as number) ?? 1;
    const limit = (query.limit as number) ?? 20;
    const offset = (page - 1) * limit;

    const { rows, total } = await OrderModel.findMany({
      status: query.status as never,
      search: query.search as string | undefined,
      limit,
      offset
    });

    // Batch-fetch items for every order on this page in one query instead of
    // one query per order (was N+1: 1 for orders + N for items).
    const itemsByOrder = await OrderModel.findItemsByOrderIds(rows.map((order) => order.id));
    const data = rows.map((order) => serializeOrder(order, itemsByOrder.get(order.id) ?? []));

    return { data, meta: buildMeta(page, limit, total) };
  },

  async getById(id: string) {
    const order = await OrderModel.findById(id);
    if (!order) throw ApiError.notFound(`Order ${id} not found`);
    const items = await OrderModel.findItemsByOrderId(id);
    return serializeOrder(order, items);
  },

    async getByIdForUser(id: string, requesterId: string, isAdmin: boolean) {
    const order = await OrderModel.findById(id);
    if (!order) throw ApiError.notFound(`Order ${id} not found`);

    if (!isAdmin && order.user_id !== requesterId) {
      throw ApiError.forbidden("You do not have permission to view this order");
    }

    const items = await OrderModel.findItemsByOrderId(id);
    return serializeOrder(order, items);
  },

  async listMine(userId: string) {
    const orders = await OrderModel.findByUserId(userId);
    // Batch-fetch items for all of this customer's orders in one query
    // instead of one query per order (was N+1).
    const itemsByOrder = await OrderModel.findItemsByOrderIds(orders.map((order) => order.id));
    return orders.map((order) => serializeOrder(order, itemsByOrder.get(order.id) ?? []));
  },

  async updateStatus(id: string, status: OrderStatus, options?: { reason?: string }) {
    const updated = await withTransaction(async (client) => {
      const order = await OrderModel.findByIdForUpdate(client, id);
      if (!order) throw ApiError.notFound(`Order ${id} not found`);

      const allowedNext = ADMIN_ORDER_TRANSITIONS[order.status] ?? [];
      if (!allowedNext.includes(status)) {
        throw ApiError.badRequest(`Order ${id} cannot move from "${order.status}" to "${status}"`);
      }

      const result =
        status === "Cancelled"
          ? await OrderModel.cancelWithClient(client, id, options?.reason ?? null)
          : await OrderModel.updateStatusWithClient(client, id, status);
      if (!result) throw ApiError.notFound(`Order ${id} not found`);

      if (status === "Delivered") {
        await PaymentService.markPaidOnDelivery(client, id);

        if (result.payment_method === "Cash on Delivery" && result.payment_status !== "paid") {
          result.payment_status = "paid";
        }
      }

      if (status === "Cancelled" && order.status !== "Cancelled" && !order.stock_restored) {
        const cancelledItems = await OrderModel.findItemsByOrderIdWithClient(client, id);
        for (const item of cancelledItems) {
          if (item.product_id) {
            const updated = await ProductModel.incrementStockForColor(client, item.product_id, item.quantity, item.color);
            if (updated) {
              await InventoryMovementModel.create(client, {
                productId: item.product_id,
                previousStock: updated.stock - item.quantity,
                quantityChange: item.quantity,
                newStock: updated.stock,
                movementType: "cancellation",
                orderId: id,
                reason: options?.reason ?? "Order cancelled"
              });
            }
          }
        }
        await OrderModel.setStockRestoredWithClient(client, id, true);
      }

      if (status === "Cancelled" && order.status !== "Cancelled" && order.user_id) {
        const walletUsed = parseFloat(order.wallet_amount_used);
        if (walletUsed > 0) {
          await WalletService.refundOrderRedemption(client, order.user_id, walletUsed, id);
        }
      }

      return { order: result };
    });

    const items = await OrderModel.findItemsByOrderId(id);

    NotificationService.orderStatusUpdated(updated.order, updated.order.status).catch((err) => {
      console.error(`[Order ${id}] Failed to send status update notification:`, err);
    });

    return serializeOrder(updated.order, items);
  },

    async cancelByCustomer(id: string, userId: string, reason?: string) {
    const order = await OrderModel.findById(id);
    if (!order) throw ApiError.notFound(`Order ${id} not found`);

    if (order.user_id !== userId) {
      throw ApiError.forbidden("You do not have permission to cancel this order");
    }

    if (!CUSTOMER_CANCELLABLE_STATUSES.has(order.status)) {
      throw ApiError.badRequest(
        order.status === "Cancelled"
          ? "This order has already been cancelled"
          : "This order can no longer be cancelled — it has already shipped"
      );
    }

    return this.updateStatus(id, "Cancelled", { reason });
  },

  async isEligibleForReturn(orderId: string, requesterId: string) {
    const order = await OrderModel.findById(orderId);
    if (!order) throw ApiError.notFound(`Order ${orderId} not found`);
    if (order.user_id !== requesterId) {
      throw ApiError.forbidden("You do not have permission to access this order");
    }
    if (!ELIGIBLE_FOR_RETURN_STATUSES.has(order.status)) {
      throw ApiError.badRequest("Only delivered orders are eligible for a return");
    }
    return order;
  }
};
