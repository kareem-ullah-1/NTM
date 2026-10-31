import { EmailVerificationTokenModel } from "../models/emailVerificationToken.model";
import { UserModel, type UserRecord } from "../models/user.model";
import { sendEmail, isEmailConfigured } from "../notifications/email";
import { adminVerificationEmailContent } from "../notifications/templates";
import { ApiError } from "../utils/ApiError";
import { env } from "../config/env";

async function sendVerificationEmail(user: UserRecord): Promise<void> {
  const rawToken = await EmailVerificationTokenModel.create(user.id);
  const verifyUrl = `${env.frontendUrl}/admin/verify-email?token=${rawToken}`;

  if (!isEmailConfigured()) {

    console.warn(
      `[admin-verification] Email is not configured (set SMTP_HOST/SMTP_USER/SMTP_PASSWORD). ` +
        `Verification link for ${user.email}: ${verifyUrl}`
    );
    return;
  }

  const content = adminVerificationEmailContent({ name: user.name }, verifyUrl);
  await sendEmail({ to: user.email, subject: content.subject, html: content.html, text: content.text });
}

export const AdminEmailVerificationService = {
  sendVerificationEmail,

  async verify(rawToken: string): Promise<UserRecord> {
    const record = await EmailVerificationTokenModel.findValidByRawToken(rawToken);
    if (!record) {
      throw ApiError.badRequest("This verification link is invalid.");
    }
    if (record.used_at) {
      throw ApiError.badRequest("This verification link has already been used.");
    }
    if (record.expires_at.getTime() < Date.now()) {
      throw ApiError.badRequest("This verification link has expired. Request a new one below.");
    }

    await EmailVerificationTokenModel.markUsed(record.id);
    const user = await UserModel.markEmailVerified(record.user_id);
    if (!user) {
      throw ApiError.notFound("Admin account not found");
    }
    return user;
  },

  async resend(userId: string): Promise<void> {
    const user = await UserModel.findById(userId);
    if (!user || user.role !== "admin") {
      throw ApiError.forbidden("Only admin accounts require email verification");
    }
    if (user.email_verified_at) {
      throw ApiError.badRequest("This admin email is already verified.");
    }
    await sendVerificationEmail(user);
  }
};
