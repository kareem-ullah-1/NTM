ALTER TABLE product_reviews ALTER COLUMN user_id DROP NOT NULL;

ALTER TABLE product_reviews ADD COLUMN IF NOT EXISTS guest_name VARCHAR(120);

ALTER TABLE product_reviews DROP CONSTRAINT IF EXISTS product_reviews_author_check;
ALTER TABLE product_reviews
  ADD CONSTRAINT product_reviews_author_check
    CHECK (user_id IS NOT NULL OR guest_name IS NOT NULL);

