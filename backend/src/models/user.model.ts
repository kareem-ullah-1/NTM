import { query } from "../config/db";

export type UserRole = "admin" | "user";
export type AdminRoleValue =
  | "super_admin"
  | "admin"
  | "product_manager"
  | "order_manager"
  | "support_staff";

export interface UserRecord {
  id: string;
  name: string;
  email: string;
  password_hash: string;
  role: UserRole;
  admin_role: AdminRoleValue;
  is_active: boolean;
  email_verified_at: Date | null;
  wallet_balance: string;
  referred_by_user_id: string | null;
  avatar_url: string | null;
  created_at: Date;
  updated_at: Date;
}

export const UserModel = {
  async findByEmail(email: string): Promise<UserRecord | null> {
    const result = await query<UserRecord>("SELECT * FROM users WHERE email = $1", [email.toLowerCase()]);
    return result.rows[0] ?? null;
  },

  async findById(id: string): Promise<UserRecord | null> {
    const result = await query<UserRecord>("SELECT * FROM users WHERE id = $1", [id]);
    return result.rows[0] ?? null;
  },

  async findByIds(ids: string[]): Promise<UserRecord[]> {
    if (ids.length === 0) return [];
    const result = await query<UserRecord>("SELECT * FROM users WHERE id = ANY($1::uuid[])", [ids]);
    return result.rows;
  },

  async create(input: {
    name: string;
    email: string;
    passwordHash: string;
    role?: UserRole;
    adminRole?: AdminRoleValue;
    emailVerified?: boolean;
  }): Promise<UserRecord> {
    const result = await query<UserRecord>(
      `INSERT INTO users (name, email, password_hash, role, admin_role, email_verified_at)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [
        input.name,
        input.email.toLowerCase(),
        input.passwordHash,
        input.role ?? "admin",

        input.adminRole ?? "support_staff",
        input.emailVerified ? new Date() : null
      ]
    );
    return result.rows[0];
  },

  async findStaff(): Promise<UserRecord[]> {
    const result = await query<UserRecord>(
      `SELECT * FROM users WHERE role = 'admin' ORDER BY created_at DESC`
    );
    return result.rows;
  },

  async countAdmins(): Promise<number> {
    const result = await query<{ count: string }>(`SELECT COUNT(*)::int AS count FROM users WHERE role = 'admin'`);
    return Number(result.rows[0]?.count ?? 0);
  },

  async updateAdminRole(id: string, adminRole: AdminRoleValue): Promise<UserRecord | null> {
    const result = await query<UserRecord>(
      `UPDATE users SET admin_role = $1, updated_at = now() WHERE id = $2 AND role = 'admin' RETURNING *`,
      [adminRole, id]
    );
    return result.rows[0] ?? null;
  },

  async setActive(id: string, isActive: boolean): Promise<UserRecord | null> {
    const result = await query<UserRecord>(
      `UPDATE users SET is_active = $1, updated_at = now() WHERE id = $2 AND role = 'admin' RETURNING *`,
      [isActive, id]
    );
    return result.rows[0] ?? null;
  },

  async markEmailVerified(id: string): Promise<UserRecord | null> {
    const result = await query<UserRecord>(
      `UPDATE users SET email_verified_at = now(), updated_at = now() WHERE id = $1 RETURNING *`,
      [id]
    );
    return result.rows[0] ?? null;
  },

  async countSuperAdmins(): Promise<number> {
    const result = await query<{ count: string }>(
      `SELECT COUNT(*)::int AS count FROM users WHERE role = 'admin' AND admin_role = 'super_admin'`
    );
    return Number(result.rows[0]?.count ?? 0);
  },

  async deleteStaff(id: string): Promise<UserRecord | null> {
    const result = await query<UserRecord>(
      `DELETE FROM users WHERE id = $1 AND role = 'admin' RETURNING *`,
      [id]
    );
    return result.rows[0] ?? null;
  }
};
