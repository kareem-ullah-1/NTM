import { Router } from "express";
import {
  deleteReviewAsAdmin,
  listReviewsForAdmin,
  updateReviewStatus,
  getReviewStats
} from "../controllers/review.controller";
import { requireAuth, requireRole, requirePermission } from "../middleware/auth.middleware";
import { validate } from "../middleware/validate.middleware";
import { adminReviewListQuerySchema, reviewStatusUpdateSchema } from "../validators/review.validator";

const router = Router();

router.use(requireAuth, requireRole("admin"), requirePermission("reviews.manage"));

router.get("/stats", getReviewStats);
router.get("/", validate(adminReviewListQuerySchema, "query"), listReviewsForAdmin);
router.patch("/:reviewId/status", validate(reviewStatusUpdateSchema), updateReviewStatus);
router.delete("/:reviewId", deleteReviewAsAdmin);

export default router;
