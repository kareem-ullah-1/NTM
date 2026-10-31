import { PoolClient } from "pg";
import { query } from "../config/db";

export type PaymentProviderName = "cod" | "easypaisa_jazzcash" | "bank_transfer" | "manual";
export type ActiveProviderName = "cod" | "manual";
export type PaymentStatus = "pending" | "paid" | "failed" | "refunded" | "cancelled";

export interface PaymentRecord {
  id: string;
  order_id: string;
  provider: PaymentProviderName;
  status: PaymentStatus;
  amount: string;
  currency: string;
  transaction_ref: string | null;
  gateway_response: Record<string, unknown>;
  failure_reason: string | null;
  paid_at: Date | null;
  created_at: Date;
  updated_at: Date;
}

export const PaymentModel = {
  async create(
    client: PoolClient,
    input: {
      orderId: string;
      provider: PaymentProviderName;
      status: PaymentStatus;
      amount: number;
      currency?: string;
      transactionRef?: string | null;
      gatewayResponse?: Record<string, unknown>;
    }
  ): Promise<PaymentRecord> {
    const result = await client.query<PaymentRecord>(
      `INSERT INTO payments (order_id, provider, status, amount, currency, transaction_ref, gateway_response, paid_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [
        input.orderId,
        input.provider,
        input.status,
        input.amount,
        input.currency ?? "PKR",
        input.transactionRef ?? null,
        JSON.stringify(input.gatewayResponse ?? {}),
        input.status === "paid" ? new Date() : null
      ]
    );
    return result.rows[0];
  },

  async findById(id: string): Promise<PaymentRecord | null> {
    const result = await query<PaymentRecord>("SELECT * FROM payments WHERE id = $1", [id]);
    return result.rows[0] ?? null;
  },

  async findByOrderId(orderId: string): Promise<PaymentRecord | null> {
    const result = await query<PaymentRecord>(
      `SELECT * FROM payments WHERE order_id = $1 ORDER BY created_at DESC LIMIT 1`,
      [orderId]
    );
    return result.rows[0] ?? null;
  },

  async updateStatusById(
    id: string,
    input: {
      status: PaymentStatus;
      transactionRef?: string | null;
      failureReason?: string | null;
      gatewayResponse?: Record<string, unknown>;
    }
  ): Promise<PaymentRecord | null> {
    const result = await query<PaymentRecord>(
      `UPDATE payments SET
         status = $1,
         transaction_ref = COALESCE($2, transaction_ref),
         failure_reason = $3,
         gateway_response = COALESCE($4, gateway_response),
         paid_at = CASE WHEN $1::varchar = 'paid' THEN now() ELSE paid_at END,
         updated_at = now()
       WHERE id = $5
       RETURNING *`,
      [
        input.status,
        input.transactionRef ?? null,
        input.failureReason ?? null,
        input.gatewayResponse ? JSON.stringify(input.gatewayResponse) : null,
        id
      ]
    );
    return result.rows[0] ?? null;
  },

  async updateStatusByOrderId(
    orderId: string,
    input: { status: PaymentStatus; transactionRef?: string | null; gatewayResponse?: Record<string, unknown> }
  ): Promise<PaymentRecord | null> {
    const result = await query<PaymentRecord>(
      `UPDATE payments SET
         status = $1,
         transaction_ref = COALESCE($2, transaction_ref),
         gateway_response = COALESCE($3, gateway_response),
         paid_at = CASE WHEN $1::varchar = 'paid' THEN now() ELSE paid_at END,
         updated_at = now()
       WHERE order_id = $4
       RETURNING *`,
      [
        input.status,
        input.transactionRef ?? null,
        input.gatewayResponse ? JSON.stringify(input.gatewayResponse) : null,
        orderId
      ]
    );
    return result.rows[0] ?? null;
  },

  async updateStatusByOrderIdWithClient(
    client: PoolClient,
    orderId: string,
    status: PaymentStatus,
    options?: { transactionRef?: string | null; gatewayResponse?: Record<string, unknown> }
  ): Promise<PaymentRecord | null> {
    const result = await client.query<PaymentRecord>(
      `UPDATE payments SET
         status = $1,
         transaction_ref = COALESCE($2, transaction_ref),
         gateway_response = COALESCE($3, gateway_response),
         paid_at = CASE WHEN $1::varchar = 'paid' THEN now() ELSE paid_at END,
         updated_at = now()
       WHERE order_id = $4
       RETURNING *`,
      [
        status,
        options?.transactionRef ?? null,
        options?.gatewayResponse ? JSON.stringify(options.gatewayResponse) : null,
        orderId
      ]
    );
    return result.rows[0] ?? null;
  },

  async findByOrderIdWithClient(client: PoolClient, orderId: string): Promise<PaymentRecord | null> {
    const result = await client.query<PaymentRecord>(
      `SELECT * FROM payments WHERE order_id = $1 ORDER BY created_at DESC LIMIT 1`,
      [orderId]
    );
    return result.rows[0] ?? null;
  }
};
