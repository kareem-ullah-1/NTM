import { apiRequest } from "./client";
import type { ApiCollection, ApiCollectionOption } from "./types";

export async function fetchEnabledCollections() {
  return apiRequest<ApiCollection[]>("/collections/public");
}

export async function fetchCollections() {
  return apiRequest<ApiCollection[]>("/admin/collections", { auth: true });
}

export async function createCollection(data: {
  name: string;
  slug?: string;
  description?: string;
  imageUrl?: string | null;
  displayOrder?: number;
  isEnabled?: boolean;
}) {
  return apiRequest<ApiCollection>("/admin/collections", {
    method: "POST",
    body: data,
    auth: true
  });
}

export async function updateCollection(id: string, data: {
  name?: string;
  slug?: string;
  description?: string;
  imageUrl?: string | null;
  displayOrder?: number;
  isEnabled?: boolean;
}) {
  return apiRequest<ApiCollection>(`/admin/collections/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: data,
    auth: true
  });
}

export async function deleteCollection(id: string) {
  return apiRequest<null>(`/admin/collections/${encodeURIComponent(id)}`, {
    method: "DELETE",
    auth: true
  });
}

export async function createCollectionOption(collectionId: string, data: {
  name: string;
  slug?: string;
  isActive?: boolean;
}) {
  return apiRequest<ApiCollectionOption>(`/admin/collections/${encodeURIComponent(collectionId)}/options`, {
    method: "POST",
    body: { collectionId, ...data },
    auth: true
  });
}

export async function updateCollectionOption(collectionId: string, optionId: string, data: {
  name?: string;
  slug?: string;
  isActive?: boolean;
}) {
  return apiRequest<ApiCollectionOption>(`/admin/collections/${encodeURIComponent(collectionId)}/options/${encodeURIComponent(optionId)}`, {
    method: "PATCH",
    body: data,
    auth: true
  });
}

export async function deleteCollectionOption(collectionId: string, optionId: string) {
  return apiRequest<null>(`/admin/collections/${encodeURIComponent(collectionId)}/options/${encodeURIComponent(optionId)}`, {
    method: "DELETE",
    auth: true
  });
}
