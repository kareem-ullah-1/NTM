import { Router } from "express";
import { createStaff, listStaff, updateStaffRole, updateStaffStatus, deleteStaff } from "../controllers/staff.controller";
import { requireAuth, requireRole, requirePermission } from "../middleware/auth.middleware";
import { validate } from "../middleware/validate.middleware";
import { createStaffSchema, updateStaffRoleSchema, updateStaffStatusSchema } from "../validators/staff.validator";

const router = Router();

router.use(requireAuth, requireRole("admin"), requirePermission("staff.manage"));

router.get("/", listStaff);
router.post("/", validate(createStaffSchema), createStaff);
router.patch("/:id/role", validate(updateStaffRoleSchema), updateStaffRole);
router.patch("/:id/status", validate(updateStaffStatusSchema), updateStaffStatus);
router.delete("/:id", deleteStaff);

export default router;
