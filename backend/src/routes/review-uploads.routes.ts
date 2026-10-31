import { Router } from "express";
import multer from "multer";
import { uploadReviewImages } from "../controllers/upload.controller";
import { guestReviewUploadRateLimiter } from "../middleware/rateLimit.middleware";

const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_FILE_SIZE = 5 * 1024 * 1024;
const MAX_FILES = 5;

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_SIZE, files: MAX_FILES },
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      cb(null, true);
    } else {

      cb(null, false);
    }
  }
});

const router = Router();

router.use(guestReviewUploadRateLimiter);

router.post("/images", upload.array("images", MAX_FILES), uploadReviewImages);

export default router;
