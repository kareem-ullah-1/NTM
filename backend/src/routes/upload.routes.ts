import { Router } from "express";
import multer from "multer";
import { deleteProductImage, uploadProductImage, uploadProductImages, uploadPromotionMedia } from "../controllers/upload.controller";
import { requireAuth, requireRole, requirePermission } from "../middleware/auth.middleware";

const ALLOWED_IMAGE_MIME_TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif", "image/gif"];
const ALLOWED_MEDIA_MIME_TYPES = [...ALLOWED_IMAGE_MIME_TYPES, "video/mp4", "video/webm"];

const imageUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 10 },
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_IMAGE_MIME_TYPES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Invalid file type "${file.mimetype}". Only JPEG, PNG, WEBP, AVIF, or GIF images are allowed.`));
    }
  }
});

const mediaUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024, files: 1 },
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_MEDIA_MIME_TYPES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Invalid file type "${file.mimetype}". Only images (JPEG, PNG, WEBP) or videos (MP4, WebM) are allowed.`));
    }
  }
});

const router = Router();

router.use(requireAuth, requireRole("admin"), requirePermission("products.manage"));

router.post("/image", imageUpload.single("image"), uploadProductImage);
router.post("/images", imageUpload.array("images", 10), uploadProductImages);
router.post("/media", mediaUpload.single("media"), uploadPromotionMedia);
router.delete("/image", deleteProductImage);

export default router;
