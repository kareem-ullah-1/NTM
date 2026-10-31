import type { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { sendCreated, sendSuccess } from "../utils/ApiResponse";
import { CouponService } from "../services/coupon.service";

export const listCoupons = asyncHandler(async (_req: Request, res: Response) => {
  const coupons = await CouponService.list();
  sendSuccess(res, coupons);
});

export const createCoupon = asyncHandler(async (req: Request, res: Response) => {
  const coupon = await CouponService.create(req.body);
  sendCreated(res, coupon, "Coupon created");
});

export const updateCoupon = asyncHandler(async (req: Request, res: Response) => {
  const coupon = await CouponService.update(req.params.id, req.body);
  sendSuccess(res, coupon, 200, undefined, "Coupon updated");
});

export const setCouponStatus = asyncHandler(async (req: Request, res: Response) => {
  const coupon = await CouponService.setActive(req.params.id, req.body.isActive);
  sendSuccess(res, coupon, 200, undefined, coupon.isActive ? "Coupon enabled" : "Coupon disabled");
});

export const deleteCoupon = asyncHandler(async (req: Request, res: Response) => {
  await CouponService.remove(req.params.id);
  sendSuccess(res, null, 200, undefined, "Coupon deleted");
});

export const validateCoupon = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.sub ?? null;

  const result = await CouponService.preview(req.body.code, req.body.subtotal, userId);
  sendSuccess(res, result, 200, undefined, "Coupon applied");
});
