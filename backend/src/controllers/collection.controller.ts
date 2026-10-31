import type { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { sendSuccess, sendCreated } from "../utils/ApiResponse";
import { CollectionService, CollectionOptionService } from "../services/collection.service";

export const listCollections = asyncHandler(async (_req: Request, res: Response) => {
  const collections = await CollectionService.list();
  sendSuccess(res, collections);
});

export const getCollection = asyncHandler(async (req: Request, res: Response) => {
  const collection = await CollectionService.getById(req.params.id);
  sendSuccess(res, collection);
});

export const createCollection = asyncHandler(async (req: Request, res: Response) => {
  const collection = await CollectionService.create(req.body);
  sendCreated(res, collection, "Collection created");
});

export const updateCollection = asyncHandler(async (req: Request, res: Response) => {
  const collection = await CollectionService.update(req.params.id, req.body);
  sendSuccess(res, collection, 200, undefined, "Collection updated");
});

export const deleteCollection = asyncHandler(async (req: Request, res: Response) => {
  await CollectionService.remove(req.params.id);
  sendSuccess(res, null, 200, undefined, "Collection deleted");
});

export const listEnabledCollections = asyncHandler(async (_req: Request, res: Response) => {
  const collections = await CollectionService.listEnabled();
  sendSuccess(res, collections);
});

export const createCollectionOption = asyncHandler(async (req: Request, res: Response) => {
  const option = await CollectionOptionService.create(req.body);
  sendCreated(res, option, "Collection option created");
});

export const updateCollectionOption = asyncHandler(async (req: Request, res: Response) => {
  const option = await CollectionOptionService.update(req.params.optionId, req.body);
  sendSuccess(res, option, 200, undefined, "Collection option updated");
});

export const deleteCollectionOption = asyncHandler(async (req: Request, res: Response) => {
  await CollectionOptionService.remove(req.params.optionId);
  sendSuccess(res, null, 200, undefined, "Collection option deleted");
});
