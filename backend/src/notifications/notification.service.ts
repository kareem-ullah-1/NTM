import { sendEmailWithRetry, isEmailConfigured, formatSmtpError } from "./email";
import { sendSms, isSmsConfigured } from "./sms";
import { NotificationLogModel, type NotificationChannel } from "../models/notification-log.model";
import { env } from "../config/env";
import { orderConfirmationContent, orderStatusContent, returnStatusContent } from "./templates";
import type { OrderRecord, OrderItemRecord } from "../models/order.model";
import { ProductModel } from "../models/product.model";
import { StoreSettingsModel } from "../models/store-settings.model";

interface OrderLike {
  id: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  amount: string;
  payment_method: string;
}

function isValidEmailAddress(value: string | null | undefined): boolean {
  if (!value || typeof value !== "string") return false;
  const trimmed = value.trim();
  // Practical check — full RFC is unnecessary; Zod already validated at checkout
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed);
}

async function buildOrderConfirmationEmailData(order: OrderRecord, items: OrderItemRecord[]) {
  const productIds = [...new Set(items.map((i) => i.product_id).filter((id): id is string => Boolean(id)))];

  let productsById = new Map<string, { category: string; fabricType: string; imageUrl: string | null }>();
  if (productIds.length > 0) {
    try {
      const products = await ProductModel.findByIds(productIds);
      productsById = new Map(
        products.map((p) => [
          p.id,
          { category: p.category, fabricType: p.fabric_type, imageUrl: p.images?.[0] ?? null }
        ])
      );
    } catch {
      // enrichment is optional
    }
  }

  let store = {
    name: "NTM Fabrics",
    contactEmail: null as string | null,
    phone: null as string | null,
    address: null as string | null
  };
  try {
    const settings = await StoreSettingsModel.get();
    store = {
      name: settings.store_name || "NTM Fabrics",
      contactEmail: settings.contact_email,
      phone: settings.phone,
      address: settings.address
    };
  } catch {
    // store settings optional for email content
  }

  const promoDiscount = items.reduce(
    (sum, item) => sum + parseFloat(item.promo_discount ?? "0") * item.quantity,
    0
  );
  const discountTotal = parseFloat(order.discount_amount);
  const couponDiscount = order.coupon_code ? Math.max(0, discountTotal - promoDiscount) : 0;

  const orderLike = {
    id: order.id,
    customerName: order.customer_name,
    customerPhone: order.customer_phone,
    address: order.address,
    city: order.city,
    region: order.region,
    postalCode: order.postal_code,
    deliveryNotes: order.delivery_notes,
    paymentMethod: order.payment_method,
    paymentStatus: order.payment_status,
    subtotal: parseFloat(order.subtotal_amount),
    promoDiscount,
    couponDiscount,
    couponCode: order.coupon_code,
    walletAmountUsed: parseFloat(order.wallet_amount_used ?? "0"),
    total: parseFloat(order.amount),
    createdAt: order.created_at,
    orderUrl: order.user_id
      ? `${env.frontendUrl}/orders?payment=success&order=${encodeURIComponent(order.id)}`
      : null
  };

  const itemsLike = items.map((item) => {
    const enrichment = item.product_id ? productsById.get(item.product_id) : undefined;
    return {
      name: item.name,
      color: item.color,
      length: item.length,
      quantity: item.quantity,
      unitPrice: parseFloat(item.unit_price),
      category: enrichment?.category ?? null,
      fabricType: enrichment?.fabricType ?? null,
      imageUrl: enrichment?.imageUrl ?? null
    };
  });

  return { orderLike, itemsLike, store };
}

async function dispatch(input: {
  channel: NotificationChannel;
  event: string;
  recipient: string;
  orderId?: string | null;
  returnId?: string | null;
  send: () => Promise<void>;
  configured: boolean;
}) {
  if (!input.configured) {
    console.warn(
      `[Notification] ${input.channel} is not configured — skipping ${input.event} to ${input.recipient}`
    );
    await NotificationLogModel.record({
      channel: input.channel,
      event: input.event,
      recipient: input.recipient,
      orderId: input.orderId,
      returnId: input.returnId,
      status: "skipped",
      error: `${input.channel} is not configured`
    }).catch(() => {});
    return;
  }

  try {
    await input.send();
    console.log(
      `[Notification] ${input.channel} ${input.event} sent to ${input.recipient}${
        input.orderId ? ` for order ${input.orderId}` : ""
      }`
    );
    await NotificationLogModel.record({
      channel: input.channel,
      event: input.event,
      recipient: input.recipient,
      orderId: input.orderId,
      returnId: input.returnId,
      status: "sent"
    }).catch(() => {});
  } catch (err) {
    const errorMessage = formatSmtpError(err);
    console.error(
      `[Notification] ${input.channel} ${input.event} FAILED for ${input.recipient}: ${errorMessage}`
    );
    await NotificationLogModel.record({
      channel: input.channel,
      event: input.event,
      recipient: input.recipient,
      orderId: input.orderId,
      returnId: input.returnId,
      status: "failed",
      error: errorMessage
    }).catch(() => {});
  }
}

