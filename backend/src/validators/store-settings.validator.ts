import { z } from "zod";

export const updateStoreSettingsSchema = z.object({
  storeName: z.string().min(1).max(200).optional(),
  storeLogoUrl: z.string().url().nullable().optional(),
  contactEmail: z.string().email().nullable().optional(),
  phone: z.string().max(50).nullable().optional(),
  address: z.string().max(500).nullable().optional(),
  currency: z.string().min(1).max(10).optional(),
  currencySymbol: z.string().min(1).max(10).optional(),
  meta: z.record(z.unknown()).optional(),
  defaultLowStockThreshold: z.coerce.number().int().nonnegative().optional()
});
