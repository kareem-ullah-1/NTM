import { Router } from "express";
import {
  listDrops,
  createDrop,
  updateDrop,
  setDropStatus,
  deleteDrop,
  getDrop,
  getPublicDrops,
  getDropForProduct,
  subscribeToDropNotification
} from "../controllers/product-drops.controller";
import { requireAuth, requireRole, requirePermission } from "../middleware/auth.middleware";
import { validate } from "../middleware/validate.middleware";
import {
  productDropCreateSchema,
  productDropUpdateSchema,
  productDropStatusSchema
} from "../validators/product-drop.validator";

const router = Router();

router.get("/public", getPublicDrops);
router.get("/product/:productId", getDropForProduct);
router.post("/:id/subscribe", subscribeToDropNotification);

router.use(requireAuth, requireRole("admin"), requirePermission("promotions.manage"));
router.get("/", listDrops);
router.post("/", validate(productDropCreateSchema), createDrop);
router.get("/:id", getDrop);
router.patch("/:id", validate(productDropUpdateSchema), updateDrop);
router.patch("/:id/status", validate(productDropStatusSchema), setDropStatus);
router.delete("/:id", deleteDrop);

export default router;
