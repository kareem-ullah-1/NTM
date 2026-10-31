CREATE TABLE IF NOT EXISTS home_featured_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID NOT NULL REFERENCES categories (id) ON DELETE CASCADE,
  image_url TEXT,
  display_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (category_id)
);

CREATE INDEX IF NOT EXISTS idx_home_featured_categories_order ON home_featured_categories (is_active, display_order);
