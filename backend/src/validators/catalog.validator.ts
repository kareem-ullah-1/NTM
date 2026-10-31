import { z } from "zod";

const imageUrlSchema = z.preprocess(
  (val) => (val === "" ? null : val),
  z.string().url("Must be a valid URL").optional().nullable()
);

export const categoryCreateSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Category name is required")
    .max(100, "Category name must be at most 100 characters"),
  imageUrl: imageUrlSchema,
  isEnabled: z.boolean().optional().default(true)
});

export const categoryUpdateSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Category name is required")
    .max(100, "Category name must be at most 100 characters"),
  imageUrl: imageUrlSchema,
  isEnabled: z.boolean().optional()
});

export type CategoryCreateInput = z.infer<typeof categoryCreateSchema>;
export type CategoryUpdateInput = z.infer<typeof categoryUpdateSchema>;

export const fabricTypeCreateSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Fabric type name is required")
    .max(100, "Fabric type name must be at most 100 characters")
});

export const fabricTypeUpdateSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Fabric type name is required")
    .max(100, "Fabric type name must be at most 100 characters")
});

export type FabricTypeCreateInput = z.infer<typeof fabricTypeCreateSchema>;
export type FabricTypeUpdateInput = z.infer<typeof fabricTypeUpdateSchema>;

const hexRegex = /^#[0-9A-Fa-f]{6}$/;

export const colorCreateSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Color name is required")
    .max(100, "Color name must be at most 100 characters"),
  hex: z
    .string()
    .trim()
    .regex(hexRegex, "HEX must be a valid 6-digit hex value (e.g. #FFFFFF)")
    .transform((val) => val.toUpperCase())
});

export const colorUpdateSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Color name is required")
    .max(100, "Color name must be at most 100 characters"),
  hex: z
    .string()
    .trim()
    .regex(hexRegex, "HEX must be a valid 6-digit hex value (e.g. #FFFFFF)")
    .transform((val) => val.toUpperCase())
});

export type ColorCreateInput = z.infer<typeof colorCreateSchema>;
export type ColorUpdateInput = z.infer<typeof colorUpdateSchema>;

const homeFeaturedImageUrlRequired = z.preprocess(
  (val) => (val === "" ? null : val),
  z.string().url("Must be a valid URL")
    .nullable()
    .refine((val) => val !== null && val.trim() !== "", "Product image is required")
);

export const homeFeaturedCategoryCreateSchema = z.object({
  categoryId: z.string().uuid("Valid category ID is required"),
  imageUrl: homeFeaturedImageUrlRequired,
  isActive: z.boolean().optional().default(true)
});

export const homeFeaturedCategoryUpdateSchema = z.object({
  imageUrl: homeFeaturedImageUrlRequired.optional(),
  isActive: z.boolean().optional()
});

