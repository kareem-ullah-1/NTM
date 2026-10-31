
import nextDynamic from "next/dynamic";

import { dehydrate, HydrationBoundary } from "@tanstack/react-query";

import { Hero } from "@/components/home/Hero";
import { CategoryCards } from "@/components/home/CategoryCards";
import { FeaturedProducts } from "@/components/home/FeaturedProducts";
import { PromoSection } from "@/components/home/PromoSection";

import { getQueryClient } from "@/lib/get-query-client";
import { queryKeys } from "@/lib/api/query-keys";
import { fetchFeaturedProducts } from "@/lib/api/products";
import { fetchHomeFeaturedCategories } from "@/lib/api/store";
import { fetchActivePromotions } from "@/lib/api/promotions";
import { fetchPublicDrops } from "@/lib/api/product-drops";

const DropSection = nextDynamic(
  () => import("@/components/home/DropSection").then((m) => m.DropSection),
  { ssr: true }
);

const Newsletter = nextDynamic(
  () => import("@/components/home/Newsletter").then((m) => m.Newsletter),
  { ssr: true }
);


export const metadata = {
  keywords: [
    "unstitched fabric Pakistan",
    "men's fabric online",
    "wash and wear fabric",
    "cotton fabric for men",
    "boski fabric",
    "latha fabric",
    "premium fabric Faisalabad",
    "buy fabric online Pakistan"
  ]
};

export const dynamic = "force-dynamic";

export default async function HomePage() {
 
  const queryClient = getQueryClient();

 
  await Promise.allSettled([
    queryClient.prefetchQuery({
      queryKey: queryKeys.products.featured(8),
      queryFn: () => fetchFeaturedProducts(8),
    }),

    queryClient.prefetchQuery({
      queryKey: queryKeys.store.homeFeatured,
      queryFn: fetchHomeFeaturedCategories,
    }),

    queryClient.prefetchQuery({
      queryKey: queryKeys.promotions.active,
      queryFn: fetchActivePromotions,
    }),

    queryClient.prefetchQuery({
      queryKey: queryKeys.productDrops.public,
      queryFn: fetchPublicDrops,
    }),
  ]);

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <Hero />
      <CategoryCards />
      <FeaturedProducts />
      <PromoSection />
      <DropSection />
      <Newsletter />
    </HydrationBoundary>
  );
}

