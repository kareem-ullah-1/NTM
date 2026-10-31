import { apiRequest } from "./client";
import type { ApiInventoryMovement, ApiProduct } from "./types";

export type InventoryPayload = {
  productName: string;
  category: string;
  fabricType: string;
  colors: {
    name: string;
    hex: string;
    image?: string | null;
    images?: string[];
    stock?: number;
  }[];
  price: number;
  originalPrice?: number | null;
  stock: number;
  lowStockThreshold?: number;
  images?: string[];
  description?: string;
  availableLengths?: string[];
  featured?: boolean;
  isNew?: boolean;
  collections?: { collectionId: string; collectionOptionId?: string | null }[];
};

export type InventoryUpdatePayload = Omit<InventoryPayload, "stock">;

export async function fetchInventory() {
  return apiRequest<ApiProduct[]>("/admin/inventory", { auth: true });
}

export async function createInventoryItem(payload: InventoryPayload) {
  return apiRequest<ApiProduct>("/admin/inventory", { method: "POST", body: payload, auth: true });
}

export async function updateInventoryItem(sku: string, payload: InventoryUpdatePayload) {
  return apiRequest<ApiProduct>(`/admin/inventory/${encodeURIComponent(sku)}`, {
    method: "PUT",
    body: payload,
    auth: true
  });
}

export async function deleteInventoryItem(sku: string) {
  return apiRequest<null>(`/admin/inventory/${encodeURIComponent(sku)}`, { method: "DELETE", auth: true });
}

export async function adjustInventoryStock(
  sku: string,
  payload: {
    quantityChange: number;
    reason: string;
    movementType?: "manual_adjustment" | "restock";
    color?: string;
  }
) {
  return apiRequest<ApiProduct>(`/admin/inventory/${encodeURIComponent(sku)}/adjust`, {
    method: "POST",
    body: payload,
    auth: true
  });
}

export async function fetchInventoryMovements(params: { sku?: string; page?: number; limit?: number }) {
  return apiRequest<ApiInventoryMovement[]>("/admin/inventory/movements", {
    auth: true,
    query: { sku: params.sku, page: params.page, limit: params.limit }
  });
}
