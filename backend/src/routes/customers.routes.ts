import { Router } from "express";
import { getCustomer, listCustomers } from "../controllers/customer.controller";
import { adminAdjustWallet, adminGetWalletHistory } from "../controllers/wallet.controller";
import { requireAuth, requireRole, requirePermission } from "../middleware/auth.middleware";
import { validate } from "../middleware/validate.middleware";
import { customerListQuerySchema } from "../validators/customer.validator";
import { adminWalletAdjustSchema } from "../validators/wallet.validator";

const router = Router();

router.use(requireAuth, requireRole("admin"), requirePermission("customers.manage"));

router.get("/", validate(customerListQuerySchema, "query"), listCustomers);
router.get("/:id", getCustomer);
router.get("/:id/wallet", adminGetWalletHistory);
router.post("/:id/wallet/adjust", validate(adminWalletAdjustSchema), adminAdjustWallet);

export default router;
