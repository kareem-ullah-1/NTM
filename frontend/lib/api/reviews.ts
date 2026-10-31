import { apiRequest, apiRequestWithMeta } from "./client";
import type { ApiAdminReview, ApiReview, ApiReviewStats, ReviewStatus } from "./types";

export async function fetchProductReviews(slug: string, page = 1, limit = 10) {
  return apiRequestWithMeta<ApiReview[]>(`/products/${encodeURIComponent(slug)}/reviews`, {
    query: { page, limit }
  });
}

export async function fetchMyReview(slug: string) {
  return apiRequest<ApiReview | null>(`/products/${encodeURIComponent(slug)}/reviews/mine`, { auth: true });
}

export async function submitProductReview(
  slug: string,
  input: { rating: number; comment: string; images: string[]; name?: string; email?: string }
) {
  return apiRequest<ApiReview>(`/products/${encodeURIComponent(slug)}/reviews`, {
    method: "POST",
    body: input,
    auth: true
  });
}

export async function deleteMyReview(slug: string, reviewId: string) {
  return apiRequest<{ deleted: boolean }>(
    `/products/${encodeURIComponent(slug)}/reviews/${encodeURIComponent(reviewId)}`,
    { method: "DELETE", auth: true }
  );
}

export async function fetchAdminReviews(
  page = 1,
  limit = 20,
  filters?: { status?: ReviewStatus; rating?: number; search?: string }
) {
  const query: Record<string, string | number> = { page, limit };
  if (filters?.status) query.status = filters.status;
  if (filters?.rating) query.rating = filters.rating;
  if (filters?.search) query.search = filters.search;

  return apiRequestWithMeta<ApiAdminReview[]>("/admin/reviews", { query, auth: true });
}

export async function fetchReviewStats() {
  return apiRequest<ApiReviewStats>("/admin/reviews/stats", { auth: true });
}

export async function updateReviewStatus(reviewId: string, status: ReviewStatus) {
  return apiRequest<ApiAdminReview>(`/admin/reviews/${encodeURIComponent(reviewId)}/status`, {
    method: "PATCH",
    body: { status },
    auth: true
  });
}

export async function deleteReviewAsAdmin(reviewId: string) {
  return apiRequest<{ deleted: boolean }>(`/admin/reviews/${encodeURIComponent(reviewId)}`, {
    method: "DELETE",
    auth: true
  });
}
