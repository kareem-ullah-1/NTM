"use client";

import { useQuery } from "@tanstack/react-query";
import {
  ArrowUp,
  History,
  Loader2,
  RotateCcw,
  ShoppingCart,
  Undo2,
  Wrench
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { fetchInventoryMovements } from "@/lib/api/inventory";
import { queryKeys } from "@/lib/api/query-keys";
import type { ApiProduct, InventoryMovementType } from "@/lib/api/types";
import { cn } from "@/lib/utils";

type MovementHistoryModalProps = {
  item: ApiProduct | null;
  onOpenChange: (open: boolean) => void;
};

const TYPE_CONFIG: Record<
  InventoryMovementType,
  {
    label: string;
    icon: typeof ShoppingCart;
    color: string;
    bgColor: string;
    changeColor: string;
  }
> = {
  sale: {
    label: "Sale",
    icon: ShoppingCart,
    color: "text-amber-600",
    bgColor: "bg-amber-50",
    changeColor: "text-red-500"
  },
  cancellation: {
    label: "Cancellation",
    icon: Undo2,
    color: "text-blue-600",
    bgColor: "bg-blue-50",
    changeColor: "text-emerald-600"
  },
  return: {
    label: "Return",
    icon: RotateCcw,
    color: "text-purple-600",
    bgColor: "bg-purple-50",
    changeColor: "text-emerald-600"
  },
  manual_adjustment: {
    label: "Manual Adjustment",
    icon: Wrench,
    color: "text-charcoal/60",
    bgColor: "bg-charcoal/[0.04]",
    changeColor: ""
  },
  restock: {
    label: "Restock",
    icon: ArrowUp,
    color: "text-emerald-600",
    bgColor: "bg-emerald-50",
    changeColor: "text-emerald-600"
  }
};

function formatDate(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
      hour: "2-digit",
      minute: "2-digit"
    });
  } catch {
    return dateStr;
  }
}

export function MovementHistoryModal({ item, onOpenChange }: MovementHistoryModalProps) {
  const { data, isLoading } = useQuery({
    queryKey: item
      ? queryKeys.inventory.movements(item.sku)
      : ["inventory", "movements", "none"],
    queryFn: () => fetchInventoryMovements({ sku: item!.sku, limit: 50 }),
    enabled: item !== null
  });

  return (
    <Dialog open={item !== null} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[80vh] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <History className="h-5 w-5 text-charcoal/40" />
            Stock History
          </DialogTitle>
          {item && (
            <p className="text-[12px] text-charcoal/45">
              {item.name} — Current stock: {item.stock}
            </p>
          )}
        </DialogHeader>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center gap-3 py-12">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-charcoal/[0.04]">
              <Loader2 className="h-5 w-5 animate-spin text-charcoal/30" />
            </div>
            <p className="text-[13px] text-charcoal/45">Loading history...</p>
          </div>
        ) : !data || data.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 py-12">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-charcoal/[0.04]">
              <History className="h-6 w-6 text-charcoal/15" />
            </div>
            <p className="text-[13px] text-charcoal/50">
              No stock movements recorded yet.
            </p>
            <p className="text-[11px] text-charcoal/35">
              Movements will appear here after stock adjustments, sales, and returns.
            </p>
          </div>
        ) : (
          <div className="space-y-0">
            {data.map((movement, index) => {
              const config = TYPE_CONFIG[movement.movement_type];
              const isPositive = movement.quantity_change > 0;
              const isNegative = movement.quantity_change < 0;
              const Icon = config.icon;

              return (
                <div key={movement.id} className="flex gap-3">
                  {/* Timeline line */}
                  <div className="flex flex-col items-center">
                    <div
                      className={cn(
                        "flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
                        config.bgColor
                      )}
                    >
                      <Icon className={cn("h-4 w-4", config.color)} />
                    </div>
                    {index < data.length - 1 && (
                      <div className="my-1 h-full min-h-[20px] w-px bg-charcoal/[0.08]" />
                    )}
                  </div>

                  {/* Content */}
                  <div className={cn("flex-1 pb-4", index === data.length - 1 && "pb-0")}>
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span
                            className={cn(
                              "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold",
                              config.bgColor,
                              config.color
                            )}
                          >
                            {config.label}
                          </span>
                          <span className="text-[11px] text-charcoal/30">
                            {formatDate(movement.created_at)}
                          </span>
                        </div>
                        {movement.reason && (
                          <p className="mt-1.5 text-[12px] text-charcoal/60">
                            {movement.reason}
                          </p>
                        )}
                        <div className="mt-1 flex items-center gap-2 text-[11px] text-charcoal/35">
                          <span>{movement.created_by_name ?? "System"}</span>
                          {movement.order_id && (
                            <>
                              <span>·</span>
                              <span className="font-mono">Order {movement.order_id.slice(-8)}</span>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Quantity change */}
                      <div className="shrink-0 text-right">
                        <p
                          className={cn(
                            "text-[14px] font-semibold",
                            isPositive
                              ? "text-emerald-600"
                              : isNegative
                                ? "text-red-500"
                                : "text-charcoal/60"
                          )}
                        >
                          {isPositive ? "+" : ""}
                          {movement.quantity_change}
                        </p>
                        <p className="font-mono text-[10px] text-charcoal/30">
                          {movement.previous_stock} → {movement.new_stock}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
