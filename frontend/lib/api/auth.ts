import { apiRequest } from "./client";

export type UserRole = "admin" | "staff" | "user";
export type AdminRole = "super_admin" | "admin" | "product_manager" | "order_manager" | "support_staff";

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  adminRole?: AdminRole;
  permissions?: string[];
  isActive?: boolean;

  emailVerified?: boolean;
  walletBalance: number;
  avatarUrl: string | null;
  createdAt: string;
};

export async function loginAdmin(email: string, password: string) {
  return apiRequest<{ token: string; user: AuthUser }>("/auth/login", {
    method: "POST",
    body: { email, password }
  });
}

export async function registerAdmin(input: {
  name: string;
  email: string;
  password: string;
  registrationCode?: string;
}) {
  return apiRequest<{ token: string; user: AuthUser }>("/auth/register", {
    method: "POST",
    body: input
  });
}

export async function verifyAdminEmail(token: string) {
  return apiRequest<{ email: string }>("/auth/verify-email", {
    method: "POST",
    body: { token }
  });
}

export async function resendAdminVerification() {
  return apiRequest<null>("/auth/resend-verification", { method: "POST", auth: true });
}
