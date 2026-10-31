"use client";

import * as React from "react";
import Image from "next/image";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Loader2,
  Plus,
  Trash2,
  Eye,
  EyeOff,
  ChevronDown,
  ChevronRight,
  Home,
  ArrowUpRight,
  Package
} from "lucide-react";
import {
  fetchCategories,
  fetchHomeFeaturedCategories,
  createHomeFeaturedCategory,
  updateHomeFeaturedCategory,
  deleteHomeFeaturedCategory
} from "@/lib/api/catalog";
import { fetchProducts } from "@/lib/api/products";
import { queryKeys } from "@/lib/api/query-keys";
import { ApiRequestError } from "@/lib/api/client";
import type { ApiHomeFeaturedCategory, ApiProduct } from "@/lib/api/types";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { useToastStore } from "@/store/use-toast-store";
import { uploadImageToR2 } from "@/lib/api/uploads";

export function HomeFeaturedCategoryList() {
  const queryClient = useQueryClient();
  const showToast = useToastStore((state) => state.showToast);
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = React.useState("");
  const [imageUrl, setImageUrl] = React.useState<string | null>(null);
  const [isActive, setIsActive] = React.useState(true);
  const [uploading, setUploading] = React.useState(false);
  const [expandedCategoryId, setExpandedCategoryId] = React.useState<string | null>(null);

  const {
    data: homeFeatured = [],
    isLoading,
    error
  } = useQuery({
    queryKey: queryKeys.catalog.homeFeatured,
    queryFn: fetchHomeFeaturedCategories
  });

  const { data: allCategories = [] } = useQuery({
    queryKey: queryKeys.catalog.categories,
    queryFn: fetchCategories
  });

  const availableCategories = allCategories.filter(
    (cat) =>
      cat.isEnabled &&
      !homeFeatured.some((hf) => hf.categoryId === cat.id)
  );

  const createMutation = useMutation({
    mutationFn: createHomeFeaturedCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.catalog.homeFeatured });
      queryClient.invalidateQueries({ queryKey: queryKeys.store.homeFeatured });
      showToast("Category added to Home");
      closeDialog();
    },
    onError: (err) => {
      showToast(
        err instanceof ApiRequestError ? err.message : "Failed to add category"
      );
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({
      id,
      ...data
    }: {
      id: string;
      imageUrl?: string | null;
      isActive?: boolean;
    }) => updateHomeFeaturedCategory(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.catalog.homeFeatured });
      queryClient.invalidateQueries({ queryKey: queryKeys.store.homeFeatured });
      showToast("Updated");
    },
    onError: (err) => {
      showToast(
        err instanceof ApiRequestError ? err.message : "Failed to update"
      );
    }
  });

  const deleteMutation = useMutation({
    mutationFn: deleteHomeFeaturedCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.catalog.homeFeatured });
      queryClient.invalidateQueries({ queryKey: queryKeys.store.homeFeatured });
      showToast("Removed from Home");
    },
    onError: (err) => {
      showToast(
        err instanceof ApiRequestError ? err.message : "Failed to remove"
      );
    }
  });

  function closeDialog() {
    setDialogOpen(false);
    setSelectedCategoryId("");
    setImageUrl(null);
    setIsActive(true);
  }

  function openAddDialog() {
    setSelectedCategoryId("");
    setImageUrl(null);
    setIsActive(true);
    setDialogOpen(true);
  }

  function handleAdd() {
    if (!selectedCategoryId) return;
    createMutation.mutate({
      categoryId: selectedCategoryId,
      imageUrl,
      isActive
    });
  }

  function handleRemove(hfc: ApiHomeFeaturedCategory) {
    const name = hfc.category?.name ?? "this category";
    if (!window.confirm(`Remove "${name}" from Home page?`)) return;
    deleteMutation.mutate(hfc.id);
  }

  function toggleActive(hfc: ApiHomeFeaturedCategory) {
    updateMutation.mutate({
      id: hfc.id,
      isActive: !hfc.isActive
    });
  }

  function toggleExpand(categoryId: string) {
    setExpandedCategoryId(prev => prev === categoryId ? null : categoryId);
  }

  async function handleImageUpload(
    e: React.ChangeEvent<HTMLInputElement>,
    hfcId?: string
  ) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadImageToR2(file);
      if (hfcId) {
        updateMutation.mutate({ id: hfcId, imageUrl: url });
      } else {
        setImageUrl(url);
      }
    } catch {
      showToast("Failed to upload image", "error");
    } finally {
      setUploading(false);
    }
  }

  const isSaving = createMutation.isPending || updateMutation.isPending;

  return (
    <div>
      {}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm text-charcoal/60">
            Select which categories appear on the Home page &quot;Shop by Category&quot; section.
          </p>
        </div>
        <Button
          size="sm"
          onClick={openAddDialog}
          disabled={availableCategories.length === 0}
        >
          <Plus className="h-4 w-4" />
          Add to Home
        </Button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center gap-2 py-16 text-sm text-charcoal/50">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading...
        </div>
      ) : error ? (
        <div className="rounded-lg border border-red-100 bg-red-50 py-12 text-center">
          <p className="text-sm text-red-600">
            Unable to load Home Featured Categories.
          </p>
          <p className="mt-1 text-xs text-red-400">
            {error instanceof ApiRequestError ? error.message : "Please try again."}
          </p>
          <Button
            variant="outline"
            size="sm"
            className="mt-4"
            onClick={() => queryClient.invalidateQueries({ queryKey: queryKeys.catalog.homeFeatured })}
          >
            Retry
          </Button>
        </div>
      ) : homeFeatured.length === 0 ? (
        <div className="rounded-lg border border-dashed border-charcoal/15 py-12 text-center">
          <Home className="mx-auto mb-3 h-8 w-8 text-charcoal/20" />
          <p className="text-sm text-charcoal/50">
            No categories added to Home yet.
          </p>
          <p className="mt-1 text-xs text-charcoal/35">
            Click &quot;Add to Home&quot; to feature categories on the homepage.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {homeFeatured.map((hfc) => (
            <div
              key={hfc.id}
              className={`rounded-lg border transition-colors ${
                hfc.isActive
                  ? "border-charcoal/10 bg-white"
                  : "border-charcoal/[0.06] bg-charcoal/[0.02] opacity-60"
              }`}
            >
              {}
              <div className="flex items-center gap-3 p-3">
                {}
                <button
                  onClick={() => toggleExpand(hfc.id)}
                  className="rounded p-0.5 text-charcoal/30 hover:bg-charcoal/5 hover:text-charcoal/60"
                  aria-label={expandedCategoryId === hfc.id ? "Collapse products" : "Expand products"}
                >
                  {expandedCategoryId === hfc.id ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </button>

                {}
                <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-charcoal/5">
                  {hfc.imageUrl || hfc.category?.imageUrl ? (
                    <Image
                      src={hfc.imageUrl || hfc.category?.imageUrl || ""}
                      alt={hfc.category?.name || ""}
                      fill
                      sizes="48px"
                      className="object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-[9px] text-charcoal/30">
                      No img
                    </div>
                  )}
                  <label className="absolute inset-0 flex cursor-pointer items-center justify-center bg-black/0 transition-colors hover:bg-black/30">
                    <span className="text-[9px] font-medium text-white opacity-0 transition-opacity hover:opacity-100">
                      Change
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      className="sr-only"
                      onChange={(e) => handleImageUpload(e, hfc.id)}
                    />
                  </label>
                </div>

                {}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-charcoal truncate">
                    {hfc.category?.name ?? "Unknown Category"}
                  </p>
                </div>

                {}
                <button
                  onClick={() => toggleActive(hfc)}
                  className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium transition-colors ${
                    hfc.isActive
                      ? "bg-emerald-50 text-emerald-600 hover:bg-emerald-100"
                      : "bg-red-50 text-red-500 hover:bg-red-100"
                  }`}
                >
                  {hfc.isActive ? (
                    <Eye className="h-3 w-3" />
                  ) : (
                    <EyeOff className="h-3 w-3" />
                  )}
                  {hfc.isActive ? "Active" : "Hidden"}
                </button>

                {}
                {hfc.category && (
                  <a
                    href={`/shop?category=${encodeURIComponent(hfc.category.name)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-full p-1.5 text-charcoal/40 hover:bg-charcoal/5 hover:text-forest"
                    title="Preview in shop"
                  >
                    <ArrowUpRight className="h-4 w-4" />
                  </a>
                )}

                {}
                <button
                  onClick={() => handleRemove(hfc)}
                  className="rounded-full p-1.5 text-charcoal/40 hover:bg-red-50 hover:text-rust"
                  aria-label="Remove from Home"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>

              {}
              {expandedCategoryId === hfc.id && hfc.category && (
                <CategoryProductsPanel
                  categoryName={hfc.category.name}
                  categoryId={hfc.id}
                />
              )}
            </div>
          ))}
        </div>
      )}

      {}
      <Dialog
        open={dialogOpen}
        onOpenChange={(open) => {
          if (!open) closeDialog();
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Category to Home</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Select Category</Label>
              <select
                value={selectedCategoryId}
                onChange={(e) => setSelectedCategoryId(e.target.value)}
                className="mt-1.5 w-full rounded-lg border border-charcoal/[0.12] bg-white px-3 py-2 text-sm text-charcoal focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest"
              >
                <option value="">Choose a category...</option>
                {availableCategories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
              {availableCategories.length === 0 && (
                <p className="mt-1 text-[11px] text-charcoal/40">
                  All active categories are already on the Home page.
                </p>
              )}
            </div>

            <div>
              <Label>Image</Label>
              <p className="mt-0.5 text-[11px] text-charcoal/40">
                Upload an image for this Home Featured Category.
              </p>
              <div className="mt-1.5 flex items-center gap-3">
                {imageUrl ? (
                  <div className="relative h-16 w-16 overflow-hidden rounded-lg bg-charcoal/5">
                    <Image
                      src={imageUrl}
                      alt="Preview"
                      fill
                      sizes="64px"
                      className="object-cover"
                    />
                    <button
                      onClick={() => setImageUrl(null)}
                      className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-white"
                    >
                      ×
                    </button>
                  </div>
                ) : (
                  <label className="flex h-16 w-16 cursor-pointer items-center justify-center rounded-lg border-2 border-dashed border-charcoal/20 text-charcoal/40 hover:border-charcoal/40">
                    {uploading ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <Plus className="h-5 w-5" />
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      className="sr-only"
                      onChange={(e) => handleImageUpload(e)}
                    />
                  </label>
                )}
              </div>
            </div>

            <div>
              <Label>Visibility</Label>
              <button
                type="button"
                onClick={() => setIsActive(!isActive)}
                className={`mt-1.5 flex w-full items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors ${
                  isActive
                    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                    : "border-red-200 bg-red-50 text-red-700"
                }`}
              >
                {isActive ? (
                  <Eye className="h-4 w-4" />
                ) : (
                  <EyeOff className="h-4 w-4" />
                )}
                {isActive ? "Visible on Home" : "Hidden from Home"}
              </button>
            </div>

            {!imageUrl && selectedCategoryId && (
              <p className="text-xs text-red-500">
                Product image is required.
              </p>
            )}
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={closeDialog}
                disabled={isSaving}
              >
                Cancel
              </Button>
              <Button
                onClick={handleAdd}
                disabled={isSaving || !selectedCategoryId || !imageUrl}
              >
                {isSaving ? "Adding..." : "Add to Home"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function CategoryProductsPanel({
  categoryName,
  categoryId
}: {
  categoryName: string;
  categoryId: string;
}) {
  const { data, isLoading, error } = useQuery({
    queryKey: ["home-featured-products", categoryId],
    queryFn: () => fetchProducts({ category: [categoryName] }),
    staleTime: 30_000,
  });

  const products: ApiProduct[] = data?.data ?? [];

  if (isLoading) {
    return (
      <div className="border-t border-charcoal/10 px-6 py-4">
        <div className="flex items-center gap-2 text-xs text-charcoal/40">
          <Loader2 className="h-3 w-3 animate-spin" />
          Loading products for &quot;{categoryName}&quot;...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="border-t border-charcoal/10 px-6 py-4">
        <p className="text-xs text-red-500">
          Failed to load products. Please try again.
        </p>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="border-t border-charcoal/10 px-6 py-4">
        <div className="flex items-center gap-2 text-xs text-charcoal/40">
          <Package className="h-3.5 w-3.5" />
          No products found for &quot;{categoryName}&quot;.
        </div>
      </div>
    );
  }

  return (
    <div className="border-t border-charcoal/10 px-6 py-4">
      <p className="mb-3 text-[11px] font-medium uppercase tracking-wide text-charcoal/40">
        {products.length} product{products.length !== 1 ? "s" : ""} in &quot;{categoryName}&quot;
      </p>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {products.map((product) => (
          <div
            key={product.id}
            className="flex items-center gap-3 rounded-lg border border-charcoal/[0.06] bg-charcoal/[0.01] p-2.5"
          >
            {}
            <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-md bg-charcoal/5">
              {product.images && product.images.length > 0 ? (
                <Image
                  src={product.images[0]}
                  alt={product.name}
                  fill
                  sizes="40px"
                  className="object-cover"
                />
              ) : (
                <div className="flex h-full items-center justify-center text-[8px] text-charcoal/20">
                  No img
                </div>
              )}
            </div>
            {}
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-medium text-charcoal">
                {product.name}
              </p>
              <p className="text-[10px] text-charcoal/40">
                {product.fabricType} &middot; Rs. {product.price.toLocaleString()}
              </p>
            </div>
            {}
            <span
              className={`shrink-0 rounded-full px-1.5 py-0.5 text-[9px] font-medium ${
                product.stock > 0
                  ? "bg-emerald-50 text-emerald-600"
                  : "bg-red-50 text-red-500"
              }`}
            >
              {product.stock > 0 ? `${product.stock} in stock` : "Out of stock"}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
