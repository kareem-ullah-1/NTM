import { Router } from "express";
import {
  createCoupon,
  deleteCoupon,
  listCoupons,
  setCouponStatus,
  updateCoupon,
  validateCoupon
} from "../controllers/coupon.controller";
import { optionalAuth, requireAuth, requireRole, requirePermission } from "../middleware/auth.middleware";
import { validate } from "../middleware/validate.middleware";
import {
  couponCreateSchema,
  couponStatusSchema,
  couponUpdateSchema,
  couponValidateSchema
} from "../validators/coupon.validator";

const router = Router();

router.post("/validate", optionalAuth, validate(couponValidateSchema), validateCoupon);

router.use(requireAuth, requireRole("admin"), requirePermission("coupons.manage"));
router.get("/", listCoupons);
router.post("/", validate(couponCreateSchema), createCoupon);
router.patch("/:id", validate(couponUpdateSchema), updateCoupon);
router.patch("/:id/status", validate(couponStatusSchema), setCouponStatus);
router.delete("/:id", deleteCoupon);

export default router;
