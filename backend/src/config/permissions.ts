export type AdminRole = "super_admin" | "admin" | "product_manager" | "order_manager" | "support_staff";

export const ADMIN_ROLES: AdminRole[] = [
  "super_admin",
  "admin",
  "product_manager",
  "order_manager",
  "support_staff"
];

export const STAFF_ASSIGNABLE_ROLES: AdminRole[] = [
  "admin",
  "product_manager",
  "order_manager",
  "support_staff"
];

export type Permission =
  | "products.manage"
  | "categories.manage"
  | "fabric_types.manage"
  | "colors.manage"
  | "coupons.manage"
  | "orders.manage"
  | "returns.manage"
  | "customers.manage"
  | "reviews.manage"
  | "staff.manage"
  | "store_settings.manage"
  | "promotions.manage"
  | "dashboard.view";

const ROLE_PERMISSIONS: Record<Exclude<AdminRole, "super_admin">, Permission[]> = {
  admin: [
    "products.manage",
    "categories.manage",
    "fabric_types.manage",
    "colors.manage",
    "coupons.manage",
    "orders.manage",
    "returns.manage",
    "customers.manage",
    "reviews.manage",
    "promotions.manage",
    "store_settings.manage",
    "dashboard.view"
  ],
  product_manager: [
    "products.manage",
    "categories.manage",
    "fabric_types.manage",
    "colors.manage",
    "reviews.manage",
    "dashboard.view"
  ],
  order_manager: ["orders.manage", "returns.manage", "coupons.manage", "dashboard.view"],
  support_staff: ["customers.manage", "returns.manage", "dashboard.view"]
};

export function hasPermission(adminRole: string | undefined, permission: Permission): boolean {
  if (adminRole === "super_admin") return true;
  if (!adminRole || !ADMIN_ROLES.includes(adminRole as AdminRole)) return false;
  return ROLE_PERMISSIONS[adminRole as Exclude<AdminRole, "super_admin">]?.includes(permission) ?? false;
}

export function permissionsForRole(adminRole: string): Permission[] {
  if (adminRole === "super_admin") {
    const all = new Set<Permission>();
    Object.values(ROLE_PERMISSIONS).forEach((perms) => perms.forEach((p) => all.add(p)));
    all.add("staff.manage");
    return Array.from(all);
  }
  return ROLE_PERMISSIONS[adminRole as Exclude<AdminRole, "super_admin">] ?? [];
}
