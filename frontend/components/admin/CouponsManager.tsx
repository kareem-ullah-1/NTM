"use client";

import * as React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Loader2,
  Plus,
  Search,
  Tags,
  Trash2,
  Pencil,
  MoreVertical,
  Eye,
  AlertTriangle,
  Check,
  Ticket,
  Clock,
  Ban,
  AlertCircle
} from "lucide-react";
import {
  createCoupon,
  deleteCoupon,
  fetchCoupons,
  setCouponActive,
  updateCoupon,
  type ApiCoupon,
  type CouponDiscountType
} from "@/lib/api/coupons";
import { ApiRequestError } from "@/lib/api/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from "@/components/ui/dialog";
import { useToastStore } from "@/store/use-toast-store";
import { formatPrice, cn } from "@/lib/utils";

const QUERY_KEY = ["admin", "coupons"] as const;

type CouponStatus = "active" | "scheduled" | "disabled" | "expired" | "limit_reached";

function getCouponStatus(coupon: ApiCoupon): CouponStatus {
  if (!coupon.isActive) return "disabled";
  const now = new Date();
  if (coupon.startsAt && now < new Date(coupon.startsAt)) return "scheduled";
  if (coupon.expiresAt && now > new Date(coupon.expiresAt)) return "expired";
  if (coupon.usageLimit !== null && coupon.usageCount >= coupon.usageLimit)
    return "limit_reached";
  return "active";
}

const STATUS_CONFIG: Record<CouponStatus, { label: string; variant: "success" | "warning" | "muted" | "outline" | "danger" }> = {
  active: { label: "Active", variant: "success" },
  scheduled: { label: "Scheduled", variant: "warning" },
  disabled: { label: "Disabled", variant: "muted" },
  expired: { label: "Expired", variant: "outline" },
  limit_reached: { label: "Limit Reached", variant: "danger" }
};


function StatCard({
  label,
  count,
  icon: Icon,
  color
}: {
  label: string;
  count: number;
  icon: React.ElementType;
  color: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-[10px] border border-charcoal/[0.06] bg-white px-4 py-3.5">
      <div
        className={cn(
          "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
          color
        )}
      >
        <Icon className="h-4 w-4" />
      </div>
      <div>
        <p className="text-lg font-medium leading-tight text-charcoal">
          {count}
        </p>
        <p className="text-[11px] text-charcoal/40">{label}</p>
      </div>
    </div>
  );
}


function CouponSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-4 border-b border-charcoal/[0.04] py-4"
        >
          <div className="h-4 w-20 animate-pulse rounded bg-charcoal/[0.06]" />
          <div className="h-4 w-14 animate-pulse rounded bg-charcoal/[0.06]" />
          <div className="h-4 w-16 animate-pulse rounded bg-charcoal/[0.06]" />
          <div className="h-4 w-12 animate-pulse rounded bg-charcoal/[0.06]" />
          <div className="h-5 w-14 animate-pulse rounded-full bg-charcoal/[0.06]" />
        </div>
      ))}
    </div>
  );
}


function CouponPreviewCard({
  code,
  discountType,
  discountValue,
  maxDiscountAmount,
  minOrderAmount,
  expiresAt
}: {
  code: string;
  discountType: CouponDiscountType;
  discountValue: number;
  maxDiscountAmount?: number | null;
  minOrderAmount?: number;
  expiresAt?: string | null;
}) {
  return (
    <div className="overflow-hidden rounded-[8px] border border-charcoal/[0.08] bg-charcoal/[0.02]">
      <div className="border-b border-dashed border-charcoal/[0.1] bg-white px-4 py-3">
        <p className="font-mono text-[15px] font-semibold tracking-wider text-charcoal">
          {code || "CODE"}
        </p>
      </div>
      <div className="px-4 py-3">
        <p className="text-lg font-medium text-charcoal">
          {discountType === "percentage"
            ? `${discountValue || 0}% OFF`
            : `${formatPrice(discountValue || 0)} OFF`}
        </p>
        {maxDiscountAmount ? (
          <p className="mt-1 text-[11px] text-charcoal/40">
            Max discount: {formatPrice(maxDiscountAmount)}
          </p>
        ) : null}
        {minOrderAmount && minOrderAmount > 0 ? (
          <p className="mt-1 text-[11px] text-charcoal/40">
            Min. order: {formatPrice(minOrderAmount)}
          </p>
        ) : null}
        {expiresAt ? (
          <p className="mt-1 text-[11px] text-charcoal/40">
            Valid until{" "}
            {new Date(expiresAt).toLocaleDateString("en-PK", {
              month: "short",
              day: "numeric",
              year: "numeric"
            })}
          </p>
        ) : null}
      </div>
    </div>
  );
}


