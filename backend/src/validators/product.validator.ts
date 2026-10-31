import { z } from "zod";

export const productListQuerySchema = z.object({
  search: z.string().optional(),
  category: z.union([z.string(), z.array(z.string())]).optional(),
  color: z.union([z.string(), z.array(z.string())]).optional(),
  fabricType: z.union([z.string(), z.array(z.string())]).optional(),
  collection: z.string().optional(),
  option: z.string().optional(),
  priceMin: z.coerce.number().nonnegative().optional(),
  priceMax: z.coerce.number().nonnegative().optional(),
  inStockOnly: z.coerce.boolean().optional(),
  featuredOnly: z.coerce.boolean().optional(),
  promotion: z.string().uuid().optional(),
  sort: z.enum(["Featured", "Newest", "Price low to high", "Price high to low"]).optional(),
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(100).optional()
});

const colorSchema = z.object({
  name: z.string().trim().min(1, "Color name is required"),
  hex: z
    .string()
    .trim()
    .optional()
    .transform((h) => {
      const v = (h ?? "").trim();
      if (!v) return "#888888";
      return v.startsWith("#") ? v : `#${v}`;
    }),
  image: z
    .union([z.string().url(), z.null()])
    .optional()
    .nullable(),
  images: z.array(z.string().url()).optional(),
  stock: z.coerce.number().int().nonnegative("Colour stock cannot be negative").optional()
});

const specificationSchema = z.object({
  label: z.string().min(1),
  value: z.string().min(1)
});

const productImageUrl = z
  .string()
  .url("Each image must be a valid URL")
  .refine((value) => value.startsWith("https://"), "Each image URL must use https");

const uuidField = z.string().uuid("Invalid ID");

const collectionSelectionSchema = z.object({
  collectionId: uuidField,
  collectionOptionId: uuidField.optional().nullable()
});

const collectionSelectionsSchema = z
  .array(collectionSelectionSchema)
  .optional()
  .default([])
  .refine(
    (selections) => new Set(selections.map((s) => s.collectionId)).size === selections.length,
    "Each collection can only be selected once"
  );

export const inventoryCreateSchema = z
  .object({
    productName: z.string().min(2, "Product name is required"),
    category: z.string().min(1, "Category is required"),
    fabricType: z.string().min(1, "Fabric type is required"),
    price: z.coerce.number().positive("Price must be greater than zero"),
    originalPrice: z.coerce.number().positive("Cut price must be greater than zero").optional().nullable(),
    stock: z.coerce.number().int().nonnegative("Stock cannot be negative"),
    lowStockThreshold: z.coerce.number().int().nonnegative("Low stock threshold cannot be negative").optional(),
    description: z.string().optional(),
    images: z.array(productImageUrl).max(10, "Up to 10 images").optional(),
    colors: z
      .array(colorSchema)
      .min(1, "At least one color is required")
      .refine(
        (colors) => new Set(colors.map((c) => c.name)).size === colors.length,
        "Duplicate colors are not allowed"
      ),
    availableLengths: z.array(z.string()).optional(),
    specifications: z.array(specificationSchema).optional(),
    featured: z.boolean().optional(),
    isNew: z.boolean().optional(),
    collections: collectionSelectionsSchema
  })
  .refine(
    (data) => !data.originalPrice || data.originalPrice >= data.price,
    { message: "Cut price must be greater than or equal to the selling price", path: ["originalPrice"] }
  );

export const inventoryUpdateSchema = z
  .object({
    productName: z.string().min(2, "Product name is required").optional(),
    category: z.string().min(1, "Category is required").optional(),
    fabricType: z.string().min(1, "Fabric type is required").optional(),
    price: z.coerce.number().positive("Price must be greater than zero").optional(),
    originalPrice: z.coerce.number().positive("Cut price must be greater than zero").optional().nullable(),
    lowStockThreshold: z.coerce.number().int().nonnegative("Low stock threshold cannot be negative").optional(),
    description: z.string().optional(),
    images: z.array(productImageUrl).max(10, "Up to 10 images").optional(),
    colors: z
      .array(colorSchema)
      .min(1, "At least one color is required")
      .refine(
        (colors) => new Set(colors.map((c) => c.name)).size === colors.length,
        "Duplicate colors are not allowed"
      )
      .optional(),
    availableLengths: z.array(z.string()).optional(),
    specifications: z.array(specificationSchema).optional(),
    featured: z.boolean().optional(),
    isNew: z.boolean().optional(),
    collections: z.array(collectionSelectionSchema).optional()
  })
  .refine(
    (data) => data.originalPrice === undefined || data.originalPrice === null || data.price === undefined || data.originalPrice >= data.price,
    { message: "Cut price must be greater than or equal to the selling price", path: ["originalPrice"] }
  )
  .refine(
    (data) => data.collections === undefined || new Set(data.collections.map((s) => s.collectionId)).size === data.collections.length,
    { message: "Each collection can only be selected once", path: ["collections"] }
  );

export type InventoryCreateInput = z.infer<typeof inventoryCreateSchema>;
export type InventoryUpdateInput = z.infer<typeof inventoryUpdateSchema>;

export const stockAdjustmentSchema = z.object({
  quantityChange: z.coerce.number().int().refine((v) => v !== 0, "Adjustment cannot be zero"),
  reason: z.string().trim().min(3, "A reason is required for manual stock adjustments").max(500),
  movementType: z.enum(["manual_adjustment", "restock"]).optional(),
  /** Required when the product has colour variants */
  color: z.string().trim().min(1).optional()
});

export type StockAdjustmentInput = z.infer<typeof stockAdjustmentSchema>;
