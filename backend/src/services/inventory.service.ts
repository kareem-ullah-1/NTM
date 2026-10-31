import type { PoolClient } from "pg";
import { ProductModel } from "../models/product.model";
import { CollectionModel, CollectionOptionModel } from "../models/collection.model";
import { InventoryMovementModel, type InventoryMovementType } from "../models/inventory-movement.model";
import { StoreSettingsModel } from "../models/store-settings.model";
import { ApiError } from "../utils/ApiError";
import { serializeProduct } from "./product.service";
import { normalizeColorsFromDb } from "../config/colors";
import { ensureColorStocks, applyColorStockDelta, colorStock, sumColorStocks } from "../utils/color-stock";
import { withTransaction } from "../config/db";
import { buildMeta } from "../utils/pagination";
import type { InventoryCreateInput, InventoryUpdateInput, StockAdjustmentInput } from "../validators/product.validator";

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

function categoryCode(category: string): string {
  const letters = category.replace(/[^A-Za-z]/g, "");
  return (letters.slice(0, 2) || "GN").toUpperCase();
}

async function generateUniqueSku(category: string): Promise<string> {
  for (let attempt = 0; attempt < 8; attempt += 1) {
    const candidate = `NF-${categoryCode(category)}-${Math.floor(100 + Math.random() * 900)}`;
    const existing = await ProductModel.findBySku(candidate);
    if (!existing) return candidate;
  }
  return `NF-${categoryCode(category)}-${Date.now().toString().slice(-4)}`;
}

async function generateUniqueSlug(name: string): Promise<string> {
  const base = slugify(name);
  let candidate = base;
  let suffix = 1;
  while (true) {
    const existing = await ProductModel.findBySlug(candidate);
    if (!existing) return candidate;
    suffix += 1;
    candidate = `${base}-${suffix}`;
  }
}

type CollectionSelection = { collectionId: string; collectionOptionId?: string | null };

async function validateCollectionSelections(selections: CollectionSelection[]) {
  for (const selection of selections) {
    const collection = await CollectionModel.findById(selection.collectionId);
    if (!collection) throw ApiError.badRequest("Selected collection does not exist");

    if (selection.collectionOptionId) {
      const option = await CollectionOptionModel.findById(selection.collectionOptionId);
      if (!option || option.collection_id !== selection.collectionId) {
        throw ApiError.badRequest("Selected collection option does not belong to the selected collection");
      }
    }
  }
}

async function syncCollectionMembership(
  client: PoolClient,
  productId: string,
  selections: CollectionSelection[]
) {
  await CollectionModel.removeProductFromAll(productId, client);
  await CollectionOptionModel.removeProductFromAll(productId, client);
  for (const selection of selections) {
    await CollectionModel.addProduct(selection.collectionId, productId, client);
    if (selection.collectionOptionId) {
      await CollectionOptionModel.addProduct(selection.collectionOptionId, productId, client);
    }
  }
}

async function attachCollectionInfo(product: ReturnType<typeof serializeProduct>, productId: string) {
  const [collections, options] = await Promise.all([
    CollectionModel.findAllByProductId(productId),
    CollectionOptionModel.findAllByProductId(productId)
  ]);
  const optionsByCollectionId = new Map(options.map((o) => [o.collection_id, o]));
  const collectionSelections: CollectionSelection[] = collections.map((c) => ({
    collectionId: c.id,
    collectionOptionId: optionsByCollectionId.get(c.id)?.id ?? null
  }));
  return { ...product, collections: collectionSelections };
}

