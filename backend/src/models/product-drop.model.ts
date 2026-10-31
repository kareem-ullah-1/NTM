import type { PoolClient } from "pg";
import { query } from "../config/db";

export interface ProductDropRecord {
  id: string;
  product_id: string;
  name: string;
  description: string;
  starts_at: Date;
  ends_at: Date;
  max_quantity: number;
  per_customer_limit: number;
  sold_quantity: number;
  special_price: string | null;
  promotion_id: string | null;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface ProductDropInput {
  productId: string;
  name: string;
  description?: string;
  startsAt: string;
  endsAt: string;
  maxQuantity: number;
  perCustomerLimit?: number;
  specialPrice?: number | null;
  promotionId?: string | null;
  isActive?: boolean;
}

export interface ProductDropListParams {
  page: number;
  limit: number;
  search?: string;
  status?: string;
}

export interface ProductDropListResult {
  rows: ProductDropRecord[];
  total: number;
}

export const ProductDropModel = {
  async create(input: ProductDropInput): Promise<ProductDropRecord> {
    const result = await query<ProductDropRecord>(
      `INSERT INTO product_drops
        (product_id, name, description, starts_at, ends_at, max_quantity,
         per_customer_limit, special_price, promotion_id, is_active)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
       RETURNING *`,
      [
        input.productId,
        input.name,
        input.description ?? "",
        input.startsAt,
        input.endsAt,
        input.maxQuantity,
        input.perCustomerLimit ?? 1,
        input.specialPrice ?? null,
        input.promotionId ?? null,
        input.isActive ?? true
      ]
    );
    return result.rows[0];
  },

  async update(id: string, input: Partial<ProductDropInput>): Promise<ProductDropRecord | null> {
    const setClauses: string[] = [];
    const params: unknown[] = [];

    if (input.productId !== undefined) {
      params.push(input.productId);
      setClauses.push(`product_id = $${params.length}`);
    }
    if (input.name !== undefined) {
      params.push(input.name);
      setClauses.push(`name = $${params.length}`);
    }
    if (input.description !== undefined) {
      params.push(input.description);
      setClauses.push(`description = $${params.length}`);
    }
    if (input.startsAt !== undefined) {
      params.push(input.startsAt);
      setClauses.push(`starts_at = $${params.length}`);
    }
    if (input.endsAt !== undefined) {
      params.push(input.endsAt);
      setClauses.push(`ends_at = $${params.length}`);
    }
    if (input.maxQuantity !== undefined) {
      params.push(input.maxQuantity);
      setClauses.push(`max_quantity = $${params.length}`);
    }
    if (input.perCustomerLimit !== undefined) {
      params.push(input.perCustomerLimit);
      setClauses.push(`per_customer_limit = $${params.length}`);
    }
    if (input.specialPrice !== undefined) {
      params.push(input.specialPrice);
      setClauses.push(`special_price = $${params.length}`);
    }
    if (input.promotionId !== undefined) {
      params.push(input.promotionId);
      setClauses.push(`promotion_id = $${params.length}`);
    }
    if (input.isActive !== undefined) {
      params.push(input.isActive);
      setClauses.push(`is_active = $${params.length}`);
    }

    if (setClauses.length === 0) {
      return this.findById(id);
    }

    setClauses.push(`updated_at = now()`);
    params.push(id);

    const result = await query<ProductDropRecord>(
      `UPDATE product_drops SET ${setClauses.join(", ")} WHERE id = $${params.length} RETURNING *`,
      params
    );
    return result.rows[0] ?? null;
  },

  async setActive(id: string, isActive: boolean): Promise<ProductDropRecord | null> {
    const result = await query<ProductDropRecord>(
      `UPDATE product_drops SET is_active = $1, updated_at = now() WHERE id = $2 RETURNING *`,
      [isActive, id]
    );
    return result.rows[0] ?? null;
  },

  async remove(id: string): Promise<boolean> {
    const result = await query("DELETE FROM product_drops WHERE id = $1", [id]);
    return (result.rowCount ?? 0) > 0;
  },

  async findById(id: string): Promise<ProductDropRecord | null> {
    const result = await query<ProductDropRecord>("SELECT * FROM product_drops WHERE id = $1", [id]);
    return result.rows[0] ?? null;
  },

  async findByIdForUpdate(client: PoolClient, id: string): Promise<ProductDropRecord | null> {
    const result = await client.query<ProductDropRecord>(
      "SELECT * FROM product_drops WHERE id = $1 FOR UPDATE",
      [id]
    );
    return result.rows[0] ?? null;
  },

  async findByProductId(productId: string): Promise<ProductDropRecord | null> {
    const result = await query<ProductDropRecord>(
      "SELECT * FROM product_drops WHERE product_id = $1 AND is_active = true ORDER BY created_at DESC LIMIT 1",
      [productId]
    );
    return result.rows[0] ?? null;
  },

  async hasOverlappingDrop(
    productId: string,
    startsAt: string,
    endsAt: string,
    excludeId?: string
  ): Promise<ProductDropRecord | null> {
    const params: unknown[] = [productId, startsAt, endsAt];
    let excludeClause = "";
    if (excludeId) {
      params.push(excludeId);
      excludeClause = `AND id != $${params.length}`;
    }
    const result = await query<ProductDropRecord>(
      `SELECT * FROM product_drops
       WHERE product_id = $1 AND is_active = true
         AND starts_at < $3 AND ends_at > $2
         ${excludeClause}
       LIMIT 1`,
      params
    );
    return result.rows[0] ?? null;
  },

  async findMany(): Promise<ProductDropRecord[]> {
    const result = await query<ProductDropRecord>(
      "SELECT * FROM product_drops ORDER BY created_at DESC"
    );
    return result.rows;
  },

  async findManyPaginated(params: ProductDropListParams): Promise<ProductDropListResult> {
    const { page, limit, search, status } = params;
    const offset = (page - 1) * limit;
    const conditions: string[] = [];
    const queryParams: unknown[] = [];

    if (search && search.trim()) {
      const term = `%${search.trim()}%`;
      queryParams.push(term);
      conditions.push(
        `(pd.name ILIKE $${queryParams.length} OR p.name ILIKE $${queryParams.length})`
      );
    }

    if (status && status !== "all") {
      const now = new Date().toISOString();
      switch (status) {
        case "draft":
          conditions.push(`pd.is_active = false AND pd.sold_quantity = 0`);
          break;
        case "upcoming":
          conditions.push(`pd.is_active = true AND pd.starts_at > ${queryParams.length === 0 ? "now()" : `$${++queryParams.length}`}`);
          if (queryParams.length === 0) queryParams.push(now);
          break;
        case "live":
          conditions.push(`pd.is_active = true AND pd.starts_at <= ${queryParams.length === 0 ? "now()" : `$${++queryParams.length}`} AND pd.ends_at > ${queryParams.length === 0 ? "now()" : `$${++queryParams.length}`} AND pd.sold_quantity < pd.max_quantity`);
          if (queryParams.length <= 1) queryParams.push(now);
          if (queryParams.length <= 2) queryParams.push(now);
          break;
        case "sold_out":
          conditions.push(`pd.is_active = true AND pd.sold_quantity >= pd.max_quantity`);
          break;
        case "ended":
          conditions.push(`pd.is_active = true AND pd.ends_at <= ${queryParams.length === 0 ? "now()" : `$${++queryParams.length}`}`);
          if (queryParams.length === 0) queryParams.push(now);
          break;
        case "disabled":
          conditions.push(`pd.is_active = false AND pd.sold_quantity > 0`);
          break;
      }
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    const countResult = await query<{ count: string }>(
      `SELECT COUNT(*)::text AS count
       FROM product_drops pd
       LEFT JOIN products p ON p.id = pd.product_id
       ${whereClause}`,
      queryParams
    );
    const total = parseInt(countResult.rows[0]?.count ?? "0", 10);

    const pageParams = [...queryParams, limit, offset];
    const rowsResult = await query<ProductDropRecord>(
      `SELECT pd.*
       FROM product_drops pd
       LEFT JOIN products p ON p.id = pd.product_id
       ${whereClause}
       ORDER BY pd.created_at DESC
       LIMIT $${pageParams.length - 1} OFFSET $${pageParams.length}`,
      pageParams
    );

    return { rows: rowsResult.rows, total };
  },

  async findLive(now?: Date): Promise<ProductDropRecord[]> {
    const currentTime = now ?? new Date();
    const result = await query<ProductDropRecord>(
      `SELECT * FROM product_drops
       WHERE is_active = true AND starts_at <= $1 AND ends_at > $1 AND sold_quantity < max_quantity
       ORDER BY starts_at ASC`,
      [currentTime]
    );
    return result.rows;
  },

  async findUpcoming(now?: Date): Promise<ProductDropRecord[]> {
    const currentTime = now ?? new Date();
    const result = await query<ProductDropRecord>(
      `SELECT * FROM product_drops
       WHERE is_active = true AND starts_at > $1
       ORDER BY starts_at ASC`,
      [currentTime]
    );
    return result.rows;
  },

  async decrementQuantityWithClient(
    client: PoolClient,
    id: string,
    quantity: number
  ): Promise<ProductDropRecord | null> {
    const result = await client.query<ProductDropRecord>(
      `UPDATE product_drops SET sold_quantity = sold_quantity + $1, updated_at = now()
       WHERE id = $2 AND (sold_quantity + $1) <= max_quantity
       RETURNING *`,
      [quantity, id]
    );
    return result.rows[0] ?? null;
  },

  async decrementQuantity(id: string, quantity: number): Promise<ProductDropRecord | null> {
    const result = await query<ProductDropRecord>(
      `UPDATE product_drops SET sold_quantity = sold_quantity + $1, updated_at = now()
       WHERE id = $2 AND (sold_quantity + $1) <= max_quantity
       RETURNING *`,
      [quantity, id]
    );
    return result.rows[0] ?? null;
  },

  async countDropPurchasesByUser(dropId: string, userId: string): Promise<number> {
    const result = await query<{ count: string }>(
      "SELECT COALESCE(SUM(quantity), 0)::text AS count FROM drop_purchases WHERE drop_id = $1 AND user_id = $2",
      [dropId, userId]
    );
    return parseInt(result.rows[0]?.count ?? "0", 10);
  },

  async countDropPurchasesByUserWithClient(
    client: PoolClient,
    dropId: string,
    userId: string
  ): Promise<number> {
    const result = await client.query<{ count: string }>(
      "SELECT COALESCE(SUM(quantity), 0)::text AS count FROM drop_purchases WHERE drop_id = $1 AND user_id = $2",
      [dropId, userId]
    );
    return parseInt(result.rows[0]?.count ?? "0", 10);
  },

  async recordPurchaseWithClient(
    client: PoolClient,
    dropId: string,
    userId: string | null,
    orderId: string,
    quantity: number
  ): Promise<void> {
    await client.query(
      `INSERT INTO drop_purchases (drop_id, user_id, order_id, quantity) VALUES ($1, $2, $3, $4)`,
      [dropId, userId, orderId, quantity]
    );
  },

  async recordPurchase(
    dropId: string,
    userId: string | null,
    orderId: string,
    quantity: number
  ): Promise<void> {
    await query(
      `INSERT INTO drop_purchases (drop_id, user_id, order_id, quantity) VALUES ($1, $2, $3, $4)`,
      [dropId, userId, orderId, quantity]
    );
    await query(
      `UPDATE product_drops SET sold_quantity = sold_quantity + $1, updated_at = now() WHERE id = $2`,
      [quantity, dropId]
    );
  },

  async countPurchasesByDropId(dropId: string): Promise<number> {
    const result = await query<{ count: string }>(
      "SELECT COUNT(*)::text AS count FROM drop_purchases WHERE drop_id = $1",
      [dropId]
    );
    return parseInt(result.rows[0]?.count ?? "0", 10);
  },

  async getAnalytics(dropId: string): Promise<{
    totalOrders: number;
    totalUnits: number;
    totalRevenue: number;
    remainingQuantity: number;
  }> {
    const result = await query<{ total_orders: string; total_units: string; total_revenue: string; remaining: string }>(
      `SELECT
         COUNT(DISTINCT dp.order_id)::text AS total_orders,
         COALESCE(SUM(dp.quantity), 0)::text AS total_units,
         COALESCE(SUM(o.amount), 0)::text AS total_revenue,
         (pd.max_quantity - pd.sold_quantity)::text AS remaining
       FROM drop_purchases dp
       JOIN orders o ON o.id = dp.order_id
       JOIN product_drops pd ON pd.id = dp.drop_id
       WHERE dp.drop_id = $1 AND o.status != 'Cancelled'`,
      [dropId]
    );
    const row = result.rows[0];
    return {
      totalOrders: parseInt(row?.total_orders ?? "0", 10),
      totalUnits: parseInt(row?.total_units ?? "0", 10),
      totalRevenue: parseFloat(row?.total_revenue ?? "0"),
      remainingQuantity: parseInt(row?.remaining ?? "0", 10)
    };
  }
};
