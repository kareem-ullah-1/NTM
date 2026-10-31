import { apiRequest } from "./client";
import type { DashboardStats } from "./types";

export async function fetchDashboardStats() {
  return apiRequest<DashboardStats>("/admin/dashboard/stats", { auth: true });
}

export type DashboardPeriod = "7d" | "30d" | "60d" | "90d" | "6m" | "12m" | "all";

export type SalesSeriesPoint = {
  bucket: string;
  total: number;
  orderCount: number;
};

export type SalesSeriesResponse = {
  period: DashboardPeriod;
  points: SalesSeriesPoint[];
};

export async function fetchSalesSeries(period: DashboardPeriod) {
  return apiRequest<SalesSeriesResponse>("/admin/dashboard/sales-series", {
    auth: true,
    query: { period }
  });
}

export type BestSellingProduct = {
  productId: string | null;
  name: string;
  imageUrl: string | null;
  unitsSold: number;
  revenue: number;
  orderCount: number;
};

export async function fetchBestSellingProducts(limit = 10, sinceDays?: number) {
  return apiRequest<BestSellingProduct[]>("/admin/dashboard/best-sellers", {
    auth: true,
    query: { limit, sinceDays }
  });
}

export type CouponPerformance = {
  id: string;
  code: string;
  discountType: "percentage" | "fixed";
  discountValue: number;
  isActive: boolean;
  redemptionCount: number;
  totalDiscountGiven: number;
  revenueFromOrders: number;
  revenuePerDiscountRupee: number | null;
};

export async function fetchCouponPerformance(limit = 20) {
  return apiRequest<CouponPerformance[]>("/admin/dashboard/coupon-performance", { auth: true, query: { limit } });
}
