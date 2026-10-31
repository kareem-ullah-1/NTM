CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(120) NOT NULL,
  email VARCHAR(160) NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role VARCHAR(20) NOT NULL DEFAULT 'admin' CHECK (role IN ('admin', 'user')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(120) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT categories_name_unique UNIQUE (name),
  CONSTRAINT categories_slug_unique UNIQUE (slug)
);

CREATE TABLE IF NOT EXISTS fabric_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(120) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT fabric_types_name_unique UNIQUE (name),
  CONSTRAINT fabric_types_slug_unique UNIQUE (slug)
);

CREATE TABLE IF NOT EXISTS colors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  hex VARCHAR(7) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT colors_name_unique UNIQUE (name),
  CONSTRAINT colors_hex_check CHECK (hex ~ '^#[0-9A-Fa-f]{6}$')
);

CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sku VARCHAR(40) NOT NULL UNIQUE,
  slug VARCHAR(180) NOT NULL UNIQUE,
  name VARCHAR(180) NOT NULL,
  category VARCHAR(60) NOT NULL,
  fabric_type VARCHAR(80) NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  price NUMERIC(10, 2) NOT NULL CHECK (price >= 0),
  original_price NUMERIC(10, 2) CHECK (original_price IS NULL OR original_price >= 0),
  images JSONB NOT NULL DEFAULT '[]',
  colors JSONB NOT NULL DEFAULT '[]',
  available_lengths JSONB NOT NULL DEFAULT '["4 meters", "4.5 meters", "5 meters"]',
  specifications JSONB NOT NULL DEFAULT '[]',
  rating NUMERIC(2, 1) NOT NULL DEFAULT 0,
  review_count INTEGER NOT NULL DEFAULT 0,
  stock INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
  featured BOOLEAN NOT NULL DEFAULT false,
  is_new BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_products_category ON products (category);
CREATE INDEX IF NOT EXISTS idx_products_fabric_type ON products (fabric_type);
CREATE INDEX IF NOT EXISTS idx_products_name_trgm ON products USING gin (to_tsvector('simple', name));

CREATE TABLE IF NOT EXISTS orders (
  id VARCHAR(20) PRIMARY KEY,
  customer_name VARCHAR(160) NOT NULL,
  customer_phone VARCHAR(30) NOT NULL,
  customer_email VARCHAR(160) NOT NULL,
  address VARCHAR(255) NOT NULL,
  city VARCHAR(80) NOT NULL,
  postal_code VARCHAR(20) NOT NULL,
  region VARCHAR(100),
  delivery_notes TEXT,
  payment_method VARCHAR(40) NOT NULL CHECK (
    payment_method IN ('Cash on Delivery', 'Easypaisa / JazzCash', 'Bank Transfer')
  ),
  status VARCHAR(20) NOT NULL DEFAULT 'Pending' CHECK (
    status IN ('Pending', 'Confirmed', 'Shipped', 'Delivered', 'Cancelled')
  ),
  amount NUMERIC(10, 2) NOT NULL DEFAULT 0,
  cancellation_reason VARCHAR(500),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_orders_status ON orders (status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders (created_at DESC);

ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role IN ('admin', 'user'));
ALTER TABLE users ADD COLUMN IF NOT EXISTS wallet_balance NUMERIC(10, 2) NOT NULL DEFAULT 0;

ALTER TABLE orders ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES users (id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders (user_id);

CREATE TABLE IF NOT EXISTS wishlist_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products (id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, product_id)
);

CREATE INDEX IF NOT EXISTS idx_wishlist_items_user_id ON wishlist_items (user_id);

CREATE TABLE IF NOT EXISTS order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id VARCHAR(20) NOT NULL REFERENCES orders (id) ON DELETE CASCADE,
  product_id UUID REFERENCES products (id) ON DELETE SET NULL,
  name VARCHAR(180) NOT NULL,
  color VARCHAR(60),
  length VARCHAR(30),
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  unit_price NUMERIC(10, 2) NOT NULL CHECK (unit_price >= 0)
);

CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items (order_id);

CREATE TABLE IF NOT EXISTS contact_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(160) NOT NULL,
  email VARCHAR(160) NOT NULL,
  phone VARCHAR(30) NOT NULL,
  subject VARCHAR(200) NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS newsletter_subscribers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(160) NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url TEXT;

