import type { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { sendCreated, sendSuccess } from "../utils/ApiResponse";
import { PromotionService } from "../services/promotion.service";

export const listPromotions = asyncHandler(async (_req: Request, res: Response) => {
  const promos = await PromotionService.list();
  sendSuccess(res, promos);
});

export const createPromotion = asyncHandler(async (req: Request, res: Response) => {
  const promo = await PromotionService.create(req.body);
  sendCreated(res, promo, "Promotion created");
});

export const updatePromotion = asyncHandler(async (req: Request, res: Response) => {
  const promo = await PromotionService.update(req.params.id, req.body);
  sendSuccess(res, promo, 200, undefined, "Promotion updated");
});

export const setPromotionStatus = asyncHandler(async (req: Request, res: Response) => {
  const promo = await PromotionService.setActive(req.params.id, req.body.isActive);
  sendSuccess(res, promo, 200, undefined, promo.isActive ? "Promotion enabled" : "Promotion disabled");
});

export const deletePromotion = asyncHandler(async (req: Request, res: Response) => {
  await PromotionService.remove(req.params.id);
  sendSuccess(res, null, 200, undefined, "Promotion deleted");
});

export const getPromotion = asyncHandler(async (req: Request, res: Response) => {
  const promo = await PromotionService.getById(req.params.id);
  sendSuccess(res, promo);
});

export const getActivePromotions = asyncHandler(async (_req: Request, res: Response) => {
  const promos = await PromotionService.getActivePromotions();
  sendSuccess(res, promos);
});

export const getPromotionForProduct = asyncHandler(async (req: Request, res: Response) => {
  const promo = await PromotionService.getForProduct(req.params.productId);
  sendSuccess(res, promo);
});

export const previewPromotion = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.sub ?? null;
  const result = await PromotionService.preview(
    req.body.productId,
    req.body.subtotal,
    userId
  );
  sendSuccess(res, result);
});
