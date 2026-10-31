"use client";

import * as React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type RowSelectionState,
  type SortingState
} from "@tanstack/react-table";
import {
  AlertCircle,
  ChevronsUpDown,
  History,
  Loader2,
  MoreHorizontal,
  Package,
  PackagePlus,
  Pencil,
  RefreshCcw,
  Search,
  ShoppingCart,
  Star,
  Tags,
  Trash2,
  X
} from "lucide-react";
import {
  fetchInventory,
  createInventoryItem,
  updateInventoryItem,
  deleteInventoryItem,
  adjustInventoryStock
} from "@/lib/api/inventory";
import { ApiRequestError } from "@/lib/api/client";
import { queryKeys } from "@/lib/api/query-keys";
import type { ApiProduct } from "@/lib/api/types";
import type { InventoryFormValues } from "@/lib/validations";
import { cn, formatPrice } from "@/lib/utils";
import { InventoryAddModal } from "@/components/admin/InventoryAddModal";
import { InventoryEditModal } from "@/components/admin/InventoryEditModal";
import { AdjustStockModal } from "@/components/admin/AdjustStockModal";
import { MovementHistoryModal } from "@/components/admin/MovementHistoryModal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToastStore } from "@/store/use-toast-store";

const STATUS_TABS: Array<{
  label: string;
  value: ApiProduct["status"] | "All";
}> = [
  { label: "All", value: "All" },
  { label: "In Stock", value: "In Stock" },
  { label: "Low Stock", value: "Low Stock" },
  { label: "Out of Stock", value: "Out of Stock" }
];

const statusBadgeVariant: Record<ApiProduct["status"], "success" | "warning" | "danger"> = {
  "In Stock": "success",
  "Low Stock": "warning",
  "Out of Stock": "danger"
};

function InventoryStats({ products }: { products: ApiProduct[] }) {
  const stats = React.useMemo(() => {
    const total = products.length;
    const inStock = products.filter((p) => p.status === "In Stock").length;
    const lowStock = products.filter((p) => p.status === "Low Stock").length;
    const outOfStock = products.filter((p) => p.status === "Out of Stock").length;
    const totalStock = products.reduce((sum, p) => sum + p.stock, 0);
    const featured = products.filter((p) => p.featured).length;
    return { total, inStock, lowStock, outOfStock, totalStock, featured };
  }, [products]);

  const cards = [
    {
      label: "Total Products",
      value: String(stats.total),
      icon: Package,
      color: "text-forest",
      bg: "bg-forest/[0.06]"
    },
    {
      label: "In Stock",
      value: String(stats.inStock),
      icon: ShoppingCart,
      color: "text-emerald-600",
      bg: "bg-emerald-50"
    },
    {
      label: "Low Stock",
      value: String(stats.lowStock),
      icon: AlertCircle,
      color: "text-amber-600",
      bg: "bg-amber-50"
    },
    {
      label: "Out of Stock",
      value: String(stats.outOfStock),
      icon: X,
      color: "text-red-500",
      bg: "bg-red-50"
    },
    {
      label: "Total Units",
      value: String(stats.totalStock),
      icon: Tags,
      color: "text-sand-dark",
      bg: "bg-sand/10"
    },
    {
      label: "Featured",
      value: String(stats.featured),
      icon: Star,
      color: "text-amber-600",
      bg: "bg-amber-50"
    }
  ];

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
      {cards.map((card) => (
        <div
          key={card.label}
          className="rounded-[10px] border border-charcoal/[0.06] bg-white p-4"
        >
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-charcoal/35">
              {card.label}
            </p>
            <div
              className={cn(
                "flex h-7 w-7 items-center justify-center rounded-full",
                card.bg
              )}
            >
              <card.icon className={cn("h-3.5 w-3.5", card.color)} />
            </div>
          </div>
          <p className="mt-2 font-serif text-xl font-medium tracking-tight text-charcoal">
            {card.value}
          </p>
        </div>
      ))}
    </div>
  );
}

