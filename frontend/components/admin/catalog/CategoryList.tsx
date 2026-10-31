"use client";

import * as React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Plus, Pencil, Trash2, Eye, EyeOff } from "lucide-react";
import { fetchCategories, createCategory, updateCategory, deleteCategory } from "@/lib/api/catalog";
import { queryKeys } from "@/lib/api/query-keys";
import { ApiRequestError } from "@/lib/api/client";
import type { ApiCategory } from "@/lib/api/types";
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

export function CategoryList() {
  const queryClient = useQueryClient();
  const showToast = useToastStore((state) => state.showToast);
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editingItem, setEditingItem] = React.useState<ApiCategory | null>(null);
  const [name, setName] = React.useState("");
  const [isEnabled, setIsEnabled] = React.useState(true);
  const [search, setSearch] = React.useState("");

  const { data: categories = [], isLoading, error } = useQuery({
    queryKey: queryKeys.catalog.categories,
    queryFn: fetchCategories
  });

  const createMutation = useMutation({
    mutationFn: (input: { name: string; isEnabled?: boolean }) => createCategory(input.name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.catalog.categories });
      showToast("Category created");
      closeDialog();
    },
    onError: (err) => {
      showToast(err instanceof ApiRequestError ? err.message : "Failed to create category", "error");
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, ...rest }: { id: string; name: string; isEnabled?: boolean }) =>
      updateCategory(id, rest.name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.catalog.categories });
      showToast("Category updated");
      closeDialog();
    },
    onError: (err) => {
      showToast(err instanceof ApiRequestError ? err.message : "Failed to update category", "error");
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteCategory(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.catalog.categories });
      showToast("Category deleted");
    },
    onError: (err) => {
      showToast(err instanceof ApiRequestError ? err.message : "Failed to delete category", "error");
    }
  });

  function closeDialog() {
    setDialogOpen(false);
    setEditingItem(null);
    setName("");
    setIsEnabled(true);
  }

  function openCreateDialog() {
    setEditingItem(null);
    setName("");
    setIsEnabled(true);
    setDialogOpen(true);
  }

  function openEditDialog(category: ApiCategory) {
    setEditingItem(category);
    setName(category.name);
    setIsEnabled(category.isEnabled);
    setDialogOpen(true);
  }

  function handleSave() {
    if (!name.trim()) return;
    if (editingItem) {
      updateMutation.mutate({ id: editingItem.id, name: name.trim(), isEnabled });
    } else {
      createMutation.mutate({ name: name.trim(), isEnabled });
    }
  }

  function handleDelete(category: ApiCategory) {
    if (!window.confirm(`Delete "${category.name}"? This cannot be undone.`)) return;
    deleteMutation.mutate(category.id);
  }

  const filtered = categories.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  const isSaving = createMutation.isPending || updateMutation.isPending;

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search categories..."
          className="h-9 w-48"
          aria-label="Search categories"
        />
        <Button size="sm" onClick={openCreateDialog}>
          <Plus className="h-4 w-4" />
          Add Category
        </Button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center gap-2 py-16 text-sm text-charcoal/50">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading categories...
        </div>
      ) : error ? (
        <div className="py-16 text-center text-sm text-red-500">Failed to load categories.</div>
      ) : filtered.length === 0 ? (
        <div className="py-16 text-center text-sm text-charcoal/50">No categories found.</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-charcoal/10 text-xs uppercase tracking-wide text-charcoal/45">
                <th className="py-2 pr-4">Name</th>
                <th className="py-2 pr-4">Slug</th>
                <th className="py-2 pr-4">Status</th>
                <th className="py-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((category) => (
                <tr key={category.id} className="border-b border-charcoal/5">
                  <td className="py-3 pr-4 font-medium text-charcoal">{category.name}</td>
                  <td className="py-3 pr-4 text-charcoal/60">{category.slug}</td>
                  <td className="py-3 pr-4">
                    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ${category.isEnabled ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-500"}`}>
                      {category.isEnabled ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                      {category.isEnabled ? "Enabled" : "Disabled"}
                    </span>
                  </td>
                  <td className="py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => openEditDialog(category)}
                        aria-label={`Edit ${category.name}`}
                        className="rounded-full p-1.5 text-charcoal/60 hover:bg-charcoal/5 hover:text-forest"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(category)}
                        aria-label={`Delete ${category.name}`}
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
            <DialogTitle>{editingItem ? "Edit Category" : "Add Category"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="category-name">Category Name</Label>
              <Input
                id="category-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Wash & Wear"
                className="mt-1.5"
                onKeyDown={(e) => { if (e.key === "Enter") handleSave(); }}
              />
            </div>
            <div>
              <Label>Status</Label>
              <button
                type="button"
                onClick={() => setIsEnabled(!isEnabled)}
                className={`mt-1.5 flex w-full items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors ${isEnabled ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-red-200 bg-red-50 text-red-700"}`}
              >
                {isEnabled ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                {isEnabled ? "Enabled" : "Disabled"}
              </button>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={closeDialog} disabled={isSaving}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={isSaving || !name.trim()}>
                {isSaving ? "Saving..." : editingItem ? "Update Category" : "Create Category"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
