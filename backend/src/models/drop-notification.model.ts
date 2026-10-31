import { query } from "../config/db";

export interface DropNotificationSubscription {
  id: string;
  drop_id: string;
  user_id: string | null;
  email: string;
  is_notified: boolean;
  notified_at: Date | null;
  created_at: Date;
}

export const DropNotificationModel = {
  async subscribe(
    dropId: string,
    email: string,
    userId: string | null = null
  ): Promise<{ record: DropNotificationSubscription; alreadySubscribed: boolean }> {
    const existing = await query<DropNotificationSubscription>(
      "SELECT * FROM drop_notification_subscriptions WHERE drop_id = $1 AND email = $2",
      [dropId, email]
    );

    if (existing.rows[0]) {
      return { record: existing.rows[0], alreadySubscribed: true };
    }

    const result = await query<DropNotificationSubscription>(
      `INSERT INTO drop_notification_subscriptions (drop_id, user_id, email)
       VALUES ($1, $2, $3)
       ON CONFLICT (drop_id, email) DO NOTHING
       RETURNING *`,
      [dropId, userId, email]
    );

    if (result.rows.length === 0) {
      const fallback = await query<DropNotificationSubscription>(
        "SELECT * FROM drop_notification_subscriptions WHERE drop_id = $1 AND email = $2",
        [dropId, email]
      );
      return { record: fallback.rows[0], alreadySubscribed: true };
    }

    return { record: result.rows[0], alreadySubscribed: false };
  },

  async findPendingByDropId(dropId: string): Promise<DropNotificationSubscription[]> {
    const result = await query<DropNotificationSubscription>(
      "SELECT * FROM drop_notification_subscriptions WHERE drop_id = $1 AND is_notified = false",
      [dropId]
    );
    return result.rows;
  },

  async markNotified(subscriptionId: string): Promise<void> {
    await query(
      "UPDATE drop_notification_subscriptions SET is_notified = true, notified_at = now() WHERE id = $1 AND is_notified = false",
      [subscriptionId]
    );
  },

  async markAllNotifiedForDrop(dropId: string): Promise<number> {
    const result = await query(
      "UPDATE drop_notification_subscriptions SET is_notified = true, notified_at = now() WHERE drop_id = $1 AND is_notified = false",
      [dropId]
    );
    return result.rowCount ?? 0;
  },

  async countByDropId(dropId: string): Promise<number> {
    const result = await query<{ count: string }>(
      "SELECT COUNT(*)::text AS count FROM drop_notification_subscriptions WHERE drop_id = $1",
      [dropId]
    );
    return parseInt(result.rows[0]?.count ?? "0", 10);
  },

  async isSubscribed(dropId: string, email: string): Promise<boolean> {
    const result = await query<{ count: string }>(
      "SELECT COUNT(*)::text AS count FROM drop_notification_subscriptions WHERE drop_id = $1 AND email = $2",
      [dropId, email]
    );
    return parseInt(result.rows[0]?.count ?? "0", 10) > 0;
  }
};
