-- Add display content fields to promotions table
ALTER TABLE promotions ADD COLUMN IF NOT EXISTS video_url TEXT;
ALTER TABLE promotions ADD COLUMN IF NOT EXISTS video_poster_url TEXT;

-- Create dedicated table for featured/display products (merchandising only, separate from discount targeting)
CREATE TABLE IF NOT EXISTS promotion_display_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  promotion_id UUID NOT NULL REFERENCES promotions (id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products (id) ON DELETE CASCADE,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (promotion_id, product_id)
);

CREATE INDEX IF NOT EXISTS idx_promotion_display_products_promotion_id ON promotion_display_products (promotion_id);
CREATE INDEX IF NOT EXISTS idx_promotion_display_products_product_id ON promotion_display_products (product_id);
