import { Router } from "express";
import authRoutes from "./auth.routes";
import productsRoutes from "./products.routes";
import inventoryRoutes from "./inventory.routes";
import ordersRoutes from "./orders.routes";
import contactRoutes from "./contact.routes";
import newsletterRoutes from "./newsletter.routes";
import dashboardRoutes from "./dashboard.routes";
import uploadRoutes from "./upload.routes";
import adminReviewsRoutes from "./admin-reviews.routes";
import customersRoutes from "./customers.routes";
import storeSettingsRoutes from "./store-settings.routes";
import catalogRoutes from "./catalog.routes";
import { listEnabledCategories, listActiveHomeFeaturedCategories } from "../controllers/catalog.controller";
import staffRoutes from "./staff.routes";
import paymentRoutes from "./payment.routes";
import couponRoutes from "./coupon.routes";
import returnRoutes from "./return.routes";
import notificationRoutes from "./notification.routes";
import reviewUploadsRoutes from "./review-uploads.routes";
import promotionsRoutes from "./promotions.routes";
import productDropsRoutes from "./product-drops.routes";
import collectionRoutes from "./collection.routes";

const router = Router();

router.get("/health", (_req, res) => {
  res.status(200).json({ success: true, message: "API is healthy", data: { status: "ok" } });
});

router.use("/auth", authRoutes);
router.use("/products", productsRoutes);
router.use("/admin/inventory", inventoryRoutes);
router.use("/orders", ordersRoutes);
router.use("/contact", contactRoutes);
router.use("/newsletter", newsletterRoutes);
router.use("/admin/dashboard", dashboardRoutes);
router.use("/admin/uploads", uploadRoutes);
router.use("/admin/reviews", adminReviewsRoutes);
router.use("/admin/customers", customersRoutes);
router.use("/admin/store-settings", storeSettingsRoutes);
router.use("/admin", catalogRoutes);
router.use("/admin/staff", staffRoutes);
router.use("/payments", paymentRoutes);
router.use("/coupons", couponRoutes);
router.use("/returns", returnRoutes);
router.use("/admin/notifications", notificationRoutes);
router.use("/reviews/uploads", reviewUploadsRoutes);
router.use("/promotions", promotionsRoutes);
router.use("/product-drops", productDropsRoutes);
router.use("/admin/collections", collectionRoutes);
router.use("/collections", collectionRoutes);
router.get("/store/categories", listEnabledCategories);
router.get("/store/home-featured-categories", listActiveHomeFeaturedCategories);

export default router;
