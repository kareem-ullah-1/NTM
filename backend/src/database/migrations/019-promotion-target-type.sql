-- Adds an explicit, unambiguous targeting mode to promotions.
-- Previously "who a promotion applies to" was inferred from which of
-- promotion_products / promotion_categories / promotion_fabric_types had rows,
-- which was ambiguous (e.g. an empty set could mean "all products" in one
-- code path and "match nothing" in another) and never accounted for
-- fabric-type targeting at all. target_type is now the single source of truth.

ALTER TABLE promotions ADD COLUMN IF NOT EXISTS target_type VARCHAR(20) NOT NULL DEFAULT 'ALL_PRODUCTS';

-- Backfill existing rows from whichever targeting table they already have rows in.
UPDATE promotions p SET target_type = CASE
  WHEN EXISTS (SELECT 1 FROM promotion_products pp WHERE pp.promotion_id = p.id) THEN 'PRODUCTS'
  WHEN EXISTS (SELECT 1 FROM promotion_categories pc WHERE pc.promotion_id = p.id) THEN 'CATEGORIES'
  WHEN EXISTS (SELECT 1 FROM promotion_fabric_types pf WHERE pf.promotion_id = p.id) THEN 'FABRIC_TYPES'
  ELSE 'ALL_PRODUCTS'
END;

ALTER TABLE promotions DROP CONSTRAINT IF EXISTS promotions_target_type_check;
ALTER TABLE promotions ADD CONSTRAINT promotions_target_type_check
  CHECK (target_type IN ('ALL_PRODUCTS', 'CATEGORIES', 'FABRIC_TYPES', 'PRODUCTS'));

CREATE INDEX IF NOT EXISTS idx_promotions_target_type ON promotions (target_type);
