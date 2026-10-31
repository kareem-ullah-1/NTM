import { apiRequest } from "./client";

export type CouponDiscountType = "percentage" | "fixed";

export type ApiCoupon = {
  id: string;
  code: string;
  description: string | null;
  discountType: CouponDiscountType;
  discountValue: number;
  minOrderAmount: number;
  maxDiscountAmount: number | null;
  usageLimit: number | null;
  perUserLimit: number | null;
  usageCount: number;
  isActive: boolean;
  startsAt: string | null;
  expiresAt: string | null;
  createdAt: string;
};

export type CouponPreview = { code: string; discountAmount: number; discountType: CouponDiscountType };

export async function validateCoupon(code: string, subtotal: number) {
  return apiRequest<CouponPreview>("/coupons/validate", { method: "POST", body: { code, subtotal }, auth: true });
}

export async function fetchCoupons() {
  return apiRequest<ApiCoupon[]>("/coupons", { auth: true });
}

export async function createCoupon(input: {
  code: string;
  description?: string;
  discountType: CouponDiscountType;
  discountValue: number;
  minOrderAmount?: number;
  maxDiscountAmount?: number;
  usageLimit?: number;
  perUserLimit?: number;
  isActive?: boolean;
  startsAt?: string;
  expiresAt?: string;
}) {
  return apiRequest<ApiCoupon>("/coupons", { method: "POST", body: input, auth: true });
}

export async function updateCoupon(id: string, input: Partial<Parameters<typeof createCoupon>[0]>) {
  return apiRequest<ApiCoupon>(`/coupons/${encodeURIComponent(id)}`, { method: "PATCH", body: input, auth: true });
}

export async function setCouponActive(id: string, isActive: boolean) {
  return apiRequest<ApiCoupon>(`/coupons/${encodeURIComponent(id)}/status`, {
    method: "PATCH",
    body: { isActive },
    auth: true
  });
}

export async function deleteCoupon(id: string) {
  return apiRequest<null>(`/coupons/${encodeURIComponent(id)}`, { method: "DELETE", auth: true });
}
