import type { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { sendSuccess } from "../utils/ApiResponse";
import { ColorModel } from "../models/catalog.model";
import { PRODUCT_COLORS } from "../config/colors";

export const listAvailableColors = asyncHandler(async (_req: Request, res: Response) => {
  let colors: { name: string; hex: string }[];
  try {
    const rows = await ColorModel.findAllAsLookup();
    colors = rows.length > 0 ? rows : PRODUCT_COLORS;
  } catch {
    colors = PRODUCT_COLORS;
  }
  sendSuccess(res, colors);
});
