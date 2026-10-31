import { PoolClient } from "pg";
import { query } from "../config/db";

export type DiscountType = "percentage" | "fixed";

export interface CouponRecord {
  id: string;
  code: string;
  description: string | null;
  discount_type: DiscountType;
  discount_value: string;
  min_order_amount: string;
  max_discount_amount: string | null;
  usage_limit: number | null;
  per_user_limit: number | null;
  usage_count: number;
  is_active: boolean;
  starts_at: Date | null;
  expires_at: Date | null;
  created_at: Date;
  updated_at: Date;
}

export interface CouponInput {
  code: string;
  description?: string | null;
  discountType: DiscountType;
  discountValue: number;
  minOrderAmount?: number;
  maxDiscountAmount?: number | null;
  usageLimit?: number | null;
  perUserLimit?: number | null;
  isActive?: boolean;
  startsAt?: string | null;
  expiresAt?: string | null;
}

export const CouponModel = {
  async create(input: CouponInput): Promise<CouponRecord> {
    const result = await query<CouponRecord>(
      `INSERT INTO coupons
        (code, description, discount_type, discount_value, min_order_amount, max_discount_amount,
         usage_limit, per_user_limit, is_active, starts_at, expires_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
       RETURNING *`,
      [
        input.code.trim().toUpperCase(),
        input.description ?? null,
        input.discountType,
        input.discountValue,
        input.minOrderAmount ?? 0,
        input.maxDiscountAmount ?? null,
        input.usageLimit ?? null,
        input.perUserLimit ?? null,
        input.isActive ?? true,
        input.startsAt ?? null,
        input.expiresAt ?? null
      ]
    );
    return result.rows[0];
  },

  async update(id: string, input: Partial<CouponInput>): Promise<CouponRecord | null> {
    const result = await query<CouponRecord>(
      `UPDATE coupons SET
         code = COALESCE($1, code),
         description = COALESCE($2, description),
         discount_type = COALESCE($3, discount_type),
         discount_value = COALESCE($4, discount_value),
         min_order_amount = COALESCE($5, min_order_amount),
         max_discount_amount = $6,
         usage_limit = $7,
         per_user_limit = $8,
         starts_at = $9,
         expires_at = $10,
         updated_at = now()
       WHERE id = $11
       RETURNING *`,
      [
        input.code ? input.code.trim().toUpperCase() : null,
        input.description ?? null,
        input.discountType ?? null,
        input.discountValue ?? null,
        input.minOrderAmount ?? null,
        input.maxDiscountAmount ?? null,
        input.usageLimit ?? null,
        input.perUserLimit ?? null,
        input.startsAt ?? null,
        input.expiresAt ?? null,
        id
      ]
    );
    return result.rows[0] ?? null;
  },

  async setActive(id: string, isActive: boolean): Promise<CouponRecord | null> {
    const result = await query<CouponRecord>(
      `UPDATE coupons SET is_active = $1, updated_at = now() WHERE id = $2 RETURNING *`,
      [isActive, id]
    );
    return result.rows[0] ?? null;
  },

  async remove(id: string): Promise<boolean> {
    const result = await query("DELETE FROM coupons WHERE id = $1", [id]);
    return (result.rowCount ?? 0) > 0;
  },

  async findById(id: string): Promise<CouponRecord | null> {
    const result = await query<CouponRecord>("SELECT * FROM coupons WHERE id = $1", [id]);
    return result.rows[0] ?? null;
  },

  async findByCode(code: string): Promise<CouponRecord | null> {
    const result = await query<CouponRecord>("SELECT * FROM coupons WHERE code = $1", [code.trim().toUpperCase()]);
    return result.rows[0] ?? null;
  },

  async findByCodeForUpdate(client: PoolClient, code: string): Promise<CouponRecord | null> {
    const result = await client.query<CouponRecord>(
      "SELECT * FROM coupons WHERE code = $1 FOR UPDATE",
      [code.trim().toUpperCase()]
    );
    return result.rows[0] ?? null;
  },

  async findMany(): Promise<CouponRecord[]> {
    const result = await query<CouponRecord>("SELECT * FROM coupons ORDER BY created_at DESC");
    return result.rows;
  },

  async countRedemptionsByUser(couponId: string, userId: string): Promise<number> {
    const result = await query<{ count: string }>(
      "SELECT COUNT(*)::text AS count FROM coupon_redemptions WHERE coupon_id = $1 AND user_id = $2",
      [couponId, userId]
    );
    return parseInt(result.rows[0]?.count ?? "0", 10);
  },

  async recordRedemption(
    client: PoolClient,
    input: { couponId: string; userId: string | null; orderId: string; discountAmount: number }
  ): Promise<void> {
    await client.query(
      `INSERT INTO coupon_redemptions (coupon_id, user_id, order_id, discount_amount) VALUES ($1,$2,$3,$4)`,
      [input.couponId, input.userId, input.orderId, input.discountAmount]
    );
    await client.query(`UPDATE coupons SET usage_count = usage_count + 1, updated_at = now() WHERE id = $1`, [
      input.couponId
    ]);
  }
};
