"use client";

import * as React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Loader2,
  Plus,
  Pencil,
  Trash2,
  Eye,
  EyeOff,
  ChevronRight
} from "lucide-react";
import {
  fetchCollections,
  createCollection,
  updateCollection,
  deleteCollection,
  createCollectionOption,
  updateCollectionOption,
  deleteCollectionOption
} from "@/lib/api/collections";
import { ApiRequestError } from "@/lib/api/client";
import type { ApiCollection, ApiCollectionOption } from "@/lib/api/types";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { useToastStore } from "@/store/use-toast-store";

export function CollectionsManager() {
  const queryClient = useQueryClient();
  const showToast = useToastStore((state) => state.showToast);
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [optionDialogOpen, setOptionDialogOpen] = React.useState(false);
  const [editingItem, setEditingItem] = React.useState<ApiCollection | null>(null);
  const [editingOption, setEditingOption] = React.useState<ApiCollectionOption | null>(null);
  const [selectedCollection, setSelectedCollection] = React.useState<ApiCollection | null>(null);
  const [name, setName] = React.useState("");
  const [slug, setSlug] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [displayOrder, setDisplayOrder] = React.useState(0);
  const [isEnabled, setIsEnabled] = React.useState(true);
  const [search, setSearch] = React.useState("");
  const [expandedCollection, setExpandedCollection] = React.useState<string | null>(null);

  const { data: collections = [], isLoading, error } = useQuery({
    queryKey: ["admin-collections"],
    queryFn: fetchCollections
  });

  const createMutation = useMutation({
    mutationFn: createCollection,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-collections"] });
      queryClient.invalidateQueries({ queryKey: ["collections", "public"] });
      showToast("Collection created");
      closeDialog();
    },
    onError: (err) => {
      showToast(err instanceof ApiRequestError ? err.message : "Failed to create collection", "error");
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, ...data }: { id: string; name?: string; description?: string; displayOrder?: number; isEnabled?: boolean }) =>
      updateCollection(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-collections"] });
      queryClient.invalidateQueries({ queryKey: ["collections", "public"] });
      showToast("Collection updated");
    },
    onError: (err) => {
      showToast(err instanceof ApiRequestError ? err.message : "Failed to update collection", "error");
    }
  });

  const deleteMutation = useMutation({
    mutationFn: deleteCollection,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-collections"] });
      queryClient.invalidateQueries({ queryKey: ["collections", "public"] });
      showToast("Collection deleted");
    },
    onError: (err) => {
      showToast(err instanceof ApiRequestError ? err.message : "Failed to delete collection", "error");
    }
  });

  const createOptionMutation = useMutation({
    mutationFn: ({ collectionId, ...data }: { collectionId: string; name: string; isActive?: boolean }) =>
      createCollectionOption(collectionId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-collections"] });
      queryClient.invalidateQueries({ queryKey: ["collections", "public"] });
      showToast("Option added");
      closeOptionDialog();
    },
    onError: (err) => {
      showToast(err instanceof ApiRequestError ? err.message : "Failed to add option", "error");
    }
  });

  const updateOptionMutation = useMutation({
    mutationFn: ({ collectionId, optionId, ...data }: { collectionId: string; optionId: string; name?: string; isActive?: boolean }) =>
      updateCollectionOption(collectionId, optionId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-collections"] });
      queryClient.invalidateQueries({ queryKey: ["collections", "public"] });
      showToast("Option updated");
    },
    onError: (err) => {
      showToast(err instanceof ApiRequestError ? err.message : "Failed to update option", "error");
    }
  });

  const deleteOptionMutation = useMutation({
    mutationFn: ({ collectionId, optionId }: { collectionId: string; optionId: string }) =>
      deleteCollectionOption(collectionId, optionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-collections"] });
      queryClient.invalidateQueries({ queryKey: ["collections", "public"] });
      showToast("Option removed");
    },
    onError: (err) => {
      showToast(err instanceof ApiRequestError ? err.message : "Failed to remove option", "error");
    }
  });

  function closeDialog() {
    setDialogOpen(false);
    setEditingItem(null);
    setName("");
    setSlug("");
    setDescription("");
    setDisplayOrder(0);
    setIsEnabled(true);
  }

  function openCreateDialog() {
    setEditingItem(null);
    setName("");
    setSlug("");
    setDescription("");
    setDisplayOrder(0);
    setIsEnabled(true);
    setDialogOpen(true);
  }

  function openEditDialog(collection: ApiCollection) {
    setEditingItem(collection);
    setName(collection.name);
    setSlug(collection.slug);
    setDescription(collection.description);
    setDisplayOrder(collection.displayOrder);
    setIsEnabled(collection.isEnabled);
    setDialogOpen(true);
  }

  function handleSave() {
    if (!name.trim()) return;
    const data = {
      name: name.trim(),
      slug: slug.trim() || undefined,
      description: description.trim(),
      displayOrder,
      isEnabled
    };
    if (editingItem) {
      updateMutation.mutate({ id: editingItem.id, ...data });
    } else {
      createMutation.mutate(data);
    }
  }

  function closeOptionDialog() {
    setOptionDialogOpen(false);
    setEditingOption(null);
    setSelectedCollection(null);
    setName("");
    setSlug("");
    setIsEnabled(true);
  }

  function openAddOptionDialog(collection: ApiCollection) {
    setSelectedCollection(collection);
    setEditingOption(null);
    setName("");
    setSlug("");
    setIsEnabled(true);
    setOptionDialogOpen(true);
  }

  function openEditOptionDialog(collection: ApiCollection, option: ApiCollectionOption) {
    setSelectedCollection(collection);
    setEditingOption(option);
    setName(option.name);
    setSlug(option.slug);
    setIsEnabled(option.isActive);
    setOptionDialogOpen(true);
  }

  function handleSaveOption() {
    if (!name.trim() || !selectedCollection) return;
    const data = {
      name: name.trim(),
      slug: slug.trim() || undefined,
      isActive: isEnabled
    };
    if (editingOption) {
      updateOptionMutation.mutate({
        collectionId: selectedCollection.id,
        optionId: editingOption.id,
        ...data
      });
    } else {
      createOptionMutation.mutate({
        collectionId: selectedCollection.id,
        ...data
      });
    }
  }

  function handleDeleteOption(collectionId: string, optionId: string) {
    if (!window.confirm("Remove this option? This cannot be undone.")) return;
    deleteOptionMutation.mutate({ collectionId, optionId });
  }

  const filtered = collections.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  const isSaving = createMutation.isPending || updateMutation.isPending;
  const isSavingOption = createOptionMutation.isPending || updateOptionMutation.isPending;

  return (
    <div className="rounded-[10px] border border-charcoal/[0.06] bg-white p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search collections..."
          className="h-9 w-48"
          aria-label="Search collections"
        />
        <Button size="sm" onClick={openCreateDialog}>
          <Plus className="h-4 w-4" />
          Add Collection
        </Button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center gap-2 py-16 text-sm text-charcoal/50">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading collections...
        </div>
      ) : error ? (
        <div className="py-16 text-center text-sm text-red-500">Failed to load collections.</div>
      ) : filtered.length === 0 ? (
        <div className="py-16 text-center text-sm text-charcoal/50">No collections found.</div>
      ) : (
        <div className="space-y-3">
          {filtered.map((collection) => (
            <div key={collection.id} className="rounded-lg border border-charcoal/[0.08]">
              {}
              <div className="flex items-center gap-3 px-4 py-3">
                <button
                  onClick={() => setExpandedCollection(expandedCollection === collection.id ? null : collection.id)}
                  className="rounded p-1 text-charcoal/40 hover:bg-charcoal/5 hover:text-charcoal/60"
                >
                  <ChevronRight className={`h-4 w-4 transition-transform ${expandedCollection === collection.id ? "rotate-90" : ""}`} />
                </button>

                <div className="flex-1 min-w-0">
                  <p className="font-medium text-charcoal">{collection.name}</p>
                  <p className="text-[11px] text-charcoal/40">
                    {collection.options?.length ?? 0} options &middot; {collection.productCount ?? 0} products
                  </p>
                </div>

                <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ${collection.isEnabled ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-500"}`}>
                  {collection.isEnabled ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                  {collection.isEnabled ? "Enabled" : "Disabled"}
                </span>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => openAddOptionDialog(collection)}
                    className="rounded-full p-1.5 text-charcoal/60 hover:bg-charcoal/5 hover:text-forest"
                    title="Add option"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => openEditDialog(collection)}
                    aria-label={`Edit ${collection.name}`}
                    className="rounded-full p-1.5 text-charcoal/60 hover:bg-charcoal/5 hover:text-forest"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => {
                      if (!window.confirm(`Delete "${collection.name}"? This cannot be undone.`)) return;
                      deleteMutation.mutate(collection.id);
                    }}
                    aria-label={`Delete ${collection.name}`}
                    className="rounded-full p-1.5 text-charcoal/60 hover:bg-red-50 hover:text-rust"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {}
              {expandedCollection === collection.id && (
                <div className="border-t border-charcoal/[0.06] px-4 py-3 bg-charcoal/[0.01]">
                  {collection.options && collection.options.length > 0 ? (
                    <div className="space-y-1.5">
                      {collection.options.map((option, idx) => (
                        <div key={option.id} className="flex items-center gap-2 rounded-lg bg-white border border-charcoal/[0.06] px-3 py-2">
                          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-charcoal/[0.06] text-[10px] font-medium text-charcoal/50">
                            {idx + 1}
                          </span>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-charcoal">{option.name}</p>
                            <p className="text-[10px] text-charcoal/40">{option.productCount ?? 0} products</p>
                          </div>
                          <button
                            onClick={() => openEditOptionDialog(collection, option)}
                            className="rounded-full p-1.5 text-charcoal/50 hover:bg-charcoal/5 hover:text-forest"
                            title="Edit option"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteOption(collection.id, option.id)}
                            className="rounded-full p-1.5 text-charcoal/50 hover:bg-red-50 hover:text-rust"
                            title="Delete option"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-center text-[12px] text-charcoal/40 py-4">
                      No dropdown options yet. Click + to add one.
                    </p>
                  )}
                  <button
                    onClick={() => openAddOptionDialog(collection)}
                    className="mt-2 flex w-full items-center justify-center gap-1 rounded-lg border border-dashed border-charcoal/15 py-2 text-[12px] text-charcoal/45 hover:border-forest/30 hover:text-forest"
                  >
                    <Plus className="h-3 w-3" />
                    Add Dropdown Option
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {}
      <Dialog open={dialogOpen} onOpenChange={(open) => { if (!open) closeDialog(); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingItem ? "Edit Collection" : "Add Collection"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="collection-name">Collection Name</Label>
              <Input id="collection-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Summer Collection" className="mt-1.5" />
            </div>
            <div>
              <Label htmlFor="collection-slug">Slug (auto-generated if empty)</Label>
              <Input id="collection-slug" value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="e.g. summer-collection" className="mt-1.5" />
            </div>
            <div>
              <Label htmlFor="collection-desc">Description</Label>
              <Textarea id="collection-desc" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Brief description" className="mt-1.5" rows={2} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="collection-order">Display Order</Label>
                <Input id="collection-order" type="number" value={displayOrder} onChange={(e) => setDisplayOrder(parseInt(e.target.value) || 0)} className="mt-1.5" />
              </div>
              <div>
                <Label>Status</Label>
                <button type="button" onClick={() => setIsEnabled(!isEnabled)} className={`mt-1.5 flex w-full items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors ${isEnabled ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-red-200 bg-red-50 text-red-700"}`}>
                  {isEnabled ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                  {isEnabled ? "Enabled" : "Disabled"}
                </button>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={closeDialog} disabled={isSaving}>Cancel</Button>
              <Button onClick={handleSave} disabled={isSaving || !name.trim()}>
                {isSaving ? "Saving..." : editingItem ? "Update Collection" : "Create Collection"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {}
      <Dialog open={optionDialogOpen} onOpenChange={(open) => { if (!open) closeOptionDialog(); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingOption ? "Edit Option" : `Add Option to ${selectedCollection?.name}`}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="option-name">Option Name</Label>
              <Input id="option-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Wash & Wear" className="mt-1.5" />
            </div>
            <div>
              <Label htmlFor="option-slug">Slug (auto-generated if empty)</Label>
              <Input id="option-slug" value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="e.g. wash-wear" className="mt-1.5" />
            </div>
            <div>
              <Label>Status</Label>
              <button type="button" onClick={() => setIsEnabled(!isEnabled)} className={`mt-1.5 flex w-full items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors ${isEnabled ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-red-200 bg-red-50 text-red-700"}`}>
                {isEnabled ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                {isEnabled ? "Active" : "Inactive"}
              </button>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={closeOptionDialog} disabled={isSavingOption}>Cancel</Button>
              <Button onClick={handleSaveOption} disabled={isSavingOption || !name.trim()}>
                {isSavingOption ? "Saving..." : editingOption ? "Update Option" : "Add Option"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
