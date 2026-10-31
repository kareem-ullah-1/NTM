import type { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { sendSuccess } from "../utils/ApiResponse";
import { ProductService } from "../services/product.service";

export const listProducts = asyncHandler(async (req: Request, res: Response) => {
  const { data, meta } = await ProductService.list(req.query as Record<string, unknown>);
  sendSuccess(res, data, 200, meta);
});

export const getProductBySlug = asyncHandler(async (req: Request, res: Response) => {
  const product = await ProductService.getBySlug(req.params.slug);
  sendSuccess(res, product);
});

export const getRelatedProducts = asyncHandler(async (req: Request, res: Response) => {
  const limit = req.query.limit ? parseInt(String(req.query.limit), 10) : 4;
  const related = await ProductService.getRelated(req.params.slug, limit);
  sendSuccess(res, related);
});

export const getAlsoBoughtProducts = asyncHandler(async (req: Request, res: Response) => {
  const limit = req.query.limit ? parseInt(String(req.query.limit), 10) : 4;
  const alsoBought = await ProductService.getAlsoBought(req.params.slug, limit);
  sendSuccess(res, alsoBought);
});

export const getFeaturedProducts = asyncHandler(async (req: Request, res: Response) => {
  const limit = req.query.limit ? parseInt(String(req.query.limit), 10) : 8;
  const products = await ProductService.featured(limit);
  sendSuccess(res, products);
});

export const getFilterOptions = asyncHandler(async (req: Request, res: Response) => {
  const options = await ProductService.filterOptions(req.query as Record<string, unknown>);
  sendSuccess(res, options);
});

export const getSearchSuggestions = asyncHandler(async (req: Request, res: Response) => {
  const term = (req.query.q as string | undefined) ?? "";
  const limit = req.query.limit ? Math.min(parseInt(String(req.query.limit), 10), 10) : 6;
  const suggestions = await ProductService.suggestions(term, limit);
  sendSuccess(res, suggestions);
});
