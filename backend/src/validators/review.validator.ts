import { z } from "zod";

const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

export const createReviewSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Name is required")
    .max(120, "Name must be under 120 characters")
    .refine((val) => val.trim().length >= 2, "Name must be at least 2 characters")
    .optional(),
  email: z
    .string()
    .trim()
    .min(1, "Email is required")
    .max(160, "Email must be under 160 characters")
    .regex(emailRegex, "Please enter a valid email address")
    .optional(),
  rating: z.coerce.number().int().min(1, "Rating must be between 1 and 5").max(5, "Rating must be between 1 and 5"),
  comment: z
    .string()
    .trim()
    .min(3, "Review must be at least 3 characters")
    .max(2000, "Review must be under 2000 characters"),
  images: z.array(z.string().url()).max(5, "You can attach up to 5 photos").optional().default([])
}).refine(
  (data) => {

    const hasName = data.name !== undefined && data.name.trim().length > 0;
    const hasEmail = data.email !== undefined && data.email.trim().length > 0;
    return hasName === hasEmail;
  },
  { message: "Both name and email are required for guest reviews", path: ["name"] }
);


export const reviewListQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(200).optional()
});

export const reviewStatusUpdateSchema = z.object({
  status: z.enum(["pending", "approved", "rejected", "hidden"], {
    errorMap: () => ({ message: "Status must be: pending, approved, rejected, or hidden" })
  })
});


export const adminReviewListQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(200).optional(),
  status: z.enum(["pending", "approved", "rejected", "hidden"]).optional(),
  rating: z.coerce.number().int().min(1).max(5).optional(),
  search: z.string().max(200).optional()
});

