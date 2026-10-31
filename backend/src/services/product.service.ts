import { ProductModel, type ProductRecord } from "../models/product.model";
import { PromotionModel } from "../models/promotion.model";
import { ApiError } from "../utils/ApiError";
import { buildMeta } from "../utils/pagination";
import { serializeColors, statusForStock, sumColorStocks } from "../utils/color-stock";

function toArray(value: unknown): string[] | undefined {
  if (value === undefined) return undefined;
  return Array.isArray(value) ? value : [value as string];
}

function mergeFilters(
  userFilters: string[] | undefined,
  promotionFilters: string[] | undefined
): string[] | undefined {
  if (!promotionFilters) return userFilters;
  if (!userFilters) return promotionFilters;
  const promoSet = new Set(promotionFilters);
  const intersection = userFilters.filter((v) => promoSet.has(v));
  return intersection.length > 0 ? intersection : promotionFilters;
}

export function serializeProduct(row: ProductRecord) {
  const colors = serializeColors(row.colors as { name: string; hex: string; stock?: number }[], row.low_stock_threshold);
  const totalStock =
    colors.length > 0 ? sumColorStocks(colors) : row.stock;
  return {
    id: row.id,
    sku: row.sku,
    slug: row.slug,
    name: row.name,
    category: row.category,
    fabricType: row.fabric_type,
    description: row.description,
    price: parseFloat(row.price),
    originalPrice: row.original_price ? parseFloat(row.original_price) : undefined,
    images: row.images,
    colors,
    availableLengths: row.available_lengths,
    specifications: row.specifications,
    rating: parseFloat(row.rating),
    reviewCount: row.review_count,
    stock: totalStock,
    lowStockThreshold: row.low_stock_threshold,
    featured: row.featured,
    isNew: row.is_new,
    status: statusForStock(totalStock, row.low_stock_threshold),
    lastUpdated: row.updated_at.toISOString().slice(0, 10)
  };
}

