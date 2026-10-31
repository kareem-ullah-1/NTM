"use client";

import * as React from "react";
import { useForm, Controller, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Loader2,
  Plus,
  Trash2,
  X,
  ImagePlus,
  Tag,
  Palette,
  Banknote,
  Package,
  FileText,
  Star,
  LayoutGrid
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { inventoryFormSchema, type InventoryFormValues } from "@/lib/validations";
import { fetchCategories, fetchFabricTypes } from "@/lib/api/catalog";
import { fetchCollections } from "@/lib/api/collections";
import { uploadImageToR2 } from "@/lib/api/uploads";
import { ApiRequestError } from "@/lib/api/client";
import { useToastStore } from "@/store/use-toast-store";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { ImageUploadField } from "@/components/admin/ImageUploadField";

const textareaClassName =
  "w-full rounded-lg border border-charcoal/15 bg-white px-4 py-2.5 text-sm text-charcoal focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest disabled:cursor-not-allowed disabled:opacity-50";

const selectClassName =
  "h-11 w-full rounded-lg border border-charcoal/15 bg-white px-4 text-sm text-charcoal focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest disabled:cursor-not-allowed disabled:opacity-50";

function SectionHeader({
  icon: Icon,
  title,
  description
}: {
  icon: typeof Tag;
  title: string;
  description?: string;
}) {
  return (
    <div className="mb-4 flex items-start gap-3 sm:col-span-2">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-charcoal/[0.04]">
        <Icon className="h-4 w-4 text-charcoal/40" />
      </div>
      <div>
        <h3 className="text-[13px] font-medium text-charcoal">{title}</h3>
        {description && (
          <p className="mt-0.5 text-[11px] text-charcoal/40">{description}</p>
        )}
      </div>
    </div>
  );
}

function FieldError({ error }: { error?: string }) {
  if (!error) return null;
  return <p className="mt-1 text-xs text-red-500">{error}</p>;
}

function autoHexFromName(name: string): string {
  const known: Record<string, string> = {
    black: "#1C1C1C",
    white: "#FFFFFF",
    ivory: "#FFFFF0",
    cream: "#FAF8F3",
    beige: "#F5F5DC",
    grey: "#808080",
    gray: "#808080",
    charcoal: "#36454F",
    navy: "#1B2A4A",
    blue: "#2563EB",
    red: "#B91C1C",
    maroon: "#800000",
    green: "#166534",
    olive: "#556B2F",
    brown: "#8B4513",
    tan: "#D2B48C",
    gold: "#C9A227",
    silver: "#C0C0C0",
    pink: "#EC4899",
    purple: "#7C3AED",
    orange: "#EA580C",
    yellow: "#CA8A04"
  };
  const key = name.trim().toLowerCase();
  if (known[key]) return known[key];
  for (const [k, v] of Object.entries(known)) {
    if (key.includes(k)) return v;
  }
  let hash = 0;
  for (let i = 0; i < key.length; i++) {
    hash = key.charCodeAt(i) + ((hash << 5) - hash);
  }
  const c = (hash & 0x00ffffff).toString(16).toUpperCase();
  return "#" + "000000".substring(0, 6 - c.length) + c;
}


type InventoryFormProps = {
  mode: "create" | "edit";
  defaultValues?: Partial<InventoryFormValues>;
  onSubmit: (values: InventoryFormValues) => void;
  submitLabel: string;
};

export function InventoryForm({ mode, defaultValues, onSubmit, submitLabel }: InventoryFormProps) {
  const isCreateMode = mode === "create";
  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting }
  } = useForm<InventoryFormValues>({
    resolver: zodResolver(inventoryFormSchema),
    defaultValues: { colors: [], images: [], ...defaultValues }
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "colors"
  });

  const watchedColors = watch("colors");

  const { data: categoriesData, isLoading: loadingCategories } = useQuery({
    queryKey: ["admin", "catalog", "categories", "names"],
    queryFn: fetchCategories
  });

  const { data: fabricTypesData, isLoading: loadingFabricTypes } = useQuery({
    queryKey: ["admin", "catalog", "fabric-types", "names"],
    queryFn: fetchFabricTypes
  });


  const { data: collectionsData, isLoading: loadingCollections } = useQuery({
    queryKey: ["admin", "collections"],
    queryFn: fetchCollections
  });

  const watchedCollectionSelections = watch("collections") ?? [];

  function isCollectionSelected(collectionId: string) {
    return watchedCollectionSelections.some((s) => s.collectionId === collectionId);
  }

  function toggleCollection(collectionId: string) {
    if (isCollectionSelected(collectionId)) {
      setValue(
        "collections",
        watchedCollectionSelections.filter((s) => s.collectionId !== collectionId),
        { shouldValidate: true }
      );
    } else {
      setValue(
        "collections",
        [...watchedCollectionSelections, { collectionId, collectionOptionId: null }],
        { shouldValidate: true }
      );
    }
  }

  function selectedOptionIdFor(collectionId: string) {
    return watchedCollectionSelections.find((s) => s.collectionId === collectionId)?.collectionOptionId ?? null;
  }

  function toggleCollectionOption(collectionId: string, optionId: string) {
    const currentlySelected = selectedOptionIdFor(collectionId) === optionId;
    setValue(
      "collections",
      watchedCollectionSelections.map((s) =>
        s.collectionId === collectionId
          ? { ...s, collectionOptionId: currentlySelected ? null : optionId }
          : s
      ),
      { shouldValidate: true }
    );
  }

  const categoryNames = React.useMemo(
    () => (categoriesData ?? []).map((c) => c.name),
    [categoriesData]
  );

  const fabricTypeNames = React.useMemo(
    () => (fabricTypesData ?? []).map((ft) => ft.name),
    [fabricTypesData]
  );

  const isLoadingCatalog = loadingCategories || loadingFabricTypes;

  const [colorImageUploading, setColorImageUploading] = React.useState<Record<number, boolean>>({});
  const [draftColorName, setDraftColorName] = React.useState("");
  const [draftColorImages, setDraftColorImages] = React.useState<string[]>([]);
  const [draftUploading, setDraftUploading] = React.useState(false);
  const showToast = useToastStore((state) => state.showToast);

  async function handleColorImageUpload(index: number, files: FileList | null) {
    if (!files || files.length === 0) return;
    setColorImageUploading((prev) => ({ ...prev, [index]: true }));
    try {
      const colorObj = watchedColors[index];
      const currentImages = colorObj?.images?.length
        ? colorObj.images
        : colorObj?.image
          ? [colorObj.image]
          : [];
      const newUrls: string[] = [];
      for (const file of Array.from(files)) {
        if (!file.type.startsWith("image/")) continue;
        const url = await uploadImageToR2(file);
        newUrls.push(url);
      }
      const updated = [...currentImages, ...newUrls];
      setValue(`colors.${index}.images`, updated, { shouldValidate: true });
      setValue(`colors.${index}.image`, updated[0] ?? null, { shouldValidate: true });

      const currentProductImages = watch("images") ?? [];
      const missing = newUrls.filter((u) => !currentProductImages.includes(u));
      if (missing.length > 0) {
        setValue("images", [...currentProductImages, ...missing], { shouldValidate: true });
      }
    } catch (err) {
      const message =
        err instanceof ApiRequestError ? err.message : "Color image upload failed. Please try again.";
      showToast(message);
    } finally {
      setColorImageUploading((prev) => ({ ...prev, [index]: false }));
    }
  }

  function removeColorImage(index: number, imgUrl: string) {
    const colorObj = watchedColors[index];
    const currentImages = colorObj?.images?.length
      ? colorObj.images
      : colorObj?.image
        ? [colorObj.image]
        : [];
    const updated = currentImages.filter((u) => u !== imgUrl);
    setValue(`colors.${index}.images`, updated, { shouldValidate: true });
    setValue(`colors.${index}.image`, updated[0] ?? null, { shouldValidate: true });
  }

  async function handleDraftImageUpload(files: FileList | null) {
    if (!files || files.length === 0) return;
    setDraftUploading(true);
    try {
      const newUrls: string[] = [];
      for (const file of Array.from(files)) {
        if (!file.type.startsWith("image/")) continue;
        const url = await uploadImageToR2(file);
        newUrls.push(url);
      }
      setDraftColorImages((prev) => [...prev, ...newUrls]);
      const currentProductImages = watch("images") ?? [];
      const missing = newUrls.filter((u) => !currentProductImages.includes(u));
      if (missing.length > 0) {
        setValue("images", [...currentProductImages, ...missing], { shouldValidate: true });
      }
    } catch (err) {
      const message =
        err instanceof ApiRequestError ? err.message : "Color image upload failed. Please try again.";
      showToast(message);
    } finally {
      setDraftUploading(false);
    }
  }

  function commitDraftColor(options: { silent?: boolean } = {}): boolean {
    const { silent = false } = options;
    const name = draftColorName.trim();
    if (!name) {
      if (!silent) showToast("Enter a color name", "error");
      return false;
    }
    const exists = watchedColors.some(
      (c) => c.name.trim().toLowerCase() === name.toLowerCase()
    );
    if (exists) {
      if (!silent) showToast("That color is already added", "error");
      setDraftColorName("");
      setDraftColorImages([]);
      return false;
    }
    const hex = autoHexFromName(name);
    append({
      name,
      hex,
      image: draftColorImages[0] ?? null,
      images: draftColorImages.length > 0 ? [...draftColorImages] : []
    });
    setDraftColorName("");
    setDraftColorImages([]);
    return true;
  }

  function addColorFromDraft() {
    commitDraftColor();
  }

  function updateColorName(index: number, name: string) {
    setValue(`colors.${index}.name`, name, { shouldValidate: true });
    setValue(`colors.${index}.hex`, autoHexFromName(name), { shouldValidate: true });
  }

  function handleFormSubmit(values: InventoryFormValues) {
    const colors = (values.colors ?? [])
      .map((c) => {
        const name = (c.name ?? "").trim();
        if (!name) return null;
        const hex = (c.hex ?? "").trim() || autoHexFromName(name);
        const images = (c.images ?? []).filter(Boolean);
        const image = c.image || images[0] || null;
        return {
          name,
          hex: hex.startsWith("#") ? hex : `#${hex}`,
          image,
          images: images.length > 0 ? images : undefined
        };
      })
      .filter((c): c is NonNullable<typeof c> => c !== null);

    onSubmit({ ...values, colors });
  }

  function handleFormElementSubmit(event: React.FormEvent<HTMLFormElement>) {
    commitDraftColor({ silent: true });
    return handleSubmit(handleFormSubmit)(event);
  }

  return (
    <form onSubmit={handleFormElementSubmit} className="space-y-6" noValidate>
      {/* Product Information */}
      <div className="rounded-[10px] border border-charcoal/[0.06] p-5">
        <SectionHeader
          icon={Tag}
          title="Product Information"
          description="Basic product details"
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Label htmlFor="productName">Product Name</Label>
            <Input
              id="productName"
              className="mt-1.5"
              placeholder="e.g. Premium Linen Fabric"
              {...register("productName")}
            />
            <FieldError error={errors.productName?.message} />
          </div>
        </div>
      </div>

      {/* Collections / Category / Fabric Type */}
      <div className="rounded-[10px] border border-charcoal/[0.06] p-5">
        <SectionHeader
          icon={LayoutGrid}
          title="Collections & Classification"
          description="Organize products into collections, categories, and fabric types"
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Label>Collections</Label>
            <div className="mt-1.5 space-y-2 rounded-lg border border-charcoal/10 p-3">
              {loadingCollections ? (
                <div className="flex items-center gap-2 py-2 text-sm text-charcoal/50">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading collections...
                </div>
              ) : (collectionsData ?? []).length === 0 ? (
                <p className="py-2 text-sm text-charcoal/40">No collections available.</p>
              ) : (
                (collectionsData ?? []).map((collection) => {
                  const checked = isCollectionSelected(collection.id);
                  const options = collection.options ?? [];
                  const selectedOptionId = selectedOptionIdFor(collection.id);
                  return (
                    <div key={collection.id}>
                      <label className="flex cursor-pointer items-center gap-3 rounded-lg px-1 py-1.5 text-sm hover:bg-charcoal/[0.03]">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleCollection(collection.id)}
                          className="sr-only"
                        />
                        <div
                          className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 ${
                            checked ? "border-forest bg-forest text-white" : "border-charcoal/20"
                          }`}
                        >
                          {checked && (
                            <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                              <polyline points="20 6 9 17 4 12" />
                            </svg>
                          )}
                        </div>
                        <span className="font-medium text-charcoal">{collection.name}</span>
                      </label>

                      {checked && options.length > 0 && (
                        <div className="ml-8 mt-1 space-y-1 border-l border-charcoal/10 pl-3">
                          {options.map((option) => {
                            const optionChecked = selectedOptionId === option.id;
                            return (
                              <label
                                key={option.id}
                                className="flex cursor-pointer items-center gap-2.5 rounded-lg px-1 py-1 text-sm hover:bg-charcoal/[0.03]"
                              >
                                <input
                                  type="checkbox"
                                  checked={optionChecked}
                                  onChange={() => toggleCollectionOption(collection.id, option.id)}
                                  className="sr-only"
                                />
                                <div
                                  className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border-2 ${
                                    optionChecked ? "border-forest bg-forest text-white" : "border-charcoal/20"
                                  }`}
                                >
                                  {optionChecked && (
                                    <svg className="h-2.5 w-2.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                                      <polyline points="20 6 9 17 4 12" />
                                    </svg>
                                  )}
                                </div>
                                <span className="text-charcoal/80">{option.name}</span>
                              </label>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
            {errors.collections && (
              <FieldError error={errors.collections.message ?? errors.collections.root?.message} />
            )}
          </div>
          <div>
            <Label htmlFor="category">Category</Label>
            <select
              id="category"
              defaultValue={defaultValues?.category ?? ""}
              className={`${selectClassName} mt-1.5`}
              {...register("category")}
              disabled={isLoadingCatalog}
            >
              <option value="" disabled>
                {loadingCategories ? "Loading..." : "Select category"}
              </option>
              {categoryNames.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
            <FieldError error={errors.category?.message} />
          </div>
          <div>
            <Label htmlFor="fabricType">Fabric Type</Label>
            <select
              id="fabricType"
              defaultValue={defaultValues?.fabricType ?? ""}
              className={`${selectClassName} mt-1.5`}
              {...register("fabricType")}
              disabled={isLoadingCatalog}
            >
              <option value="" disabled>
                {loadingFabricTypes ? "Loading..." : "Select fabric type"}
              </option>
              {fabricTypeNames.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
            <FieldError error={errors.fabricType?.message} />
          </div>
        </div>
      </div>

      {/* Colors — name + image only (no picker / hex / JSON) */}
      <div className="rounded-[10px] border border-charcoal/[0.06] p-5">
        <SectionHeader
          icon={Palette}
          title="Colors"
          description="Type a color name and upload its image — no codes required"
        />

        {/* Added colors */}
        {fields.length > 0 && (
          <div className="mb-4 space-y-3">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-charcoal/35">
              Added Colors
            </p>
            {fields.map((field, index) => {
              const colorImages =
                watchedColors[index]?.images ??
                (watchedColors[index]?.image ? [watchedColors[index]!.image!] : []);
              return (
                <div
                  key={field.id}
                  className="rounded-lg border border-charcoal/10 bg-charcoal/[0.01] p-3"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
                    <div className="min-w-0 flex-1 space-y-1.5">
                      <Label htmlFor={`color-name-${index}`} className="text-[12px]">
                        Color Name
                      </Label>
                      <Input
                        id={`color-name-${index}`}
                        value={watchedColors[index]?.name ?? ""}
                        onChange={(e) => updateColorName(index, e.target.value)}
                        placeholder="e.g. Black"
                        className="h-10"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => remove(index)}
                      aria-label={`Remove ${watchedColors[index]?.name || "color"}`}
                      className="mt-0 flex h-10 w-10 shrink-0 items-center justify-center self-end rounded-full text-charcoal/40 hover:bg-red-50 hover:text-rust sm:mt-6"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    {colorImages.map((imgUrl) => (
                      <div
                        key={imgUrl}
                        className="group relative h-14 w-14 overflow-hidden rounded-lg border border-charcoal/15 bg-charcoal/5"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={imgUrl} alt="" className="h-full w-full object-cover" />
                        <button
                          type="button"
                          onClick={() => removeColorImage(index, imgUrl)}
                          aria-label="Remove color image"
                          className="absolute right-0.5 top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-black/70 text-white opacity-0 transition-opacity group-hover:opacity-100"
                        >
                          <X className="h-2.5 w-2.5" />
                        </button>
                      </div>
                    ))}
                    <label className="flex h-14 cursor-pointer items-center gap-1.5 rounded-lg border border-dashed border-charcoal/25 bg-white px-3 text-xs text-charcoal/60 transition-colors hover:border-forest hover:text-forest">
                      {colorImageUploading[index] ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <ImagePlus className="h-3.5 w-3.5" />
                      )}
                      <span>{colorImages.length ? "Add image" : "Upload color image"}</span>
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        disabled={!!colorImageUploading[index]}
                        onChange={(e) => {
                          handleColorImageUpload(index, e.target.files);
                          e.target.value = "";
                        }}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Add new color */}
        <div className="rounded-lg border border-dashed border-charcoal/20 bg-white p-4">
          <p className="mb-3 text-[12px] font-medium text-charcoal/70">Add Color</p>
          <div className="space-y-3">
            <div>
              <Label htmlFor="draft-color-name" className="text-[12px]">
                Color Name
              </Label>
              <Input
                id="draft-color-name"
                value={draftColorName}
                onChange={(e) => setDraftColorName(e.target.value)}
                placeholder="e.g. Black"
                className="mt-1.5 h-10"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addColorFromDraft();
                  }
                }}
              />
            </div>
            <div>
              <Label className="text-[12px]">Color Image</Label>
              <div className="mt-1.5 flex flex-wrap items-center gap-2">
                {draftColorImages.map((imgUrl) => (
                  <div
                    key={imgUrl}
                    className="group relative h-14 w-14 overflow-hidden rounded-lg border border-charcoal/15 bg-charcoal/5"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={imgUrl} alt="" className="h-full w-full object-cover" />
                    <button
                      type="button"
                      onClick={() =>
                        setDraftColorImages((prev) => prev.filter((u) => u !== imgUrl))
                      }
                      aria-label="Remove preview image"
                      className="absolute right-0.5 top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-black/70 text-white opacity-0 transition-opacity group-hover:opacity-100"
                    >
                      <X className="h-2.5 w-2.5" />
                    </button>
                  </div>
                ))}
                <label className="flex h-14 cursor-pointer items-center gap-1.5 rounded-lg border border-dashed border-charcoal/25 bg-charcoal/[0.02] px-3 text-xs text-charcoal/60 transition-colors hover:border-forest hover:text-forest">
                  {draftUploading ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <ImagePlus className="h-3.5 w-3.5" />
                  )}
                  <span>
                    {draftColorImages.length ? "Add another image" : "Upload Color Image"}
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    disabled={draftUploading}
                    onChange={(e) => {
                      handleDraftImageUpload(e.target.files);
                      e.target.value = "";
                    }}
                    className="hidden"
                  />
                </label>
              </div>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addColorFromDraft}
              className="rounded-full"
            >
              <Plus className="h-3.5 w-3.5" />
              Add Color
            </Button>
          </div>
        </div>

        <FieldError error={errors.colors?.message ?? errors.colors?.root?.message} />
      </div>

      {/* Pricing */}
      <div className="rounded-[10px] border border-charcoal/[0.06] p-5">
        <SectionHeader
          icon={Banknote}
          title="Pricing"
          description="Set selling price and optional cut price"
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="price">Selling Price (PKR)</Label>
            <Input
              id="price"
              type="number"
              step="1"
              className="mt-1.5"
              placeholder="e.g. 1200"
              {...register("price")}
            />
            <FieldError error={errors.price?.message} />
          </div>
          <div>
            <Label htmlFor="originalPrice">Cut Price (PKR) — optional</Label>
            <Input
              id="originalPrice"
              type="number"
              step="1"
              className="mt-1.5"
              placeholder="e.g. 1500"
              {...register("originalPrice")}
            />
            <FieldError error={errors.originalPrice?.message} />
          </div>
        </div>
      </div>

      {/* Stock & Inventory */}
      <div className="rounded-[10px] border border-charcoal/[0.06] p-5">
        <SectionHeader
          icon={Package}
          title="Stock & Inventory"
          description={
            isCreateMode
              ? "Set initial stock and low-stock threshold"
              : "Use Adjust Stock on the inventory list to change quantity"
          }
        />
        <div className={isCreateMode ? "grid gap-4 sm:grid-cols-2" : "grid gap-4"}>
          {isCreateMode && (
            <div>
              <Label htmlFor="stock">Initial Stock</Label>
              <Input
                id="stock"
                type="number"
                step="1"
                className="mt-1.5"
                placeholder="e.g. 100"
                {...register("stock")}
              />
              <FieldError error={errors.stock?.message} />
            </div>
          )}
          <div>
            <Label htmlFor="lowStockThreshold">Low Stock Threshold — optional</Label>
            <Input
              id="lowStockThreshold"
              type="number"
              step="1"
              placeholder="Store default"
              className="mt-1.5"
              {...register("lowStockThreshold")}
            />
            <FieldError error={errors.lowStockThreshold?.message} />
          </div>
        </div>
      </div>

      {/* Images */}
      <div className="rounded-[10px] border border-charcoal/[0.06] p-5">
        <SectionHeader
          icon={ImagePlus}
          title="Product Images"
          description="Upload product images (up to 10)"
        />
        <Controller
          name="images"
          control={control}
          render={({ field }) => (
            <ImageUploadField
              value={field.value ?? []}
              onChange={field.onChange}
              disabled={isSubmitting}
            />
          )}
        />
        <FieldError error={errors.images?.message} />
      </div>

      {/* Description */}
      <div className="rounded-[10px] border border-charcoal/[0.06] p-5">
        <SectionHeader
          icon={FileText}
          title="Description"
          description="Product description for the storefront"
        />
        <textarea
          id="description"
          rows={4}
          className={`${textareaClassName}`}
          placeholder="Describe the fabric, its qualities, and use cases..."
          {...register("description")}
        />
        <FieldError error={errors.description?.message} />
      </div>

      {/* Visibility & Featured */}
      <div className="rounded-[10px] border border-charcoal/[0.06] p-5">
        <SectionHeader
          icon={Star}
          title="Visibility & Featured"
          description="Control product visibility and featured status"
        />
        <div className="flex flex-wrap items-center gap-6">
          <label className="flex items-center gap-2.5 text-sm text-charcoal">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-charcoal/25 text-forest accent-forest"
              {...register("featured")}
            />
            <span className="font-medium">Featured Product</span>
            <span className="text-charcoal/40">(shown on homepage)</span>
          </label>
        </div>
      </div>

      {/* Submit */}
      <div className="flex justify-end">
        <Button type="submit" disabled={isSubmitting || isLoadingCatalog} className="min-w-[140px]">
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            submitLabel
          )}
        </Button>
      </div>
    </form>
  );
}
