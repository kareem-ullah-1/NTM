import { query } from "../config/db";

export interface ContactMessageRecord {
  id: string;
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
  created_at: Date;
}

export const ContactMessageModel = {
  async create(input: { name: string; email: string; phone: string; subject: string; message: string }): Promise<ContactMessageRecord> {
    const result = await query<ContactMessageRecord>(
      `INSERT INTO contact_messages (name, email, phone, subject, message) VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [input.name, input.email, input.phone, input.subject, input.message]
    );
    return result.rows[0];
  },

  async findAll(limit = 50, offset = 0): Promise<ContactMessageRecord[]> {
    const result = await query<ContactMessageRecord>(
      "SELECT * FROM contact_messages ORDER BY created_at DESC LIMIT $1 OFFSET $2",
      [limit, offset]
    );
    return result.rows;
  }
};
