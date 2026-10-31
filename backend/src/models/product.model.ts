import type { PoolClient } from "pg";
import { query } from "../config/db";

export interface ProductRecord {
  id: string;
  sku: string;
  slug: string;
  name: string;
  category: string;
  fabric_type: string;
  description: string;
  price: string;
  original_price: string | null;
  images: string[];
  colors: { name: string; hex: string; image?: string | null; images?: string[]; stock?: number }[];
  available_lengths: string[];
  specifications: { label: string; value: string }[];
  rating: string;
  review_count: number;
  stock: number;
  low_stock_threshold: number;
  featured: boolean;
  is_new: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface ProductFilterOptions {
  search?: string;
  categories?: string[];
  colors?: string[];
  fabricTypes?: string[];
  collectionSlug?: string;
  optionSlug?: string;
  priceMin?: number;
  priceMax?: number;
  inStockOnly?: boolean;
  featuredOnly?: boolean;
  productIds?: string[];
  sortBy?: "Featured" | "Newest" | "Price low to high" | "Price high to low";
  limit: number;
  offset: number;
}

export type ProductFilterKey = "search" | "category" | "fabricType" | "color" | "price" | "inStock" | "featured" | "collection" | "option";

function buildTsQuery(term: string): string | null {
  const words = term
    .trim()
    .split(/\s+/)
    .map((word) => word.replace(/[^\p{L}\p{N}]+/gu, ""))
    .filter(Boolean);
  if (words.length === 0) return null;
  return words.map((word, index) => (index === words.length - 1 ? `${word}:*` : word)).join(" & ");
}

function buildProductWhere(
  options: ProductFilterOptions,
  exclude: Set<ProductFilterKey> = new Set()
): { clause: string; params: unknown[]; tsQuery: string | null; tsQueryParamIndex: number | null } {
  const conditions: string[] = [];
  const params: unknown[] = [];
  let tsQuery: string | null = null;
  let tsQueryParamIndex: number | null = null;

  if (options.search && !exclude.has("search")) {
    tsQuery = buildTsQuery(options.search);
    if (tsQuery) {
      params.push(tsQuery);
      tsQueryParamIndex = params.length;
      conditions.push(`search_vector @@ to_tsquery('english', $${tsQueryParamIndex})`);
    }
  }
  if (options.categories && options.categories.length > 0 && !exclude.has("category")) {
    params.push(options.categories);
    conditions.push(`category = ANY($${params.length}::text[])`);
  }
  if (options.fabricTypes && options.fabricTypes.length > 0 && !exclude.has("fabricType")) {
    params.push(options.fabricTypes);
    conditions.push(`fabric_type = ANY($${params.length}::text[])`);
  }
  if (options.colors && options.colors.length > 0 && !exclude.has("color")) {
    params.push(options.colors);
    conditions.push(`EXISTS (
      SELECT 1 FROM jsonb_array_elements(colors) AS c
      WHERE c->>'name' = ANY($${params.length}::text[])
    )`);
  }
  if (options.collectionSlug && !exclude.has("collection")) {
    if (options.optionSlug && !exclude.has("option")) {

      params.push(options.collectionSlug);
      params.push(options.optionSlug);
      conditions.push(`id IN (
        SELECT cop.product_id FROM collection_option_products cop
        JOIN collection_options co ON co.id = cop.option_id
        JOIN collections col ON col.id = co.collection_id
        WHERE col.slug = $${params.length - 1} AND co.slug = $${params.length}
      )`);
    } else {

      params.push(options.collectionSlug);
      conditions.push(`id IN (
        SELECT cp.product_id FROM collection_products cp
        JOIN collections col ON col.id = cp.collection_id
        WHERE col.slug = $${params.length}
      )`);
    }
  }
  if (options.priceMin !== undefined && !exclude.has("price")) {
    params.push(options.priceMin);
    conditions.push(`price >= $${params.length}`);
  }
  if (options.priceMax !== undefined && !exclude.has("price")) {
    params.push(options.priceMax);
    conditions.push(`price <= $${params.length}`);
  }
  if (options.inStockOnly && !exclude.has("inStock")) {
    conditions.push(`stock > 0`);
  }
  if (options.featuredOnly && !exclude.has("featured")) {
    conditions.push(`featured = true`);
  }
  if (options.productIds && options.productIds.length > 0) {
    params.push(options.productIds);
    conditions.push(`id = ANY($${params.length}::uuid[])`);
  }

  return { clause: conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "", params, tsQuery, tsQueryParamIndex };
}

function buildSort(sortBy: ProductFilterOptions["sortBy"], hasSearchRank: boolean): string {
  const rankPrefix = hasSearchRank ? "search_rank DESC, " : "";
  switch (sortBy) {
    case "Newest":
      return `ORDER BY ${rankPrefix}is_new DESC, created_at DESC`;
    case "Price low to high":
      return `ORDER BY ${rankPrefix}price ASC`;
    case "Price high to low":
      return `ORDER BY ${rankPrefix}price DESC`;
    case "Featured":
    default:
      return `ORDER BY ${rankPrefix}featured DESC, created_at DESC`;
  }
}

export const ProductModel = {
  async findMany(options: ProductFilterOptions): Promise<{ rows: ProductRecord[]; total: number }> {
    const { clause: whereClause, params, tsQueryParamIndex } = buildProductWhere(options);
    const sortClause = buildSort(options.sortBy, tsQueryParamIndex !== null);
    const selectColumns =
      tsQueryParamIndex !== null
        ? `*, ts_rank(search_vector, to_tsquery('english', $${tsQueryParamIndex})) AS search_rank`
        : "*";

    const countResult = await query<{ count: string }>(
      `SELECT COUNT(*)::text AS count FROM products ${whereClause}`,
      params
    );
    const total = parseInt(countResult.rows[0]?.count ?? "0", 10);

    const limitParams = [...params];
    limitParams.push(options.limit);
    const limitIndex = limitParams.length;
    limitParams.push(options.offset);
    const offsetIndex = limitParams.length;

    const rowsResult = await query<ProductRecord>(
      `SELECT ${selectColumns} FROM products ${whereClause} ${sortClause} LIMIT $${limitIndex} OFFSET $${offsetIndex}`,
      limitParams
    );

    return { rows: rowsResult.rows, total };
  },

  async findBySlug(slug: string): Promise<ProductRecord | null> {
    const result = await query<ProductRecord>("SELECT * FROM products WHERE slug = $1", [slug]);
    return result.rows[0] ?? null;
  },

  async findById(id: string): Promise<ProductRecord | null> {
    const result = await query<ProductRecord>("SELECT * FROM products WHERE id = $1", [id]);
    return result.rows[0] ?? null;
  },

  async findByIds(ids: string[]): Promise<ProductRecord[]> {
    if (ids.length === 0) return [];
    const result = await query<ProductRecord>("SELECT * FROM products WHERE id = ANY($1::uuid[])", [ids]);
    return result.rows;
  },

  async findBySku(sku: string): Promise<ProductRecord | null> {
    const result = await query<ProductRecord>("SELECT * FROM products WHERE sku = $1", [sku]);
    return result.rows[0] ?? null;
  },

  async findRelated(category: string, excludeId: string, limit = 4): Promise<ProductRecord[]> {
    const result = await query<ProductRecord>(
      `SELECT * FROM products WHERE category = $1 AND id != $2 ORDER BY created_at DESC LIMIT $3`,
      [category, excludeId, limit]
    );
    return result.rows;
  },

  async findFrequentlyBoughtTogether(productId: string, limit = 4): Promise<ProductRecord[]> {
    const result = await query<ProductRecord>(
      `SELECT p.*, COUNT(*) AS co_purchase_count
       FROM order_items oi_self
       JOIN order_items oi_other
         ON oi_other.order_id = oi_self.order_id AND oi_other.product_id != oi_self.product_id
       JOIN orders o ON o.id = oi_self.order_id
       JOIN products p ON p.id = oi_other.product_id
       WHERE oi_self.product_id = $1 AND o.status != 'Cancelled'
       GROUP BY p.id
       ORDER BY co_purchase_count DESC, p.created_at DESC
       LIMIT $2`,
      [productId, limit]
    );
    return result.rows;
  },

  async findFeatured(limit = 8): Promise<ProductRecord[]> {
    const result = await query<ProductRecord>(
      `SELECT * FROM products WHERE featured = true ORDER BY created_at DESC LIMIT $1`,
      [limit]
    );
    return result.rows;
  },

  async create(input: {
    sku: string;
    slug: string;
    name: string;
    category: string;
    fabricType: string;
    description: string;
    price: number;
    originalPrice?: number | null;
    images: string[];
    colors: { name: string; hex: string }[];
    availableLengths: string[];
    specifications: { label: string; value: string }[];
    stock: number;
    lowStockThreshold?: number;
    featured?: boolean;
    isNew?: boolean;
  }, client?: PoolClient): Promise<ProductRecord> {
    const sql = `INSERT INTO products
        (sku, slug, name, category, fabric_type, description, price, original_price,
         images, colors, available_lengths, specifications, stock, low_stock_threshold, featured, is_new)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,COALESCE($14, 5),$15,$16)
       RETURNING *`;
    const params = [
      input.sku,
      input.slug,
      input.name,
      input.category,
      input.fabricType,
      input.description,
      input.price,
      input.originalPrice ?? null,
      JSON.stringify(input.images),
      JSON.stringify(input.colors),
      JSON.stringify(input.availableLengths),
      JSON.stringify(input.specifications),
      input.stock,
      input.lowStockThreshold ?? null,
      input.featured ?? false,
      input.isNew ?? false
    ];
    const result = client
      ? await client.query<ProductRecord>(sql, params)
      : await query<ProductRecord>(sql, params);
    return result.rows[0];
  },

  async updateBySku(
    sku: string,
    input: Partial<{
      name: string;
      category: string;
      fabricType: string;
      description: string;
      price: number;
      originalPrice: number | null;
      images: string[];
      colors: { name: string; hex: string }[];
      availableLengths: string[];
      specifications: { label: string; value: string }[];
      stock: number;
      lowStockThreshold: number;
      featured: boolean;
      isNew: boolean;
    }>,
    client?: PoolClient
  ): Promise<ProductRecord | null> {
    const fieldMap: Record<string, string> = {
      name: "name",
      category: "category",
      fabricType: "fabric_type",
      description: "description",
      price: "price",
      originalPrice: "original_price",
      stock: "stock",
      lowStockThreshold: "low_stock_threshold",
      featured: "featured",
      isNew: "is_new"
    };
    const jsonFieldMap: Record<string, string> = {
      images: "images",
      colors: "colors",
      availableLengths: "available_lengths",
      specifications: "specifications"
    };

    const setClauses: string[] = [];
    const params: unknown[] = [];

    for (const [key, column] of Object.entries(fieldMap)) {
      const value = (input as Record<string, unknown>)[key];
      if (value !== undefined) {
        params.push(value);
        setClauses.push(`${column} = $${params.length}`);
      }
    }
    for (const [key, column] of Object.entries(jsonFieldMap)) {
      const value = (input as Record<string, unknown>)[key];
      if (value !== undefined) {
        params.push(JSON.stringify(value));
        setClauses.push(`${column} = $${params.length}`);
      }
    }

    if (setClauses.length === 0) {
      return this.findBySku(sku);
    }

    setClauses.push(`updated_at = now()`);
    params.push(sku);

    const sql = `UPDATE products SET ${setClauses.join(", ")} WHERE sku = $${params.length} RETURNING *`;
    const result = client ? await client.query<ProductRecord>(sql, params) : await query<ProductRecord>(sql, params);
    return result.rows[0] ?? null;
  },

  async deleteBySku(sku: string): Promise<boolean> {
    const result = await query("DELETE FROM products WHERE sku = $1", [sku]);
    return (result.rowCount ?? 0) > 0;
  },

  async decrementStock(id: string, quantity: number): Promise<void> {
    await query(`UPDATE products SET stock = GREATEST(stock - $1, 0), updated_at = now() WHERE id = $2`, [quantity, id]);
  },

    async incrementStock(id: string, quantity: number): Promise<void> {
    await query(`UPDATE products SET stock = stock + $1, updated_at = now() WHERE id = $2`, [quantity, id]);
  },

    async incrementStockWithClient(client: PoolClient, id: string, quantity: number): Promise<ProductRecord | null> {
    const result = await client.query<ProductRecord>(
      `UPDATE products SET stock = stock + $1, updated_at = now() WHERE id = $2 RETURNING *`,
      [quantity, id]
    );
    return result.rows[0] ?? null;
  },

  async findByIdForUpdate(client: PoolClient, id: string): Promise<ProductRecord | null> {
    const result = await client.query<ProductRecord>("SELECT * FROM products WHERE id = $1 FOR UPDATE", [id]);
    return result.rows[0] ?? null;
  },

  async findBySkuForUpdate(client: PoolClient, sku: string): Promise<ProductRecord | null> {
    const result = await client.query<ProductRecord>("SELECT * FROM products WHERE sku = $1 FOR UPDATE", [sku]);
    return result.rows[0] ?? null;
  },

  async decrementStockForOrder(
    client: PoolClient,
    id: string,
    quantity: number,
    colorName?: string | null
  ): Promise<ProductRecord | null> {
    const locked = await client.query<ProductRecord>("SELECT * FROM products WHERE id = $1 FOR UPDATE", [id]);
    const product = locked.rows[0];
    if (!product) return null;

    const colors = (product.colors ?? []) as {
      name: string;
      hex: string;
      image?: string | null;
      images?: string[];
      stock?: number;
    }[];

    if (colors.length > 0) {
      if (!colorName) {
        return null;
      }
      const target = colorName.trim().toLowerCase();
      let found = false;
      let ok = true;
      const nextColors = colors.map((c) => {
        const stock = Math.max(0, Math.floor(Number(c.stock ?? 0)));
        if (c.name.trim().toLowerCase() !== target) return { ...c, stock };
        found = true;
        if (stock < quantity) {
          ok = false;
          return { ...c, stock };
        }
        return { ...c, stock: stock - quantity };
      });
      if (!found || !ok) return null;
      const total = nextColors.reduce((s, c) => s + Math.max(0, Math.floor(Number(c.stock ?? 0))), 0);
      const result = await client.query<ProductRecord>(
        `UPDATE products SET colors = $1::jsonb, stock = $2, updated_at = now() WHERE id = $3 RETURNING *`,
        [JSON.stringify(nextColors), total, id]
      );
      return result.rows[0] ?? null;
    }

    const result = await client.query<ProductRecord>(
      `UPDATE products SET stock = stock - $1, updated_at = now()
       WHERE id = $2 AND stock >= $1
       RETURNING *`,
      [quantity, id]
    );
    return result.rows[0] ?? null;
  },

  async incrementStockForColor(
    client: PoolClient,
    id: string,
    quantity: number,
    colorName?: string | null
  ): Promise<ProductRecord | null> {
    const locked = await client.query<ProductRecord>("SELECT * FROM products WHERE id = $1 FOR UPDATE", [id]);
    const product = locked.rows[0];
    if (!product) return null;
    const colors = (product.colors ?? []) as {
      name: string;
      hex: string;
      stock?: number;
      [key: string]: unknown;
    }[];
    if (colors.length > 0 && colorName) {
      const target = colorName.trim().toLowerCase();
      let found = false;
      const nextColors = colors.map((c) => {
        const stock = Math.max(0, Math.floor(Number(c.stock ?? 0)));
        if (c.name.trim().toLowerCase() !== target) return { ...c, stock };
        found = true;
        return { ...c, stock: stock + quantity };
      });
      if (!found) return null;
      const total = nextColors.reduce((s, c) => s + Math.max(0, Math.floor(Number(c.stock ?? 0))), 0);
      const result = await client.query<ProductRecord>(
        `UPDATE products SET colors = $1::jsonb, stock = $2, updated_at = now() WHERE id = $3 RETURNING *`,
        [JSON.stringify(nextColors), total, id]
      );
      return result.rows[0] ?? null;
    }
    const result = await client.query<ProductRecord>(
      `UPDATE products SET stock = stock + $1, updated_at = now() WHERE id = $2 RETURNING *`,
      [quantity, id]
    );
    return result.rows[0] ?? null;
  },

  /**
   * Single-scan, database-side replacement for fetching up to 1000 products
   * and counting low/out-of-stock in JavaScript. Definitions preserved exactly:
   * low stock = stock > 0 AND stock <= low_stock_threshold; out of stock = stock = 0.
   * A covering index on (stock, low_stock_threshold) lets this run as an index-only scan.
   */
  async stockSummary(): Promise<{ productCount: number; lowStockCount: number; outOfStockCount: number }> {
    const result = await query<{ total: string; low_stock: string; out_of_stock: string }>(
      `SELECT
         COUNT(*)::text AS total,
         COUNT(*) FILTER (WHERE stock > 0 AND stock <= low_stock_threshold)::text AS low_stock,
         COUNT(*) FILTER (WHERE stock = 0)::text AS out_of_stock
       FROM products`
    );
    const row = result.rows[0];
    return {
      productCount: parseInt(row?.total ?? "0", 10),
      lowStockCount: parseInt(row?.low_stock ?? "0", 10),
      outOfStockCount: parseInt(row?.out_of_stock ?? "0", 10)
    };
  },

  async distinctCategories(): Promise<string[]> {
    const result = await query<{ category: string }>("SELECT DISTINCT category FROM products ORDER BY category");
    return result.rows.map((row) => row.category);
  },

  async distinctFabricTypes(): Promise<string[]> {
    const result = await query<{ fabric_type: string }>("SELECT DISTINCT fabric_type FROM products ORDER BY fabric_type");
    return result.rows.map((row) => row.fabric_type);
  },

  async priceBounds(): Promise<{ min: number; max: number }> {
    const result = await query<{ min: string | null; max: string | null }>(
      "SELECT MIN(price)::text AS min, MAX(price)::text AS max FROM products"
    );
    return {
      min: result.rows[0]?.min ? Math.floor(parseFloat(result.rows[0].min)) : 0,
      max: result.rows[0]?.max ? Math.ceil(parseFloat(result.rows[0].max)) : 0
    };
  },

  async facetCounts(options: ProductFilterOptions): Promise<{
    categories: { value: string; count: number }[];
    fabricTypes: { value: string; count: number }[];
    colors: { name: string; count: number }[];
  }> {
    const categoryWhere = buildProductWhere(options, new Set(["category"]));
    const fabricWhere = buildProductWhere(options, new Set(["fabricType"]));
    const colorWhere = buildProductWhere(options, new Set(["color"]));

    const [categoryRows, fabricRows, colorRows] = await Promise.all([
      query<{ category: string; count: string }>(
        `SELECT category, COUNT(*)::text AS count FROM products ${categoryWhere.clause} GROUP BY category`,
        categoryWhere.params
      ),
      query<{ fabric_type: string; count: string }>(
        `SELECT fabric_type, COUNT(*)::text AS count FROM products ${fabricWhere.clause} GROUP BY fabric_type`,
        fabricWhere.params
      ),
      query<{ name: string; count: string }>(
        `SELECT c->>'name' AS name, COUNT(*)::text AS count
         FROM products, jsonb_array_elements(colors) AS c
         ${colorWhere.clause}
         GROUP BY c->>'name'`,
        colorWhere.params
      )
    ]);

    return {
      categories: categoryRows.rows.map((row) => ({ value: row.category, count: parseInt(row.count, 10) })),
      fabricTypes: fabricRows.rows.map((row) => ({ value: row.fabric_type, count: parseInt(row.count, 10) })),
      colors: colorRows.rows.map((row) => ({ name: row.name, count: parseInt(row.count, 10) }))
    };
  },

  async searchSuggestions(term: string, limit: number): Promise<
    { id: string; name: string; slug: string; image: string | null; price: string; category: string }[]
  > {
    const tsQuery = buildTsQuery(term);
    const params: unknown[] = [];
    let rankSelect = "0 AS rank";
    let condition = "";

    if (tsQuery) {
      params.push(tsQuery);
      rankSelect = `ts_rank(search_vector, to_tsquery('english', $${params.length})) AS rank`;
      condition = `search_vector @@ to_tsquery('english', $${params.length})`;
    }
    params.push(`${term.trim().replace(/[%_]/g, (char) => `\\${char}`)}%`);
    const prefixCondition = `name ILIKE $${params.length} ESCAPE '\\'`;

    const whereClause = condition ? `WHERE (${condition}) OR ${prefixCondition}` : `WHERE ${prefixCondition}`;

    params.push(limit);
    const result = await query<{
      id: string;
      name: string;
      slug: string;
      images: string[];
      price: string;
      category: string;
    }>(
      `SELECT id, name, slug, images, price, category, ${rankSelect}
       FROM products
       ${whereClause}
       ORDER BY rank DESC, name ASC
       LIMIT $${params.length}`,
      params
    );

    return result.rows.map((row) => ({
      id: row.id,
      name: row.name,
      slug: row.slug,
      image: row.images[0] ?? null,
      price: row.price,
      category: row.category
    }));
  }
};