CREATE TABLE IF NOT EXISTS product_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products (id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  rating SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE (product_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_product_reviews_product_id ON product_reviews (product_id);
CREATE INDEX IF NOT EXISTS idx_product_reviews_user_id ON product_reviews (user_id);

CREATE TABLE IF NOT EXISTS store_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_name VARCHAR(200) NOT NULL DEFAULT 'NTM Fabrics',
  store_logo_url TEXT,
  contact_email VARCHAR(200),
  phone VARCHAR(50),
  address TEXT,
  currency VARCHAR(10) NOT NULL DEFAULT 'PKR',
  currency_symbol VARCHAR(10) NOT NULL DEFAULT 'Rs.',
  meta JSONB NOT NULL DEFAULT '{}',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE users ADD COLUMN IF NOT EXISTS admin_role VARCHAR(30) NOT NULL DEFAULT 'super_admin';
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_admin_role_check;
ALTER TABLE users ADD CONSTRAINT users_admin_role_check CHECK (
  admin_role IN ('super_admin', 'admin', 'product_manager', 'order_manager', 'support_staff')
);
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true;

ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_status VARCHAR(20) NOT NULL DEFAULT 'pending';
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_payment_status_check;
ALTER TABLE orders ADD CONSTRAINT orders_payment_status_check CHECK (
  payment_status IN ('pending', 'paid', 'failed', 'refunded', 'cancelled')
);

CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id VARCHAR(20) NOT NULL REFERENCES orders (id) ON DELETE CASCADE,
  provider VARCHAR(30) NOT NULL DEFAULT 'cod',
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  amount NUMERIC(10, 2) NOT NULL CHECK (amount >= 0),
  currency VARCHAR(10) NOT NULL DEFAULT 'PKR',
  transaction_ref VARCHAR(150),
  gateway_response JSONB NOT NULL DEFAULT '{}',
  failure_reason TEXT,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT payments_provider_check CHECK (

    provider IN ('cod', 'easypaisa_jazzcash', 'bank_transfer', 'manual')
  ),
  CONSTRAINT payments_status_check CHECK (
    status IN ('pending', 'paid', 'failed', 'refunded', 'cancelled')
  )
);

CREATE INDEX IF NOT EXISTS idx_payments_order_id ON payments (order_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_payments_transaction_ref ON payments (transaction_ref) WHERE transaction_ref IS NOT NULL;

CREATE TABLE IF NOT EXISTS coupons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(40) NOT NULL UNIQUE,
  description TEXT,
  discount_type VARCHAR(20) NOT NULL,
  discount_value NUMERIC(10, 2) NOT NULL CHECK (discount_value > 0),
  min_order_amount NUMERIC(10, 2) NOT NULL DEFAULT 0,
  max_discount_amount NUMERIC(10, 2),
  usage_limit INTEGER,
  per_user_limit INTEGER,
  usage_count INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  starts_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT coupons_discount_type_check CHECK (discount_type IN ('percentage', 'fixed')),
  CONSTRAINT coupons_percentage_range_check CHECK (
    discount_type != 'percentage' OR (discount_value > 0 AND discount_value <= 100)
  )
);

CREATE INDEX IF NOT EXISTS idx_coupons_code ON coupons (code);

CREATE TABLE IF NOT EXISTS coupon_redemptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coupon_id UUID NOT NULL REFERENCES coupons (id) ON DELETE CASCADE,
  user_id UUID REFERENCES users (id) ON DELETE SET NULL,
  order_id VARCHAR(20) NOT NULL REFERENCES orders (id) ON DELETE CASCADE,
  discount_amount NUMERIC(10, 2) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (order_id)
);

CREATE INDEX IF NOT EXISTS idx_coupon_redemptions_coupon_id ON coupon_redemptions (coupon_id);
CREATE INDEX IF NOT EXISTS idx_coupon_redemptions_user_id ON coupon_redemptions (user_id);

ALTER TABLE orders ADD COLUMN IF NOT EXISTS coupon_code VARCHAR(40);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS discount_amount NUMERIC(10, 2) NOT NULL DEFAULT 0;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS subtotal_amount NUMERIC(10, 2);

UPDATE orders SET subtotal_amount = amount WHERE subtotal_amount IS NULL;
ALTER TABLE orders ALTER COLUMN subtotal_amount SET NOT NULL;

CREATE TABLE IF NOT EXISTS return_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id VARCHAR(20) NOT NULL REFERENCES orders (id) ON DELETE CASCADE,
  order_item_id UUID REFERENCES order_items (id) ON DELETE SET NULL,
  user_id UUID REFERENCES users (id) ON DELETE SET NULL,
  reason TEXT NOT NULL,
  customer_notes TEXT,
  admin_notes TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'requested',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT return_requests_status_check CHECK (
    status IN ('requested', 'approved', 'rejected', 'shipped_back', 'received', 'refunded', 'cancelled')
  )
);

CREATE INDEX IF NOT EXISTS idx_return_requests_order_id ON return_requests (order_id);
CREATE INDEX IF NOT EXISTS idx_return_requests_user_id ON return_requests (user_id);

ALTER TABLE return_requests ADD COLUMN IF NOT EXISTS restocked_at TIMESTAMPTZ;

ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_payment_method_check;
ALTER TABLE orders ADD CONSTRAINT orders_payment_method_check CHECK (
  payment_method IN ('Cash on Delivery', 'Easypaisa / JazzCash', 'Bank Transfer')
);

