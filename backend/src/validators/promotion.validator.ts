import { z } from "zod";
import { PROMOTION_TARGET_TYPES } from "../services/promotion-eligibility";

const targetTypeSchema = z.enum(PROMOTION_TARGET_TYPES as [string, ...string[]]);

const baseFields = {
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(120),
  description: z.string().trim().max(500).optional(),
  discountType: z.enum(["percentage", "fixed"]),
  discountValue: z.coerce.number().positive("Discount value must be greater than 0"),
  minOrderAmount: z.coerce.number().nonnegative().optional(),
  maxDiscountAmount: z.coerce.number().positive().optional().nullable(),
  startsAt: z.string().datetime(),
  expiresAt: z.string().datetime(),
  usageLimit: z.coerce.number().int().positive().optional().nullable(),
  perUserLimit: z.coerce.number().int().positive().optional().nullable(),
  isActive: z.boolean().optional(),
  targetType: targetTypeSchema,
  productIds: z.array(z.string().uuid()).optional(),
  categories: z.array(z.string().max(60)).optional(),
  fabricTypes: z.array(z.string().max(80)).optional(),
  videoUrl: z.string().url().optional().nullable(),
  videoPosterUrl: z.string().url().optional().nullable(),
  displayProductIds: z.array(z.string().uuid()).optional()
};

function refineTargeting<T extends z.ZodTypeAny>(schema: T) {
  return schema
    .superRefine((data: any, ctx: z.RefinementCtx) => {
      if (data.targetType === undefined) return;
      if (data.targetType === "CATEGORIES" && (!data.categories || data.categories.length === 0)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Select at least one category",
          path: ["categories"]
        });
      }
      if (data.targetType === "FABRIC_TYPES" && (!data.fabricTypes || data.fabricTypes.length === 0)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Select at least one fabric type",
          path: ["fabricTypes"]
        });
      }
      if (data.targetType === "PRODUCTS" && (!data.productIds || data.productIds.length === 0)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Select at least one product",
          path: ["productIds"]
        });
      }
    });
}

export const promotionCreateSchema = refineTargeting(
  z
    .object(baseFields)
    .refine((data) => data.discountType !== "percentage" || data.discountValue <= 100, {
      message: "Percentage discount cannot exceed 100",
      path: ["discountValue"]
    })
    .refine((data) => new Date(data.expiresAt) > new Date(data.startsAt), {
      message: "End date must be after start date",
      path: ["expiresAt"]
    })
);

export type PromotionCreateInput = z.infer<typeof promotionCreateSchema>;

export const promotionUpdateSchema = refineTargeting(
  z
    .object({
      ...baseFields,
      discountType: baseFields.discountType.optional(),
      discountValue: baseFields.discountValue.optional(),
      startsAt: baseFields.startsAt.optional(),
      expiresAt: baseFields.expiresAt.optional(),
      targetType: baseFields.targetType.optional()
    })
    .refine(
      (data) => data.discountType !== "percentage" || data.discountValue === undefined || data.discountValue <= 100,
      { message: "Percentage discount cannot exceed 100", path: ["discountValue"] }
    )
    .refine(
      (data) => !data.startsAt || !data.expiresAt || new Date(data.expiresAt) > new Date(data.startsAt),
      { message: "End date must be after start date", path: ["expiresAt"] }
    )
);

export type PromotionUpdateInput = z.infer<typeof promotionUpdateSchema>;

export const promotionStatusSchema = z.object({
  isActive: z.boolean()
});
