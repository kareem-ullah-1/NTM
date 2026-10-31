import { apiRequest } from "./client";
import type { AdminRole } from "./auth";

export type ApiStaff = {
  id: string;
  name: string;
  email: string;
  adminRole: AdminRole;
  permissions: string[];
  isActive: boolean;
  createdAt: string;
};

export async function fetchStaff() {
  return apiRequest<ApiStaff[]>("/admin/staff", { auth: true });
}

export async function createStaff(input: { name: string; email: string; password: string; adminRole: AdminRole }) {
  return apiRequest<ApiStaff>("/admin/staff", { method: "POST", body: input, auth: true });
}

export async function updateStaffRole(id: string, adminRole: AdminRole) {
  return apiRequest<ApiStaff>(`/admin/staff/${encodeURIComponent(id)}/role`, {
    method: "PATCH",
    body: { adminRole },
    auth: true
  });
}

export async function updateStaffStatus(id: string, isActive: boolean) {
  return apiRequest<ApiStaff>(`/admin/staff/${encodeURIComponent(id)}/status`, {
    method: "PATCH",
    body: { isActive },
    auth: true
  });
}

export async function deleteStaff(id: string) {
  return apiRequest<ApiStaff>(`/admin/staff/${encodeURIComponent(id)}`, {
    method: "DELETE",
    auth: true
  });
}

