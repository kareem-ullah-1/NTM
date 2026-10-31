import { Router } from "express";
import {
  getDashboardStats,
  getSalesSeries,
  getBestSellingProducts,
  getCouponPerformance
} from "../controllers/dashboard.controller";
import { requireAuth, requireRole, requirePermission } from "../middleware/auth.middleware";

const router = Router();

router.use(requireAuth, requireRole("admin"), requirePermission("dashboard.view"));

router.get("/stats", getDashboardStats);
router.get("/sales-series", getSalesSeries);
router.get("/best-sellers", getBestSellingProducts);
router.get("/coupon-performance", getCouponPerformance);

export default router;
