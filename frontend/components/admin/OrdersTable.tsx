"use client";

import * as React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type SortingState,
  type VisibilityState
} from "@tanstack/react-table";
import {
  ChevronsUpDown,
  Clock,
  Eye,
  FileText,
  Filter,
  Loader2,
  MoreHorizontal,
  Package,
  RefreshCcw,
  Search,
  Send,
  ShoppingCart,
  Trash2,
  TrendingUp,
  X,
  CheckCircle2,
  Banknote,
  AlertCircle
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { fetchOrders, updateOrderStatus } from "@/lib/api/orders";
import { ApiRequestError } from "@/lib/api/client";
import { queryKeys } from "@/lib/api/query-keys";
import type { ApiOrder } from "@/lib/api/types";
import { cn, formatPrice } from "@/lib/utils";
import { statusVariant, orderColumnLabels } from "@/lib/status-styles";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { OrderDetailPanel } from "@/components/admin/OrderDetailPanel";
import { useToastStore } from "@/store/use-toast-store";

const statusOptions: (ApiOrder["status"] | "All")[] = [
  "All",
  "Pending",
  "Confirmed",
  "Shipped",
  "Delivered",
  "Cancelled"
];

const statusConfig: Record<
  ApiOrder["status"],
  { label: string; icon: typeof Package; color: string; bgColor: string }
> = {
  Pending: {
    label: "Pending",
    icon: Clock,
    color: "text-amber-600",
    bgColor: "bg-amber-50"
  },
  Confirmed: {
    label: "Confirmed",
    icon: CheckCircle2,
    color: "text-blue-600",
    bgColor: "bg-blue-50"
  },
  Shipped: {
    label: "Shipped",
    icon: Send,
    color: "text-violet-600",
    bgColor: "bg-violet-50"
  },
  Delivered: {
    label: "Delivered",
    icon: Package,
    color: "text-emerald-600",
    bgColor: "bg-emerald-50"
  },
  Cancelled: {
    label: "Cancelled",
    icon: Trash2,
    color: "text-red-600",
    bgColor: "bg-red-50"
  }
};

const paymentMethodLabels: Record<string, string> = {
  "Cash on Delivery": "COD",
  "Easypaisa / JazzCash": "Easypaisa",
  "Bank Transfer": "Bank"
};

function formatDate(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    const timeStr = date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true
    });

    if (diffDays === 0) {
      return `Today, ${timeStr}`;
    } else if (diffDays === 1) {
      return `Yesterday, ${timeStr}`;
    } else if (diffDays < 7) {
      return `${diffDays}d ago`;
    } else {
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined
      });
    }
  } catch {
    return dateStr;
  }
}

