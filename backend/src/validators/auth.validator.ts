import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters")
});

export type LoginInput = z.infer<typeof loginSchema>;

export const registerSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  registrationCode: z.string().optional()
});

export type RegisterInput = z.infer<typeof registerSchema>;

export const verifyEmailSchema = z.object({
  token: z.string().min(10, "A verification token is required")
});

export type VerifyEmailInput = z.infer<typeof verifyEmailSchema>;
