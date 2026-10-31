"use client";

import * as React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { InventoryForm } from "@/components/admin/InventoryForm";
import type { InventoryFormValues } from "@/lib/validations";
import type { ApiProduct } from "@/lib/api/types";

type InventoryEditModalProps = {
  item: ApiProduct | null;
  onOpenChange: (open: boolean) => void;
  onSave: (sku: string, values: InventoryFormValues) => unknown;
};

export function InventoryEditModal({ item, onOpenChange, onSave }: InventoryEditModalProps) {
  const [submitting, setSubmitting] = React.useState(false);

  async function handleSave(sku: string, values: InventoryFormValues) {
    setSubmitting(true);
    try {
      await onSave(sku, values);
    } catch {
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={item !== null} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            Edit Product
            {item && (
              <span className="ml-2 font-normal text-charcoal/50">
                — {item.name}
              </span>
            )}
          </DialogTitle>
        </DialogHeader>
        {item && (
          <InventoryForm
            key={item.sku}
            mode="edit"
            defaultValues={{
              productName: item.name,
              collections: item.collections ?? [],
              category: item.category,
              fabricType: item.fabricType,
              colors: item.colors.map((c) => ({
                name: c.name,
                hex: c.hex,
                image: c.image ?? null,
                images: c.images ?? []
              })),
              price: item.price,
              originalPrice: item.originalPrice ?? null,
              lowStockThreshold: item.lowStockThreshold,
              images: item.images,
              description: item.description,
              featured: item.featured,
              isNew: item.isNew
            }}
            onSubmit={(values) => handleSave(item.sku, values)}
            submitLabel={submitting ? "Saving..." : "Save Changes"}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
