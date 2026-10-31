import { Router } from "express";
import {
  getOrderPayment,
  updatePaymentStatus,
  collectCodPayment
} from "../controllers/payment.controller";
import { requireAuth, requireRole, requirePermission } from "../middleware/auth.middleware";
import { validate } from "../middleware/validate.middleware";
import { updatePaymentStatusSchema } from "../validators/payment.validator";

const router = Router();

router.get("/order/:orderId", requireAuth, getOrderPayment);

router.patch(
  "/:paymentId/status",
  requireAuth,
  requireRole("admin"),
  requirePermission("orders.manage"),
  validate(updatePaymentStatusSchema),
  updatePaymentStatus
);

router.patch(
  "/:paymentId/collect",
  requireAuth,
  requireRole("admin"),
  requirePermission("orders.manage"),
  collectCodPayment
);

export default router;
