"use client";

import * as React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Loader2,
  Star,
  Trash2,
  Eye,
  EyeOff,
  CheckCircle,
  XCircle,
  RotateCcw,
  Clock,
  Search,
  X
} from "lucide-react";
import Link from "next/link";
import {
  fetchAdminReviews,
  fetchReviewStats,
  updateReviewStatus,
  deleteReviewAsAdmin
} from "@/lib/api/reviews";
import { ApiRequestError } from "@/lib/api/client";
import { queryKeys } from "@/lib/api/query-keys";
import type { ApiAdminReview, ReviewStatus } from "@/lib/api/types";
import { useToastStore } from "@/store/use-toast-store";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric"
  });
}

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
}

const STATUS_CONFIG: Record<ReviewStatus, { label: string; color: string; icon: React.ElementType }> = {
  pending: { label: "Pending", color: "bg-amber-50 text-amber-700", icon: Clock },
  approved: { label: "Approved", color: "bg-emerald-50 text-emerald-700", icon: CheckCircle },
  rejected: { label: "Rejected", color: "bg-red-50 text-red-600", icon: XCircle },
  hidden: { label: "Hidden", color: "bg-gray-100 text-gray-600", icon: EyeOff }
};

const STATUS_FILTERS: { key: ReviewStatus | "all"; label: string }[] = [
  { key: "all", label: "All" },
  { key: "pending", label: "Pending" },
  { key: "approved", label: "Approved" },
  { key: "rejected", label: "Rejected" },
  { key: "hidden", label: "Hidden" }
];

const RATING_FILTERS = [5, 4, 3, 2, 1] as const;

function StatCard({ label, value, icon: Icon, accent }: { label: string; value: number; icon: React.ElementType; accent?: string }) {
  return (
    <div className="flex items-center gap-3 rounded-[10px] border border-charcoal/[0.06] bg-white p-4">
      <div className={cn("flex h-10 w-10 items-center justify-center rounded-full", accent ?? "bg-charcoal/[0.04]")}>
        <Icon className={cn("h-5 w-5", accent ? "text-white" : "text-charcoal/50")} />
      </div>
      <div>
        <p className="text-[22px] font-semibold leading-tight text-charcoal">{value}</p>
        <p className="text-[11px] text-charcoal/45">{label}</p>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: ReviewStatus }) {
  const config = STATUS_CONFIG[status];
  const Icon = config.icon;
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium", config.color)}>
      <Icon className="h-3 w-3" />
      {config.label}
    </span>
  );
}

