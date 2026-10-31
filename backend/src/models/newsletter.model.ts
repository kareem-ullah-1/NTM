import { query } from "../config/db";

export interface NewsletterSubscriberRecord {
  id: string;
  email: string;
  created_at: Date;
}

export const NewsletterModel = {
  async subscribe(email: string): Promise<{ record: NewsletterSubscriberRecord; alreadySubscribed: boolean }> {
    const existing = await query<NewsletterSubscriberRecord>(
      "SELECT * FROM newsletter_subscribers WHERE email = $1",
      [email.toLowerCase()]
    );
    if (existing.rows[0]) {
      return { record: existing.rows[0], alreadySubscribed: true };
    }
    const result = await query<NewsletterSubscriberRecord>(
      "INSERT INTO newsletter_subscribers (email) VALUES ($1) RETURNING *",
      [email.toLowerCase()]
    );
    return { record: result.rows[0], alreadySubscribed: false };
  }
};
