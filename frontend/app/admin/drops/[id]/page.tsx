"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  Loader2,
  Pencil,
  Power,
  PowerOff,
  Trash2,
  Zap,
} from "lucide-react";
import Link from "next/link";
import {
  getProductDrop,
  setProductDropActive,
  deleteProductDrop,
} from "@/lib/api/product-drops";
import { queryKeys } from "@/lib/api/query-keys";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToastStore } from "@/store/use-toast-store";
import { formatPrice, cn } from "@/lib/utils";
import { ApiRequestError } from "@/lib/api/client";

function getStatusVariant(status: string) {
  switch (status) {
    case "live":
      return "success" as const;
    case "upcoming":
      return "warning" as const;
    case "sold_out":
      return "rust" as const;
    case "ended":
    case "disabled":
      return "muted" as const;
    case "draft":
      return "outline" as const;
    default:
      return "muted" as const;
  }
}

function formatStatus(status: string) {
  return status
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatDateTime(dateStr: string) {
  return new Date(dateStr).toLocaleString("en-PK", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

export default function AdminDropDetailPage() {
  const params = useParams();
  const router = useRouter();
  const dropId = params.id as string;
  const showToast = useToastStore((s) => s.showToast);
  const queryClient = useQueryClient();

  const { data: drop, isLoading } = useQuery({
    queryKey: [...queryKeys.productDrops.all, dropId],
    queryFn: () => getProductDrop(dropId),
  });

  const toggleMutation = useMutation({
    mutationFn: (isActive: boolean) => setProductDropActive(dropId, isActive),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [...queryKeys.productDrops.all, dropId],
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.productDrops.all });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteProductDrop(dropId),
    onSuccess: () => {
      showToast("Product drop deleted");
      router.push("/admin/drops");
    },
    onError: (error) => {
      showToast(
        error instanceof ApiRequestError
          ? error.message
          : "Failed to delete drop"
      );
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center gap-2 py-20 text-[13px] text-charcoal/50">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading drop details...
      </div>
    );
  }

  if (!drop) {
    return (
      <div className="py-20 text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-charcoal/5">
          <Zap className="h-5 w-5 text-charcoal/30" />
        </div>
        <p className="text-[13px] font-medium text-charcoal/70">Drop not found</p>
        <p className="mt-1 text-[12px] text-charcoal/40">This drop may have been deleted.</p>
        <Button variant="outline" size="sm" className="mt-4 rounded-full" onClick={() => router.push("/admin/drops")}>
          Back to Drops
        </Button>
      </div>
    );
  }

  const remaining = drop.maxQuantity - drop.soldQuantity;
  const soldPercent =
    drop.maxQuantity > 0
      ? Math.round((drop.soldQuantity / drop.maxQuantity) * 100)
      : 0;

  return (
    <div className="space-y-6">
      {/* Back link */}
      <Link
        href="/admin/drops"
        className="inline-flex items-center gap-1.5 text-[12px] text-charcoal/45 hover:text-charcoal"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to Drops
      </Link>

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="font-serif text-2xl text-charcoal">{drop.name}</h1>
            <Badge variant={getStatusVariant(drop.status)} className="text-[10px]">
              {formatStatus(drop.status)}
            </Badge>
          </div>
          {drop.description && (
            <p className="mt-1 text-[13px] text-charcoal/50">
              {drop.description}
            </p>
          )}
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="rounded-full"
            onClick={() => router.push(`/admin/drops/${dropId}/edit`)}
          >
            <Pencil className="h-3.5 w-3.5" />
            Edit
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="rounded-full"
            onClick={() =>
              toggleMutation.mutate(!drop.isActive)
            }
            disabled={toggleMutation.isPending}
          >
            {drop.isActive ? (
              <>
                <PowerOff className="h-3.5 w-3.5" />
                Disable
              </>
            ) : (
              <>
                <Power className="h-3.5 w-3.5" />
                Enable
              </>
            )}
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="rounded-full text-red-500 hover:bg-red-50 hover:text-red-600"
            onClick={() => deleteMutation.mutate()}
            disabled={deleteMutation.isPending}
          >
            <Trash2 className="h-3.5 w-3.5" />
            Delete
          </Button>
        </div>
      </div>

      {/* Content grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main column */}
        <div className="space-y-6 lg:col-span-2">
          {/* Product */}
          <div className="rounded-[10px] border border-charcoal/[0.06] bg-white p-5">
            <p className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-charcoal/40">
              Product
            </p>
            {drop.product ? (
              <div className="flex items-center gap-4">
                {drop.product.images?.[0] && (
                  <img
                    src={drop.product.images[0]}
                    alt={drop.product.name}
                    className="h-16 w-16 rounded-lg object-cover"
                  />
                )}
                <div>
                  <p className="font-medium text-charcoal">
                    {drop.product.name}
                  </p>
                  <p className="text-[12px] text-charcoal/40">
                    SKU: {drop.product.sku ?? "—"} · Stock:{" "}
                    {drop.product.stock ?? "—"}
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-[12px] text-charcoal/40">
                Product not found
              </p>
            )}
          </div>

          {/* Pricing */}
          <div className="rounded-[10px] border border-charcoal/[0.06] bg-white p-5">
            <p className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-charcoal/40">
              Pricing
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-[12px] text-charcoal/40">Regular Price</p>
                <p className="mt-0.5 font-medium text-charcoal">
                  {drop.product ? formatPrice(drop.product.price) : "—"}
                </p>
              </div>
              <div>
                <p className="text-[12px] text-charcoal/40">Drop Price</p>
                <p className="mt-0.5 font-medium text-charcoal">
                  {drop.specialPrice
                    ? formatPrice(drop.specialPrice)
                    : "— (uses regular price)"}
                </p>
              </div>
            </div>
          </div>

          {/* Inventory */}
          <div className="rounded-[10px] border border-charcoal/[0.06] bg-white p-5">
            <p className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-charcoal/40">
              Inventory
            </p>
            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <p className="text-[12px] text-charcoal/40">Total Quantity</p>
                <p className="mt-0.5 font-medium text-charcoal">
                  {drop.maxQuantity}
                </p>
              </div>
              <div>
                <p className="text-[12px] text-charcoal/40">Sold</p>
                <p className="mt-0.5 font-medium text-charcoal">
                  {drop.soldQuantity}
                </p>
              </div>
              <div>
                <p className="text-[12px] text-charcoal/40">Remaining</p>
                <p
                  className={cn(
                    "mt-0.5 font-medium",
                    remaining === 0 ? "text-red-500" : "text-charcoal"
                  )}
                >
                  {remaining}
                </p>
              </div>
            </div>
            <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-charcoal/10">
              <div
                className={cn(
                  "h-full rounded-full transition-all",
                  soldPercent >= 100
                    ? "bg-charcoal/30"
                    : soldPercent >= 80
                      ? "bg-rust"
                      : "bg-forest"
                )}
                style={{ width: `${Math.min(soldPercent, 100)}%` }}
              />
            </div>
            <p className="mt-1.5 text-[11px] text-charcoal/40">
              {soldPercent}% sold
            </p>
          </div>

          {/* Schedule */}
          <div className="rounded-[10px] border border-charcoal/[0.06] bg-white p-5">
            <p className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-charcoal/40">
              Schedule
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-[12px] text-charcoal/40">Starts</p>
                <p className="mt-0.5 font-medium text-charcoal">
                  {formatDateTime(drop.startsAt)}
                </p>
              </div>
              <div>
                <p className="text-[12px] text-charcoal/40">Ends</p>
                <p className="mt-0.5 font-medium text-charcoal">
                  {formatDateTime(drop.endsAt)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick stats */}
          <div className="rounded-[10px] border border-charcoal/[0.06] bg-white p-5">
            <p className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-charcoal/40">
              Quick Info
            </p>
            <div className="space-y-3 text-[13px]">
              <div className="flex justify-between">
                <span className="text-charcoal/50">Customer Limit</span>
                <span className="font-medium text-charcoal">
                  {drop.perCustomerLimit} per customer
                </span>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="text-charcoal/50">Notifications</span>
                <span className="font-medium text-charcoal">
                  {drop.notificationCount ?? 0} subscribed
                </span>
              </div>
            </div>
          </div>

          {/* Promotion */}
          {drop.promotion && (
            <div className="rounded-[10px] border border-charcoal/[0.06] bg-white p-5">
              <p className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-charcoal/40">
                Promotion
              </p>
              <div className="space-y-2 text-[13px]">
                <p className="font-medium text-charcoal">
                  {drop.promotion.name}
                </p>
                <p className="text-[12px] text-charcoal/50">
                  {drop.promotion.discountType === "percentage"
                    ? `${drop.promotion.discountValue}% off`
                    : `${formatPrice(drop.promotion.discountValue)} off`}
                </p>
              </div>
            </div>
          )}

          {/* Performance */}
          {drop.analytics && (
            <div className="rounded-[10px] border border-charcoal/[0.06] bg-white p-5">
              <p className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-charcoal/40">
                Performance
              </p>
              <div className="space-y-3 text-[13px]">
                <div className="flex justify-between">
                  <span className="text-charcoal/50">Orders</span>
                  <span className="font-medium text-charcoal">
                    {drop.analytics.totalOrders}
                  </span>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <span className="text-charcoal/50">Units Sold</span>
                  <span className="font-medium text-charcoal">
                    {drop.analytics.totalUnits}
                  </span>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <span className="text-charcoal/50">Revenue</span>
                  <span className="font-medium text-charcoal">
                    {formatPrice(drop.analytics.totalRevenue)}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
