import type { PoolClient } from "pg";
import { query } from "../config/db";

export interface CollectionRecord {
  id: string;
  name: string;
  slug: string;
  description: string;
  image_url: string | null;
  display_order: number;
  is_enabled: boolean;
  nav_links: { label: string; href: string }[];
  created_at: Date;
  updated_at: Date;
}

export interface CollectionOptionRecord {
  id: string;
  collection_id: string;
  name: string;
  slug: string;
  display_order: number;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

export const CollectionModel = {
  async findAll(): Promise<CollectionRecord[]> {
    const result = await query<CollectionRecord>(
      "SELECT * FROM collections ORDER BY display_order ASC, name ASC"
    );
    return result.rows;
  },

  async findEnabled(): Promise<CollectionRecord[]> {
    const result = await query<CollectionRecord>(
      "SELECT * FROM collections WHERE is_enabled = true ORDER BY display_order ASC, name ASC"
    );
    return result.rows;
  },

  async findById(id: string): Promise<CollectionRecord | null> {
    const result = await query<CollectionRecord>(
      "SELECT * FROM collections WHERE id = $1",
      [id]
    );
    return result.rows[0] ?? null;
  },

  async findBySlug(slug: string): Promise<CollectionRecord | null> {
    const result = await query<CollectionRecord>(
      "SELECT * FROM collections WHERE slug = $1",
      [slug]
    );
    return result.rows[0] ?? null;
  },

  async create(input: {
    name: string;
    slug?: string;
    description?: string;
    imageUrl?: string | null;
    displayOrder?: number;
    isEnabled?: boolean;
    navLinks?: { label: string; href: string }[];
  }): Promise<CollectionRecord> {
    const slug = input.slug || slugify(input.name);
    const result = await query<CollectionRecord>(
      `INSERT INTO collections (name, slug, description, image_url, display_order, is_enabled, nav_links)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [
        input.name,
        slug,
        input.description ?? "",
        input.imageUrl ?? null,
        input.displayOrder ?? 0,
        input.isEnabled ?? true,
        JSON.stringify(input.navLinks ?? [])
      ]
    );
    return result.rows[0];
  },

  async update(
    id: string,
    input: {
      name?: string;
      slug?: string;
      description?: string;
      imageUrl?: string | null;
      displayOrder?: number;
      isEnabled?: boolean;
      navLinks?: { label: string; href: string }[];
    }
  ): Promise<CollectionRecord | null> {
    const fields: string[] = [];
    const values: unknown[] = [];
    let paramIdx = 1;

    if (input.name !== undefined) {
      fields.push(`name = $${paramIdx++}`);
      values.push(input.name);
    }
    if (input.slug !== undefined) {
      fields.push(`slug = $${paramIdx++}`);
      values.push(input.slug);
    }
    if (input.description !== undefined) {
      fields.push(`description = $${paramIdx++}`);
      values.push(input.description);
    }
    if (input.imageUrl !== undefined) {
      fields.push(`image_url = $${paramIdx++}`);
      values.push(input.imageUrl);
    }
    if (input.displayOrder !== undefined) {
      fields.push(`display_order = $${paramIdx++}`);
      values.push(input.displayOrder);
    }
    if (input.isEnabled !== undefined) {
      fields.push(`is_enabled = $${paramIdx++}`);
      values.push(input.isEnabled);
    }
    if (input.navLinks !== undefined) {
      fields.push(`nav_links = $${paramIdx++}`);
      values.push(JSON.stringify(input.navLinks));
    }

    if (fields.length === 0) return this.findById(id);

    fields.push(`updated_at = now()`);
    values.push(id);

    const result = await query<CollectionRecord>(
      `UPDATE collections SET ${fields.join(", ")} WHERE id = $${paramIdx} RETURNING *`,
      values
    );
    return result.rows[0] ?? null;
  },

  async delete(id: string): Promise<boolean> {
    const result = await query("DELETE FROM collections WHERE id = $1", [id]);
    return (result.rowCount ?? 0) > 0;
  },

  async getProducts(collectionId: string): Promise<string[]> {
    const result = await query<{ product_id: string }>(
      "SELECT product_id FROM collection_products WHERE collection_id = $1",
      [collectionId]
    );
    return result.rows.map((r) => r.product_id);
  },

  async countProducts(collectionId: string): Promise<number> {
    const result = await query<{ count: string }>(
      "SELECT COUNT(*)::text AS count FROM collection_products WHERE collection_id = $1",
      [collectionId]
    );
    return parseInt(result.rows[0]?.count ?? "0", 10);
  },

    async addProduct(collectionId: string, productId: string, client?: PoolClient): Promise<void> {
    const sql = "INSERT INTO collection_products (collection_id, product_id) VALUES ($1, $2) ON CONFLICT DO NOTHING";
    if (client) {
      await client.query(sql, [collectionId, productId]);
    } else {
      await query(sql, [collectionId, productId]);
    }
  },

    async removeProductFromAll(productId: string, client?: PoolClient): Promise<void> {
    const sql = "DELETE FROM collection_products WHERE product_id = $1";
    if (client) {
      await client.query(sql, [productId]);
    } else {
      await query(sql, [productId]);
    }
  },

    async findByProductId(productId: string, client?: PoolClient): Promise<CollectionRecord | null> {
    const sql = `SELECT col.* FROM collections col
                 JOIN collection_products cp ON cp.collection_id = col.id
                 WHERE cp.product_id = $1 LIMIT 1`;
    const result = client
      ? await client.query<CollectionRecord>(sql, [productId])
      : await query<CollectionRecord>(sql, [productId]);
    return result.rows[0] ?? null;
  },

    async findAllByProductId(productId: string, client?: PoolClient): Promise<CollectionRecord[]> {
    const sql = `SELECT col.* FROM collections col
                 JOIN collection_products cp ON cp.collection_id = col.id
                 WHERE cp.product_id = $1
                 ORDER BY col.display_order ASC, col.name ASC`;
    const result = client
      ? await client.query<CollectionRecord>(sql, [productId])
      : await query<CollectionRecord>(sql, [productId]);
    return result.rows;
  },

  async findOrCreateSlug(name: string): Promise<string> {
    let base = slugify(name);
    let slug = base;
    let counter = 1;
    while (await this.findBySlug(slug)) {
      slug = `${base}-${counter}`;
      counter++;
    }
    return slug;
  }
};

export const CollectionOptionModel = {
  async findByCollectionId(collectionId: string): Promise<CollectionOptionRecord[]> {
    const result = await query<CollectionOptionRecord>(
      "SELECT * FROM collection_options WHERE collection_id = $1 ORDER BY name ASC",
      [collectionId]
    );
    return result.rows;
  },

  async findActiveByCollectionId(collectionId: string): Promise<CollectionOptionRecord[]> {
    const result = await query<CollectionOptionRecord>(
      "SELECT * FROM collection_options WHERE collection_id = $1 AND is_active = true ORDER BY name ASC",
      [collectionId]
    );
    return result.rows;
  },

  async findById(id: string): Promise<CollectionOptionRecord | null> {
    const result = await query<CollectionOptionRecord>(
      "SELECT * FROM collection_options WHERE id = $1",
      [id]
    );
    return result.rows[0] ?? null;
  },

  async findBySlug(collectionId: string, slug: string): Promise<CollectionOptionRecord | null> {
    const result = await query<CollectionOptionRecord>(
      "SELECT * FROM collection_options WHERE collection_id = $1 AND slug = $2",
      [collectionId, slug]
    );
    return result.rows[0] ?? null;
  },

  async create(input: {
    collectionId: string;
    name: string;
    slug?: string;
    isActive?: boolean;
  }): Promise<CollectionOptionRecord> {
    const slug = input.slug || slugify(input.name);
    const result = await query<CollectionOptionRecord>(
      `INSERT INTO collection_options (collection_id, name, slug, is_active)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [
        input.collectionId,
        input.name,
        slug,
        input.isActive ?? true
      ]
    );
    return result.rows[0];
  },

  async update(
    id: string,
    input: {
      name?: string;
      slug?: string;
      isActive?: boolean;
    }
  ): Promise<CollectionOptionRecord | null> {
    const fields: string[] = [];
    const values: unknown[] = [];
    let paramIdx = 1;

    if (input.name !== undefined) {
      fields.push(`name = $${paramIdx++}`);
      values.push(input.name);
    }
    if (input.slug !== undefined) {
      fields.push(`slug = $${paramIdx++}`);
      values.push(input.slug);
    }
    if (input.isActive !== undefined) {
      fields.push(`is_active = $${paramIdx++}`);
      values.push(input.isActive);
    }

    if (fields.length === 0) return this.findById(id);

    fields.push(`updated_at = now()`);
    values.push(id);

    const result = await query<CollectionOptionRecord>(
      `UPDATE collection_options SET ${fields.join(", ")} WHERE id = $${paramIdx} RETURNING *`,
      values
    );
    return result.rows[0] ?? null;
  },

  async delete(id: string): Promise<boolean> {
    const result = await query("DELETE FROM collection_options WHERE id = $1", [id]);
    return (result.rowCount ?? 0) > 0;
  },

  async getProducts(optionId: string): Promise<string[]> {
    const result = await query<{ product_id: string }>(
      "SELECT product_id FROM collection_option_products WHERE option_id = $1",
      [optionId]
    );
    return result.rows.map((r) => r.product_id);
  },

  async countProducts(optionId: string): Promise<number> {
    const result = await query<{ count: string }>(
      "SELECT COUNT(*)::text AS count FROM collection_option_products WHERE option_id = $1",
      [optionId]
    );
    return parseInt(result.rows[0]?.count ?? "0", 10);
  },

    async addProduct(optionId: string, productId: string, client?: PoolClient): Promise<void> {
    const sql = "INSERT INTO collection_option_products (option_id, product_id) VALUES ($1, $2) ON CONFLICT DO NOTHING";
    if (client) {
      await client.query(sql, [optionId, productId]);
    } else {
      await query(sql, [optionId, productId]);
    }
  },

    async removeProductFromAll(productId: string, client?: PoolClient): Promise<void> {
    const sql = "DELETE FROM collection_option_products WHERE product_id = $1";
    if (client) {
      await client.query(sql, [productId]);
    } else {
      await query(sql, [productId]);
    }
  },

    async findByProductId(productId: string, client?: PoolClient): Promise<CollectionOptionRecord | null> {
    const sql = `SELECT co.* FROM collection_options co
                 JOIN collection_option_products cop ON cop.option_id = co.id
                 WHERE cop.product_id = $1 LIMIT 1`;
    const result = client
      ? await client.query<CollectionOptionRecord>(sql, [productId])
      : await query<CollectionOptionRecord>(sql, [productId]);
    return result.rows[0] ?? null;
  },

    async findAllByProductId(productId: string, client?: PoolClient): Promise<CollectionOptionRecord[]> {
    const sql = `SELECT co.* FROM collection_options co
                 JOIN collection_option_products cop ON cop.option_id = co.id
                 WHERE cop.product_id = $1
                 ORDER BY co.name ASC`;
    const result = client
      ? await client.query<CollectionOptionRecord>(sql, [productId])
      : await query<CollectionOptionRecord>(sql, [productId]);
    return result.rows;
  },

  async findOrCreateSlug(collectionId: string, name: string): Promise<string> {
    let base = slugify(name);
    let slug = base;
    let counter = 1;
    while (await this.findBySlug(collectionId, slug)) {
      slug = `${base}-${counter}`;
      counter++;
    }
    return slug;
  }
};
