import { Router } from "express";
import { subscribeNewsletter } from "../controllers/newsletter.controller";
import { validate } from "../middleware/validate.middleware";
import { newsletterSchema } from "../validators/contact.validator";

const router = Router();

router.post("/", validate(newsletterSchema), subscribeNewsletter);

export default router;
