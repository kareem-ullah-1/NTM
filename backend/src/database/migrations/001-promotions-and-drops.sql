CREATE TABLE IF NOT EXISTS promotions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(120) NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  discount_type VARCHAR(20) NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
  discount_value NUMERIC(10, 2) NOT NULL CHECK (discount_value > 0),
  min_order_amount NUMERIC(10, 2) NOT NULL DEFAULT 0,
  max_discount_amount NUMERIC(10, 2),
  starts_at TIMESTAMPTZ NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  usage_limit INTEGER,
  per_user_limit INTEGER,
  usage_count INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT promotions_discount_type_check CHECK (discount_type IN ('percentage', 'fixed')),
  CONSTRAINT promotions_percentage_range_check CHECK (
    discount_type != 'percentage' OR (discount_value > 0 AND discount_value <= 100)
  ),
  CONSTRAINT promotions_dates_check CHECK (expires_at > starts_at)
);

CREATE INDEX IF NOT EXISTS idx_promotions_active_dates ON promotions (is_active, starts_at, expires_at);

CREATE TABLE IF NOT EXISTS promotion_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  promotion_id UUID NOT NULL REFERENCES promotions (id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products (id) ON DELETE CASCADE,
  UNIQUE (promotion_id, product_id)
);

CREATE INDEX IF NOT EXISTS idx_promotion_products_promotion_id ON promotion_products (promotion_id);

CREATE TABLE IF NOT EXISTS promotion_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  promotion_id UUID NOT NULL REFERENCES promotions (id) ON DELETE CASCADE,
  category VARCHAR(60) NOT NULL,
  UNIQUE (promotion_id, category)
);

CREATE INDEX IF NOT EXISTS idx_promotion_categories_promotion_id ON promotion_categories (promotion_id);

CREATE TABLE IF NOT EXISTS promotion_fabric_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  promotion_id UUID NOT NULL REFERENCES promotions (id) ON DELETE CASCADE,
  fabric_type VARCHAR(80) NOT NULL,
  UNIQUE (promotion_id, fabric_type)
);

CREATE INDEX IF NOT EXISTS idx_promotion_fabric_types_promotion_id ON promotion_fabric_types (promotion_id);

CREATE TABLE IF NOT EXISTS promotion_usages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  promotion_id UUID NOT NULL REFERENCES promotions (id) ON DELETE CASCADE,
  user_id UUID REFERENCES users (id) ON DELETE SET NULL,
  order_id VARCHAR(20) NOT NULL REFERENCES orders (id) ON DELETE CASCADE,
  discount_amount NUMERIC(10, 2) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (order_id)
);

CREATE INDEX IF NOT EXISTS idx_promotion_usages_promotion_id ON promotion_usages (promotion_id);
CREATE INDEX IF NOT EXISTS idx_promotion_usages_user_id ON promotion_usages (user_id);

ALTER TABLE orders ADD COLUMN IF NOT EXISTS promo_id UUID REFERENCES promotions (id) ON DELETE SET NULL;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS promo_discount NUMERIC(10, 2) NOT NULL DEFAULT 0;

ALTER TABLE order_items ADD COLUMN IF NOT EXISTS promo_id UUID REFERENCES promotions (id) ON DELETE SET NULL;
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS original_unit_price NUMERIC(10, 2);
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS promo_discount NUMERIC(10, 2) NOT NULL DEFAULT 0;

CREATE TABLE IF NOT EXISTS product_drops (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products (id) ON DELETE CASCADE,
  name VARCHAR(150) NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ NOT NULL,
  max_quantity INTEGER NOT NULL CHECK (max_quantity > 0),
  per_customer_limit INTEGER NOT NULL DEFAULT 1 CHECK (per_customer_limit > 0),
  sold_quantity INTEGER NOT NULL DEFAULT 0,
  special_price NUMERIC(10, 2),
  promotion_id UUID REFERENCES promotions (id) ON DELETE SET NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT product_drops_dates_check CHECK (ends_at > starts_at)
);

CREATE INDEX IF NOT EXISTS idx_product_drops_active_dates ON product_drops (is_active, starts_at, ends_at);
CREATE INDEX IF NOT EXISTS idx_product_drops_product_id ON product_drops (product_id);

CREATE TABLE IF NOT EXISTS drop_purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  drop_id UUID NOT NULL REFERENCES product_drops (id) ON DELETE CASCADE,
  user_id UUID REFERENCES users (id) ON DELETE SET NULL,
  order_id VARCHAR(20) NOT NULL REFERENCES orders (id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_drop_purchases_drop_id ON drop_purchases (drop_id);
CREATE INDEX IF NOT EXISTS idx_drop_purchases_user_id ON drop_purchases (user_id);
CREATE INDEX IF NOT EXISTS idx_drop_purchases_order_id ON drop_purchases (order_id);

ALTER TABLE orders ADD COLUMN IF NOT EXISTS drop_id UUID REFERENCES product_drops (id) ON DELETE SET NULL;
