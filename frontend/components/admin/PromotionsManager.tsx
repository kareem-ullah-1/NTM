"use client";

import * as React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Loader2,
  Plus,
  Trash2,
  Pencil,
  Search,
  X,
  Tag,
  AlertTriangle,
  Timer,
  Zap,
  BarChart3,
  Target,
} from "lucide-react";
import {
  createPromotion,
  deletePromotion,
  fetchPromotions,
  setPromotionActive,
  updatePromotion,
  getPromotion,
  type ApiPromotion,
  type PromotionInput,
  type PromotionTargetType,
} from "@/lib/api/promotions";
import { fetchProducts } from "@/lib/api/products";
import { fetchCategories, fetchFabricTypes } from "@/lib/api/catalog";
import { ApiRequestError } from "@/lib/api/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToastStore } from "@/store/use-toast-store";
import { formatPrice, cn } from "@/lib/utils";
import { VideoUploadField } from "@/components/admin/VideoUploadField";
import { FeaturedProductPicker } from "@/components/admin/FeaturedProductPicker";
import { ImageUploadField } from "@/components/admin/ImageUploadField"

const QUERY_KEY = ["admin", "promotions"] as const;

function getPromotionStatus(
  promo: ApiPromotion
): "Active" | "Scheduled" | "Expired" | "Draft" {
  const now = new Date();
  if (!promo.isActive) return "Draft";
  if (now < new Date(promo.startsAt)) return "Scheduled";
  if (now > new Date(promo.expiresAt)) return "Expired";
  return "Active";
}

function getStatusVariant(status: string) {
  switch (status) {
    case "Active":
      return "success" as const;
    case "Scheduled":
      return "warning" as const;
    case "Expired":
      return "muted" as const;
    case "Draft":
      return "outline" as const;
    default:
      return "muted" as const;
  }
}

const STATUS_FILTERS = [
  "All",
  "Active",
  "Scheduled",
  "Expired",
  "Draft",
] as const;
const TARGET_FILTERS = [
  "All",
  "ALL_PRODUCTS",
  "CATEGORIES",
  "FABRIC_TYPES",
  "PRODUCTS",
] as const;
const TARGET_LABELS: Record<PromotionTargetType, string> = {
  ALL_PRODUCTS: "All Products",
  CATEGORIES: "Categories",
  FABRIC_TYPES: "Fabric Types",
  PRODUCTS: "Specific Products",
};

const TARGET_DESCRIPTIONS: Record<PromotionTargetType, string> = {
  ALL_PRODUCTS: "Apply this promotion to every eligible product.",
  CATEGORIES: "Apply this promotion only to selected categories.",
  FABRIC_TYPES: "Apply this promotion only to selected fabric types.",
  PRODUCTS: "Apply this promotion only to selected products.",
};

function formatDateRange(startsAt: string, expiresAt: string) {
  const start = new Date(startsAt);
  const end = new Date(expiresAt);
  return `${start.toLocaleDateString("en-PK", { month: "short", day: "numeric" })} – ${end.toLocaleDateString("en-PK", { month: "short", day: "numeric" })}`;
}


function StatPill({
  label,
  count,
  icon: Icon,
  color,
}: {
  label: string;
  count: number;
  icon: React.ElementType;
  color: string;
}) {
  return (
    <div className="flex items-center gap-2.5 rounded-lg border border-charcoal/[0.06] bg-white px-4 py-2.5">
      <div
        className={cn(
          "flex h-8 w-8 items-center justify-center rounded-lg",
          color
        )}
      >
        <Icon className="h-4 w-4" />
      </div>
      <div>
        <p className="text-[18px] font-medium leading-tight text-charcoal">
          {count}
        </p>
        <p className="text-[11px] text-charcoal/45">{label}</p>
      </div>
    </div>
  );
}


