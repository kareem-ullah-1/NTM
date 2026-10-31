import { PoolClient } from "pg";
import { query } from "../config/db";

export type OrderStatus = "Pending" | "Confirmed" | "Shipped" | "Delivered" | "Cancelled";

export type DashboardPeriod = "7d" | "30d" | "60d" | "90d" | "6m" | "12m" | "all";

export const DASHBOARD_PERIODS: DashboardPeriod[] = ["7d", "30d", "60d", "90d", "6m", "12m", "all"];

const PERIOD_CONFIG: Record<DashboardPeriod, { days: number | null; bucket: "day" | "week" | "month" }> = {
  "7d": { days: 7, bucket: "day" },
  "30d": { days: 30, bucket: "day" },
  "60d": { days: 60, bucket: "week" },
  "90d": { days: 90, bucket: "week" },
  "6m": { days: 182, bucket: "month" },
  "12m": { days: 365, bucket: "month" },
  all: { days: null, bucket: "month" }
};

export type PaymentMethod = "Cash on Delivery" | "Easypaisa / JazzCash" | "Bank Transfer";
export type PaymentStatusValue = "pending" | "paid" | "failed" | "refunded" | "cancelled";

export interface OrderRecord {
  id: string;
  customer_name: string;
  customer_phone: string;
  customer_email: string;
  address: string;
  city: string;
  region: string | null;
  postal_code: string;
  delivery_notes: string | null;
  payment_method: PaymentMethod;
  status: OrderStatus;
  amount: string;
  subtotal_amount: string;
  discount_amount: string;
  coupon_code: string | null;
  wallet_amount_used: string;
  payment_status: PaymentStatusValue;
  cancellation_reason: string | null;
  user_id: string | null;
  stock_restored: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface OrderItemRecord {
  id: string;
  order_id: string;
  product_id: string | null;
  name: string;
  color: string | null;
  length: string | null;
  quantity: number;
  unit_price: string;
  promo_id: string | null;
  original_unit_price: string | null;
  promo_discount: string;
}

export interface OrderItemInput {
  productId?: string | null;
  name: string;
  color?: string | null;
  length?: string | null;
  quantity: number;
  unitPrice: number;
}

export interface OrderFilterOptions {
  status?: OrderStatus;
  search?: string;
  limit: number;
  offset: number;
}

function generateOrderId(): string {
  const random = Math.floor(100000 + Math.random() * 900000);
  return `NF-${random}`;
}

export const OrderModel = {
  async create(
    client: PoolClient,
    input: {
      customerName: string;
      customerPhone: string;
      customerEmail: string;
      address: string;
      city: string;
      region?: string | null;
      postalCode: string;
      deliveryNotes?: string | null;
      paymentMethod: PaymentMethod;
      subtotalAmount: number;
      discountAmount: number;
      couponCode?: string | null;
      amount: number;
      userId?: string | null;
    }
  ): Promise<OrderRecord> {
    let id = generateOrderId();
    for (let attempt = 0; attempt < 5; attempt += 1) {
      const existing = await client.query("SELECT 1 FROM orders WHERE id = $1", [id]);
      if (existing.rowCount === 0) break;
      id = generateOrderId();
    }

    const result = await client.query<OrderRecord>(
      `INSERT INTO orders
        (id, customer_name, customer_phone, customer_email, address, city, region, postal_code, delivery_notes,
         payment_method, subtotal_amount, discount_amount, coupon_code,
         amount, status, user_id)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,'Pending',$15)
       RETURNING *`,
      [
        id,
        input.customerName,
        input.customerPhone,
        input.customerEmail,
        input.address,
        input.city,
        input.region ?? null,
        input.postalCode,
        input.deliveryNotes ?? null,
        input.paymentMethod,
        input.subtotalAmount,
        input.discountAmount,
        input.couponCode ?? null,
        input.amount,
        input.userId ?? null
      ]
    );
    return result.rows[0];
  },

  async addItems(client: PoolClient, orderId: string, items: OrderItemInput[]): Promise<void> {
    
    if (items.length === 0) return;

    const valuesSql: string[] = [];
    const params: unknown[] = [];
    items.forEach((item, index) => {
      const base = index * 7;
      valuesSql.push(
        `($${base + 1},$${base + 2},$${base + 3},$${base + 4},$${base + 5},$${base + 6},$${base + 7})`
      );
      params.push(
        orderId,
        item.productId ?? null,
        item.name,
        item.color ?? null,
        item.length ?? null,
        item.quantity,
        item.unitPrice
      );
    });

    await client.query(
      `INSERT INTO order_items (order_id, product_id, name, color, length, quantity, unit_price)
       VALUES ${valuesSql.join(",")}`,
      params
    );
  },

  async findMany(options: OrderFilterOptions): Promise<{ rows: OrderRecord[]; total: number }> {
    const conditions: string[] = [];
    const params: unknown[] = [];

    if (options.status) {
      params.push(options.status);
      conditions.push(`status = $${params.length}`);
    }
    if (options.search) {
      params.push(`%${options.search.toLowerCase()}%`);
      const idx = params.length;
      conditions.push(`(LOWER(customer_name) LIKE $${idx} OR LOWER(id) LIKE $${idx} OR customer_phone LIKE $${idx})`);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    const countResult = await query<{ count: string }>(`SELECT COUNT(*)::text AS count FROM orders ${whereClause}`, params);
    const total = parseInt(countResult.rows[0]?.count ?? "0", 10);

    params.push(options.limit);
    const limitIdx = params.length;
    params.push(options.offset);
    const offsetIdx = params.length;

    const rowsResult = await query<OrderRecord>(
      `SELECT * FROM orders ${whereClause} ORDER BY created_at DESC LIMIT $${limitIdx} OFFSET $${offsetIdx}`,
      params
    );

    return { rows: rowsResult.rows, total };
  },

  async findById(id: string): Promise<OrderRecord | null> {
    const result = await query<OrderRecord>("SELECT * FROM orders WHERE id = $1", [id]);
    return result.rows[0] ?? null;
  },

  async findByIdForUpdate(client: PoolClient, id: string): Promise<OrderRecord | null> {
    const result = await client.query<OrderRecord>("SELECT * FROM orders WHERE id = $1 FOR UPDATE", [id]);
    return result.rows[0] ?? null;
  },

    async setStockRestoredWithClient(client: PoolClient, id: string, value: boolean): Promise<void> {
    await client.query(`UPDATE orders SET stock_restored = $1, updated_at = now() WHERE id = $2`, [value, id]);
  },

  async findByUserId(userId: string): Promise<OrderRecord[]> {
    const result = await query<OrderRecord>(
      "SELECT * FROM orders WHERE user_id = $1 ORDER BY created_at DESC",
      [userId]
    );
    return result.rows;
  },

  async findItemsByOrderId(orderId: string): Promise<OrderItemRecord[]> {
    const result = await query<OrderItemRecord>("SELECT * FROM order_items WHERE order_id = $1", [orderId]);
    return result.rows;
  },

  
  async findItemsByOrderIds(orderIds: string[]): Promise<Map<string, OrderItemRecord[]>> {
    const byOrder = new Map<string, OrderItemRecord[]>();
    if (orderIds.length === 0) return byOrder;

    const result = await query<OrderItemRecord>(
      "SELECT * FROM order_items WHERE order_id = ANY($1::varchar[]) ORDER BY order_id, id",
      [orderIds]
    );
    for (const item of result.rows) {
      const list = byOrder.get(item.order_id);
      if (list) {
        list.push(item);
      } else {
        byOrder.set(item.order_id, [item]);
      }
    }
    return byOrder;
  },

  async findItemsByOrderIdWithClient(client: PoolClient, orderId: string): Promise<OrderItemRecord[]> {
    const result = await client.query<OrderItemRecord>("SELECT * FROM order_items WHERE order_id = $1", [orderId]);
    return result.rows;
  },

  async updateStatus(id: string, status: OrderStatus): Promise<OrderRecord | null> {
    const result = await query<OrderRecord>(
      `UPDATE orders SET status = $1, updated_at = now() WHERE id = $2 RETURNING *`,
      [status, id]
    );
    return result.rows[0] ?? null;
  },

  async updateStatusWithClient(client: PoolClient, id: string, status: OrderStatus): Promise<OrderRecord | null> {
    const result = await client.query<OrderRecord>(
      `UPDATE orders SET status = $1, updated_at = now() WHERE id = $2 RETURNING *`,
      [status, id]
    );
    return result.rows[0] ?? null;
  },

  async cancelWithClient(client: PoolClient, id: string, reason?: string | null): Promise<OrderRecord | null> {
    const result = await client.query<OrderRecord>(
      `UPDATE orders SET status = 'Cancelled', cancellation_reason = COALESCE($1, cancellation_reason), updated_at = now()
       WHERE id = $2 RETURNING *`,
      [reason ?? null, id]
    );
    return result.rows[0] ?? null;
  },

  async countAll(): Promise<number> {
    const result = await query<{ count: string }>("SELECT COUNT(*)::text AS count FROM orders");
    return parseInt(result.rows[0]?.count ?? "0", 10);
  },

  async totalRevenue(): Promise<number> {
    const result = await query<{ total: string }>(
      "SELECT COALESCE(SUM(amount), 0)::text AS total FROM orders WHERE status != 'Cancelled'"
    );
    return parseFloat(result.rows[0]?.total ?? "0");
  },

  async salesSeriesForPeriod(
    period: DashboardPeriod
  ): Promise<{ bucket: string; total: number; orderCount: number }[]> {
    const config = PERIOD_CONFIG[period];

    let startDate: Date;
    if (config.days === null) {

      const minResult = await query<{ min_date: Date | null }>(
        `SELECT MIN(created_at) AS min_date FROM orders WHERE status != 'Cancelled'`
      );
      startDate = minResult.rows[0]?.min_date ?? new Date();
    } else {
      startDate = new Date(Date.now() - config.days * 24 * 60 * 60 * 1000);
    }

    const result = await query<{ bucket: string; total: string; order_count: string }>(
      `WITH bounds AS (
         SELECT date_trunc($2, $1::timestamptz) AS start_bucket, date_trunc($2, now()) AS end_bucket
       ),
       buckets AS (
         SELECT generate_series(start_bucket, end_bucket, ('1 ' || $2)::interval) AS bucket_start FROM bounds
       ),
       agg AS (
         SELECT date_trunc($2, created_at) AS bucket_start, SUM(amount) AS total, COUNT(*) AS order_count
         FROM orders
         WHERE status != 'Cancelled' AND created_at >= $1::timestamptz
         GROUP BY 1
       )
       SELECT to_char(b.bucket_start, 'YYYY-MM-DD') AS bucket,
              COALESCE(a.total, 0)::text AS total,
              COALESCE(a.order_count, 0)::text AS order_count
       FROM buckets b
       LEFT JOIN agg a ON a.bucket_start = b.bucket_start
       ORDER BY b.bucket_start`,
      [startDate.toISOString(), config.bucket]
    );

    return result.rows.map((row) => ({
      bucket: row.bucket,
      total: parseFloat(row.total),
      orderCount: parseInt(row.order_count, 10)
    }));
  }
};
