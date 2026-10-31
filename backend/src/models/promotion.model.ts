import { PoolClient } from "pg";
import { query } from "../config/db";
import type { PromotionTargetType, PromotionTargeting } from "../services/promotion-eligibility";

export type DiscountType = "percentage" | "fixed";

export interface PromotionRecord {
  id: string;
  name: string;
  description: string;
  discount_type: DiscountType;
  discount_value: string;
  min_order_amount: string;
  max_discount_amount: string | null;
  starts_at: Date;
  expires_at: Date;
  usage_limit: number | null;
  per_user_limit: number | null;
  usage_count: number;
  is_active: boolean;
  target_type: PromotionTargetType;
  video_url: string | null;
  video_poster_url: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface PromotionInput {
  name: string;
  description?: string;
  discountType: DiscountType;
  discountValue: number;
  minOrderAmount?: number;
  maxDiscountAmount?: number | null;
  startsAt: string;
  expiresAt: string;
  usageLimit?: number | null;
  perUserLimit?: number | null;
  isActive?: boolean;
  targetType: PromotionTargetType;
  productIds?: string[];
  categories?: string[];
  fabricTypes?: string[];
  videoUrl?: string | null;
  videoPosterUrl?: string | null;
  displayProductIds?: string[];
}

export const PromotionModel = {
  async create(input: PromotionInput): Promise<PromotionRecord> {
    const result = await query<PromotionRecord>(
      `INSERT INTO promotions
        (name, description, discount_type, discount_value, min_order_amount,
         max_discount_amount, starts_at, expires_at, usage_limit, per_user_limit, is_active, target_type,
         video_url, video_poster_url)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
       RETURNING *`,
      [
        input.name,
        input.description ?? "",
        input.discountType,
        input.discountValue,
        input.minOrderAmount ?? 0,
        input.maxDiscountAmount ?? null,
        input.startsAt,
        input.expiresAt,
        input.usageLimit ?? null,
        input.perUserLimit ?? null,
        input.isActive ?? true,
        input.targetType,
        input.videoUrl ?? null,
        input.videoPosterUrl ?? null
      ]
    );
    const promo = result.rows[0];

    if (input.targetType === "PRODUCTS" && input.productIds && input.productIds.length > 0) {
      for (const productId of input.productIds) {
        await query(
          `INSERT INTO promotion_products (promotion_id, product_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
          [promo.id, productId]
        );
      }
    }
    if (input.targetType === "CATEGORIES" && input.categories && input.categories.length > 0) {
      for (const category of input.categories) {
        await query(
          `INSERT INTO promotion_categories (promotion_id, category) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
          [promo.id, category]
        );
      }
    }
    if (input.targetType === "FABRIC_TYPES" && input.fabricTypes && input.fabricTypes.length > 0) {
      for (const fabricType of input.fabricTypes) {
        await query(
          `INSERT INTO promotion_fabric_types (promotion_id, fabric_type) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
          [promo.id, fabricType]
        );
      }
    }
    if (input.displayProductIds && input.displayProductIds.length > 0) {
      await this.setDisplayProducts(promo.id, input.displayProductIds);
    }

    return promo;
  },

  async update(id: string, input: Partial<PromotionInput>): Promise<PromotionRecord | null> {
    const setClauses: string[] = [];
    const params: unknown[] = [];

    if (input.name !== undefined) {
      params.push(input.name);
      setClauses.push(`name = $${params.length}`);
    }
    if (input.description !== undefined) {
      params.push(input.description);
      setClauses.push(`description = $${params.length}`);
    }
    if (input.discountType !== undefined) {
      params.push(input.discountType);
      setClauses.push(`discount_type = $${params.length}`);
    }
    if (input.discountValue !== undefined) {
      params.push(input.discountValue);
      setClauses.push(`discount_value = $${params.length}`);
    }
    if (input.minOrderAmount !== undefined) {
      params.push(input.minOrderAmount);
      setClauses.push(`min_order_amount = $${params.length}`);
    }
    if (input.maxDiscountAmount !== undefined) {
      params.push(input.maxDiscountAmount);
      setClauses.push(`max_discount_amount = $${params.length}`);
    }
    if (input.startsAt !== undefined) {
      params.push(input.startsAt);
      setClauses.push(`starts_at = $${params.length}`);
    }
    if (input.expiresAt !== undefined) {
      params.push(input.expiresAt);
      setClauses.push(`expires_at = $${params.length}`);
    }
    if (input.usageLimit !== undefined) {
      params.push(input.usageLimit);
      setClauses.push(`usage_limit = $${params.length}`);
    }
    if (input.perUserLimit !== undefined) {
      params.push(input.perUserLimit);
      setClauses.push(`per_user_limit = $${params.length}`);
    }
    if (input.isActive !== undefined) {
      params.push(input.isActive);
      setClauses.push(`is_active = $${params.length}`);
    }
    if (input.targetType !== undefined) {
      params.push(input.targetType);
      setClauses.push(`target_type = $${params.length}`);
    }
    if (input.videoUrl !== undefined) {
      params.push(input.videoUrl);
      setClauses.push(`video_url = $${params.length}`);
    }
    if (input.videoPosterUrl !== undefined) {
      params.push(input.videoPosterUrl);
      setClauses.push(`video_poster_url = $${params.length}`);
    }

    if (setClauses.length === 0) {
      return this.findById(id);
    }

    setClauses.push(`updated_at = now()`);
    params.push(id);

    const result = await query<PromotionRecord>(
      `UPDATE promotions SET ${setClauses.join(", ")} WHERE id = $${params.length} RETURNING *`,
      params
    );
    return result.rows[0] ?? null;
  },

  async setActive(id: string, isActive: boolean): Promise<PromotionRecord | null> {
    const result = await query<PromotionRecord>(
      `UPDATE promotions SET is_active = $1, updated_at = now() WHERE id = $2 RETURNING *`,
      [isActive, id]
    );
    return result.rows[0] ?? null;
  },

  async remove(id: string): Promise<boolean> {
    const result = await query("DELETE FROM promotions WHERE id = $1", [id]);
    return (result.rowCount ?? 0) > 0;
  },

  async findById(id: string): Promise<PromotionRecord | null> {
    const result = await query<PromotionRecord>("SELECT * FROM promotions WHERE id = $1", [id]);
    return result.rows[0] ?? null;
  },

  async findMany(): Promise<PromotionRecord[]> {
    const result = await query<PromotionRecord>(
      "SELECT * FROM promotions ORDER BY created_at DESC"
    );
    return result.rows;
  },

  async findActive(now?: Date): Promise<PromotionRecord[]> {
    const currentTime = now ?? new Date();
    const result = await query<PromotionRecord>(
      `SELECT * FROM promotions
       WHERE is_active = true AND starts_at <= $1 AND expires_at > $1
       ORDER BY starts_at ASC`,
      [currentTime]
    );
    return result.rows;
  },

  async findScheduled(now?: Date): Promise<PromotionRecord[]> {
    const currentTime = now ?? new Date();
    const result = await query<PromotionRecord>(
      `SELECT * FROM promotions
       WHERE is_active = true AND starts_at > $1
       ORDER BY starts_at ASC`,
      [currentTime]
    );
    return result.rows;
  },

  async setProductIds(id: string, productIds: string[]): Promise<void> {
    await query("DELETE FROM promotion_products WHERE promotion_id = $1", [id]);
    for (const productId of productIds) {
      await query(
        `INSERT INTO promotion_products (promotion_id, product_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
        [id, productId]
      );
    }
  },

  async setCategories(id: string, categories: string[]): Promise<void> {
    await query("DELETE FROM promotion_categories WHERE promotion_id = $1", [id]);
    for (const category of categories) {
      await query(
        `INSERT INTO promotion_categories (promotion_id, category) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
        [id, category]
      );
    }
  },

  async setFabricTypes(id: string, fabricTypes: string[]): Promise<void> {
    await query("DELETE FROM promotion_fabric_types WHERE promotion_id = $1", [id]);
    for (const fabricType of fabricTypes) {
      await query(
        `INSERT INTO promotion_fabric_types (promotion_id, fabric_type) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
        [id, fabricType]
      );
    }
  },

  async replaceTargeting(
    id: string,
    targetType: PromotionTargetType,
    targeting: { productIds?: string[]; categories?: string[]; fabricTypes?: string[] }
  ): Promise<void> {
    await this.setProductIds(id, targetType === "PRODUCTS" ? targeting.productIds ?? [] : []);
    await this.setCategories(id, targetType === "CATEGORIES" ? targeting.categories ?? [] : []);
    await this.setFabricTypes(id, targetType === "FABRIC_TYPES" ? targeting.fabricTypes ?? [] : []);
  },

  async getProductIds(promotionId: string): Promise<string[]> {
    const result = await query<{ product_id: string }>(
      "SELECT product_id FROM promotion_products WHERE promotion_id = $1",
      [promotionId]
    );
    return result.rows.map((r) => r.product_id);
  },

  async getCategories(promotionId: string): Promise<string[]> {
    const result = await query<{ category: string }>(
      "SELECT category FROM promotion_categories WHERE promotion_id = $1",
      [promotionId]
    );
    return result.rows.map((r) => r.category);
  },

  async getFabricTypes(promotionId: string): Promise<string[]> {
    const result = await query<{ fabric_type: string }>(
      "SELECT fabric_type FROM promotion_fabric_types WHERE promotion_id = $1",
      [promotionId]
    );
    return result.rows.map((r) => r.fabric_type);
  },

  async countRedemptionsByUser(promotionId: string, userId: string, client?: PoolClient): Promise<number> {
    const result = client
      ? await client.query<{ count: string }>(
          "SELECT COUNT(*)::text AS count FROM promotion_usages WHERE promotion_id = $1 AND user_id = $2",
          [promotionId, userId]
        )
      : await query<{ count: string }>(
          "SELECT COUNT(*)::text AS count FROM promotion_usages WHERE promotion_id = $1 AND user_id = $2",
          [promotionId, userId]
        );
    return parseInt(result.rows[0]?.count ?? "0", 10);
  },

  async tryReserveUsage(client: PoolClient, promotionId: string): Promise<boolean> {
    const result = await client.query(
      `UPDATE promotions
       SET usage_count = usage_count + 1, updated_at = now()
       WHERE id = $1 AND (usage_limit IS NULL OR usage_count < usage_limit)`,
      [promotionId]
    );
    return (result.rowCount ?? 0) > 0;
  },

  async lockUserPromotion(client: PoolClient, promotionId: string, userId: string): Promise<void> {
    await client.query(`SELECT pg_advisory_xact_lock(hashtext($1), hashtext($2))`, [promotionId, userId]);
  },

  async recordUsageRow(
    client: PoolClient,
    promotionId: string,
    userId: string | null,
    orderId: string,
    discountAmount: number
  ): Promise<void> {
    await client.query(
      `INSERT INTO promotion_usages (promotion_id, user_id, order_id, discount_amount) VALUES ($1, $2, $3, $4)`,
      [promotionId, userId, orderId, discountAmount]
    );
  },

  async getTargeting(promotionId: string): Promise<PromotionTargeting> {
    const promo = await this.findById(promotionId);
    if (!promo) {
      throw new Error(`Promotion ${promotionId} not found`);
    }
    const [productIds, categories, fabricTypes] = await Promise.all([
      this.getProductIds(promotionId),
      this.getCategories(promotionId),
      this.getFabricTypes(promotionId)
    ]);
    return {
      targetType: promo.target_type,
      productIds,
      categories,
      fabricTypes
    };
  },


  async setDisplayProducts(promotionId: string, productIds: string[]): Promise<void> {
    await query("DELETE FROM promotion_display_products WHERE promotion_id = $1", [promotionId]);
    for (let i = 0; i < productIds.length; i++) {
      await query(
        `INSERT INTO promotion_display_products (promotion_id, product_id, display_order) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING`,
        [promotionId, productIds[i], i]
      );
    }
  },

  async getDisplayProducts(promotionId: string): Promise<Array<{ product_id: string; display_order: number }>> {
    const result = await query<{ product_id: string; display_order: number }>(
      "SELECT product_id, display_order FROM promotion_display_products WHERE promotion_id = $1 ORDER BY display_order ASC",
      [promotionId]
    );
    return result.rows;
  },

  async getDisplayProductsWithDetails(promotionId: string): Promise<Array<{
    id: string; name: string; slug: string; sku: string; price: number; images: string[];
    category: string; fabricType: string; colors: { name: string; hex: string }[];
    originalPrice: number | null; stock: number; isNew: boolean; displayOrder: number;
  }>> {
    const displayRows = await this.getDisplayProducts(promotionId);
    if (displayRows.length === 0) return [];
    const ids = displayRows.map((r) => r.product_id);
    const result = await query<{
      id: string; name: string; slug: string; sku: string; price: string; images: string[];
      category: string; fabric_type: string; colors: { name: string; hex: string }[];
      original_price: string | null; stock: number; is_new: boolean;
    }>(
      "SELECT id, name, slug, sku, price, images, category, fabric_type, colors, original_price, stock, is_new FROM products WHERE id = ANY($1::uuid[])",
      [ids]
    );
    const productMap = new Map(result.rows.map((r) => [r.id, r]));
    return displayRows.map((row) => {
      const p = productMap.get(row.product_id);
      if (!p) return null;
      return {
        id: p.id,
        name: p.name,
        slug: p.slug,
        sku: p.sku,
        price: parseFloat(p.price),
        images: p.images,
        category: p.category,
        fabricType: p.fabric_type,
        colors: p.colors,
        originalPrice: p.original_price ? parseFloat(p.original_price) : null,
        stock: p.stock,
        isNew: p.is_new,
        displayOrder: row.display_order
      };
    }).filter(Boolean) as Array<{
      id: string; name: string; slug: string; sku: string; price: number; images: string[];
      category: string; fabricType: string; colors: { name: string; hex: string }[];
      originalPrice: number | null; stock: number; isNew: boolean; displayOrder: number;
    }>;
  },

  async findActiveWithTargeting(now?: Date): Promise<Array<PromotionRecord & { targeting: PromotionTargeting }>> {
    const promos = await this.findActive(now);
    if (promos.length === 0) return [];

    const ids = promos.map((p) => p.id);
    const [productRows, categoryRows, fabricRows] = await Promise.all([
      query<{ promotion_id: string; product_id: string }>(
        "SELECT promotion_id, product_id FROM promotion_products WHERE promotion_id = ANY($1::uuid[])",
        [ids]
      ),
      query<{ promotion_id: string; category: string }>(
        "SELECT promotion_id, category FROM promotion_categories WHERE promotion_id = ANY($1::uuid[])",
        [ids]
      ),
      query<{ promotion_id: string; fabric_type: string }>(
        "SELECT promotion_id, fabric_type FROM promotion_fabric_types WHERE promotion_id = ANY($1::uuid[])",
        [ids]
      )
    ]);

    const productsByPromo = new Map<string, string[]>();
    for (const row of productRows.rows) {
      productsByPromo.set(row.promotion_id, [...(productsByPromo.get(row.promotion_id) ?? []), row.product_id]);
    }
    const categoriesByPromo = new Map<string, string[]>();
    for (const row of categoryRows.rows) {
      categoriesByPromo.set(row.promotion_id, [...(categoriesByPromo.get(row.promotion_id) ?? []), row.category]);
    }
    const fabricTypesByPromo = new Map<string, string[]>();
    for (const row of fabricRows.rows) {
      fabricTypesByPromo.set(row.promotion_id, [...(fabricTypesByPromo.get(row.promotion_id) ?? []), row.fabric_type]);
    }

    return promos.map((promo) => ({
      ...promo,
      targeting: {
        targetType: promo.target_type,
        productIds: productsByPromo.get(promo.id) ?? [],
        categories: categoriesByPromo.get(promo.id) ?? [],
        fabricTypes: fabricTypesByPromo.get(promo.id) ?? []
      }
    }));
  },

  async getAnalytics(promotionId: string): Promise<{
    totalOrders: number;
    totalDiscount: number;
    totalRevenue: number;
    uniqueUsers: number;
  }> {
    const result = await query<{ total_orders: string; total_discount: string; total_revenue: string; unique_users: string }>(
      `SELECT
         COUNT(DISTINCT pu.order_id)::text AS total_orders,
         COALESCE(SUM(pu.discount_amount), 0)::text AS total_discount,
         COALESCE(SUM(o.amount), 0)::text AS total_revenue,
         COUNT(DISTINCT pu.user_id)::text AS unique_users
       FROM promotion_usages pu
       JOIN orders o ON o.id = pu.order_id
       WHERE pu.promotion_id = $1 AND o.status != 'Cancelled'`,
      [promotionId]
    );
    const row = result.rows[0];
    return {
      totalOrders: parseInt(row?.total_orders ?? "0", 10),
      totalDiscount: parseFloat(row?.total_discount ?? "0"),
      totalRevenue: parseFloat(row?.total_revenue ?? "0"),
      uniqueUsers: parseInt(row?.unique_users ?? "0", 10)
    };
  }
};
