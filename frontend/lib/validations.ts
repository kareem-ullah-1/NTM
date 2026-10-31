import { z } from "zod";

const pakistaniPhoneRegex = /^(?:\+92|0)3\d{9}$/;

export const contactFormSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Enter a valid email address"),
  phone: z.string().regex(pakistaniPhoneRegex, "Enter a valid Pakistani phone number"),
  subject: z.string().min(1, "Subject is required"),
  message: z.string().min(10, "Message must be at least 10 characters")
});

export type ContactFormValues = z.infer<typeof contactFormSchema>;

export const newsletterSchema = z.object({
  email: z.string().email("Enter a valid email address")
});

export type NewsletterValues = z.infer<typeof newsletterSchema>;

export const checkoutFormSchema = z.object({
  fullName: z.string().min(2, "Full name must be at least 2 characters"),
  phone: z.string().regex(pakistaniPhoneRegex, "Enter a valid Pakistani phone number"),
  email: z.string().email("Enter a valid email address"),
  address: z.string().min(5, "Address must be at least 5 characters"),
  city: z.string().min(2, "City is required"),
  postalCode: z.string().min(4, "Enter a valid postal code"),
  deliveryNotes: z.string().optional(),
  paymentMethod: z.enum(["Cash on Delivery"])
});

export type CheckoutFormValues = z.infer<typeof checkoutFormSchema>;

export const inventoryFormSchema = z
  .object({
    productName: z.string().min(2, "Product name is required"),
    collections: z
      .array(
        z.object({
          collectionId: z.string().min(1),
          collectionOptionId: z.string().optional().nullable()
        })
      )
      .optional()
      .default([])
      .refine(
        (selections) => new Set(selections.map((s) => s.collectionId)).size === selections.length,
        "Each collection can only be selected once"
      ),
    category: z.string().min(1, "Category is required"),
    fabricType: z.string().min(1, "Fabric type is required"),
    colors: z
      .array(
        z.object({
          name: z.string().trim().min(1, "Color name is required"),
          hex: z
            .string()
            .trim()
            .min(1, "Color value is required")
            .transform((h) => (h.startsWith("#") ? h : `#${h}`)),
          image: z
            .union([z.string().url(), z.literal(""), z.null()])
            .optional()
            .nullable()
            .transform((v) => (v === "" ? null : v)),
          images: z.array(z.string().url()).optional()
        })
      )
      .min(1, "At least one color is required")
      .refine(
        (colors) =>
          new Set(colors.map((c) => c.name.trim().toLowerCase())).size === colors.length,
        "Duplicate colors are not allowed"
      ),
    price: z.coerce.number().positive("Price must be greater than zero"),
    originalPrice: z
      .union([z.literal(""), z.coerce.number().positive("Cut price must be greater than zero")])
      .optional()
      .nullable()
      .transform((value) => (value === "" ? undefined : value)),
    stock: z.coerce.number().int().nonnegative("Stock cannot be negative").optional(),
    lowStockThreshold: z.coerce.number().int().nonnegative("Threshold cannot be negative").optional(),
    images: z.array(z.string().url()).max(10, "Up to 10 images").optional(),
    description: z.string().optional(),
    availableLengths: z.array(z.string()).optional(),
    featured: z.boolean().optional(),
    isNew: z.boolean().optional()
  })
  .refine((data) => !data.originalPrice || data.originalPrice >= data.price, {
    message: "Cut price must be greater than or equal to the selling price",
    path: ["originalPrice"]
  });

export type InventoryFormValues = z.infer<typeof inventoryFormSchema>;
