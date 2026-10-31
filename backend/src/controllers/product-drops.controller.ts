import type { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { sendCreated, sendSuccess } from "../utils/ApiResponse";
import { ProductDropService } from "../services/product-drop.service";

export const listDrops = asyncHandler(async (req: Request, res: Response) => {
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 20;
  const search = (req.query.search as string) || undefined;
  const status = (req.query.status as string) || "all";

  const result = await ProductDropService.list({ page, limit, search, status });
  sendSuccess(res, result.data, 200, result.meta);
});

export const createDrop = asyncHandler(async (req: Request, res: Response) => {
  const drop = await ProductDropService.create(req.body);
  sendCreated(res, drop, "Product drop created");
});

export const updateDrop = asyncHandler(async (req: Request, res: Response) => {
  const drop = await ProductDropService.update(req.params.id, req.body);
  sendSuccess(res, drop, 200, undefined, "Product drop updated");
});

export const setDropStatus = asyncHandler(async (req: Request, res: Response) => {
  const drop = await ProductDropService.setActive(req.params.id, req.body.isActive);
  sendSuccess(res, drop, 200, undefined, drop.isActive ? "Drop enabled" : "Drop disabled");
});

export const deleteDrop = asyncHandler(async (req: Request, res: Response) => {
  await ProductDropService.remove(req.params.id);
  sendSuccess(res, null, 200, undefined, "Product drop deleted");
});

export const getDrop = asyncHandler(async (req: Request, res: Response) => {
  const drop = await ProductDropService.getById(req.params.id);
  sendSuccess(res, drop);
});

export const getPublicDrops = asyncHandler(async (_req: Request, res: Response) => {
  const drops = await ProductDropService.getPublicDrops();
  sendSuccess(res, drops);
});

export const getDropForProduct = asyncHandler(async (req: Request, res: Response) => {
  const drop = await ProductDropService.getForProduct(req.params.productId);
  sendSuccess(res, drop);
});

export const subscribeToDropNotification = asyncHandler(async (req: Request, res: Response) => {
  const { email } = req.body;
  const userId = (req as { user?: { id?: string } }).user?.id ?? null;
  const result = await ProductDropService.subscribeToNotification(
    req.params.id,
    email,
    userId
  );
  sendSuccess(res, result, 200, undefined, result.message);
});
