import { Pool, type PoolClient, type QueryResult, type QueryResultRow } from "pg";
import { env } from "./env";

export const pool = new Pool({
  connectionString: env.databaseUrl,
  ssl: env.pgSsl ? { rejectUnauthorized: false } : undefined,
  // Was previously unset (pg defaults: max 10, no connection timeout — a
  // request can hang indefinitely if the pool is exhausted). These are sized
  // for a single-instance Node API serving product/order/dashboard traffic,
  // not a high-concurrency worker fleet, and are overridable via env without
  // code changes if the deployment target needs different values.
  //  - max: headroom for order list + dashboard's few parallel queries per
  //    request without over-committing the DB's own max_connections.
  //  - idleTimeoutMillis: keep a small warm pool between bursts of admin/
  //    storefront traffic instead of reconnecting on every idle gap.
  //  - connectionTimeoutMillis: fail fast with a clear error instead of a
  //    request hanging forever when the pool is saturated.
  max: parseInt(process.env.PGPOOL_MAX ?? "20", 10),
  idleTimeoutMillis: parseInt(process.env.PGPOOL_IDLE_TIMEOUT_MS ?? "30000", 10),
  connectionTimeoutMillis: parseInt(process.env.PGPOOL_CONNECTION_TIMEOUT_MS ?? "5000", 10)
});

pool.on("error", (err) => {
  console.error("Unexpected error on idle PostgreSQL client", err);
  process.exit(1);
});

export async function query<T extends QueryResultRow = QueryResultRow>(
  text: string,
  params?: unknown[]
): Promise<QueryResult<T>> {
  return pool.query<T>(text, params as never[]);
}

export async function withTransaction<T>(
  callback: (client: PoolClient) => Promise<T>
): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const result = await callback(client);
    await client.query("COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function checkDbConnection(): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query("SELECT 1");
  } finally {
    client.release();
  }
}

const REQUIRED_TABLES = [
  "users",
  "categories",
  "fabric_types",
  "colors",
  "products",
  "orders",
  "order_items",
  "contact_messages",
  "newsletter_subscribers",
  "product_reviews",
  "payments",
  "coupons",
  "coupon_redemptions",
  "return_requests",
  "wallet_transactions",
  "notification_log",
  "store_settings",
  "promotions",
  "promotion_products",
  "promotion_categories",
  "promotion_fabric_types",
  "promotion_usages",
  "product_drops",
  "drop_purchases",
  "drop_notification_subscriptions",
  "collections",
  "collection_products",
  "collection_options",
  "collection_option_products",
  "home_featured_categories"
];

export async function checkRequiredTables(): Promise<void> {
  const result = await pool.query<{ table_name: string }>(
    `SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'`
  );
  const existing = new Set(result.rows.map((row) => row.table_name));
  const missing = REQUIRED_TABLES.filter((table) => !existing.has(table));
  if (missing.length > 0) {
    throw new Error(
      `Database is missing required tables: ${missing.join(", ")}. Run "npm run migrate" ` +
        `against the database in DATABASE_URL before starting the server.`
    );
  }
}
