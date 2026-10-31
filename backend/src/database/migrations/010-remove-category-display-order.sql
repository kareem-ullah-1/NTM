DROP INDEX IF EXISTS idx_categories_enabled;
CREATE INDEX IF NOT EXISTS idx_categories_enabled ON categories (is_enabled);

ALTER TABLE categories DROP COLUMN IF EXISTS display_order;
