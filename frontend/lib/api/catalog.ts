import { apiRequest } from "./client";
import type { ApiCategory, ApiFabricType, ApiHomeFeaturedCategory } from "./types";

export async function fetchCategories() {
  return apiRequest<ApiCategory[]>("/admin/categories", { auth: true });
}

export async function createCategory(name: string) {
  return apiRequest<ApiCategory>("/admin/categories", {
    method: "POST",
    body: { name },
    auth: true
  });
}

export async function updateCategory(id: string, name: string) {
  return apiRequest<ApiCategory>(`/admin/categories/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: { name },
    auth: true
  });
}

export async function deleteCategory(id: string) {
  return apiRequest<null>(`/admin/categories/${encodeURIComponent(id)}`, {
    method: "DELETE",
    auth: true
  });
}

export async function fetchFabricTypes() {
  return apiRequest<ApiFabricType[]>("/admin/fabric-types", { auth: true });
}

export async function createFabricType(name: string) {
  return apiRequest<ApiFabricType>("/admin/fabric-types", {
    method: "POST",
    body: { name },
    auth: true
  });
}

export async function updateFabricType(id: string, name: string) {
  return apiRequest<ApiFabricType>(`/admin/fabric-types/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: { name },
    auth: true
  });
}

export async function deleteFabricType(id: string) {
  return apiRequest<null>(`/admin/fabric-types/${encodeURIComponent(id)}`, {
    method: "DELETE",
    auth: true
  });
}

export async function fetchHomeFeaturedCategories() {
  return apiRequest<ApiHomeFeaturedCategory[]>("/admin/home-featured", { auth: true });
}

export async function createHomeFeaturedCategory(data: {
  categoryId: string;
  imageUrl?: string | null;
  isActive?: boolean;
}) {
  return apiRequest<ApiHomeFeaturedCategory>("/admin/home-featured", {
    method: "POST",
    body: data,
    auth: true
  });
}

export async function updateHomeFeaturedCategory(
  id: string,
  data: {
    imageUrl?: string | null;
    isActive?: boolean;
  }
) {
  return apiRequest<ApiHomeFeaturedCategory>(`/admin/home-featured/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: data,
    auth: true
  });
}

export async function deleteHomeFeaturedCategory(id: string) {
  return apiRequest<null>(`/admin/home-featured/${encodeURIComponent(id)}`, {
    method: "DELETE",
    auth: true
  });
}
