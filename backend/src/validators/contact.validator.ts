import { z } from "zod";

const pakistaniPhoneRegex = /^(?:\+92|0)3\d{9}$/;

export const contactMessageSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Enter a valid email address"),
  phone: z.string().regex(pakistaniPhoneRegex, "Enter a valid Pakistani phone number"),
  subject: z.string().min(1, "Subject is required"),
  message: z.string().min(10, "Message must be at least 10 characters")
});

export const newsletterSchema = z.object({
  email: z.string().email("Enter a valid email address")
});

export type ContactMessageInput = z.infer<typeof contactMessageSchema>;
