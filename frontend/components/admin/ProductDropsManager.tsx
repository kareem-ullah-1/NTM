"use client";

import * as React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import {
  Loader2,
  Plus,
  Trash2,
  Search,
  ChevronLeft,
  ChevronRight,
  Eye,
  Pencil,
  Power,
  PowerOff,
  AlertTriangle,
  Zap,
  Clock,
  AlertCircle,
  XCircle,
} from "lucide-react";
import {
  createProductDrop,
  deleteProductDrop,
  fetchProductDrops,
  setProductDropActive,
  type ApiProductDrop,
} from "@/lib/api/product-drops";
import { fetchProducts } from "@/lib/api/products";
import { ApiRequestError } from "@/lib/api/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToastStore } from "@/store/use-toast-store";
import { formatPrice, cn } from "@/lib/utils";
import { queryKeys } from "@/lib/api/query-keys";

const QUERY_KEY = queryKeys.productDrops.all;

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

function formatDateRange(startsAt: string, endsAt: string) {
  const start = new Date(startsAt);
  const end = new Date(endsAt);
  const startMonth = start.toLocaleDateString("en-PK", {
    month: "short",
    day: "numeric",
  });
  const endMonth = end.toLocaleDateString("en-PK", {
    month: "short",
    day: "numeric",
  });
  return `${startMonth} – ${endMonth}`;
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

const STATUS_OPTIONS = [
  { value: "all", label: "All Status" },
  { value: "live", label: "Live" },
  { value: "upcoming", label: "Upcoming" },
  { value: "sold_out", label: "Sold Out" },
  { value: "ended", label: "Ended" },
  { value: "disabled", label: "Disabled" },
  { value: "draft", label: "Draft" },
] as const;

export function ProductDropsManager() {
  const [showForm, setShowForm] = React.useState(false);
  const [search, setSearch] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState("all");
  const [page, setPage] = React.useState(1);
  const [deleteConfirmId, setDeleteConfirmId] = React.useState<string | null>(
    null
  );
  const queryClient = useQueryClient();
  const showToast = useToastStore((state) => state.showToast);
  const router = useRouter();

  const limit = 20;

  const { data: result, isLoading } = useQuery({
    queryKey: [...QUERY_KEY, { page, limit, search, status: statusFilter }],
    queryFn: () =>
      fetchProductDrops({ page, limit, search: search || undefined, status: statusFilter }),
    placeholderData: (prev) => prev,
  });

  const drops = result?.data ?? [];
  const meta = result?.meta as { page: number; limit: number; total: number; totalPages: number } | undefined;

  const stats = React.useMemo(() => {
    let live = 0;
    let upcoming = 0;
    let soldOut = 0;
    let ended = 0;
    for (const d of drops) {
      if (d.status === "live") live++;
      else if (d.status === "upcoming") upcoming++;
      else if (d.status === "sold_out") soldOut++;
      else if (d.status === "ended") ended++;
    }
    return { live, upcoming, soldOut, ended };
  }, [drops]);

  const toggleMutation = useMutation({
    mutationFn: ({
      id,
      isActive,
    }: {
      id: string;
      isActive: boolean;
    }) => setProductDropActive(id, isActive),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteProductDrop(id),
    onSuccess: () => {
      showToast("Product drop deleted");
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      setDeleteConfirmId(null);
    },
    onError: (error) => {
      const message =
        error instanceof ApiRequestError
          ? error.message
          : "Failed to delete drop.";
      showToast(message);
    },
  });

  React.useEffect(() => {
    setPage(1);
  }, [search, statusFilter]);

  return (
    <div className="space-y-4">
      {/* Summary stats */}
      {!isLoading && drops.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatPill
            label="Live"
            count={stats.live}
            icon={Zap}
            color="bg-emerald-50 text-emerald-600"
          />
          <StatPill
            label="Upcoming"
            count={stats.upcoming}
            icon={Clock}
            color="bg-amber-50 text-amber-600"
          />
          <StatPill
            label="Sold Out"
            count={stats.soldOut}
            icon={AlertCircle}
            color="bg-rust/10 text-rust-dark"
          />
          <StatPill
            label="Ended"
            count={stats.ended}
            icon={XCircle}
            color="bg-charcoal/5 text-charcoal/50"
          />
        </div>
      )}

      {/* Create form (collapsible) */}
      {showForm && (
        <CreateDropForm
          onCreated={() => {
            setShowForm(false);
            queryClient.invalidateQueries({ queryKey: QUERY_KEY });
          }}
          onCancel={() => setShowForm(false)}
        />
      )}

      {/* Search and filters */}
      <div className="rounded-[10px] border border-charcoal/[0.06] bg-white p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-charcoal/35" />
            <Input
              className="pl-9 text-[13px]"
              placeholder="Search drops..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-lg border border-charcoal/15 bg-white px-3 py-2.5 text-[13px] text-charcoal"
          >
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-[10px] border border-charcoal/[0.06] bg-white">
        {isLoading ? (
          <div className="flex items-center justify-center gap-2 py-16 text-[13px] text-charcoal/50">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading drops...
          </div>
        ) : drops.length === 0 ? (
          <div className="py-16 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-charcoal/5">
              <Zap className="h-5 w-5 text-charcoal/30" />
            </div>
            <p className="text-[13px] font-medium text-charcoal/70">
              {search || statusFilter !== "all"
                ? "No drops match your search criteria"
                : "No product drops yet"}
            </p>
            <p className="mt-1 text-[12px] text-charcoal/40">
              {search || statusFilter !== "all"
                ? "Try adjusting your search or filter criteria."
                : "Create your first drop to offer limited-release products."}
            </p>
            {!search && statusFilter === "all" && (
              <Button
                type="button"
                size="sm"
                className="mt-4 rounded-full"
                onClick={() => setShowForm(true)}
              >
                <Plus className="h-4 w-4" />
                Create Drop
              </Button>
            )}
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-[13px]">
                <thead>
                  <tr className="border-b border-charcoal/[0.06] text-[11px] uppercase tracking-wider text-charcoal/40">
                    <th className="px-4 py-3 font-medium">Drop</th>
                    <th className="px-4 py-3 font-medium">Product</th>
                    <th className="px-4 py-3 font-medium">Price</th>
                    <th className="px-4 py-3 font-medium">Stock</th>
                    <th className="px-4 py-3 font-medium">Schedule</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 text-right font-medium">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {drops.map((drop) => (
                    <DropTableRow
                      key={drop.id}
                      drop={drop}
                      onToggle={() =>
                        toggleMutation.mutate({
                          id: drop.id,
                          isActive: !drop.isActive,
                        })
                      }
                      onDelete={() => setDeleteConfirmId(drop.id)}
                      onView={() =>
                        router.push(`/admin/drops/${drop.id}`)
                      }
                      onEdit={() =>
                        router.push(`/admin/drops/${drop.id}/edit`)
                      }
                    />
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {meta && meta.totalPages > 1 && (
              <div className="flex items-center justify-between border-t border-charcoal/[0.06] px-4 py-3">
                <span className="text-[12px] text-charcoal/45">
                  Showing {(meta.page - 1) * meta.limit + 1}–
                  {Math.min(meta.page * meta.limit, meta.total)} of{" "}
                  {meta.total}
                </span>
                <div className="flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page <= 1}
                  >
                    <ChevronLeft className="h-3.5 w-3.5" />
                  </Button>
                  {Array.from({ length: meta.totalPages }, (_, i) => i + 1)
                    .filter((p) => {
                      if (
                        p === 1 ||
                        p === meta.totalPages ||
                        Math.abs(p - page) <= 1
                      )
                        return true;
                      return false;
                    })
                    .reduce<(number | "ellipsis")[]>((acc, p, i, arr) => {
                      if (i > 0 && p - (arr[i - 1] as number) > 1) {
                        acc.push("ellipsis");
                      }
                      acc.push(p);
                      return acc;
                    }, [])
                    .map((item, i) =>
                      item === "ellipsis" ? (
                        <span
                          key={`e-${i}`}
                          className="px-1 text-[12px] text-charcoal/30"
                        >
                          …
                        </span>
                      ) : (
                        <Button
                          key={item}
                          variant={item === page ? "default" : "outline"}
                          size="sm"
                          className="h-8 w-8 p-0 text-[12px]"
                          onClick={() => setPage(item)}
                        >
                          {item}
                        </Button>
                      )
                    )}
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() =>
                      setPage((p) => Math.min(meta.totalPages, p + 1))
                    }
                    disabled={page >= meta.totalPages}
                  >
                    <ChevronRight className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            )}
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
                  Delete Drop
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
                onClick={() => deleteMutation.mutate(deleteConfirmId)}
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


function DropTableRow({
  drop,
  onToggle,
  onDelete,
  onView,
  onEdit,
}: {
  drop: ApiProductDrop;
  onToggle: () => void;
  onDelete: () => void;
  onView: () => void;
  onEdit: () => void;
}) {
  const remaining = drop.maxQuantity - drop.soldQuantity;
  const stockPercent =
    drop.maxQuantity > 0
      ? Math.round((drop.soldQuantity / drop.maxQuantity) * 100)
      : 0;

  return (
    <tr className="border-b border-charcoal/[0.04] transition-colors hover:bg-charcoal/[0.01]">
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          {drop.product?.images?.[0] && (
            <img
              src={drop.product.images[0]}
              alt={drop.name}
              className="h-10 w-10 rounded-lg object-cover"
            />
          )}
          <div>
            <p className="font-medium text-charcoal">{drop.name}</p>
            {drop.description && (
              <p className="mt-0.5 max-w-[200px] truncate text-[11px] text-charcoal/40">
                {drop.description}
              </p>
            )}
          </div>
        </div>
      </td>
      <td className="px-4 py-3 text-charcoal/60">
        {drop.product?.name ?? "—"}
      </td>
      <td className="px-4 py-3">
        {drop.specialPrice ? (
          <div>
            <span className="font-medium text-charcoal">
              {formatPrice(drop.specialPrice)}
            </span>
            {drop.product && (
              <span className="ml-1.5 text-[11px] text-charcoal/35 line-through">
                {formatPrice(drop.product.price)}
              </span>
            )}
          </div>
        ) : drop.product ? (
          <span className="text-charcoal/60">
            {formatPrice(drop.product.price)}
          </span>
        ) : (
          "—"
        )}
      </td>
      <td className="px-4 py-3">
        <div>
          <span className="font-medium text-charcoal">
            {remaining > 0 ? remaining : 0} / {drop.maxQuantity}
          </span>
          <div className="mt-1 h-1.5 w-16 overflow-hidden rounded-full bg-charcoal/10">
            <div
              className={`h-full rounded-full ${
                stockPercent >= 100
                  ? "bg-charcoal/30"
                  : stockPercent >= 80
                    ? "bg-rust"
                    : "bg-forest"
              }`}
              style={{ width: `${Math.min(stockPercent, 100)}%` }}
            />
          </div>
        </div>
      </td>
      <td className="px-4 py-3 text-[12px] text-charcoal/50">
        {formatDateRange(drop.startsAt, drop.endsAt)}
      </td>
      <td className="px-4 py-3">
        <Badge variant={getStatusVariant(drop.status)} className="text-[10px]">
          {formatStatus(drop.status)}
        </Badge>
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center justify-end gap-1">
          <button
            onClick={onView}
            className="rounded-full p-1.5 text-charcoal/35 transition-colors hover:bg-charcoal/5 hover:text-charcoal"
            title="View details"
          >
            <Eye className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={onEdit}
            className="rounded-full p-1.5 text-charcoal/35 transition-colors hover:bg-charcoal/5 hover:text-charcoal"
            title="Edit drop"
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={onToggle}
            className={`rounded-full p-1.5 transition-colors ${
              drop.isActive
                ? "text-charcoal/35 hover:bg-forest/10 hover:text-forest"
                : "text-charcoal/35 hover:bg-charcoal/5 hover:text-charcoal"
            }`}
            title={drop.isActive ? "Disable drop" : "Enable drop"}
          >
            {drop.isActive ? (
              <PowerOff className="h-3.5 w-3.5" />
            ) : (
              <Power className="h-3.5 w-3.5" />
            )}
          </button>
          <button
            onClick={onDelete}
            className="rounded-full p-1.5 text-charcoal/35 transition-colors hover:bg-red-50 hover:text-red-500"
            title="Delete drop"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </td>
    </tr>
  );
}


function CreateDropForm({
  onCreated,
  onCancel,
}: {
  onCreated: () => void;
  onCancel: () => void;
}) {
  const [name, setName] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [productId, setProductId] = React.useState("");
  const [maxQuantity, setMaxQuantity] = React.useState("100");
  const [perCustomerLimit, setPerCustomerLimit] = React.useState("1");
  const [specialPrice, setSpecialPrice] = React.useState("");
  const [promotionId] = React.useState("");
  const [startsAt, setStartsAt] = React.useState(() => {
    const next = new Date();
    next.setDate(next.getDate() + 1);
    next.setHours(10, 0, 0);
    return next.toISOString().slice(0, 16);
  });
  const [endsAt, setEndsAt] = React.useState(() => {
    const next = new Date();
    next.setDate(next.getDate() + 3);
    next.setHours(23, 59, 0);
    return next.toISOString().slice(0, 16);
  });

  const showToast = useToastStore((s) => s.showToast);

  const mutation = useMutation({
    mutationFn: () =>
      createProductDrop({
        productId,
        name,
        description: description || undefined,
        maxQuantity: Number(maxQuantity),
        perCustomerLimit: perCustomerLimit
          ? Number(perCustomerLimit)
          : undefined,
        specialPrice: specialPrice ? Number(specialPrice) : undefined,
        promotionId: promotionId || undefined,
        startsAt: new Date(startsAt).toISOString(),
        endsAt: new Date(endsAt).toISOString(),
        isActive: true,
      }),
    onSuccess: () => {
      showToast("Product drop created");
      onCreated();
    },
  });

  const error =
    mutation.error instanceof ApiRequestError
      ? mutation.error.message
      : mutation.isError
        ? "Failed to create drop."
        : null;

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        mutation.mutate();
      }}
      className="rounded-[10px] border border-charcoal/[0.06] bg-white p-5"
    >
      <p className="mb-4 text-[11px] font-semibold uppercase tracking-wider text-charcoal/40">
        Basic Information
      </p>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="drop-name" className="text-[12px]">
            Drop Name *
          </Label>
          <Input
            id="drop-name"
            className="mt-1.5"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Premium Boski — Limited Release"
            required
          />
        </div>
        <div>
          <ProductSelector
            value={productId}
            onChange={setProductId}
          />
        </div>
        <div className="sm:col-span-2">
          <Label htmlFor="drop-description" className="text-[12px]">
            Description (optional)
          </Label>
          <Input
            id="drop-description"
            className="mt-1.5"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="A short editorial description"
          />
        </div>
      </div>

      <p className="mb-4 mt-6 text-[11px] font-semibold uppercase tracking-wider text-charcoal/40">
        Pricing & Inventory
      </p>
      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <Label htmlFor="drop-maxQty" className="text-[12px]">
            Drop Quantity *
          </Label>
          <Input
            id="drop-maxQty"
            type="number"
            className="mt-1.5"
            value={maxQuantity}
            onChange={(e) => setMaxQuantity(e.target.value)}
            min="1"
            required
          />
        </div>
        <div>
          <Label htmlFor="drop-perCustomer" className="text-[12px]">
            Per Customer Limit
          </Label>
          <Input
            id="drop-perCustomer"
            type="number"
            className="mt-1.5"
            value={perCustomerLimit}
            onChange={(e) => setPerCustomerLimit(e.target.value)}
            min="1"
          />
        </div>
        <div>
          <Label htmlFor="drop-specialPrice" className="text-[12px]">
            Drop Price (optional)
          </Label>
          <Input
            id="drop-specialPrice"
            type="number"
            className="mt-1.5"
            value={specialPrice}
            onChange={(e) => setSpecialPrice(e.target.value)}
            placeholder="Leave empty for regular price"
            min="0"
          />
        </div>
      </div>

      <p className="mb-4 mt-6 text-[11px] font-semibold uppercase tracking-wider text-charcoal/40">
        Schedule
      </p>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="drop-startsAt" className="text-[12px]">
            Start Date & Time *
          </Label>
          <Input
            id="drop-startsAt"
            type="datetime-local"
            className="mt-1.5"
            value={startsAt}
            onChange={(e) => setStartsAt(e.target.value)}
            required
          />
        </div>
        <div>
          <Label htmlFor="drop-endsAt" className="text-[12px]">
            End Date & Time *
          </Label>
          <Input
            id="drop-endsAt"
            type="datetime-local"
            className="mt-1.5"
            value={endsAt}
            onChange={(e) => setEndsAt(e.target.value)}
            required
          />
        </div>
      </div>

      {error && <p className="mt-3 text-[12px] text-red-500">{error}</p>}
      <div className="mt-5 flex gap-3">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="rounded-full"
          onClick={onCancel}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          size="sm"
          className="rounded-full"
          disabled={mutation.isPending || !productId}
        >
          {mutation.isPending ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            "Create Drop"
          )}
        </Button>
      </div>
    </form>
  );
}


