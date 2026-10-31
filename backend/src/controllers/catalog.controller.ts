import type { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { sendSuccess, sendCreated } from "../utils/ApiResponse";
import { CategoryService, FabricTypeService, HomeFeaturedCategoryService } from "../services/catalog.service";

export const listCategories = asyncHandler(async (_req: Request, res: Response) => {
  const categories = await CategoryService.list();
  sendSuccess(res, categories);
});

export const listEnabledCategories = asyncHandler(async (_req: Request, res: Response) => {
  const categories = await CategoryService.listEnabled();
  sendSuccess(res, categories);
});

export const createCategory = asyncHandler(async (req: Request, res: Response) => {
  const category = await CategoryService.create(req.body);
  sendCreated(res, category, "Category created");
});

export const updateCategory = asyncHandler(async (req: Request, res: Response) => {
  const category = await CategoryService.update(req.params.id, req.body);
  sendSuccess(res, category, 200, undefined, "Category updated");
});

export const deleteCategory = asyncHandler(async (req: Request, res: Response) => {
  await CategoryService.remove(req.params.id);
  sendSuccess(res, null, 200, undefined, "Category deleted");
});

export const listFabricTypes = asyncHandler(async (_req: Request, res: Response) => {
  const fabricTypes = await FabricTypeService.list();
  sendSuccess(res, fabricTypes);
});

export const createFabricType = asyncHandler(async (req: Request, res: Response) => {
  const fabricType = await FabricTypeService.create(req.body);
  sendCreated(res, fabricType, "Fabric type created");
});

export const updateFabricType = asyncHandler(async (req: Request, res: Response) => {
  const fabricType = await FabricTypeService.update(req.params.id, req.body);
  sendSuccess(res, fabricType, 200, undefined, "Fabric type updated");
});

export const deleteFabricType = asyncHandler(async (req: Request, res: Response) => {
  await FabricTypeService.remove(req.params.id);
  sendSuccess(res, null, 200, undefined, "Fabric type deleted");
});

export const listColors = asyncHandler(async (_req: Request, res: Response) => {
  const { ColorService } = await import("../services/catalog.service");
  const colors = await ColorService.list();
  sendSuccess(res, colors);
});

export const createColor = asyncHandler(async (req: Request, res: Response) => {
  const { ColorService } = await import("../services/catalog.service");
  const color = await ColorService.create(req.body);
  sendCreated(res, color, "Color created");
});

export const updateColor = asyncHandler(async (req: Request, res: Response) => {
  const { ColorService } = await import("../services/catalog.service");
  const color = await ColorService.update(req.params.id, req.body);
  sendSuccess(res, color, 200, undefined, "Color updated");
});

export const deleteColor = asyncHandler(async (req: Request, res: Response) => {
  const { ColorService } = await import("../services/catalog.service");
  await ColorService.remove(req.params.id);
  sendSuccess(res, null, 200, undefined, "Color deleted");
});

export const listHomeFeaturedCategories = asyncHandler(async (_req: Request, res: Response) => {
  const categories = await HomeFeaturedCategoryService.list();
  sendSuccess(res, categories);
});

export const listActiveHomeFeaturedCategories = asyncHandler(async (_req: Request, res: Response) => {
  const categories = await HomeFeaturedCategoryService.listActive();
  sendSuccess(res, categories);
});

export const createHomeFeaturedCategory = asyncHandler(async (req: Request, res: Response) => {
  const category = await HomeFeaturedCategoryService.create(req.body);
  sendCreated(res, category, "Home Featured Category created");
});

export const updateHomeFeaturedCategory = asyncHandler(async (req: Request, res: Response) => {
  const category = await HomeFeaturedCategoryService.update(req.params.id, req.body);
  sendSuccess(res, category, 200, undefined, "Home Featured Category updated");
});

export const deleteHomeFeaturedCategory = asyncHandler(async (req: Request, res: Response) => {
  await HomeFeaturedCategoryService.remove(req.params.id);
  sendSuccess(res, null, 200, undefined, "Home Featured Category removed");
});
