import type { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { sendSuccess } from "../utils/ApiResponse";
import { WalletService } from "../services/wallet.service";

export const adminAdjustWallet = asyncHandler(async (req: Request, res: Response) => {
  const tx = await WalletService.adminAdjust(req.params.id, req.body.amount, req.body.reason);
  sendSuccess(res, tx, 200, undefined, "Wallet adjusted");
});

export const adminGetWalletHistory = asyncHandler(async (req: Request, res: Response) => {
  const page = parseInt((req.query.page as string) ?? "1", 10);
  const limit = parseInt((req.query.limit as string) ?? "20", 10);
  const { data, meta } = await WalletService.getHistory(req.params.id, page, limit);
  sendSuccess(res, data, 200, meta);
});
