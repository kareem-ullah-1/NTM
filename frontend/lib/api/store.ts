import { apiRequest } from "./client";
import type { ApiHomeFeaturedCategory } from "./types";

export async function fetchHomeFeaturedCategories() {
  return apiRequest<ApiHomeFeaturedCategory[]>("/store/home-featured-categories");
}
