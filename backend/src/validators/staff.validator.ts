import { z } from "zod";
import { STAFF_ASSIGNABLE_ROLES } from "../config/permissions";

const staffRoleEnum = STAFF_ASSIGNABLE_ROLES as [string, ...string[]];

export const createStaffSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  adminRole: z.enum(staffRoleEnum)
});
export type CreateStaffInput = z.infer<typeof createStaffSchema>;

export const updateStaffRoleSchema = z.object({
  adminRole: z.enum(staffRoleEnum)
});
export type UpdateStaffRoleInput = z.infer<typeof updateStaffRoleSchema>;

export const updateStaffStatusSchema = z.object({
  isActive: z.boolean()
});

