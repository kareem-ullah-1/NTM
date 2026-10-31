import { Router } from "express";
import { login, register, resendAdminVerification, verifyAdminEmail } from "../controllers/auth.controller";
import { validate } from "../middleware/validate.middleware";
import { requireAuth } from "../middleware/auth.middleware";
import { adminVerificationResendRateLimiter } from "../middleware/rateLimit.middleware";
import { loginSchema, registerSchema, verifyEmailSchema } from "../validators/auth.validator";

const router = Router();

router.post("/register", validate(registerSchema), register);
router.post("/login", validate(loginSchema), login);

router.post("/verify-email", validate(verifyEmailSchema), verifyAdminEmail);
router.post("/resend-verification", requireAuth, adminVerificationResendRateLimiter, resendAdminVerification);

export default router;
