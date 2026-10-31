import { Suspense } from "react";
import type { Metadata } from "next";
import { FilterPanel } from "@/components/shop/FilterPanel";
import { MobileFilterDrawer } from "@/components/shop/MobileFilterDrawer";
import { SortSelect } from "@/components/shop/SortSelect";
import { ShopSearchInput } from "@/components/shop/ShopSearchInput";
import { ActiveFilterChips } from "@/components/shop/ActiveFilterChips";
import { ProductGrid } from "@/components/shop/ProductGrid";
import { ShopHeading } from "@/components/shop/ShopHeading";

type ShopSearchParams = { [key: string]: string | string[] | undefined };

export function generateMetadata({
  searchParams
}: {
  searchParams: ShopSearchParams;
}): Metadata {
  const category = typeof searchParams.category === "string" ? searchParams.category : undefined;
  const hasOtherParams = Object.keys(searchParams).some((key) => key !== "category");

  // Category browsing is a genuine, valuable indexable page. Search, sort,
  // price, pagination and multi-filter combinations are thin/duplicate
  // variants of the same catalog, so they stay crawlable but out of the index.
  const shouldIndex = !hasOtherParams;
  const canonicalPath = category ? `/shop?category=${encodeURIComponent(category)}` : "/shop";

  return {
    title: category ? `${category} Fabrics` : "Shop Unstitched Fabrics",
    description: category
      ? `Browse premium unstitched ${category} fabric for men, shipped nationwide across Pakistan.`
      : "Browse the full collection of premium unstitched men's fabric — Wash & Wear, Cotton, Boski, Latha and Summer Collection.",
    keywords: category
      ? [
          `${category} fabric`,
          `unstitched ${category}`,
          `${category} fabric for men`,
          "shop unstitched fabric",
          "buy fabric online Pakistan",
          "men's fabric collection"
        ]
      : [
          "shop unstitched fabric",
          "men's fabric collection",
          "wash and wear fabric",
          "cotton fabric",
          "boski fabric",
          "latha fabric",
          "summer collection fabric",
          "buy fabric online Pakistan"
        ],
    alternates: { canonical: canonicalPath },
    robots: { index: shouldIndex, follow: true }
  };
}

export default function ShopPage() {
  return (
    <div className="mx-auto max-w-[1400px] px-5 py-10 sm:px-8 lg:px-12">
      <Suspense fallback={null}>
        <ShopHeading />
      </Suspense>

      <div className="mt-10 grid gap-10 lg:grid-cols-[260px_1fr]">
        <aside className="hidden lg:block">
          <div className="sticky top-28">
            <FilterPanel />
          </div>
        </aside>
        <div className="min-w-0">
          <div className="mb-4 lg:hidden">
            <MobileFilterDrawer />
          </div>

          {/* Search (left) + Sort (right) — same row on sm+ */}
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-3">
            <ShopSearchInput />
            <SortSelect />
          </div>

          <div className="mb-5">
            <ActiveFilterChips />
          </div>

          <Suspense fallback={null}>
            <div aria-live="polite">
              <ProductGrid />
            </div>
          </Suspense>
        </div>
      </div>
    </div>
  );
}
