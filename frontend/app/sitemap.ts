import type { MetadataRoute } from "next";
import { siteConfig } from "@/lib/site-config";
import { fetchProducts, fetchFilterOptions } from "@/lib/api/products";

const STATIC_ROUTES = ["", "/shop", "/about", "/contact", "/help"];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticEntries: MetadataRoute.Sitemap = STATIC_ROUTES.map((path) => ({
    url: `${siteConfig.siteUrl}${path}`,
    lastModified: new Date(),
    changeFrequency: path === "" ? "daily" : "weekly",
    priority: path === "" ? 1 : 0.7
  }));

  let categoryEntries: MetadataRoute.Sitemap = [];
  try {
    const { categories } = await fetchFilterOptions();
    categoryEntries = categories.map((c) => ({
      url: `${siteConfig.siteUrl}/shop?category=${encodeURIComponent(c.value)}`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.6
    }));
  } catch {
    categoryEntries = [];
  }

  let productEntries: MetadataRoute.Sitemap = [];
  try {
    const pageSize = 200;
    let page = 1;
    let total = Infinity;
    const collected: MetadataRoute.Sitemap = [];

    while (collected.length < total && page <= 25) {
      const { data, meta } = await fetchProducts({ page, limit: pageSize });
      total = typeof meta?.total === "number" ? meta.total : data.length;

      collected.push(
        ...data.map((product) => ({
          url: `${siteConfig.siteUrl}/shop/${product.slug}`,
          lastModified: new Date(product.lastUpdated),
          changeFrequency: "weekly" as const,
          priority: 0.8
        }))
      );

      if (data.length === 0) break;
      page += 1;
    }

    productEntries = collected;
  } catch {
    productEntries = [];
  }

  return [...staticEntries, ...categoryEntries, ...productEntries];
}
