import { query } from "../config/db";

export interface BestSellingProductRow {
  product_id: string | null;
  name: string;
  image_url: string | null;
  units_sold: string;
  revenue: string;
  order_count: string;
}

export interface CouponPerformanceRow {
  id: string;
  code: string;
  discount_type: string;
  discount_value: string;
  is_active: boolean;
  redemption_count: string;
  total_discount_given: string;
  revenue_from_orders: string;
}

const REVENUE_ORDER_FILTER = "o.status != 'Cancelled'";

export const AnalyticsModel = {
  async bestSellingProducts(limit: number, sinceDays?: number): Promise<BestSellingProductRow[]> {
    const dateFilter = sinceDays ? `AND o.created_at >= now() - ($2 || ' days')::interval` : "";
    const params: unknown[] = [limit];
    if (sinceDays) params.push(sinceDays);

    const result = await query<BestSellingProductRow>(
      `SELECT
         oi.product_id,
         -- Falls back to the order line's saved name if the product was
         -- later deleted (order_items.product_id is ON DELETE SET NULL) —
         -- a discontinued fabric should still show up in historical
         -- best-sellers instead of vanishing from the report.
         COALESCE(p.name, MIN(oi.name)) AS name,
         MIN(p.images->>0) AS image_url,
         SUM(oi.quantity)::text AS units_sold,
         SUM(oi.quantity * oi.unit_price)::text AS revenue,
         COUNT(DISTINCT oi.order_id)::text AS order_count
       FROM order_items oi
       JOIN orders o ON o.id = oi.order_id
       LEFT JOIN products p ON p.id = oi.product_id
       WHERE ${REVENUE_ORDER_FILTER} ${dateFilter}
       GROUP BY oi.product_id, p.name
       ORDER BY SUM(oi.quantity) DESC
       LIMIT $1`,
      params
    );
    return result.rows;
  },

  async couponPerformance(limit: number): Promise<CouponPerformanceRow[]> {
    const result = await query<CouponPerformanceRow>(
      `SELECT
         c.id,
         c.code,
         c.discount_type,
         c.discount_value::text,
         c.is_active,
         COUNT(cr.id)::text AS redemption_count,
         COALESCE(SUM(cr.discount_amount), 0)::text AS total_discount_given,
         COALESCE(SUM(o.amount) FILTER (WHERE ${REVENUE_ORDER_FILTER}), 0)::text AS revenue_from_orders
       FROM coupons c
       LEFT JOIN coupon_redemptions cr ON cr.coupon_id = c.id
       LEFT JOIN orders o ON o.id = cr.order_id
       GROUP BY c.id
       ORDER BY COALESCE(SUM(o.amount) FILTER (WHERE ${REVENUE_ORDER_FILTER}), 0) DESC
       LIMIT $1`,
      [limit]
    );
    return result.rows;
  }
};
