"use client";

import * as React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Plus, Pencil, Trash2 } from "lucide-react";
import { fetchFabricTypes, createFabricType, updateFabricType, deleteFabricType } from "@/lib/api/catalog";
import { queryKeys } from "@/lib/api/query-keys";
import { ApiRequestError } from "@/lib/api/client";
import type { ApiFabricType } from "@/lib/api/types";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { useToastStore } from "@/store/use-toast-store";

export function FabricTypeList() {
  const queryClient = useQueryClient();
  const showToast = useToastStore((state) => state.showToast);
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editingItem, setEditingItem] = React.useState<ApiFabricType | null>(null);
  const [name, setName] = React.useState("");
  const [search, setSearch] = React.useState("");

  const { data: fabricTypes = [], isLoading, error } = useQuery({
    queryKey: queryKeys.catalog.fabricTypes,
    queryFn: fetchFabricTypes
  });

  const createMutation = useMutation({
    mutationFn: (newName: string) => createFabricType(newName),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.catalog.fabricTypes });
      showToast("Fabric type created");
      closeDialog();
    },
    onError: (err) => {
      showToast(err instanceof ApiRequestError ? err.message : "Failed to create fabric type", "error");
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, name: newName }: { id: string; name: string }) => updateFabricType(id, newName),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.catalog.fabricTypes });
      showToast("Fabric type updated");
      closeDialog();
    },
    onError: (err) => {
      showToast(err instanceof ApiRequestError ? err.message : "Failed to update fabric type", "error");
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteFabricType(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.catalog.fabricTypes });
      showToast("Fabric type deleted");
    },
    onError: (err) => {
      showToast(err instanceof ApiRequestError ? err.message : "Failed to delete fabric type", "error");
    }
  });

  function closeDialog() {
    setDialogOpen(false);
    setEditingItem(null);
    setName("");
  }

  function openCreateDialog() {
    setEditingItem(null);
    setName("");
    setDialogOpen(true);
  }

  function openEditDialog(fabricType: ApiFabricType) {
    setEditingItem(fabricType);
    setName(fabricType.name);
    setDialogOpen(true);
  }

  function handleSave() {
    if (!name.trim()) return;
    if (editingItem) {
      updateMutation.mutate({ id: editingItem.id, name: name.trim() });
    } else {
      createMutation.mutate(name.trim());
    }
  }

  function handleDelete(fabricType: ApiFabricType) {
    if (!window.confirm(`Delete "${fabricType.name}"? This cannot be undone.`)) return;
    deleteMutation.mutate(fabricType.id);
  }

  const filtered = fabricTypes.filter((ft) =>
    ft.name.toLowerCase().includes(search.toLowerCase())
  );

  const isSaving = createMutation.isPending || updateMutation.isPending;

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search fabric types..."
          className="h-9 w-48"
          aria-label="Search fabric types"
        />
        <Button size="sm" onClick={openCreateDialog}>
          <Plus className="h-4 w-4" />
          Add Fabric Type
        </Button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center gap-2 py-16 text-sm text-charcoal/50">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading fabric types...
        </div>
      ) : error ? (
        <div className="py-16 text-center text-sm text-red-500">Failed to load fabric types.</div>
      ) : filtered.length === 0 ? (
        <div className="py-16 text-center text-sm text-charcoal/50">No fabric types found.</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-charcoal/10 text-xs uppercase tracking-wide text-charcoal/45">
                <th className="py-2 pr-4">Name</th>
                <th className="py-2 pr-4">Slug</th>
                <th className="py-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((fabricType) => (
                <tr key={fabricType.id} className="border-b border-charcoal/5">
                  <td className="py-3 pr-4 font-medium text-charcoal">{fabricType.name}</td>
                  <td className="py-3 pr-4 text-charcoal/60">{fabricType.slug}</td>
                  <td className="py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => openEditDialog(fabricType)}
                        aria-label={`Edit ${fabricType.name}`}
                        className="rounded-full p-1.5 text-charcoal/60 hover:bg-charcoal/5 hover:text-forest"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(fabricType)}
                        aria-label={`Delete ${fabricType.name}`}
                        className="rounded-full p-1.5 text-charcoal/60 hover:bg-red-50 hover:text-rust"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={(open) => { if (!open) closeDialog(); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingItem ? "Edit Fabric Type" : "Add Fabric Type"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="fabric-type-name">Fabric Type Name</Label>
              <Input
                id="fabric-type-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Wash & Wear Blend"
                className="mt-1.5"
                onKeyDown={(e) => { if (e.key === "Enter") handleSave(); }}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={closeDialog} disabled={isSaving}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={isSaving || !name.trim()}>
                {isSaving ? "Saving..." : editingItem ? "Update Fabric Type" : "Create Fabric Type"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
