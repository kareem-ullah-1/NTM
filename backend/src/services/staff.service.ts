import { UserModel, type UserRecord, type AdminRoleValue } from "../models/user.model";
import { ApiError } from "../utils/ApiError";
import { hashPassword } from "../utils/password";
import { permissionsForRole } from "../config/permissions";
import type { CreateStaffInput, UpdateStaffRoleInput } from "../validators/staff.validator";

function serializeStaff(user: UserRecord) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    adminRole: user.admin_role,
    permissions: permissionsForRole(user.admin_role),
    isActive: user.is_active,
    createdAt: user.created_at.toISOString()
  };
}

const ASSIGNABLE_STAFF_ROLES: AdminRoleValue[] = [
  "admin",
  "product_manager",
  "order_manager",
  "support_staff"
];

export const StaffService = {
  async list() {
    const staff = await UserModel.findStaff();
    return staff.map(serializeStaff);
  },

  async create(input: CreateStaffInput, actingAdminRole: string | undefined) {
    if (input.adminRole === "super_admin") {
      throw ApiError.forbidden(
        "A Super Admin account cannot be created from Staff management. There can be only one Super Admin."
      );
    }

    if (!ASSIGNABLE_STAFF_ROLES.includes(input.adminRole as AdminRoleValue)) {
      throw ApiError.badRequest("Invalid staff role");
    }

    if (input.adminRole === "admin" && actingAdminRole !== "super_admin") {
      throw ApiError.forbidden("Only a Super Admin can create Admin accounts");
    }

    if (actingAdminRole !== "super_admin" && actingAdminRole !== "admin") {
    }

    const existing = await UserModel.findByEmail(input.email);
    if (existing) {
      throw ApiError.conflict("An account with this email already exists");
    }

    const passwordHash = await hashPassword(input.password);
    const user = await UserModel.create({
      name: input.name,
      email: input.email,
      passwordHash,
      role: "admin",
      adminRole: input.adminRole as AdminRoleValue,
      emailVerified: true
    });

    return serializeStaff(user);
  },

  async updateRole(
    id: string,
    input: UpdateStaffRoleInput,
    actingAdminRole: string | undefined,
    actingUserId: string
  ) {
    if (id === actingUserId) {
      throw ApiError.badRequest("You cannot change your own role");
    }

    if (input.adminRole === "super_admin") {
      throw ApiError.forbidden(
        "Staff cannot be promoted to Super Admin. There can be only one Super Admin."
      );
    }

    if (!ASSIGNABLE_STAFF_ROLES.includes(input.adminRole as AdminRoleValue)) {
      throw ApiError.badRequest("Invalid staff role");
    }

    if (input.adminRole === "admin" && actingAdminRole !== "super_admin") {
      throw ApiError.forbidden("Only a Super Admin can grant Admin access");
    }

    const target = await UserModel.findById(id);
    if (!target || target.role !== "admin") {
      throw ApiError.notFound("Staff member not found");
    }

    if (target.admin_role === "super_admin") {
      throw ApiError.forbidden("The Super Admin role cannot be changed");
    }

    const updated = await UserModel.updateAdminRole(id, input.adminRole as AdminRoleValue);
    if (!updated) throw ApiError.notFound("Staff member not found");
    return serializeStaff(updated);
  },

  async setActive(id: string, isActive: boolean, actingUserId: string) {
    if (id === actingUserId) {
      throw ApiError.badRequest("You cannot deactivate your own account");
    }

    const target = await UserModel.findById(id);
    if (!target || target.role !== "admin") {
      throw ApiError.notFound("Staff member not found");
    }

    if (target.admin_role === "super_admin" && !isActive) {
      throw ApiError.forbidden("The Super Admin account cannot be disabled");
    }

    const updated = await UserModel.setActive(id, isActive);
    if (!updated) throw ApiError.notFound("Staff member not found");
    return serializeStaff(updated);
  },

  async delete(id: string, actingAdminRole: string | undefined, actingUserId: string) {
    if (actingAdminRole !== "super_admin") {
      throw ApiError.forbidden("Only a Super Admin can delete staff accounts");
    }

    if (id === actingUserId) {
      throw ApiError.badRequest("You cannot delete your own account");
    }

    const target = await UserModel.findById(id);
    if (!target || target.role !== "admin") {
      throw ApiError.notFound("Staff member not found");
    }

    if (target.admin_role === "super_admin") {
      throw ApiError.forbidden("Super Admin account cannot be deleted");
    }

    const superAdminCount = await UserModel.countSuperAdmins();
    if (superAdminCount < 1) {
      throw ApiError.forbidden("Cannot delete accounts while the system has no Super Admin");
    }

    try {
      const deleted = await UserModel.deleteStaff(id);
      if (!deleted) throw ApiError.notFound("Staff member not found");
      return serializeStaff(deleted);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (/foreign key|violates foreign key/i.test(message)) {
        throw ApiError.conflict(
          "This staff account cannot be deleted because related records still reference it."
        );
      }
      throw error;
    }
  }

};
