import { z } from "zod";

export const updatePaymentStatusSchema = z.object({
  status: z.enum(["pending", "paid", "failed", "refunded", "cancelled"]),
  transactionRef: z.string().trim().min(1).max(150).optional(),
  note: z.string().trim().max(500).optional()
});
export type UpdatePaymentStatusInput = z.infer<typeof updatePaymentStatusSchema>;

