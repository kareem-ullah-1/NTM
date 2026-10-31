import { apiRequest, apiRequestWithMeta } from "./client";

export type ApiProductDrop = {
  id: string;
  productId: string;
  name: string;
  description: string;
  startsAt: string;
  endsAt: string;
  maxQuantity: number;
  perCustomerLimit: number;
  soldQuantity: number;
  remainingQuantity: number;
  specialPrice: number | null;
  promotionId: string | null;
  isActive: boolean;
  status: "draft" | "upcoming" | "live" | "sold_out" | "ended" | "disabled";
  createdAt: string;
  product?: {
    name: string;
    slug: string;
    price: number;
    images: string[];
    stock?: number;
    sku?: string;
  } | null;
  promotion?: {
    id?: string;
    name: string;
    discountType: string;
    discountValue: number;
  } | null;
  analytics?: {
    totalOrders: number;
    totalUnits: number;
    totalRevenue: number;
    remainingQuantity: number;
  };
  notificationCount?: number;
};

export type DropListParams = {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
};

export async function fetchPublicDrops() {
  return apiRequest<{ live: ApiProductDrop[]; upcoming: ApiProductDrop[] }>(
    "/product-drops/public"
  );
}

export async function fetchProductDrops(params: DropListParams = {}) {
  return apiRequestWithMeta<ApiProductDrop[]>("/product-drops", {
    query: {
      ...(params.search !== undefined && { search: params.search }),
      ...(params.status !== undefined && { status: params.status }),
      ...(params.page !== undefined && { page: params.page }),
      ...(params.limit !== undefined && { limit: params.limit }),
    } as Record<string, string | number | boolean | string[] | null | undefined>,
    auth: true
  });
}

export async function createProductDrop(input: {
  productId: string;
  name: string;
  description?: string;
  startsAt: string;
  endsAt: string;
  maxQuantity: number;
  perCustomerLimit?: number;
  specialPrice?: number | null;
  promotionId?: string | null;
  isActive?: boolean;
}) {
  return apiRequest<ApiProductDrop>("/product-drops", {
    method: "POST",
    body: input,
    auth: true
  });
}

export async function updateProductDrop(
  id: string,
  input: Partial<Parameters<typeof createProductDrop>[0]>
) {
  return apiRequest<ApiProductDrop>(
    `/product-drops/${encodeURIComponent(id)}`,
    {
      method: "PATCH",
      body: input,
      auth: true
    }
  );
}

export async function setProductDropActive(id: string, isActive: boolean) {
  return apiRequest<ApiProductDrop>(
    `/product-drops/${encodeURIComponent(id)}/status`,
    {
      method: "PATCH",
      body: { isActive },
      auth: true
    }
  );
}

export async function deleteProductDrop(id: string) {
  return apiRequest<null>(
    `/product-drops/${encodeURIComponent(id)}`,
    { method: "DELETE", auth: true }
  );
}

export async function getProductDrop(id: string) {
  return apiRequest<ApiProductDrop>(
    `/product-drops/${encodeURIComponent(id)}`,
    { auth: true }
  );
}

export async function subscribeToDropNotification(dropId: string, email: string) {
  return apiRequest<{
    subscribed: boolean;
    alreadySubscribed: boolean;
    message: string;
  }>(`/product-drops/${encodeURIComponent(dropId)}/subscribe`, {
    method: "POST",
    body: { email }
  });
}
