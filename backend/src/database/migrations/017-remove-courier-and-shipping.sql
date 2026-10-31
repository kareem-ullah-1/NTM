DROP TABLE IF EXISTS shipping_rates;

DROP TABLE IF EXISTS order_tracking_events;

UPDATE coupons SET discount_type = 'fixed', discount_value = 0 WHERE discount_type = 'free_shipping';

ALTER TABLE coupons DROP CONSTRAINT IF EXISTS coupons_discount_type_check;
ALTER TABLE coupons
  ADD CONSTRAINT coupons_discount_type_check
    CHECK (discount_type IN ('percentage', 'fixed'));

ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_shipping_status_check;

ALTER TABLE orders
  DROP COLUMN IF EXISTS shipping_status,
  DROP COLUMN IF EXISTS tracking_number,
  DROP COLUMN IF EXISTS shipping_method,
  DROP COLUMN IF EXISTS shipping_cost,
  DROP COLUMN IF EXISTS estimated_delivery_date,
  DROP COLUMN IF EXISTS courier_provider,
  DROP COLUMN IF EXISTS courier_consignment_id;
