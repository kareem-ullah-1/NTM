import { Router } from "express";
import {
  listInventory,
  createInventoryItem,
  updateInventoryItem,
  deleteInventoryItem,
  adjustInventoryStock,
  listInventoryMovements
} from "../controllers/inventory.controller";
import { requireAuth, requireRole, requirePermission } from "../middleware/auth.middleware";
import { validate } from "../middleware/validate.middleware";
import { inventoryCreateSchema, inventoryUpdateSchema, stockAdjustmentSchema } from "../validators/product.validator";

const router = Router();

router.use(requireAuth, requireRole("admin"), requirePermission("products.manage"));

router.get("/", listInventory);
router.get("/movements", listInventoryMovements);
router.post("/", validate(inventoryCreateSchema), createInventoryItem);
router.put("/:sku", validate(inventoryUpdateSchema), updateInventoryItem);
router.post("/:sku/adjust", validate(stockAdjustmentSchema), adjustInventoryStock);
router.delete("/:sku", deleteInventoryItem);

export default router;