export const InventoryService = {
  async list() {
    const { rows } = await ProductModel.findMany({ limit: 1000, offset: 0 });
    return Promise.all(rows.map((row) => attachCollectionInfo(serializeProduct(row), row.id)));
  },

  async create(input: InventoryCreateInput) {
    const sku = await generateUniqueSku(input.category);
    const slug = await generateUniqueSlug(input.productName);

    if (!input.colors || input.colors.length === 0) {
      throw ApiError.badRequest("At least one color is required");
    }
    const normalizedColors = await normalizeColorsFromDb(input.colors);
    if (normalizedColors.length === 0) {
      throw ApiError.badRequest("At least one color is required");
    }
    const colorsWithStock = ensureColorStocks(normalizedColors as { name: string; hex: string; stock?: number }[], input.stock);
    const totalStock = sumColorStocks(colorsWithStock);

    const collectionSelections = input.collections ?? [];
    await validateCollectionSelections(collectionSelections);

    let lowStockThreshold = input.lowStockThreshold;
    if (lowStockThreshold === undefined) {
      const settings = await StoreSettingsModel.get();
      lowStockThreshold = settings.default_low_stock_threshold;
    }

    const created = await withTransaction(async (client) => {
      const product = await ProductModel.create(
        {
          sku,
          slug,
          name: input.productName,
          category: input.category,
          fabricType: input.fabricType,
          description: input.description ?? "",
          price: input.price,
          originalPrice: input.originalPrice ?? null,
          images: input.images ?? [],
          colors: colorsWithStock,
          availableLengths: input.availableLengths ?? ["4 meters", "4.5 meters", "5 meters"],
          specifications: input.specifications ?? [],
          stock: totalStock,
          lowStockThreshold,
          featured: input.featured ?? false,
          isNew: input.isNew ?? true
        },
        client
      );

      await syncCollectionMembership(client, product.id, collectionSelections);

      if (product.stock > 0) {
        await InventoryMovementModel.create(client, {
          productId: product.id,
          previousStock: 0,
          quantityChange: product.stock,
          newStock: product.stock,
          movementType: "restock",
          reason: "Initial stock on product creation"
        });
      }

      return product;
    });

    return attachCollectionInfo(serializeProduct(created), created.id);
  },

  async update(sku: string, input: InventoryUpdateInput) {
    const existing = await ProductModel.findBySku(sku);
    if (!existing) throw ApiError.notFound(`No inventory item found with SKU ${sku}`);

    let normalizedColors = input.colors ? await normalizeColorsFromDb(input.colors) : undefined;
    if (input.colors && input.colors.length > 0 && normalizedColors && normalizedColors.length === 0) {
      throw ApiError.badRequest("At least one color is required");
    }
    if (normalizedColors) {
      normalizedColors = ensureColorStocks(
        normalizedColors as { name: string; hex: string; stock?: number }[],
        existing.stock
      );
    }

    const touchesCollection = input.collections !== undefined;
    if (touchesCollection) {
      await validateCollectionSelections(input.collections ?? []);
    }

    const updated = await withTransaction(async (client) => {

      const before = await ProductModel.findBySkuForUpdate(client, sku);
      if (!before) throw ApiError.notFound(`No inventory item found with SKU ${sku}`);

      const product = await ProductModel.updateBySku(
        sku,
        {
          name: input.productName,
          category: input.category,
          fabricType: input.fabricType,
          description: input.description,
          price: input.price,
          originalPrice: input.originalPrice,
          images: input.images,
          colors: normalizedColors,
          availableLengths: input.availableLengths,
          specifications: input.specifications,
          lowStockThreshold: input.lowStockThreshold,
          featured: input.featured,
          isNew: input.isNew,
          ...(normalizedColors
            ? { stock: sumColorStocks(normalizedColors as { stock?: number }[]) }
            : {})
        },
        client
      );

      if (!product) throw ApiError.notFound(`No inventory item found with SKU ${sku}`);

      if (touchesCollection) {
        await syncCollectionMembership(client, product.id, input.collections ?? []);
      }

      return product;
    });

    return attachCollectionInfo(serializeProduct(updated), updated.id);
  },

  async remove(sku: string) {
    const deleted = await ProductModel.deleteBySku(sku);
    if (!deleted) throw ApiError.notFound(`No inventory item found with SKU ${sku}`);
  },

  async adjustStock(sku: string, input: StockAdjustmentInput, adminUserId: string) {
    const updated = await withTransaction(async (client) => {
      const product = await ProductModel.findBySkuForUpdate(client, sku);
      if (!product) throw ApiError.notFound(`No inventory item found with SKU ${sku}`);

      const colors = (product.colors ?? []) as { name: string; hex: string; stock?: number }[];

      if (colors.length > 0) {
        if (!input.color) {
          throw ApiError.badRequest("Select a colour to adjust stock for this product.");
        }
        const applied = applyColorStockDelta(colors, input.color, input.quantityChange);
        if (!applied) {
          const current = colors.find((c) => c.name.trim().toLowerCase() === input.color!.trim().toLowerCase());
          if (!current) {
            throw ApiError.badRequest(`Colour "${input.color}" was not found on this product.`);
          }
          throw ApiError.badRequest(
            `This adjustment would take "${input.color}" stock below zero (current: ${colorStock(current)}).`
          );
        }
        const result = await client.query<{ stock: number; colors: unknown; updated_at: Date }>(
          `UPDATE products SET colors = $1::jsonb, stock = $2, updated_at = now() WHERE id = $3 RETURNING stock, colors, updated_at`,
          [JSON.stringify(applied.colors), applied.totalStock, product.id]
        );
        const reason =
          input.reason +
          (input.color ? ` [colour: ${input.color}]` : "");
        await InventoryMovementModel.create(client, {
          productId: product.id,
          previousStock: applied.previousColorStock,
          quantityChange: input.quantityChange,
          newStock: applied.newColorStock,
          movementType: input.movementType ?? (input.quantityChange > 0 ? "restock" : "manual_adjustment"),
          reason,
          createdBy: adminUserId
        });
        return {
          ...product,
          stock: result.rows[0].stock,
          colors: result.rows[0].colors as typeof product.colors,
          updated_at: result.rows[0].updated_at
        };
      }

      const newStock = product.stock + input.quantityChange;
      if (newStock < 0) {
        throw ApiError.badRequest(
          `This adjustment would take stock below zero (current stock: ${product.stock}).`
        );
      }

      const result = await client.query<{ stock: number; updated_at: Date }>(
        `UPDATE products SET stock = $1, updated_at = now() WHERE id = $2 RETURNING stock, updated_at`,
        [newStock, product.id]
      );

      await InventoryMovementModel.create(client, {
        productId: product.id,
        previousStock: product.stock,
        quantityChange: input.quantityChange,
        newStock,
        movementType: input.movementType ?? (input.quantityChange > 0 ? "restock" : "manual_adjustment"),
        reason: input.reason,
        createdBy: adminUserId
      });

      return { ...product, stock: result.rows[0].stock, updated_at: result.rows[0].updated_at };
    });

    return attachCollectionInfo(serializeProduct(updated), updated.id);
  },

  async listMovements(options: {
    productSku?: string;
    movementType?: InventoryMovementType;
    orderId?: string;
    page?: number;
    limit?: number;
  }) {
    let productId: string | undefined;
    if (options.productSku) {
      const product = await ProductModel.findBySku(options.productSku);
      if (!product) throw ApiError.notFound(`No inventory item found with SKU ${options.productSku}`);
      productId = product.id;
    }

    const page = options.page ?? 1;
    const limit = options.limit ?? 50;
    const offset = (page - 1) * limit;

    const { rows, total } = await InventoryMovementModel.findMany({
      productId,
      movementType: options.movementType,
      orderId: options.orderId,
      limit,
      offset
    });

    return { data: rows, meta: buildMeta(page, limit, total) };
  }
};
