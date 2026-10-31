"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, X, ImageOff } from "lucide-react";
import { fetchProducts } from "@/lib/api/products";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { formatPrice } from "@/lib/utils";

type FeaturedProduct = {
  id: string;
  name: string;
  sku: string;
  price: number;
  image: string | null;
};

type FeaturedProductPickerProps = {
  selected: FeaturedProduct[];
  onChange: (products: FeaturedProduct[]) => void;
};

export function FeaturedProductPicker({ selected, onChange }: FeaturedProductPickerProps) {
  const [search, setSearch] = React.useState("");
  const [debouncedSearch, setDebouncedSearch] = React.useState("");

  React.useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  const { data, isFetching } = useQuery({
    queryKey: ["admin", "promotions", "featured-product-search", debouncedSearch],
    queryFn: () => fetchProducts({ search: debouncedSearch || undefined, limit: 24 }),
    enabled: true,
  });

  const results = data?.data ?? [];
  const selectedIds = new Set(selected.map((p) => p.id));

  function toggle(product: {
    id: string;
    name: string;
    sku: string;
    price: number;
    images: string[];
  }) {
    if (selectedIds.has(product.id)) {
      onChange(selected.filter((p) => p.id !== product.id));
    } else {
      onChange([
        ...selected,
        {
          id: product.id,
          name: product.name,
          sku: product.sku,
          price: product.price,
          image: product.images[0] ?? null,
        },
      ]);
    }
  }

  function remove(id: string) {
    onChange(selected.filter((p) => p.id !== id));
  }

  function moveUp(index: number) {
    if (index <= 0) return;
    const next = [...selected];
    [next[index - 1], next[index]] = [next[index], next[index - 1]];
    onChange(next);
  }

  function moveDown(index: number) {
    if (index >= selected.length - 1) return;
    const next = [...selected];
    [next[index], next[index + 1]] = [next[index + 1], next[index]];
    onChange(next);
  }

  return (
    <div className="space-y-3">
      {/* Search */}
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-charcoal/35" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search products to feature..."
          className="pl-8 text-[13px]"
        />
      </div>

      {/* Selected products with reorder */}
      {selected.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-[11px] font-medium text-charcoal/50">
            Featured Products ({selected.length}) — drag to reorder
          </p>
          {selected.map((product, index) => (
            <div
              key={product.id}
              className="flex items-center gap-2.5 rounded-lg border border-charcoal/10 bg-charcoal/[0.02] px-2.5 py-2"
            >
              <div className="flex flex-col gap-0.5">
                <button
                  type="button"
                  onClick={() => moveUp(index)}
                  disabled={index === 0}
                  className="rounded p-0.5 text-charcoal/30 hover:text-charcoal disabled:opacity-30"
                  aria-label="Move up"
                >
                  <svg width="10" height="6" viewBox="0 0 10 6" fill="none">
                    <path d="M1 5L5 1L9 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
                <button
                  type="button"
                  onClick={() => moveDown(index)}
                  disabled={index === selected.length - 1}
                  className="rounded p-0.5 text-charcoal/30 hover:text-charcoal disabled:opacity-30"
                  aria-label="Move down"
                >
                  <svg width="10" height="6" viewBox="0 0 10 6" fill="none">
                    <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
              </div>
              {product.image ? (
                <img
                  src={product.image}
                  alt=""
                  className="h-10 w-10 rounded object-cover"
                />
              ) : (
                <div className="flex h-10 w-10 items-center justify-center rounded bg-charcoal/5">
                  <ImageOff className="h-4 w-4 text-charcoal/25" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="truncate text-[12px] font-medium text-charcoal">{product.name}</p>
                <p className="text-[10px] text-charcoal/40">
                  {product.sku} · {formatPrice(product.price)}
                </p>
              </div>
              <span className="text-[10px] text-charcoal/30">#{index + 1}</span>
              <button
                type="button"
                onClick={() => remove(product.id)}
                className="rounded-full p-1 text-charcoal/30 hover:bg-red-50 hover:text-red-500"
                aria-label={`Remove ${product.name}`}
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Search results */}
      <div className="max-h-56 space-y-1 overflow-y-auto rounded-lg border border-charcoal/10 p-2">
        {isFetching ? (
          <div className="flex items-center justify-center gap-2 py-6 text-[12px] text-charcoal/40">
            <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-charcoal/20 border-t-charcoal/60" />{" "}
            Searching...
          </div>
        ) : results.length === 0 ? (
          <p className="py-6 text-center text-[12px] text-charcoal/40">
            {debouncedSearch ? "No products found." : "Start typing to search products."}
          </p>
        ) : (
          <>
            {results.map((product) => {
              const isSelected = selectedIds.has(product.id);
              return (
                <button
                  key={product.id}
                  type="button"
                  onClick={() => toggle(product)}
                  className={cn(
                    "flex w-full cursor-pointer items-center gap-2.5 rounded-md px-1.5 py-1.5 text-left text-[13px] transition-colors",
                    isSelected
                      ? "bg-forest/5 text-charcoal"
                      : "text-charcoal/80 hover:bg-charcoal/[0.03]"
                  )}
                >
                  <div
                    className={cn(
                      "flex h-4 w-4 items-center justify-center rounded border",
                      isSelected ? "border-forest bg-forest text-white" : "border-charcoal/25"
                    )}
                  >
                    {isSelected && (
                      <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                        <path d="M1 4L3.5 6.5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    )}
                  </div>
                  {product.images[0] && (
                    <img
                      src={product.images[0]}
                      alt=""
                      className="h-8 w-8 rounded object-cover"
                    />
                  )}
                  <span className="flex-1 truncate text-charcoal/80">{product.name}</span>
                  <span className="text-[11px] text-charcoal/40">{product.sku}</span>
                  <span className="text-[11px] text-charcoal/40">{formatPrice(product.price)}</span>
                </button>
              );
            })}
          </>
        )}
      </div>

      <p className="text-[12px] text-charcoal/50">
        {selected.length} product{selected.length === 1 ? "" : "s"} selected for display
      </p>
    </div>
  );
}
