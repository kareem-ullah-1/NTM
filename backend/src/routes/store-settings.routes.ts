import { Router } from "express";
import { getStoreSettings, updateStoreSettings } from "../controllers/store-settings.controller";
import { requireAuth, requireRole, requirePermission } from "../middleware/auth.middleware";
import { validate } from "../middleware/validate.middleware";
import { updateStoreSettingsSchema } from "../validators/store-settings.validator";

const router = Router();

router.get("/", getStoreSettings);

router.put(
  "/",
  requireAuth,
  requireRole("admin"),
  requirePermission("store_settings.manage"),
  validate(updateStoreSettingsSchema),
  updateStoreSettings
);

export default router;
