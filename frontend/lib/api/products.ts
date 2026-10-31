import { apiRequest, apiRequestWithMeta } from "./client";
import type { ApiProduct } from "./types";

export type ProductListParams = {
  search?: string;
  category?: string[];
  color?: string[];
  fabricType?: string[];
  collection?: string;
  option?: string;
  priceMin?: number;
  priceMax?: number;
  inStockOnly?: boolean;
  featuredOnly?: boolean;
  promotion?: string;
  ids?: string[];
  sort?: "Featured" | "Newest" | "Price low to high" | "Price high to low";
  page?: number;
  limit?: number;
};

export async function fetchProducts(params: ProductListParams = {}, signal?: AbortSignal) {
  return apiRequestWithMeta<ApiProduct[]>("/products", { query: params as Record<string, never>, signal });
}

export async function fetchProductBySlug(slug: string) {
  return apiRequest<ApiProduct>(`/products/${encodeURIComponent(slug)}`);
}

export async function fetchRelatedProducts(slug: string, limit = 4) {
  return apiRequest<ApiProduct[]>(`/products/${encodeURIComponent(slug)}/related`, { query: { limit } });
}

export async function fetchFeaturedProducts(limit = 8, signal?: AbortSignal) {
  return apiRequest<ApiProduct[]>("/products/featured", { query: { limit }, signal });
}

export async function fetchFilterOptions(params: ProductListParams = {}) {
  return apiRequest<{
    categories: { value: string; count: number }[];
    fabricTypes: { value: string; count: number }[];
    colors: { name: string; hex: string; count: number }[];
    priceBounds: { min: number; max: number };
  }>("/products/filter-options", { query: params as Record<string, never> });
}

export type ProductSuggestion = {
  id: string;
  name: string;
  slug: string;
  image: string | null;
  price: number;
  category: string;
};

export async function fetchSearchSuggestions(term: string, limit = 6, signal?: AbortSignal) {
  return apiRequest<ProductSuggestion[]>("/products/suggestions", { query: { q: term, limit }, signal });
}