export const NotificationService = {
  async orderConfirmed(order: OrderRecord, items: OrderItemRecord[] = []) {
    const recipient = (order.customer_email ?? "").trim();
    console.log(
      `[Notification] Processing order confirmation for order ${order.id} (email=${recipient || "(empty)"})`
    );

    if (!isValidEmailAddress(recipient)) {
      console.error(
        `[Notification] order_confirmed skipped for order ${order.id}: missing or invalid customer_email`
      );
      await NotificationLogModel.record({
        channel: "email",
        event: "order_confirmed",
        recipient: recipient || "(empty)",
        orderId: order.id,
        status: "failed",
        error: "missing or invalid customer_email on order"
      }).catch(() => {});
      return;
    }

    // Idempotency: avoid duplicate confirmation emails on client retries / double submit
    try {
      const alreadySent = await NotificationLogModel.hasSuccessfulDelivery({
        channel: "email",
        event: "order_confirmed",
        orderId: order.id
      });
      if (alreadySent) {
        console.log(
          `[Notification] order_confirmed email already sent for order ${order.id} — skipping duplicate`
        );
        return;
      }
    } catch (err) {
      console.warn(
        `[Notification] Could not check notification_log for duplicates (continuing): ${
          err instanceof Error ? err.message : String(err)
        }`
      );
    }

    let content: ReturnType<typeof orderConfirmationContent>;
    try {
      const { orderLike, itemsLike, store } = await buildOrderConfirmationEmailData(order, items);
      content = orderConfirmationContent(orderLike, itemsLike, store);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(
        `[Notification] Failed to build confirmation email content for order ${order.id}: ${message}`
      );
      await NotificationLogModel.record({
        channel: "email",
        event: "order_confirmed",
        recipient,
        orderId: order.id,
        status: "failed",
        error: `Failed to build confirmation email content: ${message}`
      }).catch(() => {});
      return;
    }

    try {
      await dispatch({
        channel: "email",
        event: "order_confirmed",
        recipient,
        orderId: order.id,
        configured: isEmailConfigured(),
        send: async () => {
          await sendEmailWithRetry({
            to: recipient,
            subject: content.subject,
            html: content.html,
            text: content.text
          });
        }
      });
    } catch (err) {
      console.error(
        `[Notification] Unhandled error in email dispatch for order ${order.id}: ${formatSmtpError(err)}`
      );
    }

    try {
      await dispatch({
        channel: "sms",
        event: "order_confirmed",
        recipient: order.customer_phone,
        orderId: order.id,
        configured: isSmsConfigured(),
        send: () => sendSms({ to: order.customer_phone, body: content.sms })
      });
    } catch (err) {
      console.error(
        `[Notification] Unhandled error in SMS dispatch for order ${order.id}: ${
          err instanceof Error ? err.message : String(err)
        }`
      );
    }
  },

  async orderStatusUpdated(order: OrderLike, status: string) {
    const content = orderStatusContent(order, status);

    try {
      await dispatch({
        channel: "email",
        event: "order_status_updated",
        recipient: order.customer_email,
        orderId: order.id,
        configured: isEmailConfigured(),
        send: async () => {
          await sendEmailWithRetry({
            to: order.customer_email,
            subject: content.subject,
            html: content.html,
            text: content.text
          });
        }
      });
    } catch (err) {
      console.error(
        `[Notification] Unhandled error in email dispatch for order ${order.id} status update: ${formatSmtpError(err)}`
      );
    }

    try {
      await dispatch({
        channel: "sms",
        event: "order_status_updated",
        recipient: order.customer_phone,
        orderId: order.id,
        configured: isSmsConfigured(),
        send: () => sendSms({ to: order.customer_phone, body: content.sms })
      });
    } catch (err) {
      console.error(
        `[Notification] Unhandled error in SMS dispatch for order ${order.id} status update: ${
          err instanceof Error ? err.message : String(err)
        }`
      );
    }
  },

  async returnStatusChanged(
    orderId: string,
    returnId: string,
    customer: { name: string; email: string; phone: string },
    status: string
  ) {
    const content = returnStatusContent(orderId, customer.name, status);

    try {
      await dispatch({
        channel: "email",
        event: "return_status_changed",
        recipient: customer.email,
        orderId,
        returnId,
        configured: isEmailConfigured(),
        send: async () => {
          await sendEmailWithRetry({
            to: customer.email,
            subject: content.subject,
            html: content.html,
            text: content.text
          });
        }
      });
    } catch (err) {
      console.error(
        `[Notification] Unhandled error in email dispatch for return ${returnId}: ${formatSmtpError(err)}`
      );
    }

    try {
      await dispatch({
        channel: "sms",
        event: "return_status_changed",
        recipient: customer.phone,
        orderId,
        returnId,
        configured: isSmsConfigured(),
        send: () => sendSms({ to: customer.phone, body: content.sms })
      });
    } catch (err) {
      console.error(
        `[Notification] Unhandled error in SMS dispatch for return ${returnId}: ${
          err instanceof Error ? err.message : String(err)
        }`
      );
    }
  }
};