function OrderStats({ orders }: { orders: ApiOrder[] }) {
  const stats = React.useMemo(() => {
    const totalOrders = orders.length;
    const pendingOrders = orders.filter((o) => o.status === "Pending").length;
    const totalRevenue = orders.reduce((sum, o) => sum + o.amount, 0);
    const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
    return { totalOrders, pendingOrders, totalRevenue, avgOrderValue };
  }, [orders]);

  const cards = [
    {
      label: "Total Orders",
      value: String(stats.totalOrders),
      icon: ShoppingCart,
      color: "text-forest",
      bg: "bg-forest/[0.06]"
    },
    {
      label: "Pending",
      value: String(stats.pendingOrders),
      icon: Clock,
      color: "text-amber-600",
      bg: "bg-amber-50"
    },
    {
      label: "Revenue",
      value: formatPrice(stats.totalRevenue),
      icon: Banknote,
      color: "text-forest",
      bg: "bg-forest/[0.06]"
    },
    {
      label: "Avg. Order",
      value: formatPrice(stats.avgOrderValue),
      icon: TrendingUp,
      color: "text-sand-dark",
      bg: "bg-sand/10"
    }
  ];

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => (
        <div
          key={card.label}
          className="rounded-[10px] border border-charcoal/[0.06] bg-white p-4"
        >
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-medium uppercase tracking-wider text-charcoal/40">
              {card.label}
            </p>
            <div
              className={cn(
                "flex h-8 w-8 items-center justify-center rounded-full",
                card.bg
              )}
            >
              <card.icon className={cn("h-4 w-4", card.color)} />
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

export function OrdersTable() {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<
    ApiOrder["status"] | "All"
  >("All");
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({});
  const [selectedOrder, setSelectedOrder] = React.useState<ApiOrder | null>(
    null
  );
  const [openMenuId, setOpenMenuId] = React.useState<string | null>(null);
  const [showFilters, setShowFilters] = React.useState(false);
  const showToast = useToastStore((state) => state.showToast);
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();

  const params = { limit: 100 };
  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
    isFetching
  } = useQuery({
    queryKey: queryKeys.orders.list(params),
    queryFn: () => fetchOrders(params)
  });

  const data_ = data?.data ?? [];
  const loadError = isError
    ? error instanceof ApiRequestError
      ? error.message
      : "Failed to load orders."
    : null;

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: ApiOrder["status"] }) =>
      updateOrderStatus(id, status),
    onSuccess: (updated) => {
      queryClient.setQueryData<{ data: ApiOrder[]; meta: unknown }>(
        queryKeys.orders.list(params),
        (current) =>
          current
            ? {
                ...current,
                data: current.data.map((order) =>
                  order.id === updated.id ? updated : order
                )
              }
            : current
      );
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.stats });
      showToast(
        `Order ${updated.id.slice(-8)} marked as ${updated.status}`
      );
    },
    onError: (mutationError) => {
      showToast(
        mutationError instanceof ApiRequestError
          ? mutationError.message
          : "Failed to update order.", "error"
      );
    }
  });

  React.useEffect(() => {
    const queryParam = searchParams.get("q");
    if (queryParam) setGlobalFilter(queryParam);
  }, [searchParams]);

  React.useEffect(() => {
    if (!openMenuId) return;
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Element;
      if (!target.closest("[data-order-action-menu]")) {
        setOpenMenuId(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [openMenuId]);

  const filteredData = React.useMemo(
    () =>
      statusFilter === "All"
        ? data_
        : data_.filter((order) => order.status === statusFilter),
    [data_, statusFilter]
  );

  function markShipped(order: ApiOrder) {
    setOpenMenuId(null);
    statusMutation.mutate({ id: order.id, status: "Shipped" });
  }

  function markDelivered(order: ApiOrder) {
    setOpenMenuId(null);
    statusMutation.mutate({ id: order.id, status: "Delivered" });
  }

  function printInvoice(orderId: string) {
    setOpenMenuId(null);
    router.push(`/admin/orders/${encodeURIComponent(orderId)}/invoice`);
  }

  function viewOrder(order: ApiOrder) {
    setOpenMenuId(null);
    setSelectedOrder(order);
  }

  const columns = React.useMemo<ColumnDef<ApiOrder>[]>(
    () => [
      {
        accessorKey: "id",
        header: "Order",
        cell: (info) => {
          const id = info.getValue<string>();
          const shortId = id.length > 8 ? `#${id.slice(-8)}` : `#${id}`;
          return (
            <span className="font-mono text-[13px] font-medium text-charcoal">
              {shortId}
            </span>
          );
        }
      },
      {
        accessorKey: "customerName",
        header: "Customer",
        cell: (info) => {
          const order = info.row.original;
          return (
            <div className="min-w-[120px]">
              <p className="text-[13px] font-medium text-charcoal">
                {info.getValue<string>()}
              </p>
              <p className="text-[11px] text-charcoal/40">
                {order.customerPhone}
              </p>
            </div>
          );
        }
      },
      {
        accessorKey: "date",
        header: "Date",
        cell: (info) => (
          <span className="text-[12px] text-charcoal/55">
            {formatDate(info.getValue<string>())}
          </span>
        )
      },
      {
        accessorKey: "amount",
        header: "Amount",
        cell: (info) => (
          <span className="text-[13px] font-medium text-charcoal">
            {formatPrice(info.getValue<number>())}
          </span>
        )
      },
      {
        accessorKey: "paymentMethod",
        header: "Payment",
        cell: (info) => {
          const method = info.getValue<string>();
          const short = paymentMethodLabels[method] ?? method;
          const order = info.row.original;
          const isPaid = order.paymentStatus === "paid";
          return (
            <div className="flex flex-col gap-0.5">
              <span className="text-[12px] text-charcoal/60">{short}</span>
              <span
                className={cn(
                  "inline-flex w-fit items-center rounded-full px-1.5 py-0.5 text-[10px] font-medium",
                  isPaid
                    ? "bg-emerald-50 text-emerald-700"
                    : "bg-charcoal/[0.04] text-charcoal/45"
                )}
              >
                {isPaid ? "Paid" : order.paymentStatus}
              </span>
            </div>
          );
        }
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: (info) => {
          const status = info.getValue<ApiOrder["status"]>();
          const config = statusConfig[status];
          return (
            <div className="flex items-center gap-1.5">
              <span
                className={cn(
                  "flex h-2 w-2 rounded-full",
                  config.bgColor.replace("bg-", "bg-")
                )}
                style={{
                  backgroundColor:
                    status === "Pending"
                      ? "#f59e0b"
                      : status === "Confirmed"
                        ? "#2563eb"
                        : status === "Shipped"
                          ? "#7c3aed"
                          : status === "Delivered"
                            ? "#10b981"
                            : "#ef4444"
                }}
              />
              <Badge variant={statusVariant[status]}>{status}</Badge>
            </div>
          );
        }
      },
      {
        id: "action",
        header: "",
        cell: ({ row }) => {
          const order = row.original;
          const isOpen = openMenuId === order.id;
          return (
            <div className="relative flex justify-end" data-order-action-menu>
              <button
                onClick={() => setOpenMenuId(isOpen ? null : order.id)}
                aria-label={`Actions for order ${order.id.slice(-8)}`}
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
                    onClick={() => viewOrder(order)}
                    className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-[13px] text-charcoal/70 hover:bg-forest/[0.04] hover:text-forest transition-colors"
                  >
                    <Eye className="h-3.5 w-3.5" />
                    View Details
                  </button>
                  {order.status === "Pending" && (
                    <button
                      onClick={() => {
                        statusMutation.mutate({
                          id: order.id,
                          status: "Confirmed"
                        });
                        setOpenMenuId(null);
                      }}
                      disabled={statusMutation.isPending}
                      className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-[13px] text-charcoal/70 hover:bg-forest/[0.04] hover:text-forest transition-colors disabled:opacity-50"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Confirm Order
                    </button>
                  )}
                  {order.status === "Confirmed" && (
                    <button
                      onClick={() => markShipped(order)}
                      disabled={statusMutation.isPending}
                      className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-[13px] text-charcoal/70 hover:bg-forest/[0.04] hover:text-forest transition-colors disabled:opacity-50"
                    >
                      <Send className="h-3.5 w-3.5" />
                      Mark as Shipped
                    </button>
                  )}
                  {order.status === "Shipped" && (
                    <button
                      onClick={() => markDelivered(order)}
                      disabled={statusMutation.isPending}
                      className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-[13px] text-charcoal/70 hover:bg-forest/[0.04] hover:text-forest transition-colors disabled:opacity-50"
                    >
                      <Package className="h-3.5 w-3.5" />
                      Mark as Delivered
                    </button>
                  )}
                  <div className="my-1 border-t border-charcoal/[0.06]" />
                  <button
                    onClick={() => printInvoice(order.id)}
                    className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-[13px] text-charcoal/70 hover:bg-forest/[0.04] hover:text-forest transition-colors"
                  >
                    <FileText className="h-3.5 w-3.5" />
                    Print Invoice
                  </button>
                </div>
              )}
            </div>
          );
        }
      }
    ],
    [openMenuId, statusMutation]
  );

  const table = useReactTable({
    data: filteredData,
    columns,
    state: { sorting, globalFilter, columnVisibility },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 10 } }
  });

  const activeStatusCount =
    statusFilter !== "All"
      ? filteredData.length
      : undefined;

  return (
    <div className="space-y-5">
      {/* Summary Stats */}
      {data_.length > 0 && <OrderStats orders={data_} />}

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
                placeholder="Search by name, order ID, phone..."
                aria-label="Search orders"
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
              {/* Filter toggle */}
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={cn(
                  "flex items-center gap-1.5 rounded-lg border px-3 py-2 text-[12px] font-medium transition-colors",
                  showFilters
                    ? "border-forest/20 bg-forest/[0.04] text-forest"
                    : "border-charcoal/[0.12] text-charcoal/55 hover:bg-charcoal/[0.02]"
                )}
              >
                <Filter className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Filters</span>
              </button>

              {/* Refresh */}
              <button
                onClick={() => refetch()}
                disabled={isFetching}
                className="flex items-center gap-1.5 rounded-lg border border-charcoal/[0.12] px-3 py-2 text-[12px] font-medium text-charcoal/55 transition-colors hover:bg-charcoal/[0.02] disabled:opacity-50"
                title="Refresh orders"
              >
                <RefreshCcw
                  className={cn(
                    "h-3.5 w-3.5",
                    isFetching && "animate-spin"
                  )}
                />
                <span className="hidden sm:inline">Refresh</span>
              </button>
            </div>
          </div>

          {/* Expanded filters */}
          {showFilters && (
            <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-charcoal/[0.06] pt-3">
              <span className="text-[11px] font-medium uppercase tracking-wider text-charcoal/35">
                Status:
              </span>
              {statusOptions.map((option) => (
                <button
                  key={option}
                  onClick={() => setStatusFilter(option)}
                  className={cn(
                    "rounded-full px-3 py-1 text-[12px] font-medium transition-colors",
                    statusFilter === option
                      ? "bg-charcoal text-cream"
                      : "border border-charcoal/[0.10] text-charcoal/50 hover:border-charcoal/20 hover:text-charcoal/70"
                  )}
                >
                  {option}
                </button>
              ))}

              {activeStatusCount !== undefined && (
                <span className="ml-1 text-[11px] text-charcoal/35">
                  ({activeStatusCount} orders)
                </span>
              )}

              <div className="ml-auto flex items-center gap-3">
                {table.getAllLeafColumns().map((column) => (
                  <label
                    key={column.id}
                    className="flex items-center gap-1.5 text-[11px] text-charcoal/45"
                  >
                    <input
                      type="checkbox"
                      checked={column.getIsVisible()}
                      onChange={column.getToggleVisibilityHandler()}
                      className="h-3.5 w-3.5 rounded border-charcoal/25 text-forest accent-forest"
                    />
                    {orderColumnLabels[column.id] ?? column.id}
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Table */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center gap-3 py-20">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-charcoal/[0.04]">
              <Loader2 className="h-5 w-5 animate-spin text-charcoal/30" />
            </div>
            <p className="text-[13px] text-charcoal/45">Loading orders...</p>
          </div>
        ) : loadError ? (
          <div className="flex flex-col items-center justify-center gap-4 py-20">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-50">
              <AlertCircle className="h-6 w-6 text-red-400" />
            </div>
            <div className="text-center">
              <p className="text-[13px] font-medium text-charcoal/70">
                Unable to load orders
              </p>
              <p className="mt-1 text-[12px] text-charcoal/40">{loadError}</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
            >
              <RefreshCcw className="h-3.5 w-3.5" />
              Try Again
            </Button>
          </div>
        ) : filteredData.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-4 py-20">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-charcoal/[0.04]">
              <ShoppingCart className="h-6 w-6 text-charcoal/20" />
            </div>
            <div className="text-center">
              <p className="text-[13px] font-medium text-charcoal/60">
                No orders found
              </p>
              <p className="mt-1 text-[12px] text-charcoal/35">
                {globalFilter || statusFilter !== "All"
                  ? "Try adjusting your search or filters"
                  : "Orders will appear here once customers start placing them"}
              </p>
            </div>
            {(globalFilter || statusFilter !== "All") && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setGlobalFilter("");
                  setStatusFilter("All");
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
                      onClick={() => viewOrder(row.original)}
                      className="cursor-pointer border-b border-charcoal/[0.03] transition-colors last:border-none hover:bg-forest/[0.015]"
                    >
                      {row.getVisibleCells().map((cell) => (
                        <td
                          key={cell.id}
                          className="whitespace-nowrap px-5 py-3.5 text-charcoal/70"
                          onClick={(e) => {
                            if (
                              (e.target as Element).closest(
                                "[data-order-action-menu]"
                              )
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
                  filteredData.length
                )}{" "}
                of {filteredData.length} orders
              </span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => table.setPageIndex(0)}
                  disabled={!table.getCanPreviousPage()}
                  className="rounded-md px-2 py-1.5 text-[12px] text-charcoal/50 transition-colors hover:bg-charcoal/[0.04] disabled:opacity-30 disabled:hover:bg-transparent"
                >
                  First
                </button>
                <button
                  onClick={() => table.previousPage()}
                  disabled={!table.getCanPreviousPage()}
                  className="rounded-md px-2.5 py-1.5 text-[12px] text-charcoal/50 transition-colors hover:bg-charcoal/[0.04] disabled:opacity-30 disabled:hover:bg-transparent"
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
                  className="rounded-md px-2.5 py-1.5 text-[12px] text-charcoal/50 transition-colors hover:bg-charcoal/[0.04] disabled:opacity-30 disabled:hover:bg-transparent"
                >
                  Next
                </button>
                <button
                  onClick={() =>
                    table.setPageIndex(table.getPageCount() - 1)
                  }
                  disabled={!table.getCanNextPage()}
                  className="rounded-md px-2 py-1.5 text-[12px] text-charcoal/50 transition-colors hover:bg-charcoal/[0.04] disabled:opacity-30 disabled:hover:bg-transparent"
                >
                  Last
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Order Detail Panel */}
      <OrderDetailPanel
        order={selectedOrder}
        onClose={() => setSelectedOrder(null)}
      />
    </div>
  );
}