export function PromotionsManager() {
  const [showForm, setShowForm] = React.useState(false);
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [search, setSearch] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<
    (typeof STATUS_FILTERS)[number]
  >("All");
  const [targetFilter, setTargetFilter] = React.useState<
    (typeof TARGET_FILTERS)[number]
  >("All");
  const [deleteConfirmId, setDeleteConfirmId] = React.useState<string | null>(
    null
  );

  const queryClient = useQueryClient();
  const showToast = useToastStore((state) => state.showToast);

  const {
    data: promos,
    isLoading,
    isError,
  } = useQuery({
    queryKey: QUERY_KEY,
    queryFn: fetchPromotions,
  });

  const toggleMutation = useMutation({
    mutationFn: ({
      id,
      isActive,
    }: {
      id: string;
      isActive: boolean;
    }) => setPromotionActive(id, isActive),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: QUERY_KEY }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deletePromotion(id),
    onSuccess: () => {
      showToast("Promotion deleted");
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      setDeleteConfirmId(null);
    },
  });

  const filtered = React.useMemo(() => {
    if (!promos) return [];
    return promos.filter((promo) => {
      if (
        search &&
        !promo.name.toLowerCase().includes(search.toLowerCase())
      )
        return false;
      if (statusFilter !== "All" && getPromotionStatus(promo) !== statusFilter)
        return false;
      if (targetFilter !== "All" && promo.targetType !== targetFilter)
        return false;
      return true;
    });
  }, [promos, search, statusFilter, targetFilter]);

  const stats = React.useMemo(() => {
    if (!promos)
      return { active: 0, scheduled: 0, expired: 0, draft: 0, total: 0 };
    let active = 0;
    let scheduled = 0;
    let expired = 0;
    let draft = 0;
    for (const p of promos) {
      const s = getPromotionStatus(p);
      if (s === "Active") active++;
      else if (s === "Scheduled") scheduled++;
      else if (s === "Expired") expired++;
      else draft++;
    }
    return { active, scheduled, expired, draft, total: promos.length };
  }, [promos]);

  function closeForm() {
    setShowForm(false);
    setEditingId(null);
  }

  return (
    <div className="space-y-5">
      {/* Summary stats */}
      {!isLoading && promos && promos.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatPill
            label="Active"
            count={stats.active}
            icon={Zap}
            color="bg-emerald-50 text-emerald-600"
          />
          <StatPill
            label="Scheduled"
            count={stats.scheduled}
            icon={Timer}
            color="bg-amber-50 text-amber-600"
          />
          <StatPill
            label="Expired"
            count={stats.expired}
            icon={BarChart3}
            color="bg-charcoal/5 text-charcoal/50"
          />
          <StatPill
            label="Draft"
            count={stats.draft}
            icon={Target}
            color="bg-sand/15 text-sand-dark"
          />
        </div>
      )}

      {/* Create form (collapsible) */}
      {showForm && (
        <PromotionFormPanel
          promotionId={editingId}
          onDone={() => {
            closeForm();
            queryClient.invalidateQueries({ queryKey: QUERY_KEY });
          }}
          onCancel={closeForm}
        />
      )}

      {/* Search and filters */}
      <div className="rounded-[10px] border border-charcoal/[0.06] bg-white p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-charcoal/35" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search promotions..."
              className="pl-8 text-[13px]"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) =>
              setStatusFilter(
                e.target.value as (typeof STATUS_FILTERS)[number]
              )
            }
            className="rounded-lg border border-charcoal/15 bg-white px-3 py-2.5 text-[13px] text-charcoal"
          >
            {STATUS_FILTERS.map((s) => (
              <option key={s} value={s}>
                {s === "All" ? "All Statuses" : s}
              </option>
            ))}
          </select>
          <select
            value={targetFilter}
            onChange={(e) =>
              setTargetFilter(
                e.target.value as (typeof TARGET_FILTERS)[number]
              )
            }
            className="rounded-lg border border-charcoal/15 bg-white px-3 py-2.5 text-[13px] text-charcoal"
          >
            <option value="All">All Targets</option>
            {(
              Object.keys(TARGET_LABELS) as PromotionTargetType[]
            ).map((t) => (
              <option key={t} value={t}>
                {TARGET_LABELS[t]}
              </option>
            ))}
          </select>
          <Button
            type="button"
            size="sm"
            onClick={() => {
              setEditingId(null);
              setShowForm((v) => !v);
            }}
            className="rounded-full"
          >
            <Plus className="h-4 w-4" />
            {showForm && !editingId ? "Close" : "Create"}
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-[10px] border border-charcoal/[0.06] bg-white">
        {isLoading ? (
          <div className="flex items-center justify-center gap-2 py-16 text-[13px] text-charcoal/50">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading
            promotions...
          </div>
        ) : isError ? (
          <p className="py-10 text-center text-[13px] text-red-500">
            Couldn&apos;t load promotions. Try refreshing.
          </p>
        ) : !promos || promos.length === 0 ? (
          <div className="py-16 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-charcoal/5">
              <Tag className="h-5 w-5 text-charcoal/30" />
            </div>
            <p className="text-[13px] font-medium text-charcoal/70">
              No promotions yet
            </p>
            <p className="mt-1 text-[12px] text-charcoal/40">
              Create your first promotion to offer discounts to
              customers.
            </p>
            <Button
              type="button"
              size="sm"
              className="mt-4 rounded-full"
              onClick={() => {
                setEditingId(null);
                setShowForm(true);
              }}
            >
              <Plus className="h-4 w-4" />
              Create Promotion
            </Button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-charcoal/5">
              <Search className="h-5 w-5 text-charcoal/30" />
            </div>
            <p className="text-[13px] font-medium text-charcoal/70">
              No promotions match your filters
            </p>
            <p className="mt-1 text-[12px] text-charcoal/40">
              Try adjusting your search or filter criteria.
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-[13px]">
                <thead>
                  <tr className="border-b border-charcoal/[0.06] text-[11px] uppercase tracking-wider text-charcoal/40">
                    <th className="px-5 py-3 font-medium">
                      Promotion
                    </th>
                    <th className="px-5 py-3 font-medium">Discount</th>
                    <th className="px-5 py-3 font-medium">Target</th>
                    <th className="px-5 py-3 font-medium">Schedule</th>
                    <th className="px-5 py-3 font-medium">Usage</th>
                    <th className="px-5 py-3 font-medium">Status</th>
                    <th className="px-5 py-3 text-right font-medium">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((promo) => {
                    const status = getPromotionStatus(promo);
                    return (
                      <PromotionTableRow
                        key={promo.id}
                        promo={promo}
                        status={status}
                        onToggle={() =>
                          toggleMutation.mutate({
                            id: promo.id,
                            isActive: !promo.isActive,
                          })
                        }
                        onDelete={() => setDeleteConfirmId(promo.id)}
                        onEdit={() => {
                          setEditingId(promo.id);
                          setShowForm(true);
                        }}
                      />
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {/* Delete confirmation dialog */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-charcoal/50 backdrop-blur-sm">
          <div className="mx-4 w-full max-w-sm rounded-[10px] bg-white p-6 shadow-lg">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-50">
                <AlertTriangle className="h-5 w-5 text-red-500" />
              </div>
              <div>
                <p className="text-[14px] font-medium text-charcoal">
                  Delete Promotion
                </p>
                <p className="text-[12px] text-charcoal/50">
                  This action cannot be undone.
                </p>
              </div>
            </div>
            <div className="mt-5 flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setDeleteConfirmId(null)}
              >
                Cancel
              </Button>
              <Button
                variant="outline"
                className="flex-1 border-red-200 text-red-600 hover:bg-red-50"
                onClick={() =>
                  deleteMutation.mutate(deleteConfirmId)
                }
                disabled={deleteMutation.isPending}
              >
                {deleteMutation.isPending ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  "Delete"
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


function PromotionTableRow({
  promo,
  status,
  onToggle,
  onDelete,
  onEdit,
}: {
  promo: ApiPromotion;
  status: string;
  onToggle: () => void;
  onDelete: () => void;
  onEdit: () => void;
}) {
  return (
    <tr className="border-b border-charcoal/[0.04] transition-colors hover:bg-charcoal/[0.01]">
      <td className="px-5 py-3.5">
        <div>
          <p className="font-medium text-charcoal">{promo.name}</p>
          {promo.description && (
            <p className="mt-0.5 max-w-[220px] truncate text-[11px] text-charcoal/40">
              {promo.description}
            </p>
          )}
        </div>
      </td>
      <td className="px-5 py-3.5">
        <div className="flex items-baseline gap-1.5">
          <span className="font-medium text-charcoal">
            {promo.discountType === "percentage"
              ? `${promo.discountValue}%`
              : formatPrice(promo.discountValue)}
          </span>
          <span className="text-[11px] text-charcoal/40">off</span>
        </div>
        {promo.minOrderAmount > 0 && (
          <p className="mt-0.5 text-[11px] text-charcoal/35">
            Min: {formatPrice(promo.minOrderAmount)}
          </p>
        )}
      </td>
      <td className="px-5 py-3.5">
        <Badge variant="outline" className="gap-1 text-[10px]">
          <Tag className="h-2.5 w-2.5" />
          {promo.appliesTo ?? TARGET_LABELS[promo.targetType]}
        </Badge>
      </td>
      <td className="px-5 py-3.5 text-[12px] text-charcoal/50">
        {formatDateRange(promo.startsAt, promo.expiresAt)}
      </td>
      <td className="px-5 py-3.5">
        <span className="font-medium text-charcoal">
          {promo.usageCount}
        </span>
        {promo.usageLimit ? (
          <span className="text-[11px] text-charcoal/35">
            {" "}
            / {promo.usageLimit}
          </span>
        ) : (
          <span className="text-[11px] text-charcoal/35"> / ∞</span>
        )}
      </td>
      <td className="px-5 py-3.5">
        <Badge
          variant={getStatusVariant(status)}
          className="text-[10px]"
        >
          {status}
        </Badge>
      </td>
      <td className="px-5 py-3.5">
        <div className="flex items-center justify-end gap-1">
          <button
            onClick={onEdit}
            className="rounded-full p-1.5 text-charcoal/35 transition-colors hover:bg-charcoal/5 hover:text-charcoal"
            title="Edit"
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={onToggle}
            className={cn(
              "rounded-full px-2 py-1 text-[12px] font-medium transition-colors",
              promo.isActive
                ? "text-forest hover:bg-forest/10"
                : "text-charcoal/40 hover:bg-charcoal/5 hover:text-charcoal"
            )}
          >
            {promo.isActive ? "Disable" : "Enable"}
          </button>
          <button
            onClick={onDelete}
            className="rounded-full p-1.5 text-charcoal/35 transition-colors hover:bg-red-50 hover:text-red-500"
            title="Delete"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </td>
    </tr>
  );
}


function PromotionFormPanel({
  promotionId,
  onDone,
  onCancel,
}: {
  promotionId: string | null;
  onDone: () => void;
  onCancel: () => void;
}) {
  const { data: existing, isLoading } = useQuery({
    queryKey: ["admin", "promotions", promotionId],
    queryFn: () => getPromotion(promotionId as string),
    enabled: !!promotionId,
  });

  if (promotionId && isLoading) {
    return (
      <div className="flex items-center justify-center gap-2 rounded-[10px] border border-charcoal/[0.06] bg-white p-10 text-[13px] text-charcoal/50">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading promotion...
      </div>
    );
  }

  return (
    <PromotionForm
      existing={existing ?? null}
      onDone={onDone}
      onCancel={onCancel}
    />
  );
}

function PromotionForm({
  existing,
  onDone,
  onCancel,
}: {
  existing: ApiPromotion | null;
  onDone: () => void;
  onCancel: () => void;
}) {
  const isEdit = !!existing;

  const [name, setName] = React.useState(existing?.name ?? "");
  const [description, setDescription] = React.useState(
    existing?.description ?? ""
  );
  const [discountType, setDiscountType] = React.useState<
    "percentage" | "fixed"
  >(existing?.discountType ?? "percentage");
  const [discountValue, setDiscountValue] = React.useState(
    existing ? String(existing.discountValue) : "10"
  );
  const [minOrderAmount, setMinOrderAmount] = React.useState(
    existing ? String(existing.minOrderAmount) : "0"
  );
  const [maxDiscountAmount, setMaxDiscountAmount] = React.useState(
    existing?.maxDiscountAmount ? String(existing.maxDiscountAmount) : ""
  );
  const [usageLimit, setUsageLimit] = React.useState(
    existing?.usageLimit ? String(existing.usageLimit) : ""
  );
  const [perUserLimit, setPerUserLimit] = React.useState(
    existing?.perUserLimit ? String(existing.perUserLimit) : ""
  );
  const [startsAt, setStartsAt] = React.useState(() =>
    existing
      ? existing.startsAt.slice(0, 16)
      : new Date().toISOString().slice(0, 16)
  );
  const [expiresAt, setExpiresAt] = React.useState(() => {
    if (existing) return existing.expiresAt.slice(0, 16);
    const next = new Date();
    next.setHours(next.getHours() + 24);
    return next.toISOString().slice(0, 16);
  });

  const [targetType, setTargetType] = React.useState<PromotionTargetType>(
    existing?.targetType ?? "ALL_PRODUCTS"
  );
  const [selectedCategories, setSelectedCategories] = React.useState<
    string[]
  >(existing?.categories ?? []);
  const [selectedFabricTypes, setSelectedFabricTypes] = React.useState<
    string[]
  >(existing?.fabricTypes ?? []);
  const [selectedProducts, setSelectedProducts] = React.useState<
    {
      id: string;
      name: string;
      sku: string;
      price: number;
      image: string | null;
    }[]
  >(existing?.products ?? []);

  const [videoUrl, setVideoUrl] = React.useState<string | null>(
    existing?.videoUrl ?? null
  );
  const [videoPosterUrl, setVideoPosterUrl] = React.useState<string | null>(
    existing?.videoPosterUrl ?? null
  );
  const [displayProducts, setDisplayProducts] = React.useState<
    {
      id: string;
      name: string;
      sku: string;
      price: number;
      image: string | null;
    }[]
  >((existing?.displayProducts ?? []).map((p) => ({
    id: p.id,
    name: p.name,
    sku: p.sku,
    price: p.price,
    image: p.image ?? null
  })));

  const { data: categories } = useQuery({
    queryKey: ["admin", "catalog", "categories"],
    queryFn: fetchCategories,
  });
  const { data: fabricTypes } = useQuery({
    queryKey: ["admin", "catalog", "fabric-types"],
    queryFn: fetchFabricTypes,
  });

  const mutation = useMutation({
    mutationFn: () => {
      const payload: PromotionInput = {
        name,
        description: description || undefined,
        discountType,
        discountValue: Number(discountValue),
        minOrderAmount: minOrderAmount
          ? Number(minOrderAmount)
          : undefined,
        maxDiscountAmount: maxDiscountAmount
          ? Number(maxDiscountAmount)
          : null,
        startsAt: new Date(startsAt).toISOString(),
        expiresAt: new Date(expiresAt).toISOString(),
        usageLimit: usageLimit ? Number(usageLimit) : null,
        perUserLimit: perUserLimit ? Number(perUserLimit) : null,
        isActive: existing?.isActive ?? true,
        targetType,
        productIds:
          targetType === "PRODUCTS"
            ? selectedProducts.map((p) => p.id)
            : undefined,
        categories:
          targetType === "CATEGORIES"
            ? selectedCategories
            : undefined,
        fabricTypes:
          targetType === "FABRIC_TYPES"
            ? selectedFabricTypes
            : undefined,
        videoUrl: videoUrl || undefined,
        videoPosterUrl: videoPosterUrl || undefined,
        displayProductIds: displayProducts.map((p) => p.id),
      };
      return isEdit
        ? updatePromotion(existing!.id, payload)
        : createPromotion(payload);
    },
    onSuccess: onDone,
  });

  const error =
    mutation.error instanceof ApiRequestError
      ? mutation.error.message
      : mutation.isError
        ? `Failed to ${isEdit ? "update" : "create"} promotion.`
        : null;

  const discountValueNum = Number(discountValue);
  const discountError =
    !discountValue || isNaN(discountValueNum) || discountValueNum <= 0
      ? "Discount value must be greater than 0."
      : discountType === "percentage" && discountValueNum > 100
        ? "Percentage discount cannot exceed 100."
        : null;

  const dateError =
    startsAt && expiresAt && new Date(expiresAt) <= new Date(startsAt)
      ? "End date must be after start date."
      : null;

  const targetingValid =
    targetType === "ALL_PRODUCTS" ||
    (targetType === "CATEGORIES" && selectedCategories.length > 0) ||
    (targetType === "FABRIC_TYPES" && selectedFabricTypes.length > 0) ||
    (targetType === "PRODUCTS" && selectedProducts.length > 0);

  const canSubmit = !discountError && !dateError && targetingValid && name.trim().length >= 2;

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        if (!targetingValid) return;
        mutation.mutate();
      }}
      className="rounded-[10px] border border-charcoal/[0.06] bg-white"
    >
      {/* Form header */}
      <div className="flex items-center justify-between border-b border-charcoal/[0.04] px-6 py-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-charcoal/40">
            {isEdit ? "Edit Promotion" : "New Promotion"}
          </p>
        </div>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          onClick={onCancel}
          className="h-8 w-8 rounded-full p-0 text-charcoal/40 hover:text-charcoal"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="grid gap-0 lg:grid-cols-[1fr_280px]">
        {/* Main form */}
        <div className="space-y-6 p-6">
          <div>
            <h3 className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-charcoal/40">
              Basic Information
            </h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Label htmlFor="promo-name" className="text-[12px]">
                  Promotion Name
                </Label>
                <Input
                  id="promo-name"
                  className="mt-1.5"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Summer Collection Sale"
                  required
                />
              </div>
              <div className="sm:col-span-2">
                <Label
                  htmlFor="promo-description"
                  className="text-[12px]"
                >
                  Description (optional)
                </Label>
                <Textarea
                  id="promo-description"
                  className="mt-1.5"
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="A short description of the promotion"
                />
              </div>
            </div>
          </div>

          <Separator />

          <div>
            <h3 className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-charcoal/40">
              Discount
            </h3>
            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <Label
                  htmlFor="promo-discountType"
                  className="text-[12px]"
                >
                  Discount Type
                </Label>
                <select
                  id="promo-discountType"
                  value={discountType}
                  onChange={(e) =>
                    setDiscountType(
                      e.target.value as "percentage" | "fixed"
                    )
                  }
                  className="mt-1.5 w-full rounded-lg border border-charcoal/15 bg-white px-3 py-2.5 text-[13px] text-charcoal"
                >
                  <option value="percentage">Percentage</option>
                  <option value="fixed">Fixed Amount (PKR)</option>
                </select>
              </div>
              <div>
                <Label
                  htmlFor="promo-value"
                  className="text-[12px]"
                >
                  {discountType === "percentage"
                    ? "Percentage"
                    : "Amount (PKR)"}
                </Label>
                <Input
                  id="promo-value"
                  type="number"
                  min="0"
                  max={
                    discountType === "percentage" ? 100 : undefined
                  }
                  step="0.01"
                  className={cn("mt-1.5", discountError && "border-red-300 focus-visible:ring-red-500")}
                  value={discountValue}
                  onChange={(e) =>
                    setDiscountValue(e.target.value)
                  }
                  required
                />
                {discountError && (
                  <p className="mt-1 text-[11px] text-red-500">{discountError}</p>
                )}
              </div>
              <div>
                <Label
                  htmlFor="promo-maxDiscount"
                  className="text-[12px]"
                >
                  Maximum Discount (optional)
                </Label>
                <Input
                  id="promo-maxDiscount"
                  type="number"
                  min="0"
                  step="0.01"
                  className="mt-1.5"
                  value={maxDiscountAmount}
                  onChange={(e) =>
                    setMaxDiscountAmount(e.target.value)
                  }
                  placeholder="No cap"
                />
              </div>
            </div>
          </div>

          <Separator />

          <div>
            <h3 className="mb-1 text-[14px] font-medium text-charcoal">
              Who gets this promotion?
            </h3>
            <p className="mb-3 text-[12px] text-charcoal/45">
              Choose which products are eligible for this discount.
            </p>
            <div className="grid gap-2 sm:grid-cols-2">
              {(
                Object.keys(TARGET_DESCRIPTIONS) as PromotionTargetType[]
              ).map((type) => (
                <label
                  key={type}
                  className={cn(
                    "flex cursor-pointer items-start gap-3 rounded-lg border px-4 py-3 transition-colors",
                    targetType === type
                      ? "border-forest bg-forest/5 ring-1 ring-forest/20"
                      : "border-charcoal/15 hover:border-charcoal/25 hover:bg-charcoal/[0.02]"
                  )}
                >
                  <input
                    type="radio"
                    name="promo-target-type"
                    value={type}
                    checked={targetType === type}
                    onChange={() => setTargetType(type)}
                    className="mt-0.5 h-3.5 w-3.5 accent-forest"
                  />
                  <div>
                    <p className="text-[13px] font-medium text-charcoal">
                      {TARGET_LABELS[type]}
                    </p>
                    <p className="mt-0.5 text-[11px] text-charcoal/45">
                      {TARGET_DESCRIPTIONS[type]}
                    </p>
                  </div>
                </label>
              ))}
            </div>

            {targetType === "CATEGORIES" && (
              <div className="mt-3 max-h-48 space-y-1.5 overflow-y-auto rounded-lg border border-charcoal/10 p-3">
                {!categories ? (
                  <p className="text-[12px] text-charcoal/40">
                    Loading categories...
                  </p>
                ) : categories.length === 0 ? (
                  <p className="text-[12px] text-charcoal/40">
                    No categories found.
                  </p>
                ) : (
                  categories.map((category) => (
                    <label
                      key={category.id}
                      className="flex items-center gap-2 text-[13px] text-charcoal/80"
                    >
                      <input
                        type="checkbox"
                        className="h-3.5 w-3.5 accent-forest"
                        checked={selectedCategories.includes(
                          category.name
                        )}
                        onChange={(e) =>
                          setSelectedCategories((prev) =>
                            e.target.checked
                              ? [...prev, category.name]
                              : prev.filter(
                                  (c) => c !== category.name
                                )
                          )
                        }
                      />
                      {category.name}
                    </label>
                  ))
                )}
              </div>
            )}

            {targetType === "FABRIC_TYPES" && (
              <div className="mt-3 max-h-48 space-y-1.5 overflow-y-auto rounded-lg border border-charcoal/10 p-3">
                {!fabricTypes ? (
                  <p className="text-[12px] text-charcoal/40">
                    Loading fabric types...
                  </p>
                ) : fabricTypes.length === 0 ? (
                  <p className="text-[12px] text-charcoal/40">
                    No fabric types found.
                  </p>
                ) : (
                  fabricTypes.map((fabricType) => (
                    <label
                      key={fabricType.id}
                      className="flex items-center gap-2 text-[13px] text-charcoal/80"
                    >
                      <input
                        type="checkbox"
                        className="h-3.5 w-3.5 accent-forest"
                        checked={selectedFabricTypes.includes(
                          fabricType.name
                        )}
                        onChange={(e) =>
                          setSelectedFabricTypes((prev) =>
                            e.target.checked
                              ? [...prev, fabricType.name]
                              : prev.filter(
                                  (f) => f !== fabricType.name
                                )
                          )
                        }
                      />
                      {fabricType.name}
                    </label>
                  ))
                )}
              </div>
            )}

            {targetType === "PRODUCTS" && (
              <ProductPicker
                selected={selectedProducts}
                onChange={setSelectedProducts}
              />
            )}

            {!targetingValid && (
              <p className="mt-2 text-[12px] text-red-500">
                {targetType === "CATEGORIES" &&
                  "Select at least one category."}
                {targetType === "FABRIC_TYPES" &&
                  "Select at least one fabric type."}
                {targetType === "PRODUCTS" &&
                  "Select at least one product."}
              </p>
            )}
          </div>

          <Separator />

          <div>
            <h3 className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-charcoal/40">
              Promotion Display
            </h3>
            <p className="mb-3 text-[12px] text-charcoal/50">
              Content shown on the home page. Separate from discount targeting.
            </p>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <VideoUploadField
                  value={videoUrl}
                  onChange={setVideoUrl}
                  label="Promotion Video"
                />
              </div>
              <div>
                <Label className="text-[12px]">Video Poster / Fallback Image</Label>
                <p className="mb-1.5 text-[11px] text-charcoal/40">
                  Used while video loads or on devices that cannot autoplay.
                </p>
                <ImageUploadField
                  value={videoPosterUrl ? [videoPosterUrl] : []}
                  onChange={(urls) => setVideoPosterUrl(urls[0] ?? null)}
                  maxImages={1}
                />
              </div>
            </div>

            <div className="mt-4">
              <Label className="text-[12px]">Featured Products</Label>
              <p className="mb-1.5 text-[11px] text-charcoal/40">
                Products displayed beneath the promotion banner. Order determines display position.
              </p>
              <FeaturedProductPicker
                selected={displayProducts}
                onChange={setDisplayProducts}
              />
            </div>
          </div>

          <Separator />

          <div>
            <h3 className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-charcoal/40">
              Conditions
            </h3>
            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <Label
                  htmlFor="promo-minOrder"
                  className="text-[12px]"
                >
                  Minimum Order Amount
                </Label>
                <Input
                  id="promo-minOrder"
                  type="number"
                  min="0"
                  step="0.01"
                  className="mt-1.5"
                  value={minOrderAmount}
                  onChange={(e) =>
                    setMinOrderAmount(e.target.value)
                  }
                />
              </div>
              <div>
                <Label
                  htmlFor="promo-usageLimit"
                  className="text-[12px]"
                >
                  Usage Limit (optional)
                </Label>
                <Input
                  id="promo-usageLimit"
                  type="number"
                  min="1"
                  className="mt-1.5"
                  value={usageLimit}
                  onChange={(e) => setUsageLimit(e.target.value)}
                  placeholder="Unlimited"
                />
              </div>
              <div>
                <Label
                  htmlFor="promo-perUserLimit"
                  className="text-[12px]"
                >
                  Per-Customer Limit (optional)
                </Label>
                <Input
                  id="promo-perUserLimit"
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

          <Separator />

          <div>
            <h3 className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-charcoal/40">
              Schedule
            </h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label
                  htmlFor="promo-startsAt"
                  className="text-[12px]"
                >
                  Start Date & Time
                </Label>
                <Input
                  id="promo-startsAt"
                  type="datetime-local"
                  className="mt-1.5"
                  value={startsAt}
                  onChange={(e) => setStartsAt(e.target.value)}
                  required
                />
              </div>
              <div>
                <Label
                  htmlFor="promo-expiresAt"
                  className="text-[12px]"
                >
                  End Date & Time
                </Label>
                <Input
                  id="promo-expiresAt"
                  type="datetime-local"
                  className={cn("mt-1.5", dateError && "border-red-300 focus-visible:ring-red-500")}
                  value={expiresAt}
                  onChange={(e) => setExpiresAt(e.target.value)}
                  required
                />
              </div>
            </div>
            {dateError && (
              <p className="mt-2 text-[11px] text-red-500">{dateError}</p>
            )}
          </div>

          {error && (
            <p className="text-[12px] text-red-500">{error}</p>
          )}

          <div className="flex items-center gap-2">
            <Button
              type="submit"
              size="sm"
              className="rounded-full"
              disabled={mutation.isPending || !canSubmit}
            >
              {mutation.isPending ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : isEdit ? (
                "Save Changes"
              ) : (
                "Create Promotion"
              )}
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className="rounded-full"
              onClick={onCancel}
            >
              Cancel
            </Button>
          </div>
        </div>

        {/* Preview sidebar */}
        <div className="border-t border-charcoal/[0.04] bg-charcoal/[0.01] p-5 lg:border-t-0 lg:border-l">
          <PromotionPreviewPanel
            name={name}
            discountType={discountType}
            discountValue={discountValue}
            targetType={targetType}
            categoriesCount={selectedCategories.length}
            fabricTypesCount={selectedFabricTypes.length}
            productsCount={selectedProducts.length}
            startsAt={startsAt}
            expiresAt={expiresAt}
            isActive={existing?.isActive ?? true}
            videoUrl={videoUrl}
            videoPosterUrl={videoPosterUrl}
            displayProducts={displayProducts}
          />
        </div>
      </div>
    </form>
  );
}


function PromotionPreviewPanel({
  name,
  discountType,
  discountValue,
  targetType,
  categoriesCount,
  fabricTypesCount,
  productsCount,
  startsAt,
  expiresAt,
  isActive,
  videoUrl,
  videoPosterUrl,
  displayProducts,
}: {
  name: string;
  discountType: "percentage" | "fixed";
  discountValue: string;
  targetType: PromotionTargetType;
  categoriesCount: number;
  fabricTypesCount: number;
  productsCount: number;
  startsAt: string;
  expiresAt: string;
  isActive: boolean;
  videoUrl: string | null;
  videoPosterUrl: string | null;
  displayProducts: { id: string; name: string; image: string | null }[];
}) {
  const appliesTo =
    targetType === "ALL_PRODUCTS"
      ? "All Products"
      : targetType === "CATEGORIES"
        ? `${categoriesCount} ${categoriesCount === 1 ? "Category" : "Categories"}`
        : targetType === "FABRIC_TYPES"
          ? `${fabricTypesCount} Fabric Type${fabricTypesCount === 1 ? "" : "s"}`
          : `${productsCount} Product${productsCount === 1 ? "" : "s"}`;

  const start = startsAt ? new Date(startsAt) : null;
  const end = expiresAt ? new Date(expiresAt) : null;
  const now = new Date();
  let status = "Draft";
  if (isActive && start && end) {
    if (now < start) status = "Scheduled";
    else if (now > end) status = "Expired";
    else status = "Active";
  }

  return (
    <div>
      <p className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-charcoal/40">
        Preview
      </p>

      {/* Video preview */}
      {videoUrl ? (
        <div className="mb-3 overflow-hidden rounded-lg">
          <video
            src={videoUrl}
            poster={videoPosterUrl ?? undefined}
            className="h-24 w-full object-cover"
            muted
            playsInline
            preload="metadata"
          />
        </div>
      ) : videoPosterUrl ? (
        <div className="mb-3 overflow-hidden rounded-lg">
          <img
            src={videoPosterUrl}
            alt="Poster"
            className="h-24 w-full object-cover"
          />
        </div>
      ) : null}

      <p className="font-serif text-[16px] font-medium text-charcoal">
        {name || "Untitled Promotion"}
      </p>
      <p className="mt-1 text-[14px] font-medium text-forest">
        {discountValue || "0"}
        {discountType === "percentage" ? "% OFF" : ` PKR OFF`}
      </p>

      <div className="mt-4 space-y-3 text-[12px]">
        <div>
          <p className="text-charcoal/40">Applies to</p>
          <p className="mt-0.5 text-charcoal/80">{appliesTo}</p>
        </div>
        <div>
          <p className="text-charcoal/40">Schedule</p>
          <p className="mt-0.5 text-charcoal/80">
            {start
              ? start.toLocaleDateString("en-PK", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })
              : "—"}
            {" → "}
            {end
              ? end.toLocaleDateString("en-PK", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })
              : "—"}
          </p>
        </div>
        <div>
          <p className="text-charcoal/40">Status</p>
          <Badge
            variant={getStatusVariant(status)}
            className="mt-1 text-[10px]"
          >
            {status}
          </Badge>
        </div>

        {/* Display content preview */}
        <Separator />
        <div>
          <p className="text-charcoal/40">Display Content</p>
          <div className="mt-1 space-y-1 text-[11px] text-charcoal/60">
            <p>Video: {videoUrl ? "✓ Uploaded" : "Not set"}</p>
            <p>Poster: {videoPosterUrl ? "✓ Uploaded" : "Not set"}</p>
            <p>Featured Products: {displayProducts.length}</p>
          </div>
        </div>

        {/* Featured products preview */}
        {displayProducts.length > 0 && (
          <div>
            <p className="text-charcoal/40">Featured Products</p>
            <div className="mt-1.5 flex gap-1.5 overflow-x-auto">
              {displayProducts.map((p) => (
                <div key={p.id} className="flex-shrink-0">
                  {p.image ? (
                    <img
                      src={p.image}
                      alt=""
                      className="h-12 w-12 rounded object-cover"
                    />
                  ) : (
                    <div className="flex h-12 w-12 items-center justify-center rounded bg-charcoal/5 text-[8px] text-charcoal/30">
                      No img
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}


function ProductPicker({
  selected,
  onChange,
}: {
  selected: {
    id: string;
    name: string;
    sku: string;
    price: number;
    image: string | null;
  }[];
  onChange: (
    next: {
      id: string;
      name: string;
      sku: string;
      price: number;
      image: string | null;
    }[]
  ) => void;
}) {
  const [search, setSearch] = React.useState("");
  const [debouncedSearch, setDebouncedSearch] = React.useState("");

  React.useEffect(() => {
    const t = setTimeout(
      () => setDebouncedSearch(search),
      300
    );
    return () => clearTimeout(t);
  }, [search]);

  const { data, isFetching } = useQuery({
    queryKey: [
      "admin",
      "promotions",
      "product-search",
      debouncedSearch,
    ],
    queryFn: () =>
      fetchProducts({
        search: debouncedSearch || undefined,
        limit: 24,
      }),
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

  function selectAllVisible() {
    const additions = results
      .filter((p) => !selectedIds.has(p.id))
      .map((p) => ({
        id: p.id,
        name: p.name,
        sku: p.sku,
        price: p.price,
        image: p.images[0] ?? null,
      }));
    onChange([...selected, ...additions]);
  }

  return (
    <div className="mt-3 space-y-3">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-charcoal/35" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search products..."
          className="pl-8 text-[13px]"
        />
      </div>

      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {selected.map((p) => (
            <Badge
              key={p.id}
              variant="outline"
              className="gap-1 pr-1.5 text-[11px]"
            >
              {p.name}
              <button
                type="button"
                onClick={() =>
                  onChange(
                    selected.filter((s) => s.id !== p.id)
                  )
                }
                className="rounded-full p-0.5 hover:bg-charcoal/10"
                aria-label={`Remove ${p.name}`}
              >
                <X className="h-2.5 w-2.5" />
              </button>
            </Badge>
          ))}
        </div>
      )}

      <div className="max-h-56 space-y-1 overflow-y-auto rounded-lg border border-charcoal/10 p-2">
        {isFetching ? (
          <div className="flex items-center justify-center gap-2 py-6 text-[12px] text-charcoal/40">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />{" "}
            Searching...
          </div>
        ) : results.length === 0 ? (
          <p className="py-6 text-center text-[12px] text-charcoal/40">
            No products found.
          </p>
        ) : (
          <>
            <div className="flex items-center justify-between px-1 pb-1">
              <span className="text-[11px] text-charcoal/40">
                {results.length} result
                {results.length === 1 ? "" : "s"}
              </span>
              <button
                type="button"
                onClick={selectAllVisible}
                className="text-[11px] font-medium text-forest hover:underline"
              >
                Select all visible
              </button>
            </div>
            {results.map((product) => (
              <label
                key={product.id}
                className="flex cursor-pointer items-center gap-2.5 rounded-md px-1.5 py-1.5 text-[13px] hover:bg-charcoal/[0.03]"
              >
                <input
                  type="checkbox"
                  className="h-3.5 w-3.5 accent-forest"
                  checked={selectedIds.has(product.id)}
                  onChange={() => toggle(product)}
                />
                {product.images[0] && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={product.images[0]}
                    alt=""
                    className="h-8 w-8 rounded object-cover"
                  />
                )}
                <span className="flex-1 truncate text-charcoal/80">
                  {product.name}
                </span>
                <span className="text-[11px] text-charcoal/40">
                  {product.sku}
                </span>
              </label>
            ))}
          </>
        )}
      </div>

      <p className="text-[12px] text-charcoal/50">
        {selected.length} product
        {selected.length === 1 ? "" : "s"} selected
      </p>
    </div>
  );
}
