import { z } from "zod";

export const productDropCreateSchema = z
  .object({
    productId: z.string().uuid("Must reference a valid product"),
    name: z.string().trim().min(2, "Name must be at least 2 characters").max(150),
    description: z.string().trim().max(500).optional(),
    startsAt: z.string().datetime(),
    endsAt: z.string().datetime(),
    maxQuantity: z.coerce.number().int().positive("Quantity must be at least 1"),
    perCustomerLimit: z.coerce.number().int().positive("Per-customer limit must be at least 1").optional(),
    specialPrice: z.coerce.number().positive("Drop price must be greater than 0").optional().nullable(),
    promotionId: z.string().uuid().optional().nullable(),
    isActive: z.boolean().optional()
  })
  .refine((data) => new Date(data.endsAt) > new Date(data.startsAt), {
    message: "End date must be after start date",
    path: ["endsAt"]
  });

export type ProductDropCreateInput = z.infer<typeof productDropCreateSchema>;

export const productDropUpdateSchema = z
  .object({
    productId: z.string().uuid().optional(),
    name: z.string().trim().min(2).max(150).optional(),
    description: z.string().trim().max(500).optional(),
    startsAt: z.string().datetime().optional(),
    endsAt: z.string().datetime().optional(),
    maxQuantity: z.coerce.number().int().positive().optional(),
    perCustomerLimit: z.coerce.number().int().positive().optional(),
    specialPrice: z.coerce.number().positive("Drop price must be greater than 0").optional().nullable(),
    promotionId: z.string().uuid().optional().nullable(),
    isActive: z.boolean().optional()
  })
  .refine(
    (data) => {
      if (data.startsAt && data.endsAt) {
        return new Date(data.endsAt) > new Date(data.startsAt);
      }
      return true;
    },
    {
      message: "End date must be after start date",
      path: ["endsAt"]
    }
  );

export type ProductDropUpdateInput = z.infer<typeof productDropUpdateSchema>;

export const productDropStatusSchema = z.object({
  isActive: z.boolean()
});

