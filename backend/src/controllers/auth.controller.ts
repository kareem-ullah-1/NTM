import type { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { sendSuccess } from "../utils/ApiResponse";
import { AuthService } from "../services/auth.service";
import { AdminEmailVerificationService } from "../services/adminEmailVerification.service";
import { ApiError } from "../utils/ApiError";
import type { VerifyEmailInput } from "../validators/auth.validator";

export const register = asyncHandler(async (req: Request, res: Response) => {
  const result = await AuthService.register(req.body);
  sendSuccess(res, result, 201, undefined, "Account created successfully");
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  const result = await AuthService.login(req.body);
  sendSuccess(res, result, 200, undefined, "Logged in successfully");
});

export const verifyAdminEmail = asyncHandler(async (req: Request, res: Response) => {
  const { token } = req.body as VerifyEmailInput;
  const user = await AdminEmailVerificationService.verify(token);
  sendSuccess(res, { email: user.email }, 200, undefined, "Email verified successfully");
});

export const resendAdminVerification = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw ApiError.unauthorized("Authentication required");
  await AdminEmailVerificationService.resend(req.user.sub);
  sendSuccess(res, null, 200, undefined, "Verification email sent");
});
