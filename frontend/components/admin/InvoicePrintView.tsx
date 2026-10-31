import type { ApiOrder } from "@/lib/api/types";
import { formatPrice } from "@/lib/utils";
import { siteConfig } from "@/lib/site-config";

export function InvoicePrintView({ order }: { order: ApiOrder }) {
  const promoDiscount = order.promoDiscount ?? 0;
  const walletAmountUsed = order.walletAmountUsed ?? 0;
  const couponDiscount = order.discountAmount ?? 0;

  const summaryRows: { label: string; value: number }[] = [
    { label: "Subtotal", value: order.subtotal },
    ...(couponDiscount > 0
      ? [{ label: `Coupon Discount${order.couponCode ? ` (${order.couponCode})` : ""}`, value: -couponDiscount }]
      : []),
    ...(promoDiscount > 0 ? [{ label: "Promotion Discount", value: -promoDiscount }] : []),
    ...(walletAmountUsed > 0 ? [{ label: "Wallet Amount Used", value: -walletAmountUsed }] : [])
  ];

  const addressLines = [
    order.address,
    [order.city, order.region].filter(Boolean).join(", "),
    order.postalCode ? `Postal Code: ${order.postalCode}` : null
  ].filter(Boolean) as string[];

  return (
    <div className="invoice-print-area">
      <style>{`
        .invoice-print-area {
          font-family: Georgia, "Times New Roman", serif;
          color: #1c1c1c;
          font-size: 13px;
          line-height: 1.5;
          background: #fff;
        }
        .invoice-print-area .invoice { max-width: 760px; margin: 0 auto; padding: 24px; }
        .invoice-print-area .header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          border-bottom: 2px solid #1c1c1c;
          padding-bottom: 16px;
          margin-bottom: 24px;
        }
        .invoice-print-area .brand { font-size: 22px; font-weight: bold; letter-spacing: 0.06em; text-transform: uppercase; }
        .invoice-print-area .brand-sub { font-size: 11px; color: #555; margin-top: 4px; }
        .invoice-print-area .invoice-title { text-align: right; }
        .invoice-print-area .invoice-title h1 { margin: 0; font-size: 20px; text-transform: uppercase; letter-spacing: 0.08em; }
        .invoice-print-area .invoice-title .meta { font-size: 12px; color: #444; margin-top: 6px; }
        .invoice-print-area .parties { display: flex; justify-content: space-between; gap: 24px; margin-bottom: 24px; }
        .invoice-print-area .party { flex: 1; }
        .invoice-print-area .party h2 { font-size: 11px; text-transform: uppercase; letter-spacing: 0.08em; color: #666; margin: 0 0 6px; }
        .invoice-print-area .party div { margin-bottom: 2px; }
        .invoice-print-area .status-line { display: flex; justify-content: space-between; gap: 24px; margin-bottom: 24px; font-size: 12px; }
        .invoice-print-area .status-line .pill { border: 1px solid #999; border-radius: 999px; padding: 2px 10px; display: inline-block; }
        .invoice-print-area table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
        .invoice-print-area thead th {
          text-align: left;
          font-size: 10px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: #555;
          border-bottom: 1px solid #1c1c1c;
          padding: 6px 8px;
        }
        .invoice-print-area tbody td { padding: 8px; border-bottom: 1px solid #ddd; vertical-align: top; }
        .invoice-print-area td.num, .invoice-print-area th.num { text-align: right; }
        .invoice-print-area .summary { margin-left: auto; width: 280px; }
        .invoice-print-area .summary-row { display: flex; justify-content: space-between; padding: 4px 0; }
        .invoice-print-area .summary-row.discount { color: #2f6b3e; }
        .invoice-print-area .summary-total {
          display: flex;
          justify-content: space-between;
          border-top: 2px solid #1c1c1c;
          margin-top: 6px;
          padding-top: 8px;
          font-size: 15px;
          font-weight: bold;
        }
        .invoice-print-area .footer { margin-top: 40px; font-size: 11px; color: #777; text-align: center; border-top: 1px solid #ddd; padding-top: 12px; }
      `}</style>

      <div className="invoice">
        <div className="header">
          <div>
            <div className="brand">{siteConfig.brandName}</div>
            <div className="brand-sub">{siteConfig.address}</div>
            <div className="brand-sub">
              {siteConfig.phone} &middot; {siteConfig.email}
            </div>
          </div>
          <div className="invoice-title">
            <h1>Invoice</h1>
            <div className="meta">Order #{order.id}</div>
            <div className="meta">Date: {order.date}</div>
          </div>
        </div>

        <div className="parties">
          <div className="party">
            <h2>Billed To</h2>
            <div>
              <strong>{order.customerName}</strong>
            </div>
            <div>{order.customerPhone}</div>
            {order.customerEmail && <div>{order.customerEmail}</div>}
          </div>
          <div className="party">
            <h2>Delivery Address</h2>
            {addressLines.map((line, index) => (
              <div key={index}>{line}</div>
            ))}
          </div>
        </div>

        <div className="status-line">
          <div>
            <strong>Order Status:</strong> <span className="pill">{order.status}</span>
          </div>
          <div>
            <strong>Payment Method:</strong> {order.paymentMethod}
          </div>
          <div>
            <strong>Payment Status:</strong> <span className="pill">{order.paymentStatus}</span>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th>Item</th>
              <th>Color</th>
              <th>Length</th>
              <th className="num">Qty</th>
              <th className="num">Unit Price</th>
              <th className="num">Line Total</th>
            </tr>
          </thead>
          <tbody>
            {order.items.map((item, index) => (
              <tr key={item.id ?? index}>
                <td>{item.name}</td>
                <td>{item.color ?? "-"}</td>
                <td>{item.length ?? "-"}</td>
                <td className="num">{item.quantity}</td>
                <td className="num">{formatPrice(item.unitPrice)}</td>
                <td className="num">{formatPrice(item.unitPrice * item.quantity)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="summary">
          {summaryRows.map((row) => (
            <div key={row.label} className={`summary-row${row.value < 0 ? " discount" : ""}`}>
              <span>{row.label}</span>
              <span>
                {row.value < 0 ? "-" : ""}
                {formatPrice(Math.abs(row.value))}
              </span>
            </div>
          ))}
          <div className="summary-total">
            <span>Total Payable</span>
            <span>{formatPrice(order.amount)}</span>
          </div>
        </div>

        <div className="footer">Thank you for shopping with {siteConfig.brandName}.</div>
      </div>
    </div>
  );
}
