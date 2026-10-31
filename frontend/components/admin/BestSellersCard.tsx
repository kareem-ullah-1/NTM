"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { Loader2, Trophy } from "lucide-react";
import { fetchBestSellingProducts } from "@/lib/api/dashboard";
import { cn, formatPrice } from "@/lib/utils";

const RANGE_OPTIONS = [
  { label: "30 Days", sinceDays: 30 },
  { label: "90 Days", sinceDays: 90 },
  { label: "All Time", sinceDays: undefined }
];

export function BestSellersCard() {
  const [rangeIndex, setRangeIndex] = React.useState(0);
  const sinceDays = RANGE_OPTIONS[rangeIndex].sinceDays;

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "dashboard", "best-sellers", sinceDays],
    queryFn: () => fetchBestSellingProducts(8, sinceDays)
  });

  return (
    <div className="rounded-[10px] border border-charcoal/[0.06] bg-white p-5">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-sand/20 text-sand-dark">
            <Trophy className="h-4 w-4" />
          </div>
          <div>
            <p className="font-serif text-lg font-medium text-charcoal">
              Best-Selling Products
            </p>
            <p className="text-[11px] uppercase tracking-wide text-charcoal/35">
              By revenue
            </p>
          </div>
        </div>
        <div className="flex rounded-full border border-charcoal/[0.08] bg-cream p-0.5">
          {RANGE_OPTIONS.map((option, index) => (
            <button
              key={option.label}
              type="button"
              onClick={() => setRangeIndex(index)}
              className={cn(
                "rounded-full px-2.5 py-1 text-[11px] font-medium transition-colors duration-200",
                index === rangeIndex
                  ? "bg-charcoal text-cream"
                  : "text-charcoal/50 hover:text-charcoal"
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center gap-2 py-10 text-[13px] text-charcoal/50">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading...
        </div>
      ) : !data?.length ? (
        <p className="py-10 text-center text-[13px] text-charcoal/50">
          No sales data yet.
        </p>
      ) : (
        <div className="mt-4 divide-y divide-charcoal/[0.04]">
          {data.map((product, index) => (
            <div
              key={product.productId ?? product.name}
              className="flex items-center gap-3 py-3"
            >
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-forest/[0.06] text-[11px] font-medium text-forest">
                {index + 1}
              </span>
              {product.imageUrl ? (
                <img
                  src={product.imageUrl}
                  alt=""
                  className="h-10 w-10 shrink-0 rounded-[6px] object-cover"
                />
              ) : (
                <div className="h-10 w-10 shrink-0 rounded-[6px] bg-charcoal/[0.04]" />
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13px] font-medium text-charcoal">
                  {product.name}
                </p>
                <p className="text-[11px] text-charcoal/40">
                  {product.unitsSold} units · {product.orderCount} orders
                </p>
              </div>
              <p className="shrink-0 text-[13px] font-medium text-charcoal">
                {formatPrice(product.revenue)}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
