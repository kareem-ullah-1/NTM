import { Router } from "express";
import { submitContactMessage } from "../controllers/contact.controller";
import { validate } from "../middleware/validate.middleware";
import { contactMessageSchema } from "../validators/contact.validator";

const router = Router();

router.post("/", validate(contactMessageSchema), submitContactMessage);

export default router;
