import { Router } from "express";
import {
  listPromotions,
  createPromotion,
  updatePromotion,
  setPromotionStatus,
  deletePromotion,
  getPromotion,
  getActivePromotions,
  getPromotionForProduct,
  previewPromotion
} from "../controllers/promotions.controller";
import { requireAuth, requireRole, requirePermission, optionalAuth } from "../middleware/auth.middleware";
import { validate } from "../middleware/validate.middleware";
import {
  promotionCreateSchema,
  promotionUpdateSchema,
  promotionStatusSchema
} from "../validators/promotion.validator";

const router = Router();

router.get("/active", getActivePromotions);
router.post("/preview", optionalAuth, previewPromotion);
router.get("/product/:productId", getPromotionForProduct);

router.use(requireAuth, requireRole("admin"), requirePermission("promotions.manage"));
router.get("/", listPromotions);
router.post("/", validate(promotionCreateSchema), createPromotion);
router.get("/:id", getPromotion);
router.patch("/:id", validate(promotionUpdateSchema), updatePromotion);
router.patch("/:id/status", validate(promotionStatusSchema), setPromotionStatus);
router.delete("/:id", deletePromotion);

export default router;
