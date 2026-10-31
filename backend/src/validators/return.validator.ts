import { z } from "zod";

export const createReturnSchema = z.object({
  orderId: z.string().min(1, "Order is required"),
  orderItemId: z.string().uuid().optional(),
  reason: z.string().trim().min(3, "Please provide a reason").max(500),
  customerNotes: z.string().trim().max(1000).optional()
});


export const updateReturnStatusSchema = z.object({
  status: z.enum(["approved", "rejected", "shipped_back", "received", "refunded", "cancelled"]),
  adminNotes: z.string().trim().max(1000).optional(),
  refundMethod: z.enum(["original", "wallet"]).optional()
});


export const returnListQuerySchema = z.object({
  status: z.enum(["requested", "approved", "rejected", "shipped_back", "received", "refunded", "cancelled"]).optional(),
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(100).optional()
});
