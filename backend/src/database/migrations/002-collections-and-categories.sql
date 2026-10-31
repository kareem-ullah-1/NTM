CREATE TABLE IF NOT EXISTS collections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(150) NOT NULL,
  slug VARCHAR(180) NOT NULL UNIQUE,
  description TEXT NOT NULL DEFAULT '',
  image_url TEXT,
  display_order INTEGER NOT NULL DEFAULT 0,
  is_enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_collections_enabled ON collections (is_enabled, display_order);

CREATE TABLE IF NOT EXISTS collection_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  collection_id UUID NOT NULL REFERENCES collections (id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products (id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (collection_id, product_id)
);

CREATE INDEX IF NOT EXISTS idx_collection_products_collection_id ON collection_products (collection_id);
CREATE INDEX IF NOT EXISTS idx_collection_products_product_id ON collection_products (product_id);

ALTER TABLE categories ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE categories ADD COLUMN IF NOT EXISTS display_order INTEGER NOT NULL DEFAULT 0;
ALTER TABLE categories ADD COLUMN IF NOT EXISTS is_enabled BOOLEAN NOT NULL DEFAULT true;

CREATE INDEX IF NOT EXISTS idx_categories_enabled ON categories (is_enabled, display_order);
