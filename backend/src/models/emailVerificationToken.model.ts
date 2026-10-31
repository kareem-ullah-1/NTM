import crypto from "crypto";
import { query } from "../config/db";

export interface AdminEmailVerificationTokenRecord {
  id: string;
  user_id: string;
  token_hash: string;
  expires_at: Date;
  used_at: Date | null;
  created_at: Date;
}

const TOKEN_TTL_MINUTES = 30;

function hashToken(rawToken: string): string {

  return crypto.createHash("sha256").update(rawToken).digest("hex");
}

export const EmailVerificationTokenModel = {
  async invalidateAllForUser(userId: string): Promise<void> {
    await query(
      `UPDATE admin_email_verification_tokens SET used_at = now() WHERE user_id = $1 AND used_at IS NULL`,
      [userId]
    );
  },

  async hasAnyToken(userId: string): Promise<boolean> {
    const result = await query<{ id: string }>(
      `SELECT id FROM admin_email_verification_tokens WHERE user_id = $1 LIMIT 1`,
      [userId]
    );
    return result.rows.length > 0;
  },

  async create(userId: string): Promise<string> {

    await EmailVerificationTokenModel.invalidateAllForUser(userId);

    const rawToken = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + TOKEN_TTL_MINUTES * 60 * 1000);

    await query(
      `INSERT INTO admin_email_verification_tokens (user_id, token_hash, expires_at) VALUES ($1, $2, $3)`,
      [userId, hashToken(rawToken), expiresAt]
    );

    return rawToken;
  },

  async findValidByRawToken(rawToken: string): Promise<AdminEmailVerificationTokenRecord | null> {
    const result = await query<AdminEmailVerificationTokenRecord>(
      `SELECT * FROM admin_email_verification_tokens WHERE token_hash = $1`,
      [hashToken(rawToken)]
    );
    return result.rows[0] ?? null;
  },

  async markUsed(id: string): Promise<void> {
    await query(`UPDATE admin_email_verification_tokens SET used_at = now() WHERE id = $1`, [id]);
  }
};
