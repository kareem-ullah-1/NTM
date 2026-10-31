ALTER TABLE product_reviews
  ADD COLUMN IF NOT EXISTS status VARCHAR(20) NOT NULL DEFAULT 'pending';

ALTER TABLE product_reviews
  DROP CONSTRAINT IF EXISTS product_reviews_status_check;

ALTER TABLE product_reviews
  ADD CONSTRAINT product_reviews_status_check
    CHECK (status IN ('pending', 'approved', 'rejected', 'hidden'));

CREATE INDEX IF NOT EXISTS idx_product_reviews_status ON product_reviews (status);
CREATE INDEX IF NOT EXISTS idx_product_reviews_product_status ON product_reviews (product_id, status);

UPDATE product_reviews SET status = 'approved' WHERE status = 'pending';