function CouponForm({
  existing,
  onDone
}: {
  existing?: ApiCoupon | null;
  onDone: () => void;
}) {
  const isEdit = !!existing;
  const showToast = useToastStore((state) => state.showToast);

  const [code, setCode] = React.useState(existing?.code ?? "");
  const [description, setDescription] = React.useState(
    existing?.description ?? ""
  );
  const [discountType, setDiscountType] = React.useState<CouponDiscountType>(
    existing?.discountType ?? "percentage"
  );
  const [discountValue, setDiscountValue] = React.useState(
    existing ? String(existing.discountValue) : "10"
  );
  const [maxDiscountAmount, setMaxDiscountAmount] = React.useState(
    existing?.maxDiscountAmount ? String(existing.maxDiscountAmount) : ""
  );
  const [minOrderAmount, setMinOrderAmount] = React.useState(
    existing ? String(existing.minOrderAmount) : "0"
  );
  const [usageLimit, setUsageLimit] = React.useState(
    existing?.usageLimit ? String(existing.usageLimit) : ""
  );
  const [perUserLimit, setPerUserLimit] = React.useState(
    existing?.perUserLimit ? String(existing.perUserLimit) : ""
  );
  const [startsAt, setStartsAt] = React.useState(() =>
    existing?.startsAt ? existing.startsAt.slice(0, 16) : ""
  );
  const [expiresAt, setExpiresAt] = React.useState(() =>
    existing?.expiresAt ? existing.expiresAt.slice(0, 16) : ""
  );

  const createMutation = useMutation({
    mutationFn: () =>
      createCoupon({
        code,
        description: description || undefined,
        discountType,
        discountValue: Number(discountValue),
        maxDiscountAmount: maxDiscountAmount
          ? Number(maxDiscountAmount)
          : undefined,
        minOrderAmount: minOrderAmount ? Number(minOrderAmount) : undefined,
        usageLimit: usageLimit ? Number(usageLimit) : undefined,
        perUserLimit: perUserLimit ? Number(perUserLimit) : undefined,
        isActive: true,
        startsAt: startsAt ? new Date(startsAt).toISOString() : undefined,
        expiresAt: expiresAt ? new Date(expiresAt).toISOString() : undefined
      }),
    onSuccess: () => {
      showToast("Coupon created");
      onDone();
    }
  });

  const editMutation = useMutation({
    mutationFn: () =>
      updateCoupon(existing!.id, {
        code: code || undefined,
        description: description || undefined,
        discountType,
        discountValue: Number(discountValue),
        maxDiscountAmount: maxDiscountAmount
          ? Number(maxDiscountAmount)
          : undefined,
        minOrderAmount: minOrderAmount ? Number(minOrderAmount) : undefined,
        usageLimit: usageLimit ? Number(usageLimit) : undefined,
        perUserLimit: perUserLimit ? Number(perUserLimit) : undefined,
        startsAt: startsAt
          ? new Date(startsAt).toISOString()
          : startsAt === ""
            ? ""
            : undefined,
        expiresAt: expiresAt
          ? new Date(expiresAt).toISOString()
          : expiresAt === ""
            ? ""
            : undefined
      }),
    onSuccess: () => {
      showToast("Coupon updated");
      onDone();
    }
  });

  const mutation = isEdit ? editMutation : createMutation;
  const error =
    mutation.error instanceof ApiRequestError
      ? mutation.error.message
      : mutation.isError
        ? `Failed to ${isEdit ? "update" : "create"} coupon.`
        : null;

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
      {/* Form */}
      <form
        onSubmit={(event) => {
          event.preventDefault();
          mutation.mutate();
        }}
        className="space-y-6"
      >
        {/* Coupon Details */}
        <div>
          <h3 className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-charcoal/40">
            Coupon Details
          </h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="couponCode" className="text-[12px]">
                Code
              </Label>
              <Input
                id="couponCode"
                className="mt-1.5 font-mono"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="e.g. SUMMER25"
                required
                minLength={3}
                maxLength={40}
              />
            </div>
            <div className="sm:col-span-2">
              <Label htmlFor="couponDesc" className="text-[12px]">
                Description{" "}
                <span className="font-normal text-charcoal/35">(optional)</span>
              </Label>
              <Input
                id="couponDesc"
                className="mt-1.5"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g. Summer sale discount"
                maxLength={300}
              />
            </div>
          </div>
        </div>

        {/* Discount */}
        <div>
          <h3 className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-charcoal/40">
            Discount
          </h3>
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <Label htmlFor="discountType" className="text-[12px]">
                Type
              </Label>
              <select
                id="discountType"
                value={discountType}
                onChange={(e) =>
                  setDiscountType(e.target.value as CouponDiscountType)
                }
                className="mt-1.5 w-full rounded-lg border border-charcoal/15 bg-white px-3 py-2.5 text-[13px] text-charcoal"
              >
                <option value="percentage">Percentage</option>
                <option value="fixed">Fixed Amount (PKR)</option>
              </select>
            </div>
            <div>
              <Label htmlFor="discountValue" className="text-[12px]">
                {discountType === "percentage" ? "Percentage" : "Amount (PKR)"}
              </Label>
              <div className="relative">
                <Input
                  id="discountValue"
                  type="number"
                  min="0"
                  max={discountType === "percentage" ? 100 : undefined}
                  step="0.01"
                  className="mt-1.5"
                  value={discountValue}
                  onChange={(e) => setDiscountValue(e.target.value)}
                  required
                />
                {discountType === "percentage" && (
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[12px] text-charcoal/30">
                    %
                  </span>
                )}
              </div>
            </div>
            <div>
              <Label htmlFor="maxDiscount" className="text-[12px]">
                Max Discount{" "}
                <span className="font-normal text-charcoal/35">(optional)</span>
              </Label>
              <Input
                id="maxDiscount"
                type="number"
                min="0"
                step="0.01"
                className="mt-1.5"
                value={maxDiscountAmount}
                onChange={(e) => setMaxDiscountAmount(e.target.value)}
                placeholder="No cap"
              />
            </div>
          </div>
        </div>

        {/* Eligibility */}
        <div>
          <h3 className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-charcoal/40">
            Eligibility
          </h3>
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <Label htmlFor="minOrder" className="text-[12px]">
                Min Order Amount
              </Label>
              <Input
                id="minOrder"
                type="number"
                min="0"
                step="0.01"
                className="mt-1.5"
                value={minOrderAmount}
                onChange={(e) => setMinOrderAmount(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="usageLimit" className="text-[12px]">
                Total Usage Limit{" "}
                <span className="font-normal text-charcoal/35">(optional)</span>
              </Label>
              <Input
                id="usageLimit"
                type="number"
                min="1"
                className="mt-1.5"
                value={usageLimit}
                onChange={(e) => setUsageLimit(e.target.value)}
                placeholder="Unlimited"
              />
            </div>
            <div>
              <Label htmlFor="perUserLimit" className="text-[12px]">
                Per-User Limit{" "}
                <span className="font-normal text-charcoal/35">(optional)</span>
              </Label>
              <Input
                id="perUserLimit"
                type="number"
                min="1"
                className="mt-1.5"
                value={perUserLimit}
                onChange={(e) => setPerUserLimit(e.target.value)}
                placeholder="Unlimited"
              />
            </div>
          </div>
        </div>

        {/* Schedule */}
        <div>
          <h3 className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-charcoal/40">
            Schedule
          </h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="startsAt" className="text-[12px]">
                Start Date{" "}
                <span className="font-normal text-charcoal/35">(optional)</span>
              </Label>
              <Input
                id="startsAt"
                type="datetime-local"
                className="mt-1.5"
                value={startsAt}
                onChange={(e) => setStartsAt(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="expiresAt" className="text-[12px]">
                Expiry Date{" "}
                <span className="font-normal text-charcoal/35">(optional)</span>
              </Label>
              <Input
                id="expiresAt"
                type="datetime-local"
                className="mt-1.5"
                value={expiresAt}
                onChange={(e) => setExpiresAt(e.target.value)}
              />
            </div>
          </div>
        </div>

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-3">
            <p className="text-[12px] text-red-600">{error}</p>
          </div>
        )}

        <Button
          type="submit"
          disabled={mutation.isPending}
          className="rounded-full"
        >
          {mutation.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : isEdit ? (
            "Save Changes"
          ) : (
            "Create Coupon"
          )}
        </Button>
      </form>

      {/* Live Preview */}
      <div className="lg:sticky lg:top-24 lg:self-start">
        <p className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-charcoal/40">
          Preview
        </p>
        <CouponPreviewCard
          code={code}
          discountType={discountType}
          discountValue={Number(discountValue) || 0}
          maxDiscountAmount={
            maxDiscountAmount ? Number(maxDiscountAmount) : undefined
          }
          minOrderAmount={Number(minOrderAmount) || undefined}
          expiresAt={expiresAt || null}
        />
      </div>
    </div>
  );
}


export function CouponsManager() {
  const [showCreateForm, setShowCreateForm] = React.useState(false);
  const [editingCoupon, setEditingCoupon] = React.useState<ApiCoupon | null>(
    null
  );
  const [search, setSearch] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<CouponStatus | "all">(
    "all"
  );
  const [typeFilter, setTypeFilter] = React.useState<CouponDiscountType | "all">(
    "all"
  );
  const [deleteTarget, setDeleteTarget] = React.useState<ApiCoupon | null>(
    null
  );
  const [detailTarget, setDetailTarget] = React.useState<ApiCoupon | null>(
    null
  );

  const queryClient = useQueryClient();
  const showToast = useToastStore((state) => state.showToast);

  const { data: coupons, isLoading, isError, refetch } = useQuery({
    queryKey: QUERY_KEY,
    queryFn: fetchCoupons
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      setCouponActive(id, isActive),
    onSuccess: () => {
      showToast("Coupon status updated");
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteCoupon(id),
    onSuccess: () => {
      showToast("Coupon deleted");
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      setDeleteTarget(null);
    }
  });

  const filtered = React.useMemo(() => {
    if (!coupons) return [];
    return coupons.filter((c) => {
      if (search) {
        const q = search.toLowerCase();
        if (
          !c.code.toLowerCase().includes(q) &&
          !(c.description && c.description.toLowerCase().includes(q))
        )
          return false;
      }
      const status = getCouponStatus(c);
      if (statusFilter !== "all" && status !== statusFilter) return false;
      if (typeFilter !== "all" && c.discountType !== typeFilter) return false;
      return true;
    });
  }, [coupons, search, statusFilter, typeFilter]);

  const stats = React.useMemo(() => {
    if (!coupons)
      return { total: 0, active: 0, scheduled: 0, expired: 0, totalRedemptions: 0 };
    let active = 0;
    let scheduled = 0;
    let expired = 0;
    let totalRedemptions = 0;
    for (const c of coupons) {
      const status = getCouponStatus(c);
      if (status === "active") active++;
      if (status === "scheduled") scheduled++;
      if (status === "expired") expired++;
      totalRedemptions += c.usageCount;
    }
    return {
      total: coupons.length,
      active,
      scheduled,
      expired,
      totalRedemptions
    };
  }, [coupons]);

  const hasFilters = search || statusFilter !== "all" || typeFilter !== "all";

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-serif text-display-md text-charcoal">
            Coupons
          </h1>
          <p className="mt-1 text-[13px] text-charcoal/45">
            Create and manage promotional discount codes for checkout.
          </p>
        </div>
        <Button
          type="button"
          onClick={() => setShowCreateForm(true)}
          className="rounded-full"
        >
          <Plus className="h-4 w-4" />
          Create Coupon
        </Button>
      </div>

      {/* Stats */}
      {!isLoading && coupons && coupons.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCard
            label="Total Coupons"
            count={stats.total}
            icon={Ticket}
            color="bg-charcoal/[0.04] text-charcoal/60"
          />
          <StatCard
            label="Active"
            count={stats.active}
            icon={Check}
            color="bg-emerald-50 text-emerald-600"
          />
          <StatCard
            label="Scheduled"
            count={stats.scheduled}
            icon={Clock}
            color="bg-amber-50 text-amber-600"
          />
          <StatCard
            label="Expired"
            count={stats.expired}
            icon={Ban}
            color="bg-charcoal/5 text-charcoal/50"
          />
        </div>
      )}

      {/* Search & Filters */}
      {coupons && coupons.length > 0 && (
        <div className="rounded-[10px] border border-charcoal/[0.06] bg-white p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-charcoal/35" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by code or description..."
                className="pl-8 text-[13px]"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) =>
                setStatusFilter(e.target.value as CouponStatus | "all")
              }
              className="rounded-lg border border-charcoal/15 bg-white px-3 py-2.5 text-[13px] text-charcoal"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active</option>
              <option value="scheduled">Scheduled</option>
              <option value="disabled">Disabled</option>
              <option value="expired">Expired</option>
              <option value="limit_reached">Limit Reached</option>
            </select>
            <select
              value={typeFilter}
              onChange={(e) =>
                setTypeFilter(
                  e.target.value as CouponDiscountType | "all"
                )
              }
              className="rounded-lg border border-charcoal/15 bg-white px-3 py-2.5 text-[13px] text-charcoal"
            >
              <option value="all">All Types</option>
              <option value="percentage">Percentage</option>
              <option value="fixed">Fixed Amount</option>
            </select>
            {hasFilters && (
              <button
                onClick={() => {
                  setSearch("");
                  setStatusFilter("all");
                  setTypeFilter("all");
                }}
                className="text-[12px] font-medium text-forest hover:underline"
              >
                Clear
              </button>
            )}
          </div>
        </div>
      )}

      {/* Create Form Dialog */}
      <Dialog open={showCreateForm} onOpenChange={setShowCreateForm}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create Coupon</DialogTitle>
            <DialogDescription>
              Set up a new discount code for customers to use at checkout.
            </DialogDescription>
          </DialogHeader>
          <CouponForm
            onDone={() => {
              setShowCreateForm(false);
              queryClient.invalidateQueries({ queryKey: QUERY_KEY });
            }}
          />
        </DialogContent>
      </Dialog>

      {/* Edit Form Dialog */}
      <Dialog
        open={!!editingCoupon}
        onOpenChange={(open) => !open && setEditingCoupon(null)}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Coupon</DialogTitle>
            <DialogDescription>
              Update the details for {editingCoupon?.code}.
            </DialogDescription>
          </DialogHeader>
          {editingCoupon && (
            <CouponForm
              existing={editingCoupon}
              onDone={() => {
                setEditingCoupon(null);
                queryClient.invalidateQueries({ queryKey: QUERY_KEY });
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Coupon</DialogTitle>
            <DialogDescription>
              This action cannot be undone. The coupon will be permanently
              removed.
            </DialogDescription>
          </DialogHeader>
          {deleteTarget && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 rounded-lg bg-red-50 p-4">
                <AlertTriangle className="h-5 w-5 shrink-0 text-red-500" />
                <div>
                  <p className="text-[13px] font-medium text-red-700">
                    Delete coupon{" "}
                    <span className="font-mono">{deleteTarget.code}</span>?
                  </p>
                  <p className="mt-0.5 text-[12px] text-red-600/70">
                    This will permanently remove the coupon and its
                    configuration.
                  </p>
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  variant="ghost"
                  onClick={() => setDeleteTarget(null)}
                >
                  Cancel
                </Button>
                <Button
                  variant="outline"
                  disabled={deleteMutation.isPending}
                  onClick={() => deleteMutation.mutate(deleteTarget.id)}
                  className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                >
                  {deleteMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    "Delete Coupon"
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Detail Dialog */}
      <Dialog
        open={!!detailTarget}
        onOpenChange={(open) => !open && setDetailTarget(null)}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Coupon Details</DialogTitle>
          </DialogHeader>
          {detailTarget && <CouponDetailContent coupon={detailTarget} />}
          <div className="flex justify-end">
            <Button
              variant="ghost"
              onClick={() => setDetailTarget(null)}
              className="rounded-full"
            >
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Table / List */}
      <div className="rounded-[10px] border border-charcoal/[0.06] bg-white">
        {isLoading ? (
          <div className="p-5">
            <CouponSkeleton />
          </div>
        ) : isError ? (
          <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-50">
              <AlertCircle className="h-5 w-5 text-red-500" />
            </div>
            <p className="text-[13px] font-medium text-charcoal">
              Failed to load coupons
            </p>
            <p className="text-[12px] text-charcoal/45">
              Something went wrong while fetching coupon data.
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              className="rounded-full"
            >
              Try Again
            </Button>
          </div>
        ) : !coupons || coupons.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-charcoal/[0.04]">
              <Tags className="h-5 w-5 text-charcoal/25" />
            </div>
            <p className="text-[13px] font-medium text-charcoal/70">
              No coupons yet
            </p>
            <p className="text-[12px] text-charcoal/40">
              Create your first coupon to offer discounts to customers.
            </p>
            <Button
              size="sm"
              onClick={() => setShowCreateForm(true)}
              className="mt-2 rounded-full"
            >
              <Plus className="h-4 w-4" />
              Create Coupon
            </Button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
            <Search className="h-5 w-5 text-charcoal/20" />
            <p className="text-[13px] font-medium text-charcoal/60">
              No coupons match your filters
            </p>
            <p className="text-[12px] text-charcoal/40">
              Try adjusting your search or filter criteria.
            </p>
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full text-left text-[13px]">
                <thead>
                  <tr className="border-b border-charcoal/[0.06] text-[11px] uppercase tracking-wider text-charcoal/35">
                    <th className="px-5 py-3 font-medium">Coupon</th>
                    <th className="px-5 py-3 font-medium">Discount</th>
                    <th className="px-5 py-3 font-medium">Min Order</th>
                    <th className="px-5 py-3 font-medium">Usage</th>
                    <th className="px-5 py-3 font-medium">Validity</th>
                    <th className="px-5 py-3 font-medium">Status</th>
                    <th className="px-5 py-3 text-right font-medium">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((coupon) => (
                    <CouponTableRow
                      key={coupon.id}
                      coupon={coupon}
                      onEdit={() => setEditingCoupon(coupon)}
                      onToggle={() =>
                        toggleMutation.mutate({
                          id: coupon.id,
                          isActive: !coupon.isActive
                        })
                      }
                      onDelete={() => setDeleteTarget(coupon)}
                      onViewDetail={() => setDetailTarget(coupon)}
                      isToggling={toggleMutation.isPending}
                    />
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile card list */}
            <div className="divide-y divide-charcoal/[0.04] md:hidden">
              {filtered.map((coupon) => (
                <CouponMobileCard
                  key={coupon.id}
                  coupon={coupon}
                  onEdit={() => setEditingCoupon(coupon)}
                  onToggle={() =>
                    toggleMutation.mutate({
                      id: coupon.id,
                      isActive: !coupon.isActive
                    })
                  }
                  onDelete={() => setDeleteTarget(coupon)}
                  onViewDetail={() => setDetailTarget(coupon)}
                  isToggling={toggleMutation.isPending}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}


function CouponTableRow({
  coupon,
  onEdit,
  onToggle,
  onDelete,
  onViewDetail,
  isToggling
}: {
  coupon: ApiCoupon;
  onEdit: () => void;
  onToggle: () => void;
  onDelete: () => void;
  onViewDetail: () => void;
  isToggling: boolean;
}) {
  const [menuOpen, setMenuOpen] = React.useState(false);
  const menuRef = React.useRef<HTMLDivElement>(null);
  const status = getCouponStatus(coupon);
  const statusConfig = STATUS_CONFIG[status];

  React.useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    if (menuOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [menuOpen]);

  const usagePct =
    coupon.usageLimit
      ? Math.min(100, (coupon.usageCount / coupon.usageLimit) * 100)
      : null;

  return (
    <tr className="border-b border-charcoal/[0.04] transition-colors hover:bg-charcoal/[0.01]">
      <td className="px-5 py-3.5">
        <div>
          <p className="font-mono font-medium text-charcoal">{coupon.code}</p>
          {coupon.description && (
            <p className="mt-0.5 max-w-[200px] truncate text-[11px] text-charcoal/35">
              {coupon.description}
            </p>
          )}
        </div>
      </td>
      <td className="px-5 py-3.5">
        <div className="flex items-baseline gap-1.5">
          <span className="font-medium text-charcoal">
            {coupon.discountType === "percentage"
              ? `${coupon.discountValue}%`
              : formatPrice(coupon.discountValue)}
          </span>
          {coupon.maxDiscountAmount && (
            <span className="text-[10px] text-charcoal/30">
              (max {formatPrice(coupon.maxDiscountAmount)})
            </span>
          )}
        </div>
      </td>
      <td className="px-5 py-3.5 text-charcoal/55">
        {coupon.minOrderAmount > 0 ? formatPrice(coupon.minOrderAmount) : "—"}
      </td>
      <td className="px-5 py-3.5">
        <div>
          <span className="font-medium text-charcoal">
            {coupon.usageCount}
          </span>
          {coupon.usageLimit ? (
            <span className="text-charcoal/35">
              {" "}/ {coupon.usageLimit}
            </span>
          ) : (
            <span className="text-charcoal/25"> / ∞</span>
          )}
          {usagePct !== null && (
            <div className="mt-1.5 h-1 w-16 overflow-hidden rounded-full bg-charcoal/[0.06]">
              <div
                className={cn(
                  "h-full rounded-full transition-all",
                  usagePct >= 90 ? "bg-red-400" : "bg-forest/60"
                )}
                style={{ width: `${usagePct}%` }}
              />
            </div>
          )}
        </div>
      </td>
      <td className="px-5 py-3.5 text-[12px] text-charcoal/45">
        <div>
          {coupon.startsAt && (
            <p>
              {new Date(coupon.startsAt).toLocaleDateString("en-PK", {
                month: "short",
                day: "numeric"
              })}
              {" – "}
            </p>
          )}
          {coupon.expiresAt ? (
            <p>
              {coupon.startsAt ? "" : "Until "}
              {new Date(coupon.expiresAt).toLocaleDateString("en-PK", {
                month: "short",
                day: "numeric",
                year: "numeric"
              })}
            </p>
          ) : coupon.startsAt ? (
            <p>No expiry</p>
          ) : (
            <p>—</p>
          )}
        </div>
      </td>
      <td className="px-5 py-3.5">
        <Badge variant={statusConfig.variant} className="text-[10px]">
          {statusConfig.label}
        </Badge>
      </td>
      <td className="px-5 py-3.5 text-right">
        <div className="relative inline-block" ref={menuRef}>
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="flex h-8 w-8 items-center justify-center rounded-full text-charcoal/35 transition-colors hover:bg-charcoal/5 hover:text-charcoal"
            aria-label="Coupon actions"
          >
            <MoreVertical className="h-4 w-4" />
          </button>
          {menuOpen && (
            <div className="absolute right-0 top-full z-30 mt-1 w-44 overflow-hidden rounded-[8px] border border-charcoal/[0.08] bg-white py-1 shadow-lg">
              <button
                onClick={() => {
                  onViewDetail();
                  setMenuOpen(false);
                }}
                className="flex w-full items-center gap-2.5 px-3.5 py-2 text-[13px] text-charcoal/70 transition-colors hover:bg-charcoal/[0.04]"
              >
                <Eye className="h-3.5 w-3.5" />
                View Details
              </button>
              <button
                onClick={() => {
                  onEdit();
                  setMenuOpen(false);
                }}
                className="flex w-full items-center gap-2.5 px-3.5 py-2 text-[13px] text-charcoal/70 transition-colors hover:bg-charcoal/[0.04]"
              >
                <Pencil className="h-3.5 w-3.5" />
                Edit Coupon
              </button>
              <button
                onClick={() => {
                  onToggle();
                  setMenuOpen(false);
                }}
                disabled={isToggling}
                className="flex w-full items-center gap-2.5 px-3.5 py-2 text-[13px] text-charcoal/70 transition-colors hover:bg-charcoal/[0.04] disabled:opacity-50"
              >
                {coupon.isActive ? "Disable" : "Enable"}
              </button>
              <div className="my-1 border-t border-charcoal/[0.06]" />
              <button
                onClick={() => {
                  onDelete();
                  setMenuOpen(false);
                }}
                className="flex w-full items-center gap-2.5 px-3.5 py-2 text-[13px] text-red-500 transition-colors hover:bg-red-50"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Delete
              </button>
            </div>
          )}
        </div>
      </td>
    </tr>
  );
}


function CouponMobileCard({
  coupon,
  onEdit,
  onToggle,
  onViewDetail,
  isToggling
}: {
  coupon: ApiCoupon;
  onEdit: () => void;
  onToggle: () => void;
  onDelete: () => void;
  onViewDetail: () => void;
  isToggling: boolean;
}) {
  const status = getCouponStatus(coupon);
  const statusConfig = STATUS_CONFIG[status];

  return (
    <div className="px-5 py-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-mono font-medium text-charcoal">{coupon.code}</p>
          {coupon.description && (
            <p className="mt-0.5 text-[11px] text-charcoal/35">
              {coupon.description}
            </p>
          )}
        </div>
        <Badge variant={statusConfig.variant} className="shrink-0 text-[10px]">
          {statusConfig.label}
        </Badge>
      </div>
      <div className="mt-2.5 flex flex-wrap items-center gap-3 text-[12px]">
        <span className="font-medium text-charcoal">
          {coupon.discountType === "percentage"
            ? `${coupon.discountValue}%`
            : formatPrice(coupon.discountValue)}
        </span>
        <span className="text-charcoal/30">·</span>
        <span className="text-charcoal/45">
          {coupon.usageCount}
          {coupon.usageLimit ? ` / ${coupon.usageLimit}` : " / ∞"} used
        </span>
        {coupon.expiresAt && (
          <>
            <span className="text-charcoal/30">·</span>
            <span className="text-charcoal/40">
              Expires{" "}
              {new Date(coupon.expiresAt).toLocaleDateString("en-PK", {
                month: "short",
                day: "numeric"
              })}
            </span>
          </>
        )}
      </div>
      <div className="mt-3 flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={onViewDetail}
          className="h-8 rounded-full text-[12px]"
        >
          Details
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={onEdit}
          className="h-8 rounded-full text-[12px]"
        >
          Edit
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={onToggle}
          disabled={isToggling}
          className="h-8 rounded-full text-[12px]"
        >
          {coupon.isActive ? "Disable" : "Enable"}
        </Button>
      </div>
    </div>
  );
}


function CouponDetailContent({ coupon }: { coupon: ApiCoupon }) {
  const status = getCouponStatus(coupon);
  const statusConfig = STATUS_CONFIG[status];

  const rows: { label: string; value: React.ReactNode }[] = [
    { label: "Code", value: <span className="font-mono font-medium">{coupon.code}</span> },
    ...(coupon.description
      ? [{ label: "Description", value: coupon.description }]
      : []),
    {
      label: "Discount",
      value:
        coupon.discountType === "percentage"
          ? `${coupon.discountValue}%`
          : formatPrice(coupon.discountValue)
    },
    ...(coupon.maxDiscountAmount
      ? [{ label: "Max Discount", value: formatPrice(coupon.maxDiscountAmount) }]
      : []),
    {
      label: "Min Order",
      value:
        coupon.minOrderAmount > 0
          ? formatPrice(coupon.minOrderAmount)
          : "No minimum"
    },
    {
      label: "Usage",
      value: coupon.usageLimit
        ? `${coupon.usageCount} / ${coupon.usageLimit}`
        : `${coupon.usageCount} / Unlimited`
    },
    ...(coupon.perUserLimit
      ? [{ label: "Per-User Limit", value: `${coupon.perUserLimit} per customer` }]
      : []),
    {
      label: "Start Date",
      value: coupon.startsAt
        ? new Date(coupon.startsAt).toLocaleDateString("en-PK", {
            year: "numeric",
            month: "long",
            day: "numeric"
          })
        : "Immediate"
    },
    {
      label: "Expiry Date",
      value: coupon.expiresAt
        ? new Date(coupon.expiresAt).toLocaleDateString("en-PK", {
            year: "numeric",
            month: "long",
            day: "numeric"
          })
        : "No expiry"
    },
    {
      label: "Status",
      value: (
        <Badge variant={statusConfig.variant} className="text-[10px]">
          {statusConfig.label}
        </Badge>
      )
    },
    {
      label: "Created",
      value: new Date(coupon.createdAt).toLocaleDateString("en-PK", {
        year: "numeric",
        month: "long",
        day: "numeric"
      })
    }
  ];

  return (
    <div className="space-y-0">
      {rows.map((row) => (
        <div
          key={row.label}
          className="flex justify-between border-b border-charcoal/[0.04] py-2.5 text-[13px] last:border-none"
        >
          <span className="text-charcoal/45">{row.label}</span>
          <span className="ml-4 text-right text-charcoal/75">{row.value}</span>
        </div>
      ))}
    </div>
  );
}
