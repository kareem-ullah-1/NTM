import { z } from "zod";

const navLinkSchema = z.object({
  label: z.string().trim().min(1, "Link label is required").max(60),
  href: z.string().trim().min(1, "Link URL is required").max(300)
});

export const collectionCreateSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Collection name is required")
    .max(150, "Collection name must be at most 150 characters"),
  slug: z
    .string()
    .trim()
    .min(1, "Slug is required")
    .max(180, "Slug must be at most 180 characters")
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must contain only lowercase letters, numbers, and hyphens")
    .optional(),
  description: z.string().trim().max(500).optional().default(""),
  imageUrl: z.string().url().optional().nullable(),
  displayOrder: z.number().int().optional().default(0),
  isEnabled: z.boolean().optional().default(true),
  navLinks: z.array(navLinkSchema).max(10).optional().default([])
});

export const collectionUpdateSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Collection name is required")
    .max(150, "Collection name must be at most 150 characters")
    .optional(),
  slug: z
    .string()
    .trim()
    .min(1, "Slug is required")
    .max(180, "Slug must be at most 180 characters")
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must contain only lowercase letters, numbers, and hyphens")
    .optional(),
  description: z.string().trim().max(500).optional(),
  imageUrl: z.string().url().optional().nullable(),
  displayOrder: z.number().int().optional(),
  isEnabled: z.boolean().optional(),
  navLinks: z.array(navLinkSchema).max(10).optional()
});

export type CollectionCreateInput = z.infer<typeof collectionCreateSchema>;
export type CollectionUpdateInput = z.infer<typeof collectionUpdateSchema>;

export const collectionOptionCreateSchema = z.object({
  collectionId: z.string().uuid("Valid collection ID is required"),
  name: z
    .string()
    .trim()
    .min(1, "Option name is required")
    .max(120, "Option name must be at most 120 characters"),
  slug: z
    .string()
    .trim()
    .min(1, "Slug is required")
    .max(150, "Slug must be at most 150 characters")
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must contain only lowercase letters, numbers, and hyphens")
    .optional(),
  isActive: z.boolean().optional().default(true)
});

export const collectionOptionUpdateSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Option name is required")
    .max(120, "Option name must be at most 120 characters")
    .optional(),
  slug: z
    .string()
    .trim()
    .min(1, "Slug is required")
    .max(150, "Slug must be at most 150 characters")
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must contain only lowercase letters, numbers, and hyphens")
    .optional(),
  isActive: z.boolean().optional()
});

export type CollectionOptionCreateInput = z.infer<typeof collectionOptionCreateSchema>;
export type CollectionOptionUpdateInput = z.infer<typeof collectionOptionUpdateSchema>;
