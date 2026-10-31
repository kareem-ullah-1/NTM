"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { fetchEnabledCollections } from "@/lib/api/collections";
import { useFilterStore } from "@/store/use-filter-store";

export function ShopHeading() {
  const { collectionSlug, optionSlug } = useFilterStore();

  const { data: collections = [] } = useQuery({
    queryKey: ["collections", "public"],
    queryFn: fetchEnabledCollections,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false
  });

  const activeCollection = collectionSlug
    ? collections.find((c) => c.slug === collectionSlug)
    : null;

  const activeOption = optionSlug && activeCollection?.options
    ? activeCollection.options.find((o) => o.slug === optionSlug)
    : null;

  const heading = activeOption
    ? `${activeCollection?.name} — ${activeOption.name}`
    : activeCollection?.name ?? "Shop Unstitched Fabrics";

  const description = activeOption
    ? `Browse ${activeOption.name} products in our ${activeCollection?.name} collection.`
    : activeCollection
      ? activeCollection.description || `Browse everything in our ${activeCollection.name} collection.`
      : "Browse our full range of wash & wear, cotton, blended, boski, latha, and summer fabrics, ready to tailor into your next shalwar kameez.";

  return (
    <>
      <nav
        aria-label="Breadcrumb"
        className="mb-4 flex items-center gap-1.5 text-[11px] text-charcoal/40"
      >
        <Link href="/" className="hover:text-forest transition-colors">Home</Link>
        <ChevronRight className="h-3 w-3" />
        {activeCollection ? (
          <>
            <Link href="/shop" className="hover:text-forest transition-colors">Shop</Link>
            <ChevronRight className="h-3 w-3" />
            {activeOption ? (
              <>
                <Link href={`/shop?collection=${encodeURIComponent(collectionSlug ?? "")}`} className="hover:text-forest transition-colors">
                  {activeCollection.name}
                </Link>
                <ChevronRight className="h-3 w-3" />
                <span className="text-charcoal/70">{activeOption.name}</span>
              </>
            ) : (
              <span className="text-charcoal/70">{activeCollection.name}</span>
            )}
          </>
        ) : (
          <span className="text-charcoal/70">Shop</span>
        )}
      </nav>

      <div className="max-w-2xl">
        <h1 className="font-serif text-display-lg text-charcoal sm:text-display-xl">
          {heading}
        </h1>
        <p className="mt-3 text-[14px] text-charcoal/55">
          {description}
        </p>
      </div>
    </>
  );
}
