import { Router } from "express";
import {
  createOrder,
  listOrders,
  getOrder,
  getMyOrders,
  getMyOrder,
  updateOrderStatus,
  cancelOrder
} from "../controllers/orders.controller";
import { requireAuth, optionalAuth, requireRole, requirePermission } from "../middleware/auth.middleware";
import { validate } from "../middleware/validate.middleware";
import {
  createOrderSchema,
  orderListQuerySchema,
  updateOrderStatusSchema,
  cancelOrderSchema
} from "../validators/order.validator";

const router = Router();

router.post("/", optionalAuth, validate(createOrderSchema), createOrder);

router.get("/mine", requireAuth, getMyOrders);

router.get("/mine/:id", requireAuth, getMyOrder);

router.post("/:id/cancel", requireAuth, validate(cancelOrderSchema), cancelOrder);

router.get(
  "/",
  requireAuth,
  requireRole("admin"),
  requirePermission("orders.manage"),
  validate(orderListQuerySchema, "query"),
  listOrders
);
router.get("/:id", requireAuth, requireRole("admin"), requirePermission("orders.manage"), getOrder);
router.patch(
  "/:id/status",
  requireAuth,
  requireRole("admin"),
  requirePermission("orders.manage"),
  validate(updateOrderStatusSchema),
  updateOrderStatus
);

export default router;
