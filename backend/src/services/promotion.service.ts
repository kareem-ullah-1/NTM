import { PoolClient } from "pg";
import { PromotionModel, type PromotionRecord } from "../models/promotion.model";
import { ProductModel } from "../models/product.model";
import { CategoryModel, FabricTypeModel } from "../models/catalog.model";
import { ApiError } from "../utils/ApiError";
import {
  isProductEligibleForPromotion,
  describeTargeting,
  type EligibilityProduct,
  type PromotionTargeting
} from "./promotion-eligibility";
import type { PromotionCreateInput, PromotionUpdateInput } from "../validators/promotion.validator";

function serializePromotion(promo: PromotionRecord) {
  return {
    id: promo.id,
    name: promo.name,
    description: promo.description,
    discountType: promo.discount_type,
    discountValue: parseFloat(promo.discount_value),
    minOrderAmount: parseFloat(promo.min_order_amount),
    maxDiscountAmount: promo.max_discount_amount ? parseFloat(promo.max_discount_amount) : null,
    startsAt: promo.starts_at,
    expiresAt: promo.expires_at,
    usageLimit: promo.usage_limit,
    perUserLimit: promo.per_user_limit,
    usageCount: promo.usage_count,
    isActive: promo.is_active,
    targetType: promo.target_type,
    videoUrl: promo.video_url,
    videoPosterUrl: promo.video_poster_url,
    createdAt: promo.created_at
  };
}

function computeDiscount(promo: PromotionRecord, baseAmount: number): number {
  let discount =
    promo.discount_type === "percentage"
      ? baseAmount * (parseFloat(promo.discount_value) / 100)
      : parseFloat(promo.discount_value);

  if (promo.max_discount_amount) {
    discount = Math.min(discount, parseFloat(promo.max_discount_amount));
  }
  discount = Math.min(discount, baseAmount);
  return Math.round(Math.max(0, discount) * 100) / 100;
}

function assertActive(promo: PromotionRecord) {
  if (!promo.is_active) {
    throw ApiError.badRequest("This promotion is not active");
  }
  const now = new Date();
  if (now < new Date(promo.starts_at)) {
    throw ApiError.badRequest("This promotion has not started yet");
  }
  if (now > new Date(promo.expires_at)) {
    throw ApiError.badRequest("This promotion has expired");
  }
  if (promo.usage_limit !== null && promo.usage_count >= promo.usage_limit) {
    throw ApiError.badRequest("This promotion has reached its usage limit");
  }
}

function targetingOf(promo: PromotionRecord & { targeting: PromotionTargeting }): PromotionTargeting {
  return promo.targeting;
}

export interface OrderCandidateItem {
  productId: string;
  category: string;
  fabricType: string;
  basePrice: number;
  quantity: number;
}

export interface OrderPromotionResult {
  promoId: string | null;
  promoName: string | null;
  perItemUnitDiscount: number[];
  totalDiscount: number;
}

async function assertTargetsExist(input: {
  productIds?: string[];
  categories?: string[];
  fabricTypes?: string[];
}): Promise<void> {
  if (input.productIds && input.productIds.length > 0) {
    const found = await ProductModel.findByIds(input.productIds);
    const foundIds = new Set(found.map((p) => p.id));
    const missing = input.productIds.filter((id) => !foundIds.has(id));
    if (missing.length > 0) {
      throw ApiError.badRequest(`Unknown product id(s): ${missing.join(", ")}`);
    }
  }
  if (input.categories && input.categories.length > 0) {
    const found = await CategoryModel.findManyByName(input.categories);
    const foundNames = new Set(found.map((c) => c.name));
    const missing = input.categories.filter((c) => !foundNames.has(c));
    if (missing.length > 0) {
      throw ApiError.badRequest(`Unknown category name(s): ${missing.join(", ")}`);
    }
  }
  if (input.fabricTypes && input.fabricTypes.length > 0) {
    const found = await FabricTypeModel.findManyByName(input.fabricTypes);
    const foundNames = new Set(found.map((f) => f.name));
    const missing = input.fabricTypes.filter((f) => !foundNames.has(f));
    if (missing.length > 0) {
      throw ApiError.badRequest(`Unknown fabric type name(s): ${missing.join(", ")}`);
    }
  }
}

