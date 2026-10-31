import type { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { sendSuccess } from "../utils/ApiResponse";
import { ApiError } from "../utils/ApiError";
import { ReviewService } from "../services/review.service";
import type { ReviewStatus } from "../models/review.model";

export const listProductReviews = asyncHandler(async (req: Request, res: Response) => {
  const page = (req.query.page as number | undefined) ?? 1;
  const limit = (req.query.limit as number | undefined) ?? 10;
  const { data, meta, summary } = await ReviewService.listForProduct(req.params.slug, page, limit);
  sendSuccess(res, data, 200, { ...meta, ...summary });
});

export const getMyReview = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw ApiError.unauthorized("Authentication required");
  const review = await ReviewService.getMyReviewForProduct(req.user.sub, req.params.slug);
  sendSuccess(res, review);
});

export const submitReview = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.sub ?? null;

  if (!userId) {
    const name = req.body.name?.trim();
    const email = req.body.email?.trim();

    if (!name || name.length < 2) {
      throw ApiError.badRequest("Name is required and must be at least 2 characters");
    }
    if (!email) {
      throw ApiError.badRequest("Email is required to submit a review");
    }

    const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
    if (!emailRegex.test(email)) {
      throw ApiError.badRequest("Please provide a valid email address");
    }
  }

  const review = await ReviewService.submitReview(userId, req.params.slug, req.body);
  sendSuccess(res, review, 201, undefined, "Review submitted");
});

export const deleteMyReview = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw ApiError.unauthorized("Authentication required");
  await ReviewService.deleteOwnReview(req.user.sub, req.params.reviewId);
  sendSuccess(res, { deleted: true }, 200, undefined, "Review deleted");
});

export const listReviewsForAdmin = asyncHandler(async (req: Request, res: Response) => {
  const page = (req.query.page as number | undefined) ?? 1;
  const limit = (req.query.limit as number | undefined) ?? 20;
  const status = req.query.status as ReviewStatus | undefined;
  const rating = req.query.rating ? parseInt(req.query.rating as string, 10) : undefined;
  const search = req.query.search as string | undefined;

  const { data, meta } = await ReviewService.listForAdmin(page, limit, { status, rating, search });
  sendSuccess(res, data, 200, meta);
});

export const deleteReviewAsAdmin = asyncHandler(async (req: Request, res: Response) => {
  await ReviewService.deleteAsAdmin(req.params.reviewId);
  sendSuccess(res, { deleted: true }, 200, undefined, "Review deleted");
});

export const updateReviewStatus = asyncHandler(async (req: Request, res: Response) => {
  const { status } = req.body;
  if (!status || !["pending", "approved", "rejected", "hidden"].includes(status)) {
    throw ApiError.badRequest("Invalid status. Must be: pending, approved, rejected, or hidden");
  }
  const review = await ReviewService.updateStatusAsAdmin(req.params.reviewId, status);
  sendSuccess(res, review, 200, undefined, `Review status updated to ${status}`);
});

export const getReviewStats = asyncHandler(async (_req: Request, res: Response) => {
  const stats = await ReviewService.getStats();
  sendSuccess(res, stats);
});
