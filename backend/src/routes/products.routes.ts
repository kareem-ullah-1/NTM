import { Router } from "express";import { listProducts, getProductBySlug, getRelatedProducts, getAlsoBoughtProducts, getFeaturedProducts, getFilterOptions, getSearchSuggestions } from "../controllers/products.controller";
import { listAvailableColors } from "../controllers/colors.controller";
import citiesData from "../config/cities.json";
import {
  deleteMyReview,
  getMyReview,
  listProductReviews,
  submitReview
} from "../controllers/review.controller";
import { optionalAuth, requireAuth } from "../middleware/auth.middleware";
import { validate } from "../middleware/validate.middleware";
import { guestReviewRateLimiter } from "../middleware/rateLimit.middleware";
import { productListQuerySchema } from "../validators/product.validator";
import { createReviewSchema, reviewListQuerySchema } from "../validators/review.validator";

const router = Router();

router.get("/", validate(productListQuerySchema, "query"), listProducts);
router.get("/featured", getFeaturedProducts);
router.get("/filter-options", getFilterOptions);
router.get("/suggestions", getSearchSuggestions);
router.get("/available-colors", listAvailableColors);
router.get("/available-cities", (_req, res) => {
  res.json({ success: true, message: null, data: citiesData.cities, meta: null });
});
router.get("/:slug", getProductBySlug);
router.get("/:slug/related", getRelatedProducts);
router.get("/:slug/also-bought", getAlsoBoughtProducts);

router.get("/:slug/reviews", validate(reviewListQuerySchema, "query"), listProductReviews);
router.get("/:slug/reviews/mine", requireAuth, getMyReview);

router.post("/:slug/reviews", optionalAuth, guestReviewRateLimiter, validate(createReviewSchema), submitReview);
router.delete("/:slug/reviews/:reviewId", requireAuth, deleteMyReview);

export default router;
