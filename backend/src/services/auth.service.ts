import { UserModel, type UserRecord } from "../models/user.model";
import { EmailVerificationTokenModel } from "../models/emailVerificationToken.model";
import { AdminEmailVerificationService } from "./adminEmailVerification.service";
import { permissionsForRole } from "../config/permissions";
import { ApiError } from "../utils/ApiError";
import { comparePassword, hashPassword } from "../utils/password";
import { signAccessToken } from "../utils/jwt";
import { env } from "../config/env";
import type { LoginInput, RegisterInput } from "../validators/auth.validator";

function serializeUser(user: UserRecord) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    adminRole: user.role === "admin" ? user.admin_role : undefined,
    permissions: user.role === "admin" ? permissionsForRole(user.admin_role) : undefined,
    isActive: user.is_active,
    emailVerified: user.role === "admin" ? user.email_verified_at !== null : undefined,
    walletBalance: parseFloat(user.wallet_balance),
    avatarUrl: user.avatar_url,
    createdAt: user.created_at.toISOString()
  };
}

export const AuthService = {
  async register(input: RegisterInput) {

    if (!env.adminRegistrationCode || input.registrationCode !== env.adminRegistrationCode) {
      throw ApiError.forbidden("Invalid registration code");
    }

    const existingAdminCount = await UserModel.countAdmins();
    if (existingAdminCount > 0) {
      throw ApiError.forbidden(
        "Self-registration is only available for initial setup. Ask a Super Admin to create your staff account."
      );
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

      adminRole: "super_admin"
    });

    const token = signAccessToken({
      sub: user.id,
      email: user.email,
      role: user.role,
      adminRole: user.admin_role
    });

    try {
      await AdminEmailVerificationService.sendVerificationEmail(user);
    } catch (error) {
      console.error("Failed to send admin verification email:", error instanceof Error ? error.message : error);
    }

    return { token, user: serializeUser(user) };
  },

  async login(input: LoginInput) {
    const user = await UserModel.findByEmail(input.email);
    if (!user) {
      throw ApiError.unauthorized("Invalid email or password");
    }

    const isMatch = await comparePassword(input.password, user.password_hash);
    if (!isMatch) {
      throw ApiError.unauthorized("Invalid email or password");
    }

    if (user.role === "admin" && !user.is_active) {
      throw ApiError.forbidden("This staff account has been deactivated. Contact a super admin.");
    }

    if (user.role === "admin" && !user.email_verified_at) {
      const alreadySent = await EmailVerificationTokenModel.hasAnyToken(user.id);
      if (!alreadySent) {
        try {
          await AdminEmailVerificationService.sendVerificationEmail(user);
        } catch (error) {
          console.error("Failed to send admin verification email:", error instanceof Error ? error.message : error);
        }
      }
    }

    const token = signAccessToken({
      sub: user.id,
      email: user.email,
      role: user.role,
      adminRole: user.admin_role
    });

    return { token, user: serializeUser(user) };
  }
};
