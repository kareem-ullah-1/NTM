import { z } from "zod";

export const adminWalletAdjustSchema = z.object({
  amount: z.number().refine((v) => v !== 0, "Amount can't be zero"),
  reason: z.string().trim().min(3, "A reason is required for the ledger")
});

