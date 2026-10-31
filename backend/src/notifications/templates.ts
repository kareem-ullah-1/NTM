import { formatCurrency } from "../utils/formatCurrency";

interface OrderLike {
  id: string;
  customer_name: string;
  amount: string;
  payment_method: string;
}

interface OrderConfirmationItemLike {
  name: string;
  color: string | null;
  length: string | null;
  quantity: number;
  unitPrice: number;
    category: string | null;
  fabricType: string | null;
  imageUrl: string | null;
}

interface OrderConfirmationOrderLike {
  id: string;
  customerName: string;
  customerPhone: string;
  address: string;
  city: string;
  region: string | null;
  postalCode: string;
  deliveryNotes: string | null;
  paymentMethod: string;
  paymentStatus: string;
    subtotal: number;
  promoDiscount: number;
  couponDiscount: number;
  couponCode: string | null;
  walletAmountUsed: number;
  total: number;
  createdAt: Date;
    orderUrl: string | null;
}

interface OrderConfirmationStoreLike {
  name: string;
  contactEmail: string | null;
  phone: string | null;
  address: string | null;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function formatOrderDate(date: Date): string {
  return new Intl.DateTimeFormat("en-PK", { day: "numeric", month: "long", year: "numeric" }).format(date);
}

function orderPaymentStatusInfo(order: OrderConfirmationOrderLike): {
  badge: string;
  badgeBg: string;
  badgeText: string;
  message: string;
} {
  const isCod = order.paymentMethod.trim().toLowerCase() === "cash on delivery";

  if (isCod) {
    if (order.paymentStatus === "paid") {
      return { badge: "Paid", badgeBg: "#E4EFE7", badgeText: "#173D2D", message: "Payment has been received for this order." };
    }
    return {
      badge: "Due on Delivery",
      badgeBg: "#FBF1DC",
      badgeText: "#8A6D1F",
      message: "This is a Cash on Delivery order — payment is collected when your order is delivered."
    };
  }

  switch (order.paymentStatus) {
    case "paid":
      return { badge: "Paid", badgeBg: "#E4EFE7", badgeText: "#173D2D", message: "Your payment has been received." };
    case "failed":
      return {
        badge: "Payment Failed",
        badgeBg: "#F8E3E1",
        badgeText: "#B3261E",
        message: "Your last payment attempt was not successful. Please contact us if you need help completing payment."
      };
    case "refunded":
      return { badge: "Refunded", badgeBg: "#ECECEC", badgeText: "#6B6B6B", message: "This payment has been refunded." };
    case "cancelled":
      return { badge: "Cancelled", badgeBg: "#ECECEC", badgeText: "#6B6B6B", message: "This payment was cancelled." };
    case "pending":
    default:
      return {
        badge: "Payment Pending",
        badgeBg: "#FBF1DC",
        badgeText: "#8A6D1F",
        message: "We're waiting for payment confirmation. We'll update you as soon as it's confirmed."
      };
  }
}

function buildOrderItemHtml(item: OrderConfirmationItemLike): string {
  const lineTotal = item.unitPrice * item.quantity;
  const metaBits: string[] = [];
  const categoryBit = [item.category, item.fabricType].filter(Boolean).join(" · ");
  if (categoryBit) metaBits.push(escapeHtml(categoryBit));
  if (item.color) metaBits.push(`Color: ${escapeHtml(item.color)}`);
  if (item.length) metaBits.push(`Length: ${escapeHtml(item.length)}`);
  const metaLine = metaBits.join("&nbsp;&nbsp;|&nbsp;&nbsp;");

  const imageCell = item.imageUrl
    ? `<td width="64" valign="top" style="padding:12px 0 12px 12px;">
         <img src="${escapeHtml(item.imageUrl)}" width="64" height="64" alt="" class="ntm-item-image" style="display:block; width:64px; height:64px; border-radius:6px; object-fit:cover; background-color:#f4f2ee;" />
       </td>`
    : "";

  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #ece8e0; border-radius:8px; margin-bottom:10px;">
    <tr>
      ${imageCell}
      <td valign="top" style="padding:12px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td style="font-family:Arial, Helvetica, sans-serif; font-size:14px; font-weight:bold; color:#2b2b2b; padding-right:8px;">${escapeHtml(item.name)}</td>
            <td align="right" style="font-family:Arial, Helvetica, sans-serif; font-size:14px; font-weight:bold; color:#2b2b2b; white-space:nowrap;">${formatCurrency(lineTotal)}</td>
          </tr>
        </table>
        ${metaLine ? `<div style="font-family:Arial, Helvetica, sans-serif; font-size:12px; color:#8a8578; margin-top:4px;">${metaLine}</div>` : ""}
        <div style="font-family:Arial, Helvetica, sans-serif; font-size:12px; color:#8a8578; margin-top:2px;">Qty ${item.quantity} × ${formatCurrency(item.unitPrice)}</div>
      </td>
    </tr>
  </table>`;
}

function orderPriceRowHtml(label: string, value: string, opts: { bold?: boolean; muted?: boolean } = {}): string {
  const color = opts.muted ? "#6b8f7a" : opts.bold ? "#173D2D" : "#3f3f3a";
  const fontWeight = opts.bold ? "bold" : "normal";
  const fontSize = opts.bold ? "15px" : "13px";
  return `<tr>
    <td style="padding:5px 0; font-family:Arial, Helvetica, sans-serif; font-size:${fontSize}; font-weight:${fontWeight}; color:${color};">${label}</td>
    <td align="right" style="padding:5px 0; font-family:Arial, Helvetica, sans-serif; font-size:${fontSize}; font-weight:${fontWeight}; color:${color};">${value}</td>
  </tr>`;
}

function buildOrderPriceSummaryHtml(order: OrderConfirmationOrderLike): string {
  const rows: string[] = [orderPriceRowHtml("Subtotal", formatCurrency(order.subtotal))];

  if (order.promoDiscount > 0) {
    rows.push(orderPriceRowHtml("Promotion discount", `−${formatCurrency(order.promoDiscount)}`, { muted: true }));
  }
  if (order.couponDiscount > 0) {
    const label = order.couponCode ? `Coupon discount (${escapeHtml(order.couponCode)})` : "Coupon discount";
    rows.push(orderPriceRowHtml(label, `−${formatCurrency(order.couponDiscount)}`, { muted: true }));
  }
  if (order.walletAmountUsed > 0) {
    rows.push(orderPriceRowHtml("Wallet credit used", `−${formatCurrency(order.walletAmountUsed)}`, { muted: true }));
  }
  rows.push(orderPriceRowHtml("Shipping", "FREE"));

  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0">
    ${rows.join("")}
    <tr><td colspan="2" style="padding-top:6px; border-top:1px solid #e5e1da;"></td></tr>
    ${orderPriceRowHtml("Grand Total", formatCurrency(order.total), { bold: true })}
  </table>`;
}

function buildOrderDeliveryHtml(order: OrderConfirmationOrderLike): string {
  const cityLine = [order.city, order.region, order.postalCode].filter(Boolean).map((v) => escapeHtml(v as string)).join(", ");
  const notesLine = order.deliveryNotes
    ? `<div style="font-family:Arial, Helvetica, sans-serif; font-size:12px; color:#8a8578; margin-top:6px;">Delivery notes: ${escapeHtml(order.deliveryNotes)}</div>`
    : "";
  return `<div style="font-family:Arial, Helvetica, sans-serif; font-size:13px; color:#2b2b2b; line-height:1.6;">
    <div style="font-weight:bold;">${escapeHtml(order.customerName)}</div>
    <div>${escapeHtml(order.customerPhone)}</div>
    <div>${escapeHtml(order.address)}</div>
    <div>${cityLine}</div>
    ${notesLine}
  </div>`;
}

function buildOrderCtaHtml(order: OrderConfirmationOrderLike, store: OrderConfirmationStoreLike): string {
  if (order.orderUrl) {
    return `<tr>
      <td align="center" style="padding:4px 32px 28px;">
        <a href="${escapeHtml(order.orderUrl)}" style="display:inline-block; padding:14px 36px; background-color:#173D2D; color:#ffffff; font-family:Arial, Helvetica, sans-serif; font-size:13px; font-weight:bold; letter-spacing:1px; text-decoration:none; border-radius:6px;">VIEW YOUR ORDER</a>
      </td>
    </tr>`;
  }

  const contactBits = [store.phone, store.contactEmail].filter((v): v is string => Boolean(v)).map(escapeHtml);
  const contactLine = contactBits.length
    ? `If you have any questions about order <strong>${escapeHtml(order.id)}</strong>, reach us at ${contactBits.join(" or ")}.`
    : `If you have any questions about order <strong>${escapeHtml(order.id)}</strong>, just reply to this email.`;

  return `<tr>
    <td style="padding:4px 32px 28px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#faf9f6; border-radius:8px;">
        <tr>
          <td style="padding:16px 20px; font-family:Arial, Helvetica, sans-serif; font-size:13px; color:#5a5a52; text-align:center;">${contactLine}</td>
        </tr>
      </table>
    </td>
  </tr>`;
}

function buildOrderFooterHtml(store: OrderConfirmationStoreLike): string {
  const contactLine = [store.phone, store.contactEmail].filter((v): v is string => Boolean(v)).join(" · ");
  const lines = [store.address, contactLine].filter((v): v is string => Boolean(v)).map(escapeHtml);
  return `<tr>
    <td style="background-color:#faf9f6; border-top:1px solid #e5e1da; padding:24px 32px; text-align:center;">
      <div style="font-family:Georgia, 'Times New Roman', serif; font-size:14px; font-weight:bold; letter-spacing:1px; color:#173D2D;">${escapeHtml(store.name.toUpperCase())}</div>
      ${lines.map((l) => `<div style="font-family:Arial, Helvetica, sans-serif; font-size:11px; color:#8a8578; margin-top:4px;">${l}</div>`).join("")}
      <div style="font-family:Arial, Helvetica, sans-serif; font-size:10px; color:#b3aea1; margin-top:12px;">This is an automated order confirmation. Please keep it for your records.</div>
    </td>
  </tr>`;
}

function buildOrderConfirmationText(
  order: OrderConfirmationOrderLike,
  items: OrderConfirmationItemLike[],
  store: OrderConfirmationStoreLike,
  paymentInfo: { badge: string; message: string }
): string {
  const lines: string[] = [];
  lines.push(`${store.name} — Order Confirmed`);
  lines.push("");
  lines.push(`Thank you, ${order.customerName}! Your order has been successfully received.`);
  lines.push("");
  lines.push(`Order #${order.id}`);
  lines.push(`Order Date: ${formatOrderDate(order.createdAt)}`);
  lines.push("");
  lines.push("Items:");
  for (const item of items) {
    const bits = [item.color, item.length].filter(Boolean);
    const bitsText = bits.length ? ` (${bits.join(", ")})` : "";
    lines.push(`- ${item.name}${bitsText} x${item.quantity} — ${formatCurrency(item.unitPrice * item.quantity)}`);
  }
  lines.push("");
  lines.push(`Subtotal: ${formatCurrency(order.subtotal)}`);
  if (order.promoDiscount > 0) lines.push(`Promotion discount: -${formatCurrency(order.promoDiscount)}`);
  if (order.couponDiscount > 0) {
    lines.push(`Coupon discount${order.couponCode ? ` (${order.couponCode})` : ""}: -${formatCurrency(order.couponDiscount)}`);
  }
  if (order.walletAmountUsed > 0) lines.push(`Wallet credit used: -${formatCurrency(order.walletAmountUsed)}`);
  lines.push(`Shipping: FREE`);
  lines.push(`Grand Total: ${formatCurrency(order.total)}`);
  lines.push("");
  lines.push(`Payment Method: ${order.paymentMethod}`);
  lines.push(`Payment Status: ${paymentInfo.badge} — ${paymentInfo.message}`);
  lines.push("");
  lines.push("Delivery Information:");
  lines.push(order.customerName);
  lines.push(order.customerPhone);
  lines.push(order.address);
  lines.push([order.city, order.region, order.postalCode].filter(Boolean).join(", "));
  if (order.deliveryNotes) lines.push(`Delivery notes: ${order.deliveryNotes}`);
  lines.push("");
  if (order.orderUrl) {
    lines.push(`View your order: ${order.orderUrl}`);
  } else {
    const contactBits = [store.phone, store.contactEmail].filter(Boolean);
    lines.push(
      contactBits.length
        ? `Questions about your order? Contact us at ${contactBits.join(" or ")}.`
        : "Questions about your order? Just reply to this email."
    );
  }
  lines.push("");
  lines.push(store.name);
  if (store.address) lines.push(store.address);
  return lines.join("\n");
}

function emailShell(title: string, bodyHtml: string): string {
  return `<!doctype html>
<html>
  <body style="font-family: Georgia, 'Times New Roman', serif; background:#f7f5f2; padding:32px; color:#2b2b2b;">
    <div style="max-width:520px; margin:0 auto; background:#ffffff; border-radius:12px; padding:32px; border:1px solid #e5e1da;">
      <h1 style="font-size:20px; margin:0 0 16px;">${title}</h1>
      ${bodyHtml}
      <p style="margin-top:32px; font-size:12px; color:#8a8578;">NTM Fabrics</p>
    </div>
  </body>
</html>`;
}

export function orderConfirmationContent(
  order: OrderConfirmationOrderLike,
  items: OrderConfirmationItemLike[],
  store: OrderConfirmationStoreLike
) {
  const subject = `Order ${order.id} confirmed — ${store.name}`;
  const paymentInfo = orderPaymentStatusInfo(order);
  const orderDate = formatOrderDate(order.createdAt);
  const preheader = `Your order ${order.id} has been confirmed — thank you for shopping with ${store.name}.`;

  const itemsHtml = items.map(buildOrderItemHtml).join("");
  const priceSummaryHtml = buildOrderPriceSummaryHtml(order);
  const deliveryHtml = buildOrderDeliveryHtml(order);
  const ctaHtml = buildOrderCtaHtml(order, store);
  const footerHtml = buildOrderFooterHtml(store);

  const paymentHtml = `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #ece8e0; border-radius:8px;">
    <tr>
      <td style="padding:16px 20px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td style="font-family:Arial, Helvetica, sans-serif; font-size:13px; color:#5a5a52;">Payment Method</td>
            <td align="right" style="font-family:Arial, Helvetica, sans-serif; font-size:13px; font-weight:bold; color:#2b2b2b;">${escapeHtml(order.paymentMethod)}</td>
          </tr>
          <tr><td colspan="2" style="height:8px; line-height:8px; font-size:0;">&nbsp;</td></tr>
          <tr>
            <td style="font-family:Arial, Helvetica, sans-serif; font-size:13px; color:#5a5a52;">Payment Status</td>
            <td align="right">
              <span style="display:inline-block; padding:3px 10px; border-radius:999px; background-color:${paymentInfo.badgeBg}; color:${paymentInfo.badgeText}; font-family:Arial, Helvetica, sans-serif; font-size:11px; font-weight:bold;">${paymentInfo.badge}</span>
            </td>
          </tr>
        </table>
        <div style="font-family:Arial, Helvetica, sans-serif; font-size:12px; color:#8a8578; margin-top:10px; line-height:1.5;">${paymentInfo.message}</div>
      </td>
    </tr>
  </table>`;

  const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<meta http-equiv="X-UA-Compatible" content="IE=edge" />
<title>${escapeHtml(subject)}</title>
<!--[if mso]>
<noscript>
<xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml>
</noscript>
<![endif]-->
<style>
  body, table, td { font-family: Arial, Helvetica, sans-serif; }
  @media only screen and (max-width: 620px) {
    .ntm-container { width: 100% !important; }
    .ntm-px { padding-left: 20px !important; padding-right: 20px !important; }
  }
</style>
</head>
<body style="margin:0; padding:0; background-color:#f4f2ee;">
  <div style="display:none; max-height:0; overflow:hidden; opacity:0; mso-hide:all;">${escapeHtml(preheader)}</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f2ee;">
    <tr>
      <td align="center" style="padding:24px 12px;">
        <!--[if mso]>
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" align="center"><tr><td>
        <![endif]-->
        <table role="presentation" class="ntm-container" width="600" cellpadding="0" cellspacing="0" style="width:600px; max-width:600px; background-color:#ffffff; border-radius:10px; overflow:hidden; border:1px solid #eee;">
          <tr>
            <td style="background-color:#173D2D; padding:28px 32px; text-align:center;">
              <div style="font-family:Georgia, 'Times New Roman', serif; font-size:22px; letter-spacing:3px; color:#ffffff; font-weight:bold;">${escapeHtml(store.name.toUpperCase())}</div>
            </td>
          </tr>
          <tr>
            <td class="ntm-px" style="padding:32px 32px 8px; text-align:center;">
              <span style="display:inline-block; padding:6px 16px; border-radius:999px; background-color:#E4EFE7; color:#173D2D; font-family:Arial, Helvetica, sans-serif; font-size:11px; font-weight:bold; letter-spacing:1.5px;">ORDER CONFIRMED</span>
              <h1 style="margin:16px 0 4px; font-family:Georgia, 'Times New Roman', serif; font-size:22px; color:#2b2b2b; font-weight:normal;">Thank you, ${escapeHtml(order.customerName)}!</h1>
              <p style="margin:0; font-family:Arial, Helvetica, sans-serif; font-size:14px; color:#6b6b6b;">Your order has been successfully received.</p>
            </td>
          </tr>
          <tr>
            <td class="ntm-px" style="padding:20px 32px 4px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #ece8e0; border-radius:8px;">
                <tr>
                  <td style="padding:14px 20px;">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="font-family:Arial, Helvetica, sans-serif; font-size:11px; color:#8a8578; text-transform:uppercase; letter-spacing:0.5px;">Order Number</td>
                        <td align="right" style="font-family:Arial, Helvetica, sans-serif; font-size:13px; color:#2b2b2b; font-weight:bold;">${escapeHtml(order.id)}</td>
                      </tr>
                      <tr><td colspan="2" style="height:8px; line-height:8px; font-size:0;">&nbsp;</td></tr>
                      <tr>
                        <td style="font-family:Arial, Helvetica, sans-serif; font-size:11px; color:#8a8578; text-transform:uppercase; letter-spacing:0.5px;">Order Date</td>
                        <td align="right" style="font-family:Arial, Helvetica, sans-serif; font-size:13px; color:#2b2b2b;">${escapeHtml(orderDate)}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td class="ntm-px" style="padding:24px 32px 4px;">
              <div style="font-family:Arial, Helvetica, sans-serif; font-size:12px; font-weight:bold; text-transform:uppercase; letter-spacing:0.5px; color:#173D2D; margin-bottom:10px;">Your Items</div>
              ${itemsHtml}
            </td>
          </tr>
          <tr>
            <td class="ntm-px" style="padding:8px 32px 4px;">
              ${priceSummaryHtml}
            </td>
          </tr>
          <tr>
            <td class="ntm-px" style="padding:20px 32px 4px;">
              <div style="font-family:Arial, Helvetica, sans-serif; font-size:12px; font-weight:bold; text-transform:uppercase; letter-spacing:0.5px; color:#173D2D; margin-bottom:10px;">Payment</div>
              ${paymentHtml}
            </td>
          </tr>
          <tr>
            <td class="ntm-px" style="padding:20px 32px 8px;">
              <div style="font-family:Arial, Helvetica, sans-serif; font-size:12px; font-weight:bold; text-transform:uppercase; letter-spacing:0.5px; color:#173D2D; margin-bottom:10px;">Delivery Information</div>
              ${deliveryHtml}
            </td>
          </tr>
          ${ctaHtml}
          ${footerHtml}
        </table>
        <!--[if mso]>
        </td></tr></table>
        <![endif]-->
      </td>
    </tr>
  </table>
</body>
</html>`;

  const text = buildOrderConfirmationText(order, items, store, paymentInfo);
  const sms = `${store.name}: Your order ${order.id} (${formatCurrency(order.total)}) has been confirmed. We'll text you again once it ships.`;

  return { subject, html, text, sms };
}

const ORDER_STATUS_LABEL: Record<string, string> = {
  Pending: "is being prepared",
  Confirmed: "has been confirmed",
  Shipped: "is on its way",
  Delivered: "has been delivered",
  Cancelled: "has been cancelled"
};

export function orderStatusContent(order: OrderLike, status: string) {
  const label = ORDER_STATUS_LABEL[status] ?? `is now "${status}"`;
  return {
    subject: `Order ${order.id} update — NTM Fabrics`,
    html: emailShell(
      `Your order ${label}`,
      `<p>Hi ${order.customer_name}, your order <strong>${order.id}</strong> ${label}.</p>
       <p>You can check full order details anytime from your account.</p>`
    ),
    text: `Hi ${order.customer_name}, your order ${order.id} ${label}. Check full order details anytime from your account.`,
    sms: `NTM Fabrics: Order ${order.id} ${label}.`
  };
}

const RETURN_STATUS_LABEL: Record<string, string> = {
  approved: "has been approved",
  rejected: "has been rejected",
  shipped_back: "— we've noted your item is on its way back to us",
  received: "— we've received your returned item",
  refunded: "has been refunded",
  cancelled: "has been cancelled"
};

export function returnStatusContent(orderId: string, customerName: string, status: string) {
  const label = RETURN_STATUS_LABEL[status] ?? `is now "${status}"`;
  return {
    subject: `Return request for order ${orderId} — NTM Fabrics`,
    html: emailShell(
      `Your return request ${label}`,
      `<p>Hi ${customerName}, your return request for order <strong>${orderId}</strong> ${label}.</p>
       <p>You can view the latest status anytime from your account.</p>`
    ),
    text: `Hi ${customerName}, your return request for order ${orderId} ${label}. You can view the latest status anytime from your account.`,
    sms: `NTM Fabrics: Your return for order ${orderId} ${label}.`
  };
}

export function adminVerificationEmailContent(admin: { name: string }, verifyUrl: string) {
  return {
    subject: "Verify your admin email address — NTM Fabrics",
    html: emailShell(
      "Verify Your Admin Email",
      `<p>Hi ${admin.name},</p>
       <p>Please confirm this is your admin email address to finish setting up your NTM Fabrics admin account.</p>
       <p style="text-align:center; margin:28px 0;">
         <a href="${verifyUrl}" style="display:inline-block; padding:12px 28px; background:#173D2D; color:#ffffff; text-decoration:none; border-radius:6px; font-weight:bold;">Verify Email</a>
       </p>
       <p>This link expires in <strong>30 minutes</strong> and can only be used once.</p>
       <p style="font-size:12px; color:#8a8578;">If you didn't request this, you can safely ignore this email — your admin account will remain unverified and no access will be granted.</p>`
    ),
    text: `Hi ${admin.name}, please verify your NTM Fabrics admin email address by visiting: ${verifyUrl}\nThis link expires in 30 minutes and can only be used once. If you didn't request this, you can safely ignore this email.`
  };
}
