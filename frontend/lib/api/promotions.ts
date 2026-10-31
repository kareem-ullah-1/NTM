import { apiRequest } from "./client";

export type PromotionTargetType = "ALL_PRODUCTS" | "CATEGORIES" | "FABRIC_TYPES" | "PRODUCTS";

export type ApiPromotion = {
  id: string;
  name: string;
  description: string;
  discountType: "percentage" | "fixed";
  discountValue: number;
  minOrderAmount: number;
  maxDiscountAmount: number | null;
  startsAt: string;
  expiresAt: string;
  usageLimit: number | null;
  perUserLimit: number | null;
  usageCount: number;
  isActive: boolean;
  targetType: PromotionTargetType;
  videoUrl: string | null;
  videoPosterUrl: string | null;
  appliesTo?: string;
  createdAt: string;
  productIds?: string[];
  categories?: string[];
  fabricTypes?: string[];
  products?: { id: string; name: string; sku: string; price: number; image: string | null }[];
  displayProducts?: {
    id: string; name: string; slug?: string; sku: string; price: number; image?: string | null;
    images?: string[]; category?: string; fabricType?: string;
    colors?: { name: string; hex: string }[];
    originalPrice?: number | null; stock?: number; isNew?: boolean;
  }[];
  analytics?: {
    totalOrders: number;
    totalDiscount: number;
    totalRevenue: number;
    uniqueUsers: number;
  };
};

export type ApiPromotionWithStatus = ApiPromotion & {
  isActive: boolean;
  isScheduled: boolean;
  isExpired: boolean;
};

export type PromotionInput = {
  name: string;
  description?: string;
  discountType: "percentage" | "fixed";
  discountValue: number;
  minOrderAmount?: number;
  maxDiscountAmount?: number | null;
  startsAt: string;
  expiresAt: string;
  usageLimit?: number | null;
  perUserLimit?: number | null;
  isActive?: boolean;
  targetType: PromotionTargetType;
  productIds?: string[];
  categories?: string[];
  fabricTypes?: string[];
  videoUrl?: string | null;
  videoPosterUrl?: string | null;
  displayProductIds?: string[];
};

export async function fetchActivePromotions() {
  return apiRequest<ApiPromotion[]>("/promotions/active");
}

export async function fetchPromotions() {
  return apiRequest<ApiPromotion[]>("/promotions", { auth: true });
}

export async function createPromotion(input: PromotionInput) {
  return apiRequest<ApiPromotion>("/promotions", { method: "POST", body: input, auth: true });
}

export async function updatePromotion(id: string, input: Partial<PromotionInput>) {
  return apiRequest<ApiPromotion>(`/promotions/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: input,
    auth: true
  });
}

export async function setPromotionActive(id: string, isActive: boolean) {
  return apiRequest<ApiPromotion>(`/promotions/${encodeURIComponent(id)}/status`, {
    method: "PATCH",
    body: { isActive },
    auth: true
  });
}

export async function deletePromotion(id: string) {
  return apiRequest<null>(`/promotions/${encodeURIComponent(id)}`, { method: "DELETE", auth: true });
}

export async function getPromotion(id: string) {
  return apiRequest<ApiPromotion>(`/promotions/${encodeURIComponent(id)}`, { auth: true });
}

export async function getPromotionForProduct(productId: string) {
  return apiRequest<ApiPromotionWithStatus | null>(`/promotions/product/${encodeURIComponent(productId)}`);
}
