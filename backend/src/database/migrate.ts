import fs from "fs";
import path from "path";
import { pool } from "../config/db";

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
  "promotions",
  "promotion_products",
  "promotion_categories",
  "promotion_fabric_types",
  "promotion_usages",
  "promotion_display_products",
  "product_drops",
  "drop_purchases",
  "collections",
  "collection_products",
  "home_featured_categories",
  "admin_email_verification_tokens",
  "inventory_movements",
  "drop_notification_subscriptions"
];

async function ensureExtension(): Promise<void> {
  try {
    await pool.query('CREATE EXTENSION IF NOT EXISTS "pgcrypto"');
  } catch (error) {
    console.warn(
      "Could not create the pgcrypto extension (often expected on managed Postgres " +
        "providers that restrict CREATE EXTENSION). This is safe to ignore on " +
        "PostgreSQL 13+, which has a built-in gen_random_uuid(). Reason:",
      error instanceof Error ? error.message : error
    );
  }
}

async function verifyTables(): Promise<string[]> {
  const result = await pool.query<{ table_name: string }>(
    `SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'`
  );
  const existing = new Set(result.rows.map((row) => row.table_name));
  return REQUIRED_TABLES.filter((table) => !existing.has(table));
}

async function runNumberedMigrations(client: import("pg").PoolClient): Promise<void> {
  const migrationsDir = path.join(__dirname, "migrations");
  if (!fs.existsSync(migrationsDir)) return;

  const files = fs
    .readdirSync(migrationsDir)
    .filter((file) => file.endsWith(".sql"))
    .sort();

  for (const file of files) {
    const sql = fs.readFileSync(path.join(migrationsDir, file), "utf-8");
    console.log(`Applying migration: ${file}`);
    await client.query("BEGIN");
    try {
      await client.query(sql);
      await client.query("COMMIT");
    } catch (error) {
      await client.query("ROLLBACK");
      console.error(`Migration failed: ${file}. No changes from this file were committed.`);
      throw error;
    }
  }
}

async function migrate(): Promise<void> {
  const schemaPath = path.join(__dirname, "schema.sql");
  const schemaSql = fs.readFileSync(schemaPath, "utf-8");

  console.log("Running database migration...");

  await ensureExtension();
  const tableSql = schemaSql.replace(/CREATE EXTENSION[^;]*;\s*/i, "");

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query(tableSql);
    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Migration failed while creating tables/indexes. No changes were committed.");
    throw error;
  }

  try {
    await runNumberedMigrations(client);
  } finally {
    client.release();
  }

  const missing = await verifyTables();
  if (missing.length > 0) {
    throw new Error(
      `Migration ran but these required tables are still missing: ${missing.join(", ")}. ` +
        `Check your DATABASE_URL points at the intended database and that the app's ` +
        `Postgres user has CREATE TABLE privileges on the public schema.`
    );
  }

  console.log(`Migration complete. Verified tables: ${REQUIRED_TABLES.join(", ")}`);
  await pool.end();
}

migrate().catch((error) => {
  console.error("Migration failed:", error instanceof Error ? error.message : error);
  process.exit(1);
});
