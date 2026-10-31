ALTER TABLE products ADD COLUMN IF NOT EXISTS low_stock_threshold INTEGER NOT NULL DEFAULT 5;
ALTER TABLE store_settings ADD COLUMN IF NOT EXISTS default_low_stock_threshold INTEGER NOT NULL DEFAULT 5;

CREATE TABLE IF NOT EXISTS inventory_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  previous_stock INTEGER NOT NULL,
  quantity_change INTEGER NOT NULL,
  new_stock INTEGER NOT NULL,
  movement_type VARCHAR(20) NOT NULL CHECK (movement_type IN ('sale', 'cancellation', 'return', 'manual_adjustment', 'restock')),
  order_id VARCHAR(20) REFERENCES orders(id) ON DELETE SET NULL,
  reason VARCHAR(500),
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_inventory_movements_product_id ON inventory_movements (product_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_inventory_movements_order_id ON inventory_movements (order_id);
CREATE INDEX IF NOT EXISTS idx_inventory_movements_created_at ON inventory_movements (created_at DESC);
