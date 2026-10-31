import type { PoolClient } from "pg";
import { query, withTransaction } from "../config/db";

export type ReviewStatus = "pending" | "approved" | "rejected" | "hidden";

export interface ProductReviewRecord {
  id: string;
  product_id: string;
  user_id: string | null;
  guest_name: string | null;
  guest_email: string | null;
  rating: number;
  comment: string;
  images: string[];
  status: ReviewStatus;
  created_at: Date;
  updated_at: Date;
}

async function recalculateProductRating(client: PoolClient, productId: string): Promise<void> {
  await client.query(
    `UPDATE products SET
       rating = COALESCE(
         (SELECT ROUND(AVG(rating)::numeric, 1) FROM product_reviews WHERE product_id = $1 AND status = 'approved'),
         0
       ),
       review_count = (SELECT COUNT(*) FROM product_reviews WHERE product_id = $1 AND status = 'approved'),
       updated_at = now()
     WHERE id = $1`,
    [productId]
  );
}

export const ProductReviewModel = {
  async findByProduct(productId: string, limit: number, offset: number): Promise<{ rows: ProductReviewRecord[]; total: number }> {

    const [rowsResult, countResult] = await Promise.all([
      query<ProductReviewRecord>(
        `SELECT * FROM product_reviews WHERE product_id = $1 AND status = 'approved' ORDER BY created_at DESC LIMIT $2 OFFSET $3`,
        [productId, limit, offset]
      ),
      query<{ count: string }>(
        `SELECT COUNT(*)::text AS count FROM product_reviews WHERE product_id = $1 AND status = 'approved'`,
        [productId]
      )
    ]);
    return { rows: rowsResult.rows, total: parseInt(countResult.rows[0]?.count ?? "0", 10) };
  },

  async findByUserAndProduct(userId: string, productId: string): Promise<ProductReviewRecord | null> {

    const result = await query<ProductReviewRecord>(
      "SELECT * FROM product_reviews WHERE user_id = $1 AND product_id = $2",
      [userId, productId]
    );
    return result.rows[0] ?? null;
  },

  async findById(id: string): Promise<ProductReviewRecord | null> {
    const result = await query<ProductReviewRecord>("SELECT * FROM product_reviews WHERE id = $1", [id]);
    return result.rows[0] ?? null;
  },

  async upsert(input: { userId: string; productId: string; rating: number; comment: string; images: string[] }): Promise<ProductReviewRecord> {
    return withTransaction(async (client) => {
      const result = await client.query<ProductReviewRecord>(
        `INSERT INTO product_reviews (product_id, user_id, rating, comment, images, status)
         VALUES ($1, $2, $3, $4, $5, 'approved')
         ON CONFLICT (product_id, user_id)
         DO UPDATE SET rating = EXCLUDED.rating, comment = EXCLUDED.comment, images = EXCLUDED.images, status = 'approved', updated_at = now()
         RETURNING *`,
        [input.productId, input.userId, input.rating, input.comment, JSON.stringify(input.images)]
      );
      await recalculateProductRating(client, input.productId);
      return result.rows[0];
    });
  },

    async createGuestReview(input: {
    productId: string;
    guestName: string;
    guestEmail: string;
    rating: number;
    comment: string;
    images: string[];
  }): Promise<ProductReviewRecord> {
    return withTransaction(async (client) => {
      const result = await client.query<ProductReviewRecord>(
        `INSERT INTO product_reviews (product_id, user_id, guest_name, guest_email, rating, comment, images, status)
         VALUES ($1, NULL, $2, $3, $4, $5, $6, 'approved')
         RETURNING *`,
        [input.productId, input.guestName, input.guestEmail, input.rating, input.comment, JSON.stringify(input.images)]
      );
      await recalculateProductRating(client, input.productId);
      return result.rows[0];
    });
  },

  async delete(id: string): Promise<ProductReviewRecord | null> {
    return withTransaction(async (client) => {
      const result = await client.query<ProductReviewRecord>(
        "DELETE FROM product_reviews WHERE id = $1 RETURNING *",
        [id]
      );
      const deleted = result.rows[0] ?? null;
      if (deleted) await recalculateProductRating(client, deleted.product_id);
      return deleted;
    });
  },

  async updateStatus(id: string, status: ReviewStatus): Promise<ProductReviewRecord | null> {
    return withTransaction(async (client) => {
      const result = await client.query<ProductReviewRecord>(
        `UPDATE product_reviews SET status = $1, updated_at = now() WHERE id = $2 RETURNING *`,
        [status, id]
      );
      const updated = result.rows[0] ?? null;
      if (updated) await recalculateProductRating(client, updated.product_id);
      return updated;
    });
  },

  async listForAdmin(
    limit: number,
    offset: number,
    filters?: {
      status?: ReviewStatus;
      rating?: number;
      search?: string;
    }
  ): Promise<{ rows: ProductReviewRecord[]; total: number }> {
    const conditions: string[] = [];
    const params: unknown[] = [];

    if (filters?.status) {
      params.push(filters.status);
      conditions.push(`pr.status = $${params.length}`);
    }
    if (filters?.rating) {
      params.push(filters.rating);
      conditions.push(`pr.rating = $${params.length}`);
    }
    if (filters?.search) {
      const term = `%${filters.search}%`;
      params.push(term, term, term, term);
      conditions.push(
        `(u.name ILIKE $${params.length - 3} OR p.name ILIKE $${params.length - 2} OR pr.comment ILIKE $${params.length - 1} OR pr.guest_email ILIKE $${params.length})`
      );
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    const needsJoin = filters?.search;
    const fromClause = needsJoin
      ? `FROM product_reviews pr
         LEFT JOIN users u ON u.id = pr.user_id
         LEFT JOIN products p ON p.id = pr.product_id`
      : `FROM product_reviews pr`;

    const [rowsResult, countResult] = await Promise.all([
      query<ProductReviewRecord>(
        `SELECT pr.* ${fromClause} ${whereClause} ORDER BY pr.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
        [...params, limit, offset]
      ),
      query<{ count: string }>(
        `SELECT COUNT(*)::text AS count ${fromClause} ${whereClause}`,
        params
      )
    ]);

    return {
      rows: rowsResult.rows,
      total: parseInt(countResult.rows[0]?.count ?? "0", 10)
    };
  },

  async getStats(): Promise<{
    total: number;
    pending: number;
    approved: number;
    rejected: number;
    hidden: number;
    averageRating: number;
  }> {
    const result = await query<{
      total: string;
      pending: string;
      approved: string;
      rejected: string;
      hidden: string;
      avg_rating: string;
    }>(
      `SELECT
         COUNT(*)::text AS total,
         COUNT(*) FILTER (WHERE status = 'pending')::text AS pending,
         COUNT(*) FILTER (WHERE status = 'approved')::text AS approved,
         COUNT(*) FILTER (WHERE status = 'rejected')::text AS rejected,
         COUNT(*) FILTER (WHERE status = 'hidden')::text AS hidden,
         COALESCE(ROUND(AVG(rating) FILTER (WHERE status = 'approved')::numeric, 1), 0)::text AS avg_rating
       FROM product_reviews`
    );

    const row = result.rows[0];
    return {
      total: parseInt(row?.total ?? "0", 10),
      pending: parseInt(row?.pending ?? "0", 10),
      approved: parseInt(row?.approved ?? "0", 10),
      rejected: parseInt(row?.rejected ?? "0", 10),
      hidden: parseInt(row?.hidden ?? "0", 10),
      averageRating: parseFloat(row?.avg_rating ?? "0")
    };
  }
};
