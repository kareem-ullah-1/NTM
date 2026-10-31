import { Router } from "express";
import {
  listCollections,
  getCollection,
  createCollection,
  updateCollection,
  deleteCollection,
  listEnabledCollections,
  createCollectionOption,
  updateCollectionOption,
  deleteCollectionOption
} from "../controllers/collection.controller";
import { requireAuth, requireRole, requirePermission } from "../middleware/auth.middleware";
import { validate } from "../middleware/validate.middleware";
import {
  collectionCreateSchema,
  collectionUpdateSchema,
  collectionOptionCreateSchema,
  collectionOptionUpdateSchema
} from "../validators/collection.validator";

const router = Router();

router.get("/public", listEnabledCollections);

router.get("/", requireAuth, requireRole("admin"), requirePermission("categories.manage"), listCollections);
router.get("/:id", requireAuth, requireRole("admin"), requirePermission("categories.manage"), getCollection);
router.post("/", requireAuth, requireRole("admin"), requirePermission("categories.manage"), validate(collectionCreateSchema), createCollection);
router.patch("/:id", requireAuth, requireRole("admin"), requirePermission("categories.manage"), validate(collectionUpdateSchema), updateCollection);
router.delete("/:id", requireAuth, requireRole("admin"), requirePermission("categories.manage"), deleteCollection);

router.post("/:id/options", requireAuth, requireRole("admin"), requirePermission("categories.manage"), validate(collectionOptionCreateSchema), createCollectionOption);
router.patch("/:id/options/:optionId", requireAuth, requireRole("admin"), requirePermission("categories.manage"), validate(collectionOptionUpdateSchema), updateCollectionOption);
router.delete("/:id/options/:optionId", requireAuth, requireRole("admin"), requirePermission("categories.manage"), deleteCollectionOption);

export default router;
