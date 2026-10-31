import type { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { sendSuccess } from "../utils/ApiResponse";
import { StoreSettingsService } from "../services/store-settings.service";

export const getStoreSettings = asyncHandler(async (_req: Request, res: Response) => {
  const settings = await StoreSettingsService.get();
  sendSuccess(res, settings);
});

export const updateStoreSettings = asyncHandler(async (req: Request, res: Response) => {
  const settings = await StoreSettingsService.update(req.body);
  sendSuccess(res, settings, 200, undefined, "Settings updated");
});
