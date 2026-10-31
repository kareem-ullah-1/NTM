import { query } from "../config/db";

export interface CustomerRow {
  id: string;
  name: string;
  email: string;
  avatar_url: string | null;
  created_at: Date;
  order_count: string;
  total_spent: string;
  wallet_balance: string;
  referral_code: string | null;
}

export interface CustomerFilterOptions {
  search?: string;
  limit: number;
  offset: number;
}

export const CustomerModel = {
  async findMany(options: CustomerFilterOptions): Promise<{ rows: CustomerRow[]; total: number }> {
    const conditions: string[] = ["u.role = 'user'"];
    const params: unknown[] = [];

    if (options.search) {
      params.push(`%${options.search.toLowerCase()}%`);
      conditions.push(`(LOWER(u.name) LIKE $${params.length} OR LOWER(u.email) LIKE $${params.length})`);
    }

    const whereClause = `WHERE ${conditions.join(" AND ")}`;

    const countResult = await query<{ count: string }>(
      `SELECT COUNT(*)::text AS count FROM users u ${whereClause}`,
      params
    );
    const total = parseInt(countResult.rows[0]?.count ?? "0", 10);

    params.push(options.limit);
    const limitIndex = params.length;
    params.push(options.offset);
    const offsetIndex = params.length;

    const rowsResult = await query<CustomerRow>(
      `SELECT
         u.id,
         u.name,
         u.email,
         u.avatar_url,
         u.created_at,
         u.wallet_balance,
         u.referral_code,
         COUNT(o.id)::text AS order_count,
         COALESCE(SUM(o.amount) FILTER (WHERE o.status != 'Cancelled'), 0)::text AS total_spent
       FROM users u
       LEFT JOIN orders o ON o.user_id = u.id
       ${whereClause}
       GROUP BY u.id
       ORDER BY u.created_at DESC
       LIMIT $${limitIndex} OFFSET $${offsetIndex}`,
      params
    );

    return { rows: rowsResult.rows, total };
  },

  async findById(id: string): Promise<CustomerRow | null> {
    const result = await query<CustomerRow>(
      `SELECT
         u.id,
         u.name,
         u.email,
         u.avatar_url,
         u.created_at,
         u.wallet_balance,
         u.referral_code,
         COUNT(o.id)::text AS order_count,
         COALESCE(SUM(o.amount) FILTER (WHERE o.status != 'Cancelled'), 0)::text AS total_spent
       FROM users u
       LEFT JOIN orders o ON o.user_id = u.id
       WHERE u.id = $1 AND u.role = 'user'
       GROUP BY u.id`,
      [id]
    );
    return result.rows[0] ?? null;
  }
};
