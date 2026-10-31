"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { useFilterStore } from "@/store/use-filter-store";
import { fetchFilterOptions } from "@/lib/api/products";
import { queryKeys } from "@/lib/api/query-keys";
import { Separator } from "@/components/ui/separator";
import { cn, formatPrice } from "@/lib/utils";

/**
 * Debounces a value so consumers only react once it has settled for
 * `delayMs`. Used to collapse rapid-fire filter changes (typing in the
 * price inputs, quickly toggling several checkboxes) into a single
 * network request instead of one request per change.
 */
function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = React.useState(value);

  React.useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs]);

  return debounced;
}

export function FilterPanel() {
  const {
    search,
    categories,
    fabricTypes: activeFabricTypes,
    priceRange,
    inStockOnly,
    toggleCategory,
    toggleFabricType,
    setPriceRange,
    setInStockOnly,
    clearFilters
  } = useFilterStore();

  // Sort array-valued filters so that selecting the same set of
  // categories/fabric types in a different order still produces an
  // identical query key — otherwise React Query treats "A then B" and
  // "B then A" as different cache entries and refetches unnecessarily.
  const facetParams = React.useMemo(
    () => ({
      search: search || undefined,
      category: categories.length ? [...categories].sort() : undefined,
      fabricType: activeFabricTypes.length
        ? [...activeFabricTypes].sort()
        : undefined,
      priceMin: priceRange ? priceRange[0] : undefined,
      priceMax: priceRange ? priceRange[1] : undefined,
      inStockOnly: inStockOnly || undefined
    }),
    [search, categories, activeFabricTypes, priceRange, inStockOnly]
  );

  // Debounce before it reaches the query — the price inputs and rapid
  // checkbox toggles update the store immediately (so the UI, chips,
  // etc. stay responsive), but the API call itself waits for things to
  // settle. Typing "1500" now fires one request instead of four.
  const debouncedFacetParams = useDebouncedValue(facetParams, 350);

  const { data: filterData } = useQuery({
    queryKey: queryKeys.products.filterOptions(debouncedFacetParams),
    queryFn: () => fetchFilterOptions(debouncedFacetParams),
    placeholderData: (previous) => previous,
    // Facet counts don't need to be second-fresh. This avoids an
    // extra refetch every time the panel remounts or the window
    // regains focus with the exact same filters still selected.
    staleTime: 15 * 1000
  });

  const productCategories = filterData?.categories ?? [];
  const fabricTypes = filterData?.fabricTypes ?? [];
  const bounds = filterData?.priceBounds ?? { min: 0, max: 5000 };
  const effectiveRange = priceRange ?? [bounds.min, bounds.max];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="font-serif text-lg font-medium text-charcoal">Filters</p>
        <button
          onClick={clearFilters}
          className="text-[12px] font-medium text-forest hover:underline"
        >
          Clear all
        </button>
      </div>

      <Separator className="bg-charcoal/[0.06]" />

      {}
      <div>
        <p className="mb-3 text-overline uppercase text-charcoal/40">Category</p>
        <div className="space-y-2">
          {productCategories.map((category) => (
            <label
              key={category.value}
              className={cn(
                "flex cursor-pointer items-center justify-between gap-2 text-[13px] text-charcoal/70",
                category.count === 0 &&
                  !categories.includes(category.value) &&
                  "opacity-40"
              )}
            >
              <span className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={categories.includes(category.value)}
                  onChange={() => toggleCategory(category.value)}
                  className="h-3.5 w-3.5 rounded border-charcoal/25 text-forest focus:ring-forest"
                />
                {category.value}
              </span>

            </label>
          ))}
        </div>
      </div>

      <Separator className="bg-charcoal/[0.06]" />

      {}
      <div>
        <p className="mb-3 text-overline uppercase text-charcoal/40">Fabric Type</p>
        <div className="space-y-2">
          {fabricTypes.map((type) => (
            <label
              key={type.value}
              className={cn(
                "flex cursor-pointer items-center justify-between gap-2 text-[13px] text-charcoal/70",
                type.count === 0 &&
                  !activeFabricTypes.includes(type.value) &&
                  "opacity-40"
              )}
            >
              <span className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={activeFabricTypes.includes(type.value)}
                  onChange={() => toggleFabricType(type.value)}
                  className="h-3.5 w-3.5 rounded border-charcoal/25 text-forest focus:ring-forest"
                />
                {type.value}
              </span>
            </label>
          ))}
        </div>
      </div>

      <Separator className="bg-charcoal/[0.06]" />

      {}
      <div>
        <p className="mb-3 text-overline uppercase text-charcoal/40">Price Range</p>
        <div className="flex items-center gap-2">
          <div className="flex-1">
            <label htmlFor="price-min" className="sr-only">
              Minimum price
            </label>
            <input
              id="price-min"
              type="number"
              min={bounds.min}
              max={effectiveRange[1]}
              step={50}
              value={effectiveRange[0]}
              onChange={(event) => {
                const value = Math.min(
                  Number(event.target.value) || bounds.min,
                  effectiveRange[1]
                );
                setPriceRange([Math.max(bounds.min, value), effectiveRange[1]]);
              }}
              className="h-9 w-full rounded-[6px] border border-charcoal/[0.12] bg-white px-2.5 text-[13px] text-charcoal focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest"
            />
          </div>
          <span className="text-charcoal/30">–</span>
          <div className="flex-1">
            <label htmlFor="price-max" className="sr-only">
              Maximum price
            </label>
            <input
              id="price-max"
              type="number"
              min={effectiveRange[0]}
              max={bounds.max}
              step={50}
              value={effectiveRange[1]}
              onChange={(event) => {
                const value = Math.max(
                  Number(event.target.value) || bounds.max,
                  effectiveRange[0]
                );
                setPriceRange([
                  effectiveRange[0],
                  Math.min(bounds.max, value)
                ]);
              }}
              className="h-9 w-full rounded-[6px] border border-charcoal/[0.12] bg-white px-2.5 text-[13px] text-charcoal focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest"
            />
          </div>
        </div>
        <p className="mt-2 flex items-center justify-between text-[11px] text-charcoal/40">
          <span>
            {formatPrice(effectiveRange[0])} &ndash; {formatPrice(effectiveRange[1])}
          </span>
          {priceRange && (
            <button
              onClick={() => setPriceRange(null)}
              className="font-medium text-forest hover:underline"
            >
              Reset
            </button>
          )}
        </p>
      </div>

      <Separator className="bg-charcoal/[0.06]" />

      {}
      <label className="flex cursor-pointer items-center gap-2 text-[13px] text-charcoal/70">
        <input
          type="checkbox"
          checked={inStockOnly}
          onChange={(event) => setInStockOnly(event.target.checked)}
          className="h-3.5 w-3.5 rounded border-charcoal/25 text-forest focus:ring-forest"
        />
        In stock only
      </label>
    </div>
  );
}
