import { query } from "../config/db";

export interface CategoryRecord {
  id: string;
  name: string;
  slug: string;
  image_url: string | null;
  is_enabled: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface FabricTypeRecord {
  id: string;
  name: string;
  slug: string;
  created_at: Date;
  updated_at: Date;
}

export interface ColorRecord {
  id: string;
  name: string;
  hex: string;
  created_at: Date;
  updated_at: Date;
}

export interface HomeFeaturedCategoryRecord {
  id: string;
  category_id: string;
  image_url: string | null;
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

export const CategoryModel = {
  async findAll(): Promise<CategoryRecord[]> {
    const result = await query<CategoryRecord>(
      "SELECT * FROM categories ORDER BY name ASC"
    );
    return result.rows;
  },

  async findById(id: string): Promise<CategoryRecord | null> {
    const result = await query<CategoryRecord>(
      "SELECT * FROM categories WHERE id = $1",
      [id]
    );
    return result.rows[0] ?? null;
  },

  async findByName(name: string): Promise<CategoryRecord | null> {
    const result = await query<CategoryRecord>(
      "SELECT * FROM categories WHERE name = $1",
      [name]
    );
    return result.rows[0] ?? null;
  },

  async findAllEnabled(): Promise<CategoryRecord[]> {
    const result = await query<CategoryRecord>(
      "SELECT * FROM categories WHERE is_enabled = true ORDER BY name ASC"
    );
    return result.rows;
  },

  async create(name: string, extra?: { imageUrl?: string | null; isEnabled?: boolean }): Promise<CategoryRecord> {
    const slug = slugify(name);
    const result = await query<CategoryRecord>(
      `INSERT INTO categories (name, slug, image_url, is_enabled) VALUES ($1, $2, $3, $4) RETURNING *`,
      [name, slug, extra?.imageUrl ?? null, extra?.isEnabled ?? true]
    );
    return result.rows[0];
  },

  async update(id: string, name: string, extra?: { imageUrl?: string | null; isEnabled?: boolean }): Promise<CategoryRecord | null> {
    const slug = slugify(name);
    const result = await query<CategoryRecord>(
      `UPDATE categories SET name = $1, slug = $2, image_url = COALESCE($4, image_url), is_enabled = COALESCE($5, is_enabled), updated_at = now() WHERE id = $3 RETURNING *`,
      [name, slug, id, extra?.imageUrl ?? null, extra?.isEnabled ?? null]
    );
    return result.rows[0] ?? null;
  },

  async delete(id: string): Promise<boolean> {
    const result = await query("DELETE FROM categories WHERE id = $1", [id]);
    return (result.rowCount ?? 0) > 0;
  },

  async countProductsUsing(categoryName: string): Promise<number> {
    const result = await query<{ count: string }>(
      "SELECT COUNT(*)::text AS count FROM products WHERE category = $1",
      [categoryName]
    );
    return parseInt(result.rows[0]?.count ?? "0", 10);
  },

  async findManyByName(names: string[]): Promise<CategoryRecord[]> {
    if (names.length === 0) return [];
    const result = await query<CategoryRecord>(
      "SELECT * FROM categories WHERE name = ANY($1::text[])",
      [names]
    );
    return result.rows;
  }
};

export const HomeFeaturedCategoryModel = {
  async findAll(): Promise<HomeFeaturedCategoryRecord[]> {
    const result = await query<HomeFeaturedCategoryRecord>(
      "SELECT * FROM home_featured_categories ORDER BY created_at ASC"
    );
    return result.rows;
  },

  async findActive(): Promise<HomeFeaturedCategoryRecord[]> {
    const result = await query<HomeFeaturedCategoryRecord>(
      "SELECT * FROM home_featured_categories WHERE is_active = true ORDER BY created_at ASC"
    );
    return result.rows;
  },

  async findById(id: string): Promise<HomeFeaturedCategoryRecord | null> {
    const result = await query<HomeFeaturedCategoryRecord>(
      "SELECT * FROM home_featured_categories WHERE id = $1",
      [id]
    );
    return result.rows[0] ?? null;
  },

  async findByCategoryId(categoryId: string): Promise<HomeFeaturedCategoryRecord | null> {
    const result = await query<HomeFeaturedCategoryRecord>(
      "SELECT * FROM home_featured_categories WHERE category_id = $1",
      [categoryId]
    );
    return result.rows[0] ?? null;
  },

  async create(input: { categoryId: string; imageUrl?: string | null; isActive?: boolean }): Promise<HomeFeaturedCategoryRecord> {
    const result = await query<HomeFeaturedCategoryRecord>(
      `INSERT INTO home_featured_categories (category_id, image_url, is_active)
       VALUES ($1, $2, $3) RETURNING *`,
      [
        input.categoryId,
        input.imageUrl ?? null,
        input.isActive ?? true
      ]
    );
    return result.rows[0];
  },

  async update(id: string, input: { imageUrl?: string | null; isActive?: boolean }): Promise<HomeFeaturedCategoryRecord | null> {
    const fields: string[] = [];
    const values: unknown[] = [];
    let paramIdx = 1;

    if (input.imageUrl !== undefined) {
      fields.push(`image_url = $${paramIdx++}`);
      values.push(input.imageUrl);
    }
    if (input.isActive !== undefined) {
      fields.push(`is_active = $${paramIdx++}`);
      values.push(input.isActive);
    }

    if (fields.length === 0) return this.findById(id);

    fields.push(`updated_at = now()`);
    values.push(id);

    const result = await query<HomeFeaturedCategoryRecord>(
      `UPDATE home_featured_categories SET ${fields.join(", ")} WHERE id = $${paramIdx} RETURNING *`,
      values
    );
    return result.rows[0] ?? null;
  },

  async delete(id: string): Promise<boolean> {
    const result = await query("DELETE FROM home_featured_categories WHERE id = $1", [id]);
    return (result.rowCount ?? 0) > 0;
  },

  async deleteByCategoryId(categoryId: string): Promise<boolean> {
    const result = await query("DELETE FROM home_featured_categories WHERE category_id = $1", [categoryId]);
    return (result.rowCount ?? 0) > 0;
  },

  async count(): Promise<number> {
    const result = await query<{ count: string }>(
      "SELECT COUNT(*)::text AS count FROM home_featured_categories"
    );
    return parseInt(result.rows[0]?.count ?? "0", 10);
  }
};

export const FabricTypeModel = {
  async findAll(): Promise<FabricTypeRecord[]> {
    const result = await query<FabricTypeRecord>(
      "SELECT * FROM fabric_types ORDER BY name ASC"
    );
    return result.rows;
  },

  async findById(id: string): Promise<FabricTypeRecord | null> {
    const result = await query<FabricTypeRecord>(
      "SELECT * FROM fabric_types WHERE id = $1",
      [id]
    );
    return result.rows[0] ?? null;
  },

  async findByName(name: string): Promise<FabricTypeRecord | null> {
    const result = await query<FabricTypeRecord>(
      "SELECT * FROM fabric_types WHERE name = $1",
      [name]
    );
    return result.rows[0] ?? null;
  },

  async create(name: string): Promise<FabricTypeRecord> {
    const slug = slugify(name);
    const result = await query<FabricTypeRecord>(
      `INSERT INTO fabric_types (name, slug) VALUES ($1, $2) RETURNING *`,
      [name, slug]
    );
    return result.rows[0];
  },

  async update(id: string, name: string): Promise<FabricTypeRecord | null> {
    const slug = slugify(name);
    const result = await query<FabricTypeRecord>(
      `UPDATE fabric_types SET name = $1, slug = $2, updated_at = now() WHERE id = $3 RETURNING *`,
      [name, slug, id]
    );
    return result.rows[0] ?? null;
  },

  async delete(id: string): Promise<boolean> {
    const result = await query("DELETE FROM fabric_types WHERE id = $1", [id]);
    return (result.rowCount ?? 0) > 0;
  },

  async countProductsUsing(fabricTypeName: string): Promise<number> {
    const result = await query<{ count: string }>(
      "SELECT COUNT(*)::text AS count FROM products WHERE fabric_type = $1",
      [fabricTypeName]
    );
    return parseInt(result.rows[0]?.count ?? "0", 10);
  },

  async findManyByName(names: string[]): Promise<FabricTypeRecord[]> {
    if (names.length === 0) return [];
    const result = await query<FabricTypeRecord>(
      "SELECT * FROM fabric_types WHERE name = ANY($1::text[])",
      [names]
    );
    return result.rows;
  }
};

export const ColorModel = {
  async findAll(): Promise<ColorRecord[]> {
    const result = await query<ColorRecord>(
      "SELECT * FROM colors ORDER BY name ASC"
    );
    return result.rows;
  },

  async findById(id: string): Promise<ColorRecord | null> {
    const result = await query<ColorRecord>(
      "SELECT * FROM colors WHERE id = $1",
      [id]
    );
    return result.rows[0] ?? null;
  },

  async findByName(name: string): Promise<ColorRecord | null> {
    const result = await query<ColorRecord>(
      "SELECT * FROM colors WHERE name = $1",
      [name]
    );
    return result.rows[0] ?? null;
  },

  async create(name: string, hex: string): Promise<ColorRecord> {
    const result = await query<ColorRecord>(
      `INSERT INTO colors (name, hex) VALUES ($1, $2) RETURNING *`,
      [name, hex.toUpperCase()]
    );
    return result.rows[0];
  },

  async update(id: string, name: string, hex: string): Promise<ColorRecord | null> {
    const result = await query<ColorRecord>(
      `UPDATE colors SET name = $1, hex = $2, updated_at = now() WHERE id = $3 RETURNING *`,
      [name, hex.toUpperCase(), id]
    );
    return result.rows[0] ?? null;
  },

  async delete(id: string): Promise<boolean> {
    const result = await query("DELETE FROM colors WHERE id = $1", [id]);
    return (result.rowCount ?? 0) > 0;
  },

  async countProductsUsing(colorName: string): Promise<number> {
    const result = await query<{ count: string }>(
      `SELECT COUNT(*)::text AS count FROM products WHERE colors @> $1::jsonb`,
      [JSON.stringify([{ name: colorName, hex: "" }])]
    );
    return parseInt(result.rows[0]?.count ?? "0", 10);
  },

  async findManyByName(names: string[]): Promise<ColorRecord[]> {
    if (names.length === 0) return [];
    const result = await query<ColorRecord>(
      "SELECT * FROM colors WHERE name = ANY($1::text[])",
      [names]
    );
    return result.rows;
  },

  async findAllAsLookup(): Promise<{ name: string; hex: string }[]> {
    const result = await query<{ name: string; hex: string }>(
      "SELECT name, hex FROM colors ORDER BY name ASC"
    );
    return result.rows;
  }
};