export const PromotionService = {
  async list() {
    const promos = await PromotionModel.findMany();
    const withTargeting = await Promise.all(
      promos.map(async (promo) => ({
        ...serializePromotion(promo),
        appliesTo: describeTargeting(await PromotionModel.getTargeting(promo.id))
      }))
    );
    return withTargeting;
  },

  async create(input: PromotionCreateInput) {
    await assertTargetsExist({
      productIds: input.productIds,
      categories: input.categories,
      fabricTypes: input.fabricTypes
    });

    const promo = await PromotionModel.create({
      name: input.name,
      description: input.description,
      discountType: input.discountType,
      discountValue: input.discountValue,
      minOrderAmount: input.minOrderAmount,
      maxDiscountAmount: input.maxDiscountAmount,
      startsAt: input.startsAt,
      expiresAt: input.expiresAt,
      usageLimit: input.usageLimit,
      perUserLimit: input.perUserLimit,
      isActive: input.isActive,
      targetType: input.targetType,
      productIds: input.productIds,
      categories: input.categories,
      fabricTypes: input.fabricTypes,
      videoUrl: input.videoUrl,
      videoPosterUrl: input.videoPosterUrl,
      displayProductIds: input.displayProductIds
    });
    return serializePromotion(promo);
  },

  async update(id: string, input: PromotionUpdateInput) {
    await assertTargetsExist({
      productIds: input.productIds,
      categories: input.categories,
      fabricTypes: input.fabricTypes
    });

    const promo = await PromotionModel.update(id, {
      name: input.name,
      description: input.description,
      discountType: input.discountType,
      discountValue: input.discountValue,
      minOrderAmount: input.minOrderAmount,
      maxDiscountAmount: input.maxDiscountAmount,
      startsAt: input.startsAt,
      expiresAt: input.expiresAt,
      usageLimit: input.usageLimit,
      perUserLimit: input.perUserLimit,
      isActive: input.isActive,
      targetType: input.targetType,
      videoUrl: input.videoUrl,
      videoPosterUrl: input.videoPosterUrl
    });
    if (!promo) throw ApiError.notFound("Promotion not found");

    if (input.targetType !== undefined) {
      await PromotionModel.replaceTargeting(id, input.targetType, {
        productIds: input.productIds,
        categories: input.categories,
        fabricTypes: input.fabricTypes
      });
    } else {
      if (input.productIds !== undefined) await PromotionModel.setProductIds(id, input.productIds);
      if (input.categories !== undefined) await PromotionModel.setCategories(id, input.categories);
      if (input.fabricTypes !== undefined) await PromotionModel.setFabricTypes(id, input.fabricTypes);
    }

    if (input.displayProductIds !== undefined) {
      await PromotionModel.setDisplayProducts(id, input.displayProductIds);
    }

    return serializePromotion(promo);
  },

  async setActive(id: string, isActive: boolean) {
    const promo = await PromotionModel.setActive(id, isActive);
    if (!promo) throw ApiError.notFound("Promotion not found");
    return serializePromotion(promo);
  },

  async remove(id: string) {
    const removed = await PromotionModel.remove(id);
    if (!removed) throw ApiError.notFound("Promotion not found");
  },

  async getById(id: string) {
    const promo = await PromotionModel.findById(id);
    if (!promo) throw ApiError.notFound("Promotion not found");
    const targeting = await PromotionModel.getTargeting(id);

    let products: Array<{ id: string; name: string; sku: string; price: number; image: string | null }> = [];
    if (targeting.productIds.length > 0) {
      const rows = await ProductModel.findByIds(targeting.productIds);
      products = rows.map((row) => ({
        id: row.id,
        name: row.name,
        sku: row.sku,
        price: parseFloat(row.price),
        image: row.images?.[0] ?? null
      }));
    }

    const displayProductRows = await PromotionModel.getDisplayProducts(id);
    let displayProducts: Array<{ id: string; name: string; sku: string; price: number; image: string | null; displayOrder: number }> = [];
    if (displayProductRows.length > 0) {
      const displayIds = displayProductRows.map((r) => r.product_id);
      const displayProductRecords = await ProductModel.findByIds(displayIds);
      const productMap = new Map(displayProductRecords.map((r) => [r.id, r]));
      displayProducts = displayProductRows.map((row) => {
        const product = productMap.get(row.product_id);
        return {
          id: row.product_id,
          name: product?.name ?? "",
          sku: product?.sku ?? "",
          price: product ? parseFloat(product.price) : 0,
          image: product?.images?.[0] ?? null,
          displayOrder: row.display_order
        };
      });
    }

    const analytics = await PromotionModel.getAnalytics(id);
    return {
      ...serializePromotion(promo),
      productIds: targeting.productIds,
      categories: targeting.categories,
      fabricTypes: targeting.fabricTypes,
      products,
      displayProducts,
      appliesTo: describeTargeting(targeting),
      analytics
    };
  },

  async computeDiscountForOrder(
    items: OrderCandidateItem[],
    userId: string | null,
    client?: PoolClient
  ): Promise<OrderPromotionResult> {
    const now = new Date();
    const activePromos = await PromotionModel.findActiveWithTargeting(now);

    const pickBest = (excludedPromoIds: Set<string>) => {
      let best: { promo: PromotionRecord; eligibleIndexes: number[]; discount: number } | null = null;

      for (const promo of activePromos) {
        if (excludedPromoIds.has(promo.id)) continue;
        if (promo.usage_limit !== null && promo.usage_count >= promo.usage_limit) continue;

        const targeting = targetingOf(promo);
        const eligibleIndexes: number[] = [];
        let eligibleSubtotal = 0;
        items.forEach((item, index) => {
          const eligibilityProduct: EligibilityProduct = {
            id: item.productId,
            category: item.category,
            fabricType: item.fabricType
          };
          if (isProductEligibleForPromotion(eligibilityProduct, targeting)) {
            eligibleIndexes.push(index);
            eligibleSubtotal += item.basePrice * item.quantity;
          }
        });

        if (eligibleIndexes.length === 0) continue;
        if (eligibleSubtotal < parseFloat(promo.min_order_amount)) continue;

        const discount = computeDiscount(promo, eligibleSubtotal);
        if (discount <= 0) continue;

        if (!best || discount > best.discount) {
          best = { promo, eligibleIndexes, discount };
        }
      }

      return best;
    };

    const excludedPromoIds = new Set<string>();
    let best: { promo: PromotionRecord; eligibleIndexes: number[]; discount: number } | null = null;

    for (let attempt = 0; attempt <= activePromos.length; attempt++) {
      const candidate = pickBest(excludedPromoIds);
      if (!candidate) break;

      if (candidate.promo.per_user_limit !== null && userId) {
        const preCount = await PromotionModel.countRedemptionsByUser(candidate.promo.id, userId, client);
        if (preCount >= candidate.promo.per_user_limit) {
          excludedPromoIds.add(candidate.promo.id);
          continue;
        }

        if (client) {
          await PromotionModel.lockUserPromotion(client, candidate.promo.id, userId);
          const authoritativeCount = await PromotionModel.countRedemptionsByUser(candidate.promo.id, userId, client);
          if (authoritativeCount >= candidate.promo.per_user_limit) {
            excludedPromoIds.add(candidate.promo.id);
            continue;
          }
        }
      }

      best = candidate;
      break;
    }

    if (!best) {
      return { promoId: null, promoName: null, perItemUnitDiscount: items.map(() => 0), totalDiscount: 0 };
    }

    const eligibleSubtotal = best.eligibleIndexes.reduce(
      (sum, index) => sum + items[index].basePrice * items[index].quantity,
      0
    );
    const perItemUnitDiscount = items.map(() => 0);
    let allocated = 0;
    best.eligibleIndexes.forEach((index, position) => {
      const item = items[index];
      const isLast = position === best!.eligibleIndexes.length - 1;
      const itemLineTotal = item.basePrice * item.quantity;
      const shareOfTotal = eligibleSubtotal > 0 ? itemLineTotal / eligibleSubtotal : 0;
      const lineDiscount = isLast
        ? Math.max(0, Math.round((best!.discount - allocated) * 100) / 100)
        : Math.round(best!.discount * shareOfTotal * 100) / 100;
      allocated += lineDiscount;
      perItemUnitDiscount[index] = item.quantity > 0 ? Math.round((lineDiscount / item.quantity) * 100) / 100 : 0;
    });

    return {
      promoId: best.promo.id,
      promoName: best.promo.name,
      perItemUnitDiscount,
      totalDiscount: best.discount
    };
  },

  async reserveAndRecordUsage(
    client: PoolClient,
    promoId: string,
    userId: string | null,
    orderId: string,
    discountAmount: number
  ): Promise<boolean> {
    const reserved = await PromotionModel.tryReserveUsage(client, promoId);
    if (!reserved) return false;
    await PromotionModel.recordUsageRow(client, promoId, userId, orderId, discountAmount);
    return true;
  },

  async preview(productId: string, subtotal: number, userId: string | null) {
    const now = new Date();
    const activePromos = await PromotionModel.findActiveWithTargeting(now);
    const product = await ProductModel.findById(productId);
    if (!product) return null;

    const eligibilityProduct: EligibilityProduct = {
      id: product.id,
      category: product.category,
      fabricType: product.fabric_type
    };

    const eligible = activePromos.filter((promo) =>
      isProductEligibleForPromotion(eligibilityProduct, targetingOf(promo))
    );
    if (eligible.length === 0) return null;

    let promo: PromotionRecord | null = null;
    let bestDiscount = -1;
    for (const candidate of eligible) {
      const discount = computeDiscount(candidate, subtotal);
      if (discount > bestDiscount) {
        bestDiscount = discount;
        promo = candidate;
      }
    }
    if (!promo) return null;

    assertActive(promo);

    if (promo.min_order_amount && subtotal < parseFloat(promo.min_order_amount)) {
      return null;
    }

    if (promo.per_user_limit !== null && userId) {
      const used = await PromotionModel.countRedemptionsByUser(promo.id, userId);
      if (used >= promo.per_user_limit) return null;
    }

    return {
      id: promo.id,
      name: promo.name,
      description: promo.description,
      discountType: promo.discount_type,
      discountValue: parseFloat(promo.discount_value),
      discountAmount: computeDiscount(promo, subtotal),
      startsAt: promo.starts_at,
      expiresAt: promo.expires_at
    };
  },

  async getActivePromotions() {
    const promos = await PromotionModel.findActive();
    const serialized = await Promise.all(promos.map(async (promo) => {
      const base = serializePromotion(promo);
      const displayProductDetails = await PromotionModel.getDisplayProductsWithDetails(promo.id);
      const displayProducts = displayProductDetails.map((p) => ({
        id: p.id,
        name: p.name,
        slug: p.slug,
        sku: p.sku,
        price: p.price,
        images: p.images,
        category: p.category,
        fabricType: p.fabricType,
        colors: p.colors,
        originalPrice: p.originalPrice,
        stock: p.stock,
        isNew: p.isNew
      }));
      return { ...base, displayProducts };
    }));
    return serialized;
  },

  async getUpcomingPromotions() {
    const promos = await PromotionModel.findScheduled();
    return promos.map(serializePromotion);
  },

  async getForProduct(productId: string) {
    const product = await ProductModel.findById(productId);
    if (!product) return null;

    const now = new Date();
    const activePromos = await PromotionModel.findActiveWithTargeting(now);
    const eligibilityProduct: EligibilityProduct = { id: product.id, category: product.category, fabricType: product.fabric_type };
    const eligible = activePromos.filter((promo) => isProductEligibleForPromotion(eligibilityProduct, targetingOf(promo)));
    if (eligible.length === 0) return null;

    const promo = eligible.reduce((best, candidate) =>
      parseFloat(candidate.discount_value) > parseFloat(best.discount_value) ? candidate : best
    );

    const isActive = promo.is_active && now >= new Date(promo.starts_at) && now <= new Date(promo.expires_at);
    const isScheduled = promo.is_active && now < new Date(promo.starts_at);
    return {
      ...serializePromotion(promo),
      isActive,
      isScheduled,
      isExpired: now > new Date(promo.expires_at)
    };
  },

  async getForProducts(productIds: string[]) {
    if (productIds.length === 0) return new Map<string, ReturnType<typeof serializePromotion>>();
    const products = await ProductModel.findByIds(productIds);
    const now = new Date();
    const activePromos = await PromotionModel.findActiveWithTargeting(now);

    const map = new Map<string, ReturnType<typeof serializePromotion>>();
    for (const product of products) {
      const eligibilityProduct: EligibilityProduct = { id: product.id, category: product.category, fabricType: product.fabric_type };
      const eligible = activePromos.filter((promo) => isProductEligibleForPromotion(eligibilityProduct, targetingOf(promo)));
      if (eligible.length === 0) continue;
      const promo = eligible.reduce((best, candidate) =>
        parseFloat(candidate.discount_value) > parseFloat(best.discount_value) ? candidate : best
      );
      map.set(product.id, serializePromotion(promo));
    }
    return map;
  }
};
