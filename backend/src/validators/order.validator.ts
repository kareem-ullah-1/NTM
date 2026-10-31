import { z } from "zod";

const pakistaniPhoneRegex = /^(?:\+92|0)3\d{9}$/;

export const orderItemSchema = z.object({
  productId: z.string().uuid("Each item must reference a valid product"),
  name: z.string().min(1),
  color: z.string().optional(),
  length: z.string().optional(),
  quantity: z.coerce.number().int().positive(),
  unitPrice: z.coerce.number().nonnegative().optional()
});

export const createOrderSchema = z.object({
  fullName: z.string().min(2, "Full name must be at least 2 characters"),
  phone: z.string().regex(pakistaniPhoneRegex, "Enter a valid Pakistani phone number"),
  email: z.string().email("Enter a valid email address"),
  address: z.string().min(5, "Address must be at least 5 characters"),
  city: z.string().min(2, "City is required"),
  region: z.string().optional(),
  postalCode: z.string().min(4, "Enter a valid postal code"),
  deliveryNotes: z.string().optional(),
  paymentMethod: z.enum(["Cash on Delivery"]),
  couponCode: z.string().trim().min(1).max(40).optional(),
  walletAmountUsed: z.number().min(0).optional(),
  items: z.array(orderItemSchema).min(1, "Order must contain at least one item")
});

export const updateOrderStatusSchema = z.object({
  status: z.enum(["Pending", "Confirmed", "Shipped", "Delivered", "Cancelled"]),
  reason: z.string().trim().min(1).max(500).optional()
});

export const cancelOrderSchema = z.object({
  reason: z.string().trim().min(1, "Please share why you're cancelling").max(500).optional()
});

export const orderListQuerySchema = z.object({
  status: z.enum(["Pending", "Confirmed", "Shipped", "Delivered", "Cancelled"]).optional(),
  search: z.string().optional(),
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(100).optional()
});

export type CreateOrderInput = z.infer<typeof createOrderSchema>;
