"use client";

import { X } from "lucide-react";
import { useFilterStore } from "@/store/use-filter-store";
import { formatPrice } from "@/lib/utils";

export function ActiveFilterChips() {
  const {
    categories,
    fabricTypes,
    collectionSlug,
    optionSlug,
    priceRange,
    inStockOnly,
    toggleCategory,
    toggleFabricType,
    setCollectionSlug,
    setOptionSlug,
    setPriceRange,
    setInStockOnly
  } = useFilterStore();

  const chips = [
    ...(optionSlug
      ? [
          {
            label: optionSlug.replace(/-/g, " "),
            onRemove: () => setOptionSlug(null)
          }
        ]
      : collectionSlug
        ? [
            {
              label: collectionSlug.replace(/-/g, " "),
              onRemove: () => setCollectionSlug(null)
            }
          ]
        : []),
    ...categories.map((value) => ({
      label: value,
      onRemove: () => toggleCategory(value)
    })),
    ...fabricTypes.map((value) => ({
      label: value,
      onRemove: () => toggleFabricType(value)
    })),
    ...(priceRange
      ? [
          {
            label: `${formatPrice(priceRange[0])} – ${formatPrice(priceRange[1])}`,
            onRemove: () => setPriceRange(null)
          }
        ]
      : []),
    ...(inStockOnly
      ? [{ label: "In stock only", onRemove: () => setInStockOnly(false) }]
      : [])
  ];

  if (chips.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2" aria-label="Active filters">
      {chips.map((chip) => (
        <button
          key={chip.label}
          type="button"
          onClick={chip.onRemove}
          aria-label={`Remove filter ${chip.label}`}
          className="inline-flex min-h-[32px] items-center gap-1.5 rounded-full border border-forest/15 bg-forest/[0.06] px-3 py-1.5 text-xs font-medium capitalize text-forest transition-colors hover:bg-forest/[0.1] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest focus-visible:ring-offset-2 focus-visible:ring-offset-cream"
        >
          <span>{chip.label}</span>
          <X className="h-3 w-3 shrink-0 opacity-70" aria-hidden />
        </button>
      ))}
    </div>
  );
}
