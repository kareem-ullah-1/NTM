ALTER TABLE product_reviews ADD COLUMN IF NOT EXISTS guest_email VARCHAR(160);

ALTER TABLE product_reviews DROP CONSTRAINT IF EXISTS product_reviews_author_check;
ALTER TABLE product_reviews
  ADD CONSTRAINT product_reviews_author_check
    CHECK (user_id IS NOT NULL OR (guest_name IS NOT NULL AND guest_email IS NOT NULL));

CREATE INDEX IF NOT EXISTS idx_product_reviews_guest_email ON product_reviews (guest_email) WHERE guest_email IS NOT NULL;
