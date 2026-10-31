import { query } from "../config/db";

export type NotificationChannel = "email" | "sms";
export type NotificationDeliveryStatus = "sent" | "skipped" | "failed";

export interface NotificationLogRecord {
  id: string;
  channel: NotificationChannel;
  event: string;
  recipient: string;
  order_id: string | null;
  return_id: string | null;
  status: NotificationDeliveryStatus;
  error: string | null;
  created_at: Date;
}

export const NotificationLogModel = {
  async record(input: {
    channel: NotificationChannel;
    event: string;
    recipient: string;
    orderId?: string | null;
    returnId?: string | null;
    status: NotificationDeliveryStatus;
    error?: string | null;
  }): Promise<void> {
    await query(
      `INSERT INTO notification_log (channel, event, recipient, order_id, return_id, status, error)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        input.channel,
        input.event,
        input.recipient,
        input.orderId ?? null,
        input.returnId ?? null,
        input.status,
        input.error ?? null
      ]
    );
  },

  /** True if a successful email/SMS for this event+order was already recorded (idempotency). */
  async hasSuccessfulDelivery(input: {
    channel: NotificationChannel;
    event: string;
    orderId: string;
  }): Promise<boolean> {
    const result = await query<{ exists: boolean }>(
      `SELECT EXISTS(
         SELECT 1 FROM notification_log
         WHERE channel = $1 AND event = $2 AND order_id = $3 AND status = 'sent'
       ) AS exists`,
      [input.channel, input.event, input.orderId]
    );
    return Boolean(result.rows[0]?.exists);
  },

  async findMany(options: { orderId?: string; limit: number; offset: number }): Promise<{
    rows: NotificationLogRecord[];
    total: number;
  }> {
    const conditions: string[] = [];
    const params: unknown[] = [];
    if (options.orderId) {
      params.push(options.orderId);
      conditions.push(`order_id = $${params.length}`);
    }
    const whereClause = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

    const countResult = await query<{ count: string }>(
      `SELECT COUNT(*)::text AS count FROM notification_log ${whereClause}`,
      params
    );
    const total = parseInt(countResult.rows[0]?.count ?? "0", 10);

    params.push(options.limit);
    const limitIdx = params.length;
    params.push(options.offset);
    const offsetIdx = params.length;

    const rowsResult = await query<NotificationLogRecord>(
      `SELECT * FROM notification_log ${whereClause} ORDER BY created_at DESC LIMIT $${limitIdx} OFFSET $${offsetIdx}`,
      params
    );
    return { rows: rowsResult.rows, total };
  }
};
