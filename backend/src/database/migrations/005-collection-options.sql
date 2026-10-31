CREATE TABLE IF NOT EXISTS collection_options (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  collection_id UUID NOT NULL REFERENCES collections (id) ON DELETE CASCADE,
  name VARCHAR(120) NOT NULL,
  slug VARCHAR(150) NOT NULL,
  display_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_collection_options_collection ON collection_options (collection_id, display_order);
CREATE INDEX IF NOT EXISTS idx_collection_options_slug ON collection_options (slug);

CREATE TABLE IF NOT EXISTS collection_option_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  option_id UUID NOT NULL REFERENCES collection_options (id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products (id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (option_id, product_id)
);

CREATE INDEX IF NOT EXISTS idx_collection_option_products_option ON collection_option_products (option_id);
CREATE INDEX IF NOT EXISTS idx_collection_option_products_product ON collection_option_products (product_id);