export const ProductService = {
  async list(query: Record<string, unknown>) {
    const page = (query.page as number) ?? 1;
    const limit = (query.limit as number) ?? 12;
    const offset = (page - 1) * limit;

    let promotionCategories: string[] | undefined;
    let promotionFabricTypes: string[] | undefined;
    let promotionProductIds: string[] | undefined;
    const promotionId = query.promotion as string | undefined;

    if (promotionId) {
      const promo = await PromotionModel.findById(promotionId);
      if (!promo) {
        throw ApiError.badRequest("Invalid promotion");
      }
      const now = new Date();
      if (!promo.is_active) {
        throw ApiError.badRequest("This promotion is no longer active");
      }
      if (now < new Date(promo.starts_at)) {
        throw ApiError.badRequest("This promotion has not started yet");
      }
      if (now > new Date(promo.expires_at)) {
        throw ApiError.badRequest("This promotion has expired");
      }

      const targeting = await PromotionModel.getTargeting(promotionId);
      switch (targeting.targetType) {
        case "ALL_PRODUCTS":
          break;
        case "CATEGORIES":
          if (targeting.categories.length === 0) {
            return { data: [], meta: buildMeta(page, limit, 0) };
          }
          promotionCategories = targeting.categories;
          break;
        case "FABRIC_TYPES":
          if (targeting.fabricTypes.length === 0) {
            return { data: [], meta: buildMeta(page, limit, 0) };
          }
          promotionFabricTypes = targeting.fabricTypes;
          break;
        case "PRODUCTS":
          if (targeting.productIds.length === 0) {
            return { data: [], meta: buildMeta(page, limit, 0) };
          }
          promotionProductIds = targeting.productIds;
          break;
      }
    }

    const userCategories = toArray(query.category);
    const userFabricTypes = toArray(query.fabricType);

    const explicitIds = toArray(query.ids);
    const combinedProductIds =
      explicitIds && promotionProductIds
        ? explicitIds.filter((id) => promotionProductIds!.includes(id))
        : (explicitIds ?? promotionProductIds);

    if (combinedProductIds && combinedProductIds.length === 0 && (explicitIds || promotionProductIds)) {
      return { data: [], meta: buildMeta(page, limit, 0) };
    }

    const { rows, total } = await ProductModel.findMany({
      search: query.search as string | undefined,
      categories: mergeFilters(userCategories, promotionCategories),
      fabricTypes: mergeFilters(userFabricTypes, promotionFabricTypes),
      colors: toArray(query.color),
      collectionSlug: query.collection as string | undefined,
      optionSlug: query.option as string | undefined,
      priceMin: query.priceMin as number | undefined,
      priceMax: query.priceMax as number | undefined,
      inStockOnly: query.inStockOnly as boolean | undefined,
      featuredOnly: query.featuredOnly as boolean | undefined,
      productIds: combinedProductIds,
      sortBy: query.sort as never,
      limit,
      offset
    });

    return {
      data: rows.map(serializeProduct),
      meta: buildMeta(page, limit, total)
    };
  },

  async getBySlug(slug: string) {
    const product = await ProductModel.findBySlug(slug);
    if (!product) throw ApiError.notFound("Product not found");
    return serializeProduct(product);
  },

  async getRelated(slug: string, limit = 4) {
    const product = await ProductModel.findBySlug(slug);
    if (!product) throw ApiError.notFound("Product not found");
    const related = await ProductModel.findRelated(product.category, product.id, limit);
    return related.map(serializeProduct);
  },

  async getAlsoBought(slug: string, limit = 4) {
    const product = await ProductModel.findBySlug(slug);
    if (!product) throw ApiError.notFound("Product not found");

    const coPurchased = await ProductModel.findFrequentlyBoughtTogether(product.id, limit);
    if (coPurchased.length >= limit) {
      return coPurchased.map(serializeProduct);
    }

    const fallback = await ProductModel.findRelated(product.category, product.id, limit - coPurchased.length);
    const seen = new Set(coPurchased.map((row) => row.id));
    const merged = [...coPurchased, ...fallback.filter((row) => !seen.has(row.id))];
    return merged.map(serializeProduct);
  },

  async featured(limit = 8) {
    const rows = await ProductModel.findFeatured(limit);
    return rows.map(serializeProduct);
  },

  async filterOptions(query: Record<string, unknown> = {}) {
    const filters = {
      search: query.search as string | undefined,
      categories: toArray(query.category),
      fabricTypes: toArray(query.fabricType),
      colors: toArray(query.color),
      collectionSlug: query.collection as string | undefined,
      optionSlug: query.option as string | undefined,
      priceMin: query.priceMin as number | undefined,
      priceMax: query.priceMax as number | undefined,
      inStockOnly: query.inStockOnly as boolean | undefined,
      featuredOnly: query.featuredOnly as boolean | undefined,
      limit: 0,
      offset: 0
    };

    const [allCategories, allFabricTypes, colorLookup, facets, priceBounds] = await Promise.all([
      ProductModel.distinctCategories(),
      ProductModel.distinctFabricTypes(),
      (async () => {
        try {
          const { ColorModel } = await import("../models/catalog.model");
          return await ColorModel.findAllAsLookup();
        } catch {
          const { PRODUCT_COLORS } = await import("../config/colors");
          return PRODUCT_COLORS;
        }
      })(),
      ProductModel.facetCounts(filters),
      ProductModel.priceBounds()
    ]);

    const categoryCounts = new Map(facets.categories.map((row) => [row.value, row.count]));
    const fabricTypeCounts = new Map(facets.fabricTypes.map((row) => [row.value, row.count]));
    const colorCounts = new Map(facets.colors.map((row) => [row.name, row.count]));

    return {
      categories: allCategories.map((value) => ({ value, count: categoryCounts.get(value) ?? 0 })),
      fabricTypes: allFabricTypes.map((value) => ({ value, count: fabricTypeCounts.get(value) ?? 0 })),
      colors: colorLookup.map((color) => ({ ...color, count: colorCounts.get(color.name) ?? 0 })),
      priceBounds
    };
  },

  async suggestions(term: string, limit = 6) {
    if (!term.trim()) return [];
    const rows = await ProductModel.searchSuggestions(term, limit);
    return rows.map((row) => ({
      id: row.id,
      name: row.name,
      slug: row.slug,
      image: row.image,
      price: parseFloat(row.price),
      category: row.category
    }));
  }
};
