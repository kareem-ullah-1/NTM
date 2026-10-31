-- Performance optimization pass: indexes only, no schema/behavior changes.
-- Every index below is IF NOT EXISTS and safe to (re-)run; the migration
-- runner re-applies all files on every deploy, so this file must be a no-op
-- the second time it runs.

-- products.created_at: default "Featured" sort (featured DESC, created_at DESC),
-- "Newest" sort, findRelated(), findFeatured() all ORDER BY created_at.
CREATE INDEX IF NOT EXISTS idx_products_created_at ON products (created_at DESC);

-- Composite index matching the most common WHERE+ORDER BY: the default Shop
-- sort filters/orders on featured, then created_at. Covers "featured = true
-- ORDER BY created_at DESC" and "ORDER BY featured DESC, created_at DESC".
CREATE INDEX IF NOT EXISTS idx_products_featured_created_at ON products (featured, created_at DESC);

-- Covering index for the dashboard stock-summary aggregate (stockSummary()):
-- COUNT(*) FILTER (WHERE stock = 0) and COUNT(*) FILTER (WHERE stock > 0 AND
-- stock <= low_stock_threshold) can be satisfied with an index-only scan.
CREATE INDEX IF NOT EXISTS idx_products_stock_low_stock_threshold ON products (stock, low_stock_threshold);

-- order_items.product_id: required for findFrequentlyBoughtTogether()'s
-- self-join (oi_self.product_id = $1, oi_other joined on order_id/product_id)
-- and any other product-scoped lookups against order_items. Previously only
-- order_items.order_id was indexed.
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON order_items (product_id);

-- Trigram indexes to support existing ILIKE / LIKE '%term%' searches that use
-- leading wildcards and therefore cannot use a plain B-tree index:
--   - OrderModel.findMany(): LOWER(customer_name) LIKE, LOWER(id) LIKE, customer_phone LIKE
--   - CustomerModel.findMany(): LOWER(u.name) LIKE, LOWER(u.email) LIKE
-- Search behavior and result relevance are unchanged — these only give the
-- planner a fast path instead of a sequential scan for larger tables.
CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE INDEX IF NOT EXISTS idx_orders_customer_name_trgm ON orders USING gin (lower(customer_name) gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_orders_id_trgm ON orders USING gin (lower(id) gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_orders_customer_phone_trgm ON orders USING gin (customer_phone gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_users_name_trgm ON users USING gin (lower(name) gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_users_email_trgm ON users USING gin (lower(email) gin_trgm_ops);
