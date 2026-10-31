"use client";

import * as React from "react";
import {
  ArrowDown,
  ArrowUp,
  AlertCircle,
  CheckCircle2,
  Loader2
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ApiProduct } from "@/lib/api/types";
import { cn } from "@/lib/utils";

type AdjustStockModalProps = {
  item: ApiProduct | null;
  onOpenChange: (open: boolean) => void;
  onAdjust: (
    sku: string,
    payload: {
      quantityChange: number;
      reason: string;
      color?: string;
      movementType?: "manual_adjustment" | "restock";
    }
  ) => Promise<unknown>;
};

export function AdjustStockModal({ item, onOpenChange, onAdjust }: AdjustStockModalProps) {
  const [mode, setMode] = React.useState<"restock" | "adjust">("restock");
  const [quantity, setQuantity] = React.useState("");
  const [reason, setReason] = React.useState("");
  const [error, setError] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);
  const [selectedColor, setSelectedColor] = React.useState("");

  const colors = item?.colors ?? [];
  const hasColors = colors.length > 0;

  React.useEffect(() => {
    if (item) {
      setMode("restock");
      setQuantity("");
      setReason("");
      setError("");
      setSelectedColor(item.colors?.[0]?.name ?? "");
    }
  }, [item]);

  if (!item) return null;

  const activeColor = hasColors
    ? colors.find((c) => c.name === selectedColor) ?? colors[0]
    : null;
  const currentStock = hasColors ? (activeColor?.stock ?? 0) : item.stock;

  const parsedQuantity = Number(quantity);
  const hasValidQuantity =
    Number.isFinite(parsedQuantity) &&
    parsedQuantity > 0 &&
    Number.isInteger(parsedQuantity);
  const newStockPreview = hasValidQuantity
    ? mode === "restock"
      ? currentStock + parsedQuantity
      : currentStock - parsedQuantity
    : currentStock;

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!item) return;

    if (hasColors && !selectedColor) {
      setError("Select a colour to adjust.");
      return;
    }
    if (!hasValidQuantity) {
      setError(
        mode === "restock"
          ? "Enter the quantity received as a whole number greater than zero."
          : "Enter the quantity to remove as a whole number greater than zero."
      );
      return;
    }
    if (reason.trim().length < 3) {
      setError("A reason is required (at least 3 characters).");
      return;
    }
    if (mode === "adjust" && parsedQuantity > currentStock) {
      setError(`Cannot remove more than the current stock (${currentStock}).`);
      return;
    }

    setError("");
    setSubmitting(true);
    try {
      await onAdjust(item.sku, {
        quantityChange: mode === "restock" ? parsedQuantity : -parsedQuantity,
        reason: reason.trim(),
        movementType: mode === "restock" ? "restock" : "manual_adjustment",
        ...(hasColors ? { color: selectedColor } : {})
      });
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to adjust stock.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={!!item} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="font-serif text-lg">Adjust Stock</DialogTitle>
        </DialogHeader>
        <p className="text-[13px] text-charcoal/55">
          {item.name}
          {hasColors && selectedColor ? (
            <span className="text-charcoal/40"> · {selectedColor}</span>
          ) : null}
        </p>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {hasColors && (
            <div>
              <Label className="mb-1.5 block text-[12px]">Colour</Label>
              <select
                className="flex h-10 w-full rounded-lg border border-charcoal/15 bg-white px-3 text-[13px]"
                value={selectedColor}
                onChange={(e) => setSelectedColor(e.target.value)}
              >
                {colors.map((c) => (
                  <option key={c.name} value={c.name}>
                    {c.name} — {c.stock ?? 0} in stock
                    {(c.stock ?? 0) === 0 ? " (Sold Out)" : ""}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setMode("restock")}
              className={cn(
                "flex items-center justify-center gap-2 rounded-lg border px-3 py-2.5 text-[13px] font-medium transition-colors",
                mode === "restock"
                  ? "border-forest bg-forest/[0.04] text-forest"
                  : "border-charcoal/10 text-charcoal/60 hover:border-charcoal/20"
              )}
            >
              <ArrowUp className="h-4 w-4" />
              Restock
            </button>
            <button
              type="button"
              onClick={() => setMode("adjust")}
              className={cn(
                "flex items-center justify-center gap-2 rounded-lg border px-3 py-2.5 text-[13px] font-medium transition-colors",
                mode === "adjust"
                  ? "border-rust-dark bg-rust-dark/[0.04] text-rust-dark"
                  : "border-charcoal/10 text-charcoal/60 hover:border-charcoal/20"
              )}
            >
              <ArrowDown className="h-4 w-4" />
              Remove
            </button>
          </div>

          <div className="rounded-lg border border-charcoal/[0.08] bg-charcoal/[0.02] px-3 py-2.5 text-[13px]">
            <div className="flex justify-between text-charcoal/55">
              <span>Current{hasColors ? " (colour)" : ""}</span>
              <span className="font-medium text-charcoal">{currentStock}</span>
            </div>
            <div className="mt-1 flex justify-between text-charcoal/55">
              <span>After</span>
              <span
                className={cn(
                  "font-medium",
                  newStockPreview < 0 ? "text-red-500" : "text-charcoal"
                )}
              >
                {newStockPreview}
              </span>
            </div>
          </div>

          <div>
            <Label htmlFor="qty" className="mb-1.5 block text-[12px]">
              Quantity
            </Label>
            <Input
              id="qty"
              inputMode="numeric"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder="e.g. 10"
            />
          </div>

          <div>
            <Label htmlFor="reason" className="mb-1.5 block text-[12px]">
              Reason
            </Label>
            <Input
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Received shipment / damaged stock"
            />
          </div>

          {error && (
            <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-[12px] text-red-600">
              <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              {error}
            </div>
          )}

          <Button type="submit" className="w-full" disabled={submitting}>
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Saving…
              </>
            ) : (
              <>
                <CheckCircle2 className="h-4 w-4" />
                Save adjustment
              </>
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