export function InventoryGrid() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialStatus = (searchParams.get("status") as ApiProduct["status"] | null) ?? "All";

  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<ApiProduct["status"] | "All">(
    STATUS_TABS.some((tab) => tab.value === initialStatus) ? initialStatus : "All"
  );
  const [rowSelection, setRowSelection] = React.useState<RowSelectionState>({});
  const [editingItem, setEditingItem] = React.useState<ApiProduct | null>(null);
  const [adjustingItem, setAdjustingItem] = React.useState<ApiProduct | null>(null);
  const [historyItem, setHistoryItem] = React.useState<ApiProduct | null>(null);
  const [openMenuId, setOpenMenuId] = React.useState<string | null>(null);
  const showToast = useToastStore((state) => state.showToast);
  const queryClient = useQueryClient();

  function handleStatusFilterChange(value: ApiProduct["status"] | "All") {
    setStatusFilter(value);
    const params = new URLSearchParams(searchParams.toString());
    if (value === "All") {
      params.delete("status");
    } else {
      params.set("status", value);
    }
    router.replace(params.size > 0 ? `/admin/inventory?${params.toString()}` : "/admin/inventory");
  }

  const {
    data: rowData = [],
    isLoading,
    isError,
    error,
    refetch,
    isFetching
  } = useQuery({
    queryKey: queryKeys.inventory.all,
    queryFn: fetchInventory
  });

  const loadError = isError
    ? error instanceof ApiRequestError
      ? error.message
      : "Failed to load inventory."
    : null;

  const filteredRowData = React.useMemo(
    () => (statusFilter === "All" ? rowData : rowData.filter((row) => row.status === statusFilter)),
    [rowData, statusFilter]
  );

  const createMutation = useMutation({
    mutationFn: (values: InventoryFormValues) =>
      createInventoryItem({
        ...values,
        stock: values.stock ?? 0,
        colors: (values.colors ?? []).map((c) => ({
          name: c.name.trim(),
          hex: (c.hex || "#888888").startsWith("#") ? c.hex || "#888888" : `#${c.hex}`,
          image: c.image ?? null,
          images: c.images
        }))
      }),
    onSuccess: (created) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.inventory.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.products.all });
      showToast(`${created.name} added`);
    },
    onError: (mutationError) => {
      showToast(
        mutationError instanceof ApiRequestError
          ? mutationError.message
          : "Failed to add item.", "error"
      );
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({
      sku,
      values
    }: {
      sku: string;
      values: InventoryFormValues;
    }) => {
      const { stock: _stock, ...rest } = values;
      return updateInventoryItem(sku, {
        ...rest,
        colors: (values.colors ?? []).map((c) => ({
          name: c.name.trim(),
          hex: (c.hex || "#888888").startsWith("#") ? c.hex || "#888888" : `#${c.hex}`,
          image: c.image ?? null,
          images: c.images
        }))
      });
    },
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.inventory.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.products.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.inventory.movements(updated.sku) });
      showToast(`${updated.name} updated`);
      setEditingItem(null);
    },
    onError: (mutationError) => {
      showToast(
        mutationError instanceof ApiRequestError
          ? mutationError.message
          : "Failed to update item.", "error"
      );
    }
  });

  const deleteMutation = useMutation({
    mutationFn: deleteInventoryItem,
    onSuccess: (_result, sku) => {
      queryClient.setQueryData<ApiProduct[]>(
        queryKeys.inventory.all,
        (current) => current?.filter((row) => row.sku !== sku)
      );
      queryClient.invalidateQueries({ queryKey: queryKeys.products.all });
    },
    onError: (mutationError) => {
      showToast(
        mutationError instanceof ApiRequestError
          ? mutationError.message
          : "Failed to delete item.", "error"
      );
    }
  });

  const adjustMutation = useMutation({
    mutationFn: ({
      sku,
      payload
    }: {
      sku: string;
      payload: { quantityChange: number; reason: string; color?: string; movementType?: "manual_adjustment" | "restock" };
    }) => adjustInventoryStock(sku, payload),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.inventory.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.products.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.inventory.movements(updated.sku) });
      showToast(`${updated.name} stock adjusted`);
    },
    onError: (mutationError) => {
      showToast(
        mutationError instanceof ApiRequestError
          ? mutationError.message
          : "Failed to adjust stock.", "error"
      );
    }
  });

  function handleDelete(item: ApiProduct) {
    setOpenMenuId(null);
    const confirmed = window.confirm(
      `Delete ${item.name} (${item.sku})? This cannot be undone.`
    );
    if (!confirmed) return;
    deleteMutation.mutate(item.sku, {
      onSuccess: () => showToast(`${item.name} deleted`)
    });
  }

  React.useEffect(() => {
    if (!openMenuId) return;
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Element;
      if (!target.closest("[data-action-menu]")) {
        setOpenMenuId(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [openMenuId]);

  const columns = React.useMemo<ColumnDef<ApiProduct>[]>(
    () => [
      {
        accessorKey: "name",
        header: "Product",
        cell: (info) => {
          const product = info.row.original;
          const firstImage = product.images?.[0] ?? product.colors?.[0]?.image;
          return (
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-charcoal/[0.08] bg-charcoal/[0.02]">
                {firstImage ? (
                  <img
                    src={firstImage}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <Package className="h-4 w-4 text-charcoal/20" />
                )}
              </div>
              <div className="min-w-0">
                <p className="truncate text-[13px] font-medium text-charcoal">
                  {product.name}
                </p>
                <p className="truncate font-mono text-[11px] text-charcoal/40">
                  {product.sku}
                </p>
              </div>
            </div>
          );
        }
      },
      {
        accessorKey: "category",
        header: "Category",
        cell: (info) => (
          <span className="text-[12px] text-charcoal/60">
            {info.getValue<string>()}
          </span>
        )
      },
      {
        accessorKey: "fabricType",
        header: "Fabric",
        cell: (info) => (
          <span className="text-[12px] text-charcoal/60">
            {info.getValue<string>()}
          </span>
        )
      },
      {
        accessorKey: "price",
        header: "Price",
        cell: (info) => {
          const product = info.row.original;
          return (
            <div className="flex flex-col">
              <span className="text-[13px] font-medium text-charcoal">
                {formatPrice(product.price)}
              </span>
              {product.originalPrice && (
                <span className="text-[11px] text-charcoal/35 line-through">
                  {formatPrice(product.originalPrice)}
                </span>
              )}
            </div>
          );
        }
      },
      {
        accessorKey: "stock",
        header: "Stock",
        cell: (info) => {
          const product = info.row.original;
          const isLow = product.status === "Low Stock";
          const isOut = product.status === "Out of Stock";
          const colorLines =
            product.colors?.length > 0
              ? product.colors
                  .map((c) => `${c.name}: ${c.stock ?? 0}${(c.stock ?? 0) === 0 ? " (out)" : ""}`)
                  .join(" · ")
              : null;
          return (
            <div className="flex flex-col gap-0.5">
              <span
                className={cn(
                  "text-[13px] font-medium",
                  isOut
                    ? "text-red-500"
                    : isLow
                      ? "text-amber-600"
                      : "text-charcoal"
                )}
              >
                {product.stock}
                <span className="ml-1 text-[10px] font-normal text-charcoal/35">total</span>
              </span>
              {colorLines ? (
                <span className="max-w-[180px] truncate text-[10px] text-charcoal/40" title={colorLines}>
                  {colorLines}
                </span>
              ) : (
                <span className="text-[10px] text-charcoal/30">
                  min: {product.lowStockThreshold}
                </span>
              )}
            </div>
          );
        }
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: (info) => {
          const status = info.getValue<ApiProduct["status"]>();
          return <Badge variant={statusBadgeVariant[status]}>{status}</Badge>;
        }
      },
      {
        id: "flags",
        header: "",
        cell: ({ row }) => {
          const product = row.original;
          return (
            <div className="flex items-center gap-1">
              {product.featured && (
                <span className="rounded bg-amber-50 px-1.5 py-0.5 text-[10px] font-medium text-amber-600">
                  Featured
                </span>
              )}
              {product.isNew && (
                <span className="rounded bg-blue-50 px-1.5 py-0.5 text-[10px] font-medium text-blue-600">
                  New
                </span>
              )}
            </div>
          );
        }
      },
      {
        id: "actions",
        header: "",
        enableSorting: false,
        cell: ({ row }) => {
          const item = row.original;
          const isOpen = openMenuId === item.sku;
          return (
            <div className="relative flex justify-end" data-action-menu>
              <button
                onClick={() => setOpenMenuId(isOpen ? null : item.sku)}
                aria-label={`Actions for ${item.name}`}
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-lg transition-colors",
                  isOpen
                    ? "bg-charcoal/[0.06] text-charcoal"
                    : "text-charcoal/30 hover:bg-charcoal/[0.04] hover:text-charcoal/60"
                )}
              >
                <MoreHorizontal className="h-4 w-4" />
              </button>
              {isOpen && (
                <div className="absolute right-0 top-9 z-30 w-52 overflow-hidden rounded-[10px] border border-charcoal/[0.08] bg-white py-1 shadow-lg">
                  <p className="px-3 pb-2 pt-2 text-[10px] font-semibold uppercase tracking-wider text-charcoal/30">
                    Actions
                  </p>
                  <button
                    onClick={() => {
                      setEditingItem(item);
                      setOpenMenuId(null);
                    }}
                    className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-[13px] text-charcoal/70 hover:bg-forest/[0.04] hover:text-forest transition-colors"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                    Edit Product
                  </button>
                  <button
                    onClick={() => {
                      setAdjustingItem(item);
                      setOpenMenuId(null);
                    }}
                    className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-[13px] text-charcoal/70 hover:bg-forest/[0.04] hover:text-forest transition-colors"
                  >
                    <PackagePlus className="h-3.5 w-3.5" />
                    Adjust Stock
                  </button>
                  <button
                    onClick={() => {
                      setHistoryItem(item);
                      setOpenMenuId(null);
                    }}
                    className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-[13px] text-charcoal/70 hover:bg-forest/[0.04] hover:text-forest transition-colors"
                  >
                    <History className="h-3.5 w-3.5" />
                    Movement History
                  </button>
                  <div className="my-1 border-t border-charcoal/[0.06]" />
                  <button
                    onClick={() => handleDelete(item)}
                    disabled={deleteMutation.isPending}
                    className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-[13px] text-red-500/80 hover:bg-red-50/50 hover:text-red-600 transition-colors disabled:opacity-50"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Delete Product
                  </button>
                </div>
              )}
            </div>
          );
        }
      }
    ],
    [openMenuId, deleteMutation.isPending]
  );

  const table = useReactTable({
    data: filteredRowData,
    columns,
    getRowId: (row) => row.sku,
    state: { sorting, globalFilter, rowSelection },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 10 } }
  });

  return (
    <div className="space-y-5">
      {/* Stats */}
      {rowData.length > 0 && <InventoryStats products={rowData} />}

      {/* Table Card */}
      <div className="rounded-[10px] border border-charcoal/[0.06] bg-white">
        {/* Toolbar */}
        <div className="border-b border-charcoal/[0.06] px-5 py-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            {/* Search */}
            <div className="relative flex-1 sm:flex-none">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-charcoal/30" />
              <input
                value={globalFilter}
                onChange={(event) => setGlobalFilter(event.target.value)}
                placeholder="Search by name, SKU, category..."
                aria-label="Search inventory"
                className="w-full rounded-lg border border-charcoal/[0.12] bg-white py-2 pl-9 pr-3 text-[13px] text-charcoal placeholder:text-charcoal/35 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest sm:w-72"
              />
              {globalFilter && (
                <button
                  onClick={() => setGlobalFilter("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-charcoal/30 hover:text-charcoal/60"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              {/* Refresh */}
              <button
                onClick={() => refetch()}
                disabled={isFetching}
                className="flex items-center gap-1.5 rounded-lg border border-charcoal/[0.12] px-3 py-2 text-[12px] font-medium text-charcoal/55 transition-colors hover:bg-charcoal/[0.02] disabled:opacity-50"
                title="Refresh inventory"
              >
                <RefreshCcw
                  className={cn("h-3.5 w-3.5", isFetching && "animate-spin")}
                />
                <span className="hidden sm:inline">Refresh</span>
              </button>

              {/* Add Product */}
              <InventoryAddModal
                onAdd={(values) => createMutation.mutateAsync(values)}
              />
            </div>
          </div>

          {/* Status Filters */}
          <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-charcoal/[0.04] pt-3">
            {STATUS_TABS.map((tab) => (
              <button
                key={tab.value}
                onClick={() => handleStatusFilterChange(tab.value)}
                className={cn(
                  "rounded-full px-3 py-1.5 text-[12px] font-medium transition-colors",
                  statusFilter === tab.value
                    ? "bg-charcoal text-cream"
                    : "border border-charcoal/[0.10] text-charcoal/50 hover:border-charcoal/20 hover:text-charcoal/70"
                )}
              >
                {tab.label}
              </button>
            ))}
            {statusFilter !== "All" && (
              <span className="text-[11px] text-charcoal/35">
                ({filteredRowData.length} products)
              </span>
            )}
          </div>
        </div>

        {/* Table */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center gap-3 py-20">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-charcoal/[0.04]">
              <Loader2 className="h-5 w-5 animate-spin text-charcoal/30" />
            </div>
            <p className="text-[13px] text-charcoal/45">Loading inventory...</p>
          </div>
        ) : loadError ? (
          <div className="flex flex-col items-center justify-center gap-4 py-20">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-50">
              <AlertCircle className="h-6 w-6 text-red-400" />
            </div>
            <div className="text-center">
              <p className="text-[13px] font-medium text-charcoal/70">
                Unable to load inventory
              </p>
              <p className="mt-1 text-[12px] text-charcoal/40">{loadError}</p>
            </div>
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              <RefreshCcw className="h-3.5 w-3.5" />
              Try Again
            </Button>
          </div>
        ) : filteredRowData.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-4 py-20">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-charcoal/[0.04]">
              <Package className="h-6 w-6 text-charcoal/20" />
            </div>
            <div className="text-center">
              <p className="text-[13px] font-medium text-charcoal/60">
                No products found
              </p>
              <p className="mt-1 text-[12px] text-charcoal/35">
                {globalFilter || statusFilter !== "All"
                  ? "Try adjusting your search or filters"
                  : "Add your first product to get started"}
              </p>
            </div>
            {(globalFilter || statusFilter !== "All") && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setGlobalFilter("");
                  handleStatusFilterChange("All");
                }}
              >
                Clear Filters
              </Button>
            )}
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-[13px]">
                <thead>
                  {table.getHeaderGroups().map((headerGroup) => (
                    <tr
                      key={headerGroup.id}
                      className="border-b border-charcoal/[0.06] text-[10px] uppercase tracking-wider text-charcoal/35"
                    >
                      {headerGroup.headers.map((header) => (
                        <th
                          key={header.id}
                          className="whitespace-nowrap px-5 py-3 font-semibold"
                        >
                          {header.column.getCanSort() ? (
                            <button
                              onClick={header.column.getToggleSortingHandler()}
                              className="flex items-center gap-1 transition-colors hover:text-charcoal/60"
                            >
                              {flexRender(
                                header.column.columnDef.header,
                                header.getContext()
                              )}
                              <ChevronsUpDown className="h-3 w-3 opacity-40" />
                            </button>
                          ) : (
                            flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )
                          )}
                        </th>
                      ))}
                    </tr>
                  ))}
                </thead>
                <tbody>
                  {table.getRowModel().rows.map((row) => (
                    <tr
                      key={row.id}
                      className="border-b border-charcoal/[0.03] transition-colors last:border-none hover:bg-forest/[0.015]"
                    >
                      {row.getVisibleCells().map((cell) => (
                        <td
                          key={cell.id}
                          className="whitespace-nowrap px-5 py-3.5 text-charcoal/70"
                          onClick={(e) => {
                            if (
                              (e.target as Element).closest("[data-action-menu]")
                            ) {
                              e.stopPropagation();
                            }
                          }}
                        >
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext()
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between border-t border-charcoal/[0.06] px-5 py-3">
              <span className="text-[12px] text-charcoal/40">
                Showing{" "}
                {table.getState().pagination.pageIndex *
                  table.getState().pagination.pageSize +
                  1}
                –
                {Math.min(
                  (table.getState().pagination.pageIndex + 1) *
                    table.getState().pagination.pageSize,
                  filteredRowData.length
                )}{" "}
                of {filteredRowData.length} products
              </span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => table.setPageIndex(0)}
                  disabled={!table.getCanPreviousPage()}
                  className="rounded-md px-2 py-1.5 text-[12px] text-charcoal/50 transition-colors hover:bg-charcoal/[0.04] disabled:opacity-30"
                >
                  First
                </button>
                <button
                  onClick={() => table.previousPage()}
                  disabled={!table.getCanPreviousPage()}
                  className="rounded-md px-2.5 py-1.5 text-[12px] text-charcoal/50 transition-colors hover:bg-charcoal/[0.04] disabled:opacity-30"
                >
                  Prev
                </button>
                <span className="px-2 text-[12px] text-charcoal/40">
                  {table.getState().pagination.pageIndex + 1} /{" "}
                  {table.getPageCount() || 1}
                </span>
                <button
                  onClick={() => table.nextPage()}
                  disabled={!table.getCanNextPage()}
                  className="rounded-md px-2.5 py-1.5 text-[12px] text-charcoal/50 transition-colors hover:bg-charcoal/[0.04] disabled:opacity-30"
                >
                  Next
                </button>
                <button
                  onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                  disabled={!table.getCanNextPage()}
                  className="rounded-md px-2 py-1.5 text-[12px] text-charcoal/50 transition-colors hover:bg-charcoal/[0.04] disabled:opacity-30"
                >
                  Last
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Modals */}
      <InventoryEditModal
        item={editingItem}
        onOpenChange={(open) => {
          if (!open) setEditingItem(null);
        }}
        onSave={(sku, values) =>
          updateMutation.mutateAsync({ sku, values })
        }
      />

      <AdjustStockModal
        item={adjustingItem}
        onOpenChange={(open) => {
          if (!open) setAdjustingItem(null);
        }}
        onAdjust={(sku, payload) => adjustMutation.mutateAsync({ sku, payload })}
      />

      <MovementHistoryModal
        item={historyItem}
        onOpenChange={(open) => {
          if (!open) setHistoryItem(null);
        }}
      />
    </div>
  );
}