CREATE TABLE IF NOT EXISTS notification_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel VARCHAR(10) NOT NULL,
  event VARCHAR(40) NOT NULL,
  recipient VARCHAR(255) NOT NULL,
  order_id VARCHAR(20) REFERENCES orders (id) ON DELETE SET NULL,
  return_id UUID REFERENCES return_requests (id) ON DELETE SET NULL,
  status VARCHAR(10) NOT NULL,
  error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT notification_log_channel_check CHECK (channel IN ('email', 'sms')),
  CONSTRAINT notification_log_status_check CHECK (status IN ('sent', 'skipped', 'failed'))
);

CREATE INDEX IF NOT EXISTS idx_notification_log_order_id ON notification_log (order_id);
CREATE INDEX IF NOT EXISTS idx_notification_log_created_at ON notification_log (created_at DESC);

CREATE TABLE IF NOT EXISTS carts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES users (id) ON DELETE CASCADE,
  reminder_sent_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS cart_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cart_id UUID NOT NULL REFERENCES carts (id) ON DELETE CASCADE,
  product_id UUID REFERENCES products (id) ON DELETE SET NULL,
  name VARCHAR(200) NOT NULL,
  slug VARCHAR(200) NOT NULL,
  image TEXT,
  color VARCHAR(60),
  length VARCHAR(60),
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price NUMERIC(10, 2) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_cart_items_cart_id ON cart_items (cart_id);
CREATE INDEX IF NOT EXISTS idx_carts_reminder_lookup ON carts (updated_at) WHERE reminder_sent_at IS NULL;

ALTER TABLE product_reviews ADD COLUMN IF NOT EXISTS images JSONB NOT NULL DEFAULT '[]';

ALTER TABLE products ADD COLUMN IF NOT EXISTS search_vector tsvector GENERATED ALWAYS AS (
  setweight(to_tsvector('english', coalesce(name, '')), 'A') ||
  setweight(to_tsvector('english', coalesce(category, '') || ' ' || coalesce(fabric_type, '')), 'B') ||
  setweight(to_tsvector('english', coalesce(sku, '')), 'C') ||
  setweight(to_tsvector('english', coalesce(description, '')), 'D')
) STORED;

CREATE INDEX IF NOT EXISTS idx_products_search_vector ON products USING GIN (search_vector);

ALTER TABLE users ADD COLUMN IF NOT EXISTS referral_code VARCHAR(12);
ALTER TABLE users ADD COLUMN IF NOT EXISTS referred_by_user_id UUID REFERENCES users (id) ON DELETE SET NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_referral_code ON users (referral_code) WHERE referral_code IS NOT NULL;

CREATE TABLE IF NOT EXISTS wallet_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,

  amount NUMERIC(10, 2) NOT NULL,
  balance_after NUMERIC(10, 2) NOT NULL,
  type VARCHAR(30) NOT NULL,
  order_id VARCHAR(20) REFERENCES orders (id) ON DELETE SET NULL,
  related_user_id UUID REFERENCES users (id) ON DELETE SET NULL,
  description TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT wallet_transactions_type_check CHECK (
    type IN (
      'referral_bonus_referrer',
      'referral_bonus_referred',
      'order_redemption',
      'order_redemption_refund',
      'return_refund_credit',
      'admin_adjustment'
    )
  )
);

CREATE INDEX IF NOT EXISTS idx_wallet_transactions_user_id ON wallet_transactions (user_id, created_at DESC);

ALTER TABLE orders ADD COLUMN IF NOT EXISTS wallet_amount_used NUMERIC(10, 2) NOT NULL DEFAULT 0;

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
  target_type VARCHAR(20) NOT NULL DEFAULT 'ALL_PRODUCTS',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT promotions_percentage_range_check CHECK (
    discount_type != 'percentage' OR (discount_value > 0 AND discount_value <= 100)
  ),
  CONSTRAINT promotions_dates_check CHECK (expires_at > starts_at),
  CONSTRAINT promotions_target_type_check CHECK (target_type IN ('ALL_PRODUCTS', 'CATEGORIES', 'FABRIC_TYPES', 'PRODUCTS'))
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

ALTER TABLE collections ADD COLUMN IF NOT EXISTS nav_links JSONB NOT NULL DEFAULT '[]'::jsonb;

CREATE TABLE IF NOT EXISTS collection_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  collection_id UUID NOT NULL REFERENCES collections (id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products (id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (collection_id, product_id)
);

CREATE INDEX IF NOT EXISTS idx_collection_products_collection_id ON collection_products (collection_id);
CREATE INDEX IF NOT EXISTS idx_collection_products_product_id ON collection_products (product_id);

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

ALTER TABLE categories ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE categories ADD COLUMN IF NOT EXISTS is_enabled BOOLEAN NOT NULL DEFAULT true;

CREATE INDEX IF NOT EXISTS idx_categories_enabled ON categories (is_enabled);
