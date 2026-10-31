"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import {
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type SortingState
} from "@tanstack/react-table";
import { ArrowUpDown, Loader2 } from "lucide-react";
import { fetchOrders } from "@/lib/api/orders";
import { ApiRequestError } from "@/lib/api/client";
import { queryKeys } from "@/lib/api/query-keys";
import type { ApiOrder } from "@/lib/api/types";
import { formatPrice } from "@/lib/utils";
import { statusVariant } from "@/lib/status-styles";
import { Badge } from "@/components/ui/badge";

const columns: ColumnDef<ApiOrder>[] = [
  { accessorKey: "id", header: "Order ID" },
  { accessorKey: "customerName", header: "Customer" },
  { accessorKey: "date", header: "Date" },
  {
    accessorKey: "amount",
    header: "Amount",
    cell: (info) => formatPrice(info.getValue<number>())
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: (info) => (
      <Badge variant={statusVariant[info.getValue<ApiOrder["status"]>()]}>
        {info.getValue<string>()}
      </Badge>
    )
  }
];

export function RecentOrdersTable() {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = React.useState("");

  const params = { limit: 20 };
  const { data, isLoading, isError, error } = useQuery({
    queryKey: queryKeys.orders.list(params),
    queryFn: () => fetchOrders(params)
  });

  const orders = data?.data ?? [];
  const loadError = isError
    ? error instanceof ApiRequestError
      ? error.message
      : "Failed to load orders."
    : null;

  const table = useReactTable({
    data: orders,
    columns,
    state: { sorting, globalFilter },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 6 } }
  });

  return (
    <div className="rounded-[10px] border border-charcoal/[0.06] bg-white p-5">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="font-serif text-lg font-medium text-charcoal">
            Recent Orders
          </p>
          <p className="mt-0.5 text-[11px] uppercase tracking-wide text-charcoal/35">
            Latest customer orders
          </p>
        </div>
        <input
          value={globalFilter}
          onChange={(event) => setGlobalFilter(event.target.value)}
          placeholder="Search orders..."
          aria-label="Search recent orders"
          className="rounded-full border border-charcoal/[0.12] bg-white px-3.5 py-1.5 text-[12px] text-charcoal placeholder:text-charcoal/35 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest"
        />
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center gap-2 py-10 text-[13px] text-charcoal/50">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading orders...
        </div>
      ) : loadError ? (
        <p className="py-10 text-center text-[13px] text-red-500">
          {loadError}
        </p>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[13px]">
              <thead>
                {table.getHeaderGroups().map((headerGroup) => (
                  <tr
                    key={headerGroup.id}
                    className="border-b border-charcoal/[0.06] text-overline uppercase text-charcoal/35"
                  >
                    {headerGroup.headers.map((header) => (
                      <th key={header.id} className="py-2.5 pr-4 font-medium">
                        <button
                          onClick={header.column.getToggleSortingHandler()}
                          className="flex items-center gap-1"
                          disabled={!header.column.getCanSort()}
                        >
                          {flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                          {header.column.getCanSort() && (
                            <ArrowUpDown className="h-3 w-3" />
                          )}
                        </button>
                      </th>
                    ))}
                  </tr>
                ))}
              </thead>
              <tbody>
                {table.getRowModel().rows.map((row) => (
                  <tr
                    key={row.id}
                    className="border-b border-charcoal/[0.04] last:border-none"
                  >
                    {row.getVisibleCells().map((cell) => (
                      <td
                        key={cell.id}
                        className="py-3 pr-4 text-charcoal/70"
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
          <div className="mt-4 flex items-center justify-between text-[12px] text-charcoal/40">
            <span>
              Page {table.getState().pagination.pageIndex + 1} of{" "}
              {table.getPageCount() || 1}
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
                className="rounded-full border border-charcoal/[0.12] px-3 py-1 text-charcoal/60 disabled:opacity-40"
              >
                Prev
              </button>
              <button
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
                className="rounded-full border border-charcoal/[0.12] px-3 py-1 text-charcoal/60 disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
