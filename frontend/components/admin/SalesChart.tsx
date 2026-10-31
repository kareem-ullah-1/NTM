"use client";

import * as React from "react";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { fetchSalesSeries, type DashboardPeriod } from "@/lib/api/dashboard";
import { ApiRequestError } from "@/lib/api/client";
import { queryKeys } from "@/lib/api/query-keys";
import { formatPrice } from "@/lib/utils";

const PERIOD_OPTIONS: { value: DashboardPeriod; label: string }[] = [
  { value: "7d", label: "7 Days" },
  { value: "30d", label: "30 Days" },
  { value: "60d", label: "60 Days" },
  { value: "90d", label: "90 Days" },
  { value: "6m", label: "6 Months" },
  { value: "12m", label: "12 Months" },
  { value: "all", label: "All Time" }
];

function formatBucketLabel(bucket: string, period: DashboardPeriod): string {
  const date = new Date(`${bucket}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) return bucket;
  if (period === "6m" || period === "12m" || period === "all") {
    return date.toLocaleDateString("en-US", { month: "short", year: "2-digit", timeZone: "UTC" });
  }
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });
}

export function SalesChart() {
  const [period, setPeriod] = React.useState<DashboardPeriod>("30d");

  const { data, isLoading, isFetching, isError, error } = useQuery({
    queryKey: queryKeys.dashboard.salesSeries(period),
    queryFn: () => fetchSalesSeries(period),
    placeholderData: keepPreviousData
  });

  const loadError = isError
    ? error instanceof ApiRequestError
      ? error.message
      : "Failed to load sales data."
    : null;

  const points = data?.points ?? [];
  const hasData = points.length > 0;
  const values = points.map((point) => point.total);
  const max = Math.max(...values, 1);
  const width = 600;
  const height = 200;
  const step = points.length > 1 ? width / (points.length - 1) : width;
  const path = points
    .map((point, index) => {
      const x = index * step;
      const y = height - (point.total / max) * (height - 20) - 10;
      return `${index === 0 ? "M" : "L"}${x},${y}`;
    })
    .join(" ");
  const areaPath = hasData ? `${path} L${width},${height} L0,${height} Z` : "";

  const periodTotal = points.reduce((sum, point) => sum + point.total, 0);
  const periodOrderCount = points.reduce((sum, point) => sum + point.orderCount, 0);

  const labelStride = Math.max(1, Math.ceil(points.length / 6));

  return (
    <div className="rounded-[10px] border border-charcoal/[0.06] bg-white p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="font-serif text-lg font-medium text-charcoal">Sales Overview</p>
          {hasData && !loadError && (
            <p className="mt-0.5 text-[11px] uppercase tracking-wide text-charcoal/35">
              {formatPrice(periodTotal)} · {periodOrderCount} order{periodOrderCount === 1 ? "" : "s"}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {isFetching && !isLoading && <Loader2 className="h-3.5 w-3.5 animate-spin text-charcoal/30" />}
          <select
            value={period}
            onChange={(event) => setPeriod(event.target.value as DashboardPeriod)}
            aria-label="Sales chart period"
            className="rounded-full border border-charcoal/[0.12] bg-white px-3 py-1.5 text-[12px] text-charcoal"
          >
            {PERIOD_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center gap-2 py-16 text-[13px] text-charcoal/50">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading sales data...
        </div>
      ) : loadError ? (
        <p className="py-16 text-center text-[13px] text-red-500">{loadError}</p>
      ) : !hasData ? (
        <p className="py-16 text-center text-[13px] text-charcoal/50">
          No orders in this period yet.
        </p>
      ) : (
        <div className={isFetching ? "opacity-50 transition-opacity" : "transition-opacity"}>
          <svg
            viewBox={`0 0 ${width} ${height}`}
            className="mt-4 w-full"
            role="img"
            aria-label="Sales trend chart"
          >
            <defs>
              <linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#1B3A2D" stopOpacity="0.2" />
                <stop offset="100%" stopColor="#1B3A2D" stopOpacity="0" />
              </linearGradient>
            </defs>
            <path d={areaPath} fill="url(#salesGradient)" />
            <path
              d={path}
              fill="none"
              stroke="#1B3A2D"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <div className="relative mt-1.5 h-4 text-[10px] text-charcoal/35">
            {points.map((point, index) => {
              if (index % labelStride !== 0 && index !== points.length - 1) return null;
              const leftPercent = points.length > 1 ? (index / (points.length - 1)) * 100 : 0;
              const isLast = index === points.length - 1;
              return (
                <span
                  key={point.bucket}
                  className="absolute whitespace-nowrap"
                  style={{
                    left: `${leftPercent}%`,
                    transform: isLast ? "translateX(-100%)" : index === 0 ? "translateX(0)" : "translateX(-50%)"
                  }}
                >
                  {formatBucketLabel(point.bucket, period)}
                </span>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
