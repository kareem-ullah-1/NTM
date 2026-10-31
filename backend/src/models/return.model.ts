import type { PoolClient } from "pg";
import { query } from "../config/db";

export type ReturnStatus = "requested" | "approved" | "rejected" | "shipped_back" | "received" | "refunded" | "cancelled";

export interface ReturnRequestRecord {
  id: string;
  order_id: string;
  order_item_id: string | null;
  user_id: string | null;
  reason: string;
  customer_notes: string | null;
  admin_notes: string | null;
  status: ReturnStatus;
  restocked_at: Date | null;
  created_at: Date;
  updated_at: Date;
}

export const ReturnModel = {
  async create(input: {
    orderId: string;
    orderItemId?: string | null;
    userId: string;
    reason: string;
    customerNotes?: string | null;
  }): Promise<ReturnRequestRecord> {
    const result = await query<ReturnRequestRecord>(
      `INSERT INTO return_requests (order_id, order_item_id, user_id, reason, customer_notes)
       VALUES ($1,$2,$3,$4,$5)
       RETURNING *`,
      [input.orderId, input.orderItemId ?? null, input.userId, input.reason, input.customerNotes ?? null]
    );
    return result.rows[0];
  },

  async findById(id: string): Promise<ReturnRequestRecord | null> {
    const result = await query<ReturnRequestRecord>("SELECT * FROM return_requests WHERE id = $1", [id]);
    return result.rows[0] ?? null;
  },

  async findByUserId(userId: string): Promise<ReturnRequestRecord[]> {
    const result = await query<ReturnRequestRecord>(
      "SELECT * FROM return_requests WHERE user_id = $1 ORDER BY created_at DESC",
      [userId]
    );
    return result.rows;
  },

  async findByOrderId(orderId: string): Promise<ReturnRequestRecord[]> {
    const result = await query<ReturnRequestRecord>(
      "SELECT * FROM return_requests WHERE order_id = $1 ORDER BY created_at DESC",
      [orderId]
    );
    return result.rows;
  },

  async findMany(options: { status?: ReturnStatus; limit: number; offset: number }): Promise<{
    rows: ReturnRequestRecord[];
    total: number;
  }> {
    const conditions: string[] = [];
    const params: unknown[] = [];
    if (options.status) {
      params.push(options.status);
      conditions.push(`status = $${params.length}`);
    }
    const whereClause = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

    const countResult = await query<{ count: string }>(
      `SELECT COUNT(*)::text AS count FROM return_requests ${whereClause}`,
      params
    );
    const total = parseInt(countResult.rows[0]?.count ?? "0", 10);

    params.push(options.limit);
    const limitIdx = params.length;
    params.push(options.offset);
    const offsetIdx = params.length;

    const rowsResult = await query<ReturnRequestRecord>(
      `SELECT * FROM return_requests ${whereClause} ORDER BY created_at DESC LIMIT $${limitIdx} OFFSET $${offsetIdx}`,
      params
    );
    return { rows: rowsResult.rows, total };
  },

  async updateStatus(
    id: string,
    input: { status: ReturnStatus; adminNotes?: string | null }
  ): Promise<ReturnRequestRecord | null> {
    const result = await query<ReturnRequestRecord>(
      `UPDATE return_requests SET status = $1, admin_notes = COALESCE($2, admin_notes), updated_at = now()
       WHERE id = $3 RETURNING *`,
      [input.status, input.adminNotes ?? null, id]
    );
    return result.rows[0] ?? null;
  },

    async markRestocked(id: string): Promise<ReturnRequestRecord | null> {
    const result = await query<ReturnRequestRecord>(
      `UPDATE return_requests SET restocked_at = now() WHERE id = $1 AND restocked_at IS NULL RETURNING *`,
      [id]
    );
    return result.rows[0] ?? null;
  },

    async markRestockedWithClient(client: PoolClient, id: string): Promise<ReturnRequestRecord | null> {
    const locked = await client.query<ReturnRequestRecord>(
      `SELECT * FROM return_requests WHERE id = $1 FOR UPDATE`,
      [id]
    );
    if (!locked.rows[0] || locked.rows[0].restocked_at !== null) return null;

    const result = await client.query<ReturnRequestRecord>(
      `UPDATE return_requests SET restocked_at = now() WHERE id = $1 AND restocked_at IS NULL RETURNING *`,
      [id]
    );
    return result.rows[0] ?? null;
  }
};
