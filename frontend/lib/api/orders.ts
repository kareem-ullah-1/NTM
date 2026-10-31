import { apiRequest, apiRequestWithMeta } from "./client";
import type { ApiOrder } from "./types";

export type CreateOrderPayload = {
  fullName: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  region?: string;
  postalCode: string;
  deliveryNotes?: string;
  paymentMethod: "Cash on Delivery";
  couponCode?: string;
  items: {
    productId: string;
    name: string;
    color?: string;
    length?: string;
    quantity: number;
    unitPrice: number;
  }[];
};

export async function placeOrder(payload: CreateOrderPayload) {
  return apiRequest<ApiOrder>("/orders", { method: "POST", body: payload, auth: true });
}

export async function fetchOrders(params: { status?: string; search?: string; page?: number; limit?: number } = {}) {
  return apiRequestWithMeta<ApiOrder[]>("/orders", { query: params as Record<string, never>, auth: true });
}

export async function fetchOrder(id: string) {
  return apiRequest<ApiOrder>(`/orders/${encodeURIComponent(id)}`, { auth: true });
}

export async function updateOrderStatus(id: string, status: ApiOrder["status"], options?: { reason?: string }) {
  return apiRequest<ApiOrder>(`/orders/${encodeURIComponent(id)}/status`, {
    method: "PATCH",
    body: { status, ...options },
    auth: true
  });
}
