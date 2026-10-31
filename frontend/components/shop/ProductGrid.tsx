"use client";

import * as React from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useInfiniteQuery } from "@tanstack/react-query";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Loader2, PackageSearch } from "lucide-react";
import { fetchProducts } from "@/lib/api/products";
import { ApiRequestError } from "@/lib/api/client";
import { queryKeys } from "@/lib/api/query-keys";
import { useFilterStore, type SortOption } from "@/store/use-filter-store";
import { ProductCard } from "@/components/shared/product-card";
import { ProductCardSkeleton } from "@/components/shared/product-card-skeleton";
import { EmptyState } from "@/components/shared/empty-state";
import type { ApiProduct } from "@/lib/api/types";

const sortOptions: SortOption[] = ["Featured", "Newest", "Price low to high", "Price high to low"];

const PRODUCTS_PER_PAGE = 24;

function useDebouncedValue<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = React.useState(value);
  React.useEffect(() => {
    const timeout = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timeout);
  }, [value, delay]);
  return debounced;
}

export function ProductGrid() {
  const reduced = useReducedMotion();
  const {
    search,
    categories,
    fabricTypes,
    collectionSlug,
    optionSlug,
    priceRange,
    inStockOnly,
    sortBy,
    setSearch,
    setCategories,
    setCollectionSlug,
    setOptionSlug,
    setSortBy
  } = useFilterStore();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();

  const promotionId = searchParams.get("promotion") ?? undefined;
  const idsParam = searchParams.getAll("ids");
  const ids =
    idsParam.length > 0 ? idsParam.flatMap((v) => v.split(",")).filter(Boolean) : undefined;

  const [isReady, setIsReady] = React.useState(false);
  React.useEffect(() => {
    const timer = setTimeout(() => setIsReady(true), 0);
    return () => clearTimeout(timer);
  }, []);

  const syncedSearchRef = React.useRef<string | null>(null);
  React.useEffect(() => {
    const current = searchParams.toString();
    if (syncedSearchRef.current === current) return;
    syncedSearchRef.current = current;

    setSearch(searchParams.get("search") ?? "");

    const categoryParam = searchParams.get("category");
    setCategories(categoryParam ? categoryParam.split(",") : []);

    setCollectionSlug(searchParams.get("collection"));
    setOptionSlug(searchParams.get("option"));

    const sortParam = searchParams.get("sort");
    setSortBy(
      sortParam && sortOptions.includes(sortParam as SortOption)
        ? (sortParam as SortOption)
        : "Featured"
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const debouncedSearch = useDebouncedValue(search, 300);

  const buildFilterUrl = React.useCallback(() => {
    const params = new URLSearchParams();
    if (promotionId) params.set("promotion", promotionId);
    if (ids && ids.length > 0) params.set("ids", ids.join(","));
    if (debouncedSearch) params.set("search", debouncedSearch);
    if (categories.length) params.set("category", categories.join(","));
    if (collectionSlug) params.set("collection", collectionSlug);
    if (optionSlug) params.set("option", optionSlug);
    if (sortBy !== "Featured") params.set("sort", sortBy);
    // Infinite scroll: do not put page in the public URL
    const query = params.toString();
    return `${pathname}${query ? `?${query}` : ""}`;
  }, [pathname, promotionId, ids, debouncedSearch, categories, collectionSlug, optionSlug, sortBy]);

  const filterSignature = [
    debouncedSearch,
    categories.join(","),
    fabricTypes.join(","),
    collectionSlug ?? "",
    optionSlug ?? "",
    priceRange ? priceRange.join("-") : "",
    inStockOnly ? "1" : "0",
    sortBy,
    promotionId ?? "",
    ids?.join(",") ?? ""
  ].join("|");

  const lastFilterSignatureRef = React.useRef(filterSignature);

  React.useEffect(() => {
    if (!isReady) {
      lastFilterSignatureRef.current = filterSignature;
      return;
    }
    if (lastFilterSignatureRef.current === filterSignature) return;
    lastFilterSignatureRef.current = filterSignature;
    router.replace(buildFilterUrl(), { scroll: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isReady, filterSignature]);

  const baseQueryParams = React.useMemo(
    () => ({
      search: debouncedSearch || undefined,
      category: categories.length ? categories : undefined,
      fabricType: fabricTypes.length ? fabricTypes : undefined,
      collection: collectionSlug || undefined,
      option: optionSlug || undefined,
      priceMin: priceRange ? priceRange[0] : undefined,
      priceMax: priceRange ? priceRange[1] : undefined,
      inStockOnly: inStockOnly || undefined,
      promotion: promotionId,
      ids,
      sort: sortBy,
      limit: PRODUCTS_PER_PAGE
    }),
    [
      debouncedSearch,
      categories,
      fabricTypes,
      collectionSlug,
      optionSlug,
      priceRange,
      inStockOnly,
      promotionId,
      ids,
      sortBy
    ]
  );

  const {
    data,
    isLoading,
    isFetchingNextPage,
    isError,
    error,
    fetchNextPage,
    hasNextPage,
    isFetching
  } = useInfiniteQuery({
    queryKey: queryKeys.products.list({ ...baseQueryParams, infinite: true }),
    queryFn: ({ pageParam, signal }) =>
      fetchProducts({ ...baseQueryParams, page: pageParam as number }, signal),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      const meta = lastPage.meta as
        | { page?: number; totalPages?: number; total?: number }
        | null
        | undefined;
      const page = Number(meta?.page ?? 1);
      const totalPages = Number(meta?.totalPages ?? 1);
      if (page < totalPages) return page + 1;
      return undefined;
    },
    enabled: isReady,
    staleTime: 60_000,
    gcTime: 10 * 60_000
  });

  const products: ApiProduct[] = React.useMemo(() => {
    const seen = new Set<string>();
    const list: ApiProduct[] = [];
    for (const page of data?.pages ?? []) {
      for (const product of page.data ?? []) {
        if (seen.has(product.id)) continue;
        seen.add(product.id);
        list.push(product);
      }
    }
    return list;
  }, [data?.pages]);

  const total =
    (data?.pages?.[0]?.meta?.total as number | undefined) ?? products.length;

  const loadError = isError
    ? error instanceof ApiRequestError
      ? error.message
      : "Failed to load fabrics."
    : null;

  const loadMoreRef = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    const node = loadMoreRef.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!entry?.isIntersecting) return;
        if (!hasNextPage || isFetchingNextPage || isLoading) return;
        void fetchNextPage();
      },
      {
        root: null,
        rootMargin: "320px 0px",
        threshold: 0
      }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, isLoading, fetchNextPage, products.length]);

  const showInitialSkeletons = isLoading && products.length === 0;

  return (
    <div>
      {!showInitialSkeletons && !loadError && products.length > 0 && (
        <p className="mb-4 text-xs text-charcoal/50">
          Showing {products.length}
          {total > products.length ? ` of ${total}` : ""} fabrics
        </p>
      )}

      {showInitialSkeletons ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, index) => (
            <ProductCardSkeleton key={index} />
          ))}
        </div>
      ) : loadError ? (
        <EmptyState
          icon={PackageSearch}
          title="Couldn't load fabrics."
          description={loadError}
        />
      ) : products.length === 0 ? (
        <EmptyState
          icon={PackageSearch}
          title="No fabrics found."
          description="Try adjusting your filters or search term."
        />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
            <AnimatePresence mode="popLayout" initial={false}>
              {products.map((product) => (
                <motion.div
                  key={product.id}
                  initial={reduced ? false : { opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={reduced ? undefined : { opacity: 0, y: 6 }}
                  transition={{ duration: reduced ? 0 : 0.25, ease: [0.16, 1, 0.3, 1] }}
                >
                  <ProductCard product={product} />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {/* Infinite scroll sentinel */}
          <div ref={loadMoreRef} className="h-8 w-full" aria-hidden />

          {isFetchingNextPage && (
            <div className="mt-2 grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
              {Array.from({ length: 4 }).map((_, index) => (
                <ProductCardSkeleton key={`more-${index}`} />
              ))}
            </div>
          )}

          {isFetchingNextPage && (
            <div className="mt-4 flex items-center justify-center gap-2 text-[12px] text-charcoal/45">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Loading more fabrics…
            </div>
          )}

          {!hasNextPage && products.length > 0 && !isFetching && (
            <p className="mt-6 text-center text-[12px] text-charcoal/35">
              You&apos;ve reached the end
            </p>
          )}
        </>
      )}
    </div>
  );
}
