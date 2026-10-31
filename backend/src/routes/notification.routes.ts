import { Router } from "express";
import { listNotificationLog } from "../controllers/notification.controller";
import { requireAuth, requireRole, requirePermission } from "../middleware/auth.middleware";

const router = Router();

router.get("/", requireAuth, requireRole("admin"), requirePermission("orders.manage"), listNotificationLog);

export default router;
