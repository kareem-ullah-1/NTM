-- Drop notification subscriptions: stores customer intent to be notified when a drop goes live
CREATE TABLE IF NOT EXISTS drop_notification_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  drop_id UUID NOT NULL REFERENCES product_drops (id) ON DELETE CASCADE,
  user_id UUID REFERENCES users (id) ON DELETE SET NULL,
  email VARCHAR(255) NOT NULL,
  is_notified BOOLEAN NOT NULL DEFAULT false,
  notified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  -- Prevent duplicate subscriptions per email per drop
  CONSTRAINT drop_notification_subscriptions_unique UNIQUE (drop_id, email)
);

-- Self-heal: table may already exist from a prior partial run without these columns
ALTER TABLE drop_notification_subscriptions ADD COLUMN IF NOT EXISTS is_notified BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE drop_notification_subscriptions ADD COLUMN IF NOT EXISTS notified_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_drop_notification_subscriptions_drop_id ON drop_notification_subscriptions (drop_id);
CREATE INDEX IF NOT EXISTS idx_drop_notification_subscriptions_email ON drop_notification_subscriptions (email);
CREATE INDEX IF NOT EXISTS idx_drop_notification_subscriptions_pending ON drop_notification_subscriptions (drop_id, is_notified) WHERE is_notified = false;

-- Prevent duplicate drop purchase records for the same order+drop combination
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'drop_purchases_order_drop_unique'
  ) THEN
    ALTER TABLE drop_purchases ADD CONSTRAINT drop_purchases_order_drop_unique UNIQUE (drop_id, order_id);
  END IF;
END $$;

-- Ensure sold_quantity never goes negative
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'product_drops_sold_quantity_check'
  ) THEN
    ALTER TABLE product_drops ADD CONSTRAINT product_drops_sold_quantity_check CHECK (sold_quantity >= 0);
  END IF;
END $$;
