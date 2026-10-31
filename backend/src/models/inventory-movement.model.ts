import type { PoolClient } from "pg";
import { query } from "../config/db";

export type InventoryMovementType = "sale" | "cancellation" | "return" | "manual_adjustment" | "restock";

export interface InventoryMovementRecord {
  id: string;
  product_id: string;
  previous_stock: number;
  quantity_change: number;
  new_stock: number;
  movement_type: InventoryMovementType;
  order_id: string | null;
  reason: string | null;
  created_by: string | null;
  created_at: Date;
}

export interface InventoryMovementWithProduct extends InventoryMovementRecord {
  product_name: string;
  product_sku: string;
  created_by_name: string | null;
}

export interface CreateMovementInput {
  productId: string;
  previousStock: number;
  quantityChange: number;
  newStock: number;
  movementType: InventoryMovementType;
  orderId?: string | null;
  reason?: string | null;
  createdBy?: string | null;
}

export const InventoryMovementModel = {
    async create(client: PoolClient, input: CreateMovementInput): Promise<InventoryMovementRecord> {
    const result = await client.query<InventoryMovementRecord>(
      `INSERT INTO inventory_movements
         (product_id, previous_stock, quantity_change, new_stock, movement_type, order_id, reason, created_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
       RETURNING *`,
      [
        input.productId,
        input.previousStock,
        input.quantityChange,
        input.newStock,
        input.movementType,
        input.orderId ?? null,
        input.reason ?? null,
        input.createdBy ?? null
      ]
    );
    return result.rows[0];
  },

  async findByProduct(
    productId: string,
    options: { limit?: number; offset?: number } = {}
  ): Promise<{ rows: InventoryMovementRecord[]; total: number }> {
    const limit = options.limit ?? 50;
    const offset = options.offset ?? 0;
    const [rows, count] = await Promise.all([
      query<InventoryMovementRecord>(
        `SELECT * FROM inventory_movements WHERE product_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3`,
        [productId, limit, offset]
      ),
      query<{ count: string }>(`SELECT COUNT(*) FROM inventory_movements WHERE product_id = $1`, [productId])
    ]);
    return { rows: rows.rows, total: parseInt(count.rows[0].count, 10) };
  },

  async findMany(options: {
    productId?: string;
    movementType?: InventoryMovementType;
    orderId?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ rows: InventoryMovementWithProduct[]; total: number }> {
    const conditions: string[] = [];
    const params: unknown[] = [];

    if (options.productId) {
      params.push(options.productId);
      conditions.push(`m.product_id = $${params.length}`);
    }
    if (options.movementType) {
      params.push(options.movementType);
      conditions.push(`m.movement_type = $${params.length}`);
    }
    if (options.orderId) {
      params.push(options.orderId);
      conditions.push(`m.order_id = $${params.length}`);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
    const limit = options.limit ?? 50;
    const offset = options.offset ?? 0;

    const rowsResult = await query<InventoryMovementWithProduct>(
      `SELECT m.*, p.name AS product_name, p.sku AS product_sku, u.name AS created_by_name
       FROM inventory_movements m
       JOIN products p ON p.id = m.product_id
       LEFT JOIN users u ON u.id = m.created_by
       ${whereClause}
       ORDER BY m.created_at DESC
       LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params, limit, offset]
    );

    const countResult = await query<{ count: string }>(
      `SELECT COUNT(*) FROM inventory_movements m ${whereClause}`,
      params
    );

    return { rows: rowsResult.rows, total: parseInt(countResult.rows[0].count, 10) };
  }
};
