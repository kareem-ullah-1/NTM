import type { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { sendSuccess } from "../utils/ApiResponse";
import { ApiError } from "../utils/ApiError";
import { DashboardService, DASHBOARD_PERIODS, type DashboardPeriod } from "../services/dashboard.service";

export const getDashboardStats = asyncHandler(async (_req: Request, res: Response) => {
  const stats = await DashboardService.stats();
  sendSuccess(res, stats);
});

export const getSalesSeries = asyncHandler(async (req: Request, res: Response) => {
  const periodParam = (req.query.period as string) ?? "30d";
  if (!DASHBOARD_PERIODS.includes(periodParam as DashboardPeriod)) {
    throw ApiError.badRequest(
      `Invalid period "${periodParam}". Expected one of: ${DASHBOARD_PERIODS.join(", ")}.`
    );
  }
  const series = await DashboardService.salesSeries(periodParam as DashboardPeriod);
  sendSuccess(res, series);
});

export const getBestSellingProducts = asyncHandler(async (req: Request, res: Response) => {
  const limit = parseInt((req.query.limit as string) ?? "10", 10);
  const sinceDays = req.query.sinceDays ? parseInt(req.query.sinceDays as string, 10) : undefined;
  const products = await DashboardService.bestSellingProducts(limit, sinceDays);
  sendSuccess(res, products);
});

export const getCouponPerformance = asyncHandler(async (req: Request, res: Response) => {
  const limit = parseInt((req.query.limit as string) ?? "20", 10);
  const performance = await DashboardService.couponPerformance(limit);
  sendSuccess(res, performance);
});
