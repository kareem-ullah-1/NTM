import { z } from "zod";

const codeSchema = z
  .string()
  .trim()
  .min(3, "Coupon code must be at least 3 characters")
  .max(40, "Coupon code must be at most 40 characters")
  .regex(/^[A-Za-z0-9_-]+$/, "Coupon code may only contain letters, numbers, hyphens and underscores");

export const couponCreateSchema = z
  .object({
    code: codeSchema,
    description: z.string().trim().max(300).optional(),
    discountType: z.enum(["percentage", "fixed"]),
    discountValue: z.coerce.number().nonnegative("Discount value must be 0 or greater"),
    minOrderAmount: z.coerce.number().nonnegative().optional(),
    maxDiscountAmount: z.coerce.number().positive().optional(),
    usageLimit: z.coerce.number().int().positive().optional(),
    perUserLimit: z.coerce.number().int().positive().optional(),
    isActive: z.boolean().optional(),
    startsAt: z.string().datetime().optional().or(z.literal("").transform(() => undefined)),
    expiresAt: z.string().datetime().optional().or(z.literal("").transform(() => undefined))
  })
  .refine((data) => data.discountType !== "percentage" || data.discountValue <= 100, {
    message: "Percentage discount cannot exceed 100",
    path: ["discountValue"]
  });
export type CouponCreateInput = z.infer<typeof couponCreateSchema>;

export const couponUpdateSchema = z.object({
  code: codeSchema.optional(),
  description: z.string().trim().max(300).optional(),
  discountType: z.enum(["percentage", "fixed"]).optional(),
  discountValue: z.coerce.number().nonnegative().optional(),
  minOrderAmount: z.coerce.number().nonnegative().optional(),
  maxDiscountAmount: z.coerce.number().positive().optional(),
  usageLimit: z.coerce.number().int().positive().optional(),
  perUserLimit: z.coerce.number().int().positive().optional(),
  startsAt: z.string().datetime().optional().or(z.literal("").transform(() => undefined)),
  expiresAt: z.string().datetime().optional().or(z.literal("").transform(() => undefined))
});
export type CouponUpdateInput = z.infer<typeof couponUpdateSchema>;

export const couponStatusSchema = z.object({
  isActive: z.boolean()
});

export const couponValidateSchema = z.object({
  code: z.string().trim().min(1, "Coupon code is required"),
  subtotal: z.coerce.number().nonnegative()
});

