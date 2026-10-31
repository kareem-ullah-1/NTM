import type { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { sendSuccess } from "../utils/ApiResponse";
import { ApiError } from "../utils/ApiError";
import { deleteImageFromR2, uploadImageToR2, uploadMediaToR2 } from "../utils/r2Storage";

export const uploadProductImage = asyncHandler(async (req: Request, res: Response) => {
  const file = req.file;
  if (!file) {
    throw ApiError.badRequest("No image file was provided.");
  }

  const { url, key } = await uploadImageToR2({
    buffer: file.buffer,
    mimetype: file.mimetype,
    size: file.size
  });

  sendSuccess(res, { url, key }, 201);
});

export const uploadProductImages = asyncHandler(async (req: Request, res: Response) => {
  const files = (req.files as Express.Multer.File[] | undefined) ?? [];
  if (files.length === 0) {
    throw ApiError.badRequest("No image files were provided.");
  }

  const uploaded = await Promise.all(
    files.map((file) => uploadImageToR2({ buffer: file.buffer, mimetype: file.mimetype, size: file.size }))
  );

  sendSuccess(res, { images: uploaded }, 201);
});

export const uploadReviewImages = asyncHandler(async (req: Request, res: Response) => {
  const files = (req.files as Express.Multer.File[] | undefined) ?? [];
  if (files.length === 0) {
    throw ApiError.badRequest("No valid image files were provided. Only JPEG, PNG, or WEBP images under 5 MB are accepted.");
  }

  const uploaded = await Promise.all(
    files.map((file) => uploadImageToR2({ buffer: file.buffer, mimetype: file.mimetype, size: file.size }, "ntm-fabrics/reviews"))
  );

  sendSuccess(res, { images: uploaded }, 201);
});

export const uploadPromotionMedia = asyncHandler(async (req: Request, res: Response) => {
  const file = req.file;
  if (!file) {
    throw ApiError.badRequest("No media file was provided.");
  }

  const { url, key } = await uploadMediaToR2({
    buffer: file.buffer,
    mimetype: file.mimetype,
    size: file.size
  }, "ntm-fabrics/promotions");

  sendSuccess(res, { url, key }, 201);
});

export const deleteProductImage = asyncHandler(async (req: Request, res: Response) => {
  const { url } = req.body as { url?: string };
  if (!url || typeof url !== "string") {
    throw ApiError.badRequest("An image url is required.");
  }

  await deleteImageFromR2(url);
  sendSuccess(res, { deleted: true });
});
