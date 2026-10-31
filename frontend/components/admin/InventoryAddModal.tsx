"use client";

import * as React from "react";
import { Plus } from "lucide-react";
import type { InventoryFormValues } from "@/lib/validations";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { InventoryForm } from "@/components/admin/InventoryForm";

type InventoryAddModalProps = {
  onAdd: (values: InventoryFormValues) => unknown;
};

export function InventoryAddModal({ onAdd }: InventoryAddModalProps) {
  const [open, setOpen] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);

  async function handleSubmit(values: InventoryFormValues) {
    setSubmitting(true);
    try {
      await onAdd(values);
      setOpen(false);
    } catch {
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="h-4 w-4" />
          Add Product
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Product</DialogTitle>
        </DialogHeader>
        <InventoryForm
          mode="create"
          onSubmit={handleSubmit}
          submitLabel={submitting ? "Saving..." : "Save Product"}
        />
      </DialogContent>
    </Dialog>
  );
}