function ReviewDetailModal({
  review,
  open,
  onClose,
  onAction
}: {
  review: ApiAdminReview | null;
  open: boolean;
  onClose: () => void;
  onAction: (reviewId: string, action: ReviewStatus | "delete") => void;
}) {
  if (!review) return null;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Review Details</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="rounded-lg border border-charcoal/[0.06] p-4">
            <p className="text-overline uppercase text-charcoal/40">Customer</p>
            <p className="mt-1 font-medium text-charcoal">{review.userName}</p>
            {review.userEmail && (
              <p className="text-[12px] text-charcoal/50">{review.userEmail}</p>
            )}
          </div>

          {}
          <div className="rounded-lg border border-charcoal/[0.06] p-4">
            <p className="text-overline uppercase text-charcoal/40">Product</p>
            {review.productSlug ? (
              <Link
                href={`/shop/${review.productSlug}`}
                className="mt-1 block font-medium text-forest hover:underline"
                target="_blank"
              >
                {review.productName}
              </Link>
            ) : (
              <p className="mt-1 font-medium text-charcoal">{review.productName}</p>
            )}
          </div>

          {}
          <div className="rounded-lg border border-charcoal/[0.06] p-4">
            <p className="text-overline uppercase text-charcoal/40">Rating</p>
            <div className="mt-1 flex items-center gap-0.5">
              {Array.from({ length: 5 }).map((_, index) => (
                <Star
                  key={index}
                  className={cn(
                    "h-5 w-5",
                    index < review.rating
                      ? "fill-sand text-sand"
                      : "fill-charcoal/10 text-charcoal/10"
                  )}
                />
              ))}
              <span className="ml-2 text-[13px] text-charcoal/50">({review.rating}/5)</span>
            </div>
          </div>

          {}
          <div className="rounded-lg border border-charcoal/[0.06] p-4">
            <p className="text-overline uppercase text-charcoal/40">Review</p>
            <p className="mt-2 text-[13px] leading-relaxed text-charcoal/75">{review.comment}</p>
            {review.images.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {review.images.map((url) => (
                  <a
                    key={url}
                    href={url}
                    target="_blank"
                    rel="noreferrer"
                    className="block h-20 w-20 overflow-hidden rounded-[6px] border border-charcoal/10"
                  >
                    <img src={url} alt="Review photo" className="h-full w-full object-cover" />
                  </a>
                ))}
              </div>
            )}
          </div>

          {}
          <div className="flex items-center justify-between rounded-lg border border-charcoal/[0.06] p-4">
            <div>
              <p className="text-overline uppercase text-charcoal/40">Status</p>
              <div className="mt-1">
                <StatusBadge status={review.status} />
              </div>
            </div>
            <div className="text-right">
              <p className="text-overline uppercase text-charcoal/40">Submitted</p>
              <p className="mt-1 text-[12px] text-charcoal/55">{formatDateTime(review.createdAt)}</p>
            </div>
          </div>

          {}
          <div className="flex flex-wrap gap-2 border-t border-charcoal/[0.06] pt-4">
            {review.status !== "approved" && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => onAction(review.id, "approved")}
                className="gap-1.5 text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700"
              >
                <CheckCircle className="h-3.5 w-3.5" />
                Approve
              </Button>
            )}
            {review.status !== "rejected" && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => onAction(review.id, "rejected")}
                className="gap-1.5 text-red-600 hover:bg-red-50 hover:text-red-700"
              >
                <XCircle className="h-3.5 w-3.5" />
                Reject
              </Button>
            )}
            {review.status === "approved" && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => onAction(review.id, "hidden")}
                className="gap-1.5 text-gray-600 hover:bg-gray-50 hover:text-gray-700"
              >
                <EyeOff className="h-3.5 w-3.5" />
                Hide
              </Button>
            )}
            {review.status === "hidden" && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => onAction(review.id, "approved")}
                className="gap-1.5 text-forest hover:bg-forest/5"
              >
                <Eye className="h-3.5 w-3.5" />
                Unhide
              </Button>
            )}
            {review.status === "pending" && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => onAction(review.id, "pending")}
                className="gap-1.5 text-amber-600 hover:bg-amber-50 hover:text-amber-700"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Reset to Pending
              </Button>
            )}
            <Button
              size="sm"
              variant="outline"
              onClick={() => onAction(review.id, "delete")}
              className="gap-1.5 text-red-600 hover:bg-red-50 hover:text-red-700"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Delete
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function AdminReviewsTable() {
  const [statusFilter, setStatusFilter] = React.useState<ReviewStatus | "all">("all");
  const [ratingFilter, setRatingFilter] = React.useState<number | null>(null);
  const [search, setSearch] = React.useState("");
  const [debouncedSearch, setDebouncedSearch] = React.useState("");
  const [selectedReview, setSelectedReview] = React.useState<ApiAdminReview | null>(null);
  const [detailOpen, setDetailOpen] = React.useState(false);
  const [confirmingDeleteId, setConfirmingDeleteId] = React.useState<string | null>(null);
  const showToast = useToastStore((state) => state.showToast);
  const queryClient = useQueryClient();

  React.useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  const params = React.useMemo(
    () => ({
      limit: 100,
      ...(statusFilter !== "all" ? { status: statusFilter } : {}),
      ...(ratingFilter !== null ? { rating: ratingFilter } : {}),
      ...(debouncedSearch ? { search: debouncedSearch } : {})
    }),
    [statusFilter, ratingFilter, debouncedSearch]
  );

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: queryKeys.adminReviews.all,
    queryFn: fetchReviewStats
  });

  const {
    data,
    isLoading,
    isError,
    error,
    refetch
  } = useQuery({
    queryKey: queryKeys.adminReviews.list(params),
    queryFn: () => fetchAdminReviews(1, params.limit, params)
  });

  const reviews = data?.data ?? [];
  const loadError = isError
    ? error instanceof ApiRequestError
      ? error.message
      : "Failed to load reviews."
    : null;

  const statusMutation = useMutation({
    mutationFn: ({ reviewId, status }: { reviewId: string; status: ReviewStatus }) =>
      updateReviewStatus(reviewId, status),
    onSuccess: (_result, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.adminReviews.all });
      showToast(`Review ${variables.status === "approved" ? "approved" : variables.status === "rejected" ? "rejected" : variables.status === "hidden" ? "hidden" : "updated"}`);

      setSelectedReview((prev) =>
        prev && prev.id === variables.reviewId ? { ...prev, status: variables.status } : prev
      );
    },
    onError: (err) => {
      showToast(err instanceof ApiRequestError ? err.message : "Failed to update review status", "error");
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (reviewId: string) => deleteReviewAsAdmin(reviewId),
    onSuccess: (_result, reviewId) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.adminReviews.all });
      showToast("Review deleted");
      setConfirmingDeleteId(null);
      setSelectedReview((prev) => (prev && prev.id === reviewId ? null : prev));
      setDetailOpen((prev) => {
        if (selectedReview?.id === reviewId) return false;
        return prev;
      });
    },
    onError: (err) => {
      showToast(err instanceof ApiRequestError ? err.message : "Failed to delete review", "error");
      setConfirmingDeleteId(null);
    }
  });

  function handleAction(reviewId: string, action: ReviewStatus | "delete") {
    if (action === "delete") {
      if (!window.confirm("Permanently delete this review? This cannot be undone.")) return;
      deleteMutation.mutate(reviewId);
    } else {
      statusMutation.mutate({ reviewId, status: action });
    }
  }

  function openDetail(review: ApiAdminReview) {
    setSelectedReview(review);
    setDetailOpen(true);
  }

  return (
    <div className="space-y-5">
      {}
      {!statsLoading && stats && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          <StatCard label="Total Reviews" value={stats.total} icon={Star} accent="bg-forest" />
          <StatCard label="Pending" value={stats.pending} icon={Clock} accent="bg-amber-500" />
          <StatCard label="Approved" value={stats.approved} icon={CheckCircle} accent="bg-emerald-500" />
          <StatCard label="Rejected" value={stats.rejected} icon={XCircle} accent="bg-red-500" />
          <StatCard label="Avg Rating" value={stats.averageRating} icon={Star} accent="bg-sand" />
        </div>
      )}

      {}
      <div className="rounded-[10px] border border-charcoal/[0.06] bg-white p-4">
        <div className="flex flex-wrap items-center gap-3">
          {}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-charcoal/35" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by customer, product, or review text..."
              className="pl-9 h-9"
              aria-label="Search reviews"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-charcoal/35 hover:text-charcoal/60"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {}
          <div className="flex items-center gap-1">
            {STATUS_FILTERS.map((filter) => (
              <button
                key={filter.key}
                onClick={() => setStatusFilter(filter.key)}
                className={cn(
                  "rounded-full px-3 py-1.5 text-[11px] font-medium transition-colors",
                  statusFilter === filter.key
                    ? "bg-forest text-white"
                    : "bg-charcoal/[0.04] text-charcoal/55 hover:bg-charcoal/[0.08]"
                )}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>

        {}
        <div className="mt-3 flex items-center gap-2">
          <span className="text-[11px] text-charcoal/40">Rating:</span>
          <button
            onClick={() => setRatingFilter(null)}
            className={cn(
              "rounded-full px-2.5 py-1 text-[11px] font-medium transition-colors",
              ratingFilter === null
                ? "bg-forest text-white"
                : "bg-charcoal/[0.04] text-charcoal/55 hover:bg-charcoal/[0.08]"
            )}
          >
            All
          </button>
          {RATING_FILTERS.map((rating) => (
            <button
              key={rating}
              onClick={() => setRatingFilter(ratingFilter === rating ? null : rating)}
              className={cn(
                "flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-medium transition-colors",
                ratingFilter === rating
                  ? "bg-forest text-white"
                  : "bg-charcoal/[0.04] text-charcoal/55 hover:bg-charcoal/[0.08]"
              )}
            >
              {rating}
              <Star className={cn("h-3 w-3", ratingFilter === rating ? "fill-white text-white" : "fill-sand text-sand")} />
            </button>
          ))}
        </div>
      </div>

      {}
      <div className="rounded-[10px] border border-charcoal/[0.06] bg-white p-5">
        <div className="mb-4 flex items-center justify-between">
          <p className="text-[12px] text-charcoal/45">
            {reviews.length} review{reviews.length === 1 ? "" : "s"}
          </p>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center gap-2 py-16 text-[13px] text-charcoal/50">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading reviews...
          </div>
        ) : loadError ? (
          <div className="py-16 text-center text-[13px] text-red-500">
            {loadError}
            <button
              onClick={() => refetch()}
              className="mt-2 block w-full text-[12px] font-medium text-forest hover:underline"
            >
              Try again
            </button>
          </div>
        ) : reviews.length === 0 ? (
          <div className="py-16 text-center text-[13px] text-charcoal/50">
            {search || statusFilter !== "all" || ratingFilter !== null
              ? "No reviews match your filters."
              : "No reviews yet."}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[13px]">
              <thead>
                <tr className="border-b border-charcoal/[0.06] text-overline uppercase text-charcoal/35">
                  <th className="py-2.5 pr-4 font-medium">Customer</th>
                  <th className="py-2.5 pr-4 font-medium">Product</th>
                  <th className="py-2.5 pr-4 font-medium">Rating</th>
                  <th className="py-2.5 pr-4 font-medium">Review</th>
                  <th className="py-2.5 pr-4 font-medium">Status</th>
                  <th className="py-2.5 pr-4 font-medium">Date</th>
                  <th className="py-2.5 pr-4 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {reviews.map((review) => (
                  <tr
                    key={review.id}
                    className="border-b border-charcoal/[0.04] align-top last:border-none hover:bg-charcoal/[0.01]"
                  >
                    <td className="py-3 pr-4 text-charcoal/70">
                      <div className="font-medium">{review.userName}</div>
                      {review.userEmail && (
                        <div className="text-[11px] text-charcoal/40">{review.userEmail}</div>
                      )}
                    </td>
                    <td className="py-3 pr-4 text-charcoal/70">
                      {review.productSlug ? (
                        <Link
                          href={`/shop/${review.productSlug}`}
                          className="font-medium text-forest hover:underline"
                          target="_blank"
                        >
                          {review.productName}
                        </Link>
                      ) : (
                        <span className="font-medium">{review.productName}</span>
                      )}
                    </td>
                    <td className="py-3 pr-4">
                      <div className="flex items-center gap-0.5">
                        {Array.from({ length: 5 }).map((_, index) => (
                          <Star
                            key={index}
                            className={cn(
                              "h-3.5 w-3.5",
                              index < review.rating
                                ? "fill-sand text-sand"
                                : "fill-charcoal/10 text-charcoal/10"
                            )}
                          />
                        ))}
                      </div>
                    </td>
                    <td className="max-w-xs py-3 pr-4 text-charcoal/60">
                      <p className="line-clamp-2">{review.comment}</p>
                      {review.images.length > 0 && (
                        <div className="mt-1.5 flex gap-1">
                          {review.images.map((url) => (
                            <a
                              key={url}
                              href={url}
                              target="_blank"
                              rel="noreferrer"
                              className="block h-8 w-8 overflow-hidden rounded-[4px] border border-charcoal/[0.08]"
                            >
                              <img src={url} alt="" className="h-full w-full object-cover" />
                            </a>
                          ))}
                        </div>
                      )}
                    </td>
                    <td className="py-3 pr-4">
                      <StatusBadge status={review.status} />
                    </td>
                    <td className="py-3 pr-4 text-[12px] text-charcoal/40">
                      {formatDate(review.createdAt)}
                    </td>
                    <td className="py-3 pr-4">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => openDetail(review)}
                          className="rounded-full p-1.5 text-charcoal/40 hover:bg-charcoal/5 hover:text-forest"
                          title="View details"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        {review.status !== "approved" && (
                          <button
                            onClick={() => handleAction(review.id, "approved")}
                            className="rounded-full p-1.5 text-charcoal/40 hover:bg-emerald-50 hover:text-emerald-600"
                            title="Approve"
                          >
                            <CheckCircle className="h-4 w-4" />
                          </button>
                        )}
                        {review.status !== "rejected" && (
                          <button
                            onClick={() => handleAction(review.id, "rejected")}
                            className="rounded-full p-1.5 text-charcoal/40 hover:bg-red-50 hover:text-red-500"
                            title="Reject"
                          >
                            <XCircle className="h-4 w-4" />
                          </button>
                        )}
                        {review.status === "approved" && (
                          <button
                            onClick={() => handleAction(review.id, "hidden")}
                            className="rounded-full p-1.5 text-charcoal/40 hover:bg-gray-100 hover:text-gray-600"
                            title="Hide"
                          >
                            <EyeOff className="h-4 w-4" />
                          </button>
                        )}
                        {confirmingDeleteId === review.id ? (
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleAction(review.id, "delete")}
                              disabled={deleteMutation.isPending}
                              className="text-[11px] font-medium text-red-600 hover:underline"
                            >
                              Confirm
                            </button>
                            <button
                              onClick={() => setConfirmingDeleteId(null)}
                              className="text-[11px] font-medium text-charcoal/45 hover:underline"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setConfirmingDeleteId(review.id)}
                            className="rounded-full p-1.5 text-charcoal/40 hover:bg-red-50 hover:text-red-500"
                            title="Delete"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {}
      <ReviewDetailModal
        review={selectedReview}
        open={detailOpen}
        onClose={() => {
          setDetailOpen(false);
          setSelectedReview(null);
        }}
        onAction={handleAction}
      />
    </div>
  );
}
