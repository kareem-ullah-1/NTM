import { Router } from "express";
import {
  cancelReturn,
  getReturn,
  listMyReturns,
  listReturns,
  requestReturn,
  updateReturnStatus
} from "../controllers/return.controller";
import { requireAuth, requireRole, requirePermission } from "../middleware/auth.middleware";
import { validate } from "../middleware/validate.middleware";
import { createReturnSchema, returnListQuerySchema, updateReturnStatusSchema } from "../validators/return.validator";

const router = Router();

router.post("/", requireAuth, validate(createReturnSchema), requestReturn);
router.get("/mine", requireAuth, listMyReturns);
router.patch("/:id/cancel", requireAuth, cancelReturn);
router.get("/:id", requireAuth, getReturn);

router.get(
  "/",
  requireAuth,
  requireRole("admin"),
  requirePermission("returns.manage"),
  validate(returnListQuerySchema, "query"),
  listReturns
);
router.patch(
  "/:id/status",
  requireAuth,
  requireRole("admin"),
  requirePermission("returns.manage"),
  validate(updateReturnStatusSchema),
  updateReturnStatus
);

export default router;
