import { Router } from "express";
import {
  listCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  listFabricTypes,
  createFabricType,
  updateFabricType,
  deleteFabricType,
  listColors,
  createColor,
  updateColor,
  deleteColor,
  listHomeFeaturedCategories,
  createHomeFeaturedCategory,
  updateHomeFeaturedCategory,
  deleteHomeFeaturedCategory
} from "../controllers/catalog.controller";
import { requireAuth, requireRole, requirePermission } from "../middleware/auth.middleware";
import { validate } from "../middleware/validate.middleware";
import {
  categoryCreateSchema,
  categoryUpdateSchema,
  fabricTypeCreateSchema,
  fabricTypeUpdateSchema,
  colorCreateSchema,
  colorUpdateSchema,
  homeFeaturedCategoryCreateSchema,
  homeFeaturedCategoryUpdateSchema
} from "../validators/catalog.validator";

const router = Router();

router.use(requireAuth, requireRole("admin"));
router.use(requirePermission("categories.manage"));

router.get("/categories", listCategories);
router.post("/categories", validate(categoryCreateSchema), createCategory);
router.patch("/categories/:id", validate(categoryUpdateSchema), updateCategory);
router.delete("/categories/:id", deleteCategory);

router.get("/fabric-types", listFabricTypes);
router.post("/fabric-types", validate(fabricTypeCreateSchema), createFabricType);
router.patch("/fabric-types/:id", validate(fabricTypeUpdateSchema), updateFabricType);
router.delete("/fabric-types/:id", deleteFabricType);

router.get("/colors", listColors);
router.post("/colors", validate(colorCreateSchema), createColor);
router.patch("/colors/:id", validate(colorUpdateSchema), updateColor);
router.delete("/colors/:id", deleteColor);

router.get("/home-featured", listHomeFeaturedCategories);
router.post("/home-featured", validate(homeFeaturedCategoryCreateSchema), createHomeFeaturedCategory);
router.patch("/home-featured/:id", validate(homeFeaturedCategoryUpdateSchema), updateHomeFeaturedCategory);
router.delete("/home-featured/:id", deleteHomeFeaturedCategory);

export default router;