function ProductSelector({
  onChange,
}: {
  value: string;
  onChange: (id: string) => void;
}) {
  const [searchTerm, setSearchTerm] = React.useState("");
  const [isOpen, setIsOpen] = React.useState(false);
  const [selectedProduct, setSelectedProduct] = React.useState<{
    id: string;
    name: string;
    price: number;
    image: string | null;
  } | null>(null);
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  const { data: products = [], isLoading } = useQuery({
    queryKey: ["admin", "products-for-drop", searchTerm],
    queryFn: () =>
      fetchProducts({ search: searchTerm, limit: 20 }).then(
        (r) => r.data
      ),
    enabled: isOpen,
  });

  React.useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  function handleSelect(product: {
    id: string;
    name: string;
    price: number;
    image: string | null;
  }) {
    setSelectedProduct(product);
    onChange(product.id);
    setIsOpen(false);
    setSearchTerm("");
  }

  function handleClear() {
    setSelectedProduct(null);
    onChange("");
  }

  return (
    <div ref={dropdownRef} className="relative">
      <Label className="text-[12px]">Product *</Label>
      {selectedProduct ? (
        <div className="mt-1.5 flex items-center gap-2 rounded-lg border border-charcoal/15 bg-white px-3 py-2.5">
          {selectedProduct.image && (
            <img
              src={selectedProduct.image}
              alt=""
              className="h-8 w-8 rounded object-cover"
            />
          )}
          <span className="flex-1 truncate text-[13px] text-charcoal">
            {selectedProduct.name}
          </span>
          <button
            type="button"
            onClick={handleClear}
            className="text-[12px] text-charcoal/40 hover:text-charcoal"
          >
            ✕
          </button>
        </div>
      ) : (
        <div className="relative mt-1.5">
          <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-charcoal/35" />
          <Input
            className="pl-8 text-[13px]"
            placeholder="Search products..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              if (!isOpen) setIsOpen(true);
            }}
            onFocus={() => setIsOpen(true)}
          />
        </div>
      )}
      {isOpen && !selectedProduct && (
        <div className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-lg border border-charcoal/10 bg-white shadow-lg">
          {isLoading ? (
            <div className="flex items-center justify-center gap-2 py-4 text-[12px] text-charcoal/40">
              <Loader2 className="h-3 w-3 animate-spin" /> Searching...
            </div>
          ) : products.length === 0 ? (
            <p className="py-4 text-center text-[12px] text-charcoal/40">
              {searchTerm
                ? "No products found"
                : "Type to search products"}
            </p>
          ) : (
            products.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() =>
                  handleSelect({
                    id: p.id,
                    name: p.name,
                    price: p.price,
                    image: p.images?.[0] ?? null,
                  })
                }
                className="flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors hover:bg-charcoal/[0.03]"
              >
                {p.images?.[0] && (
                  <img
                    src={p.images[0]}
                    alt=""
                    className="h-8 w-8 rounded object-cover"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <p className="truncate text-[13px] font-medium text-charcoal">
                    {p.name}
                  </p>
                  <p className="text-[11px] text-charcoal/40">
                    {formatPrice(p.price)} · {p.category}
                  </p>
                </div>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
