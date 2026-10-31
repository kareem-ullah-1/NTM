import type { PoolClient } from "pg";
import { query } from "../config/db";

export type WalletTransactionType =
  | "referral_bonus_referrer"
  | "referral_bonus_referred"
  | "order_redemption"
  | "order_redemption_refund"
  | "return_refund_credit"
  | "admin_adjustment";

export interface WalletTransactionRecord {
  id: string;
  user_id: string;
  amount: string;
  balance_after: string;
  type: WalletTransactionType;
  order_id: string | null;
  related_user_id: string | null;
  description: string;
  created_at: Date;
}

export const WalletModel = {
    async applyTransaction(
    client: PoolClient,
    input: {
      userId: string;
      amount: number;
      type: WalletTransactionType;
      description: string;
      orderId?: string | null;
      relatedUserId?: string | null;
    }
  ): Promise<WalletTransactionRecord> {
    const lockResult = await client.query<{ wallet_balance: string }>(
      `SELECT wallet_balance FROM users WHERE id = $1 FOR UPDATE`,
      [input.userId]
    );
    if (lockResult.rows.length === 0) {
      throw new Error(`User ${input.userId} not found`);
    }

    const currentBalance = parseFloat(lockResult.rows[0].wallet_balance);
    const newBalance = Math.round((currentBalance + input.amount) * 100) / 100;

    if (newBalance < 0) {
      throw new Error("Insufficient wallet balance");
    }

    await client.query(`UPDATE users SET wallet_balance = $1, updated_at = now() WHERE id = $2`, [
      newBalance,
      input.userId
    ]);

    const result = await client.query<WalletTransactionRecord>(
      `INSERT INTO wallet_transactions (user_id, amount, balance_after, type, order_id, related_user_id, description)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [
        input.userId,
        input.amount,
        newBalance,
        input.type,
        input.orderId ?? null,
        input.relatedUserId ?? null,
        input.description
      ]
    );
    return result.rows[0];
  },

  async findHistory(userId: string, limit: number, offset: number): Promise<{ rows: WalletTransactionRecord[]; total: number }> {
    const [rows, count] = await Promise.all([
      query<WalletTransactionRecord>(
        `SELECT * FROM wallet_transactions WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3`,
        [userId, limit, offset]
      ),
      query<{ count: string }>(`SELECT COUNT(*) FROM wallet_transactions WHERE user_id = $1`, [userId])
    ]);
    return { rows: rows.rows, total: parseInt(count.rows[0].count, 10) };
  },

    async hasReferralBeenRewarded(referredUserId: string): Promise<boolean> {
    const result = await query(
      `SELECT 1 FROM wallet_transactions WHERE related_user_id = $1 AND type = 'referral_bonus_referrer' LIMIT 1`,
      [referredUserId]
    );
    return (result.rowCount ?? 0) > 0;
  }
};
