import type { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { sendCreated, sendSuccess } from "../utils/ApiResponse";
import { InventoryService } from "../services/inventory.service";

export const listInventory = asyncHandler(async (_req: Request, res: Response) => {
  const items = await InventoryService.list();
  sendSuccess(res, items);
});

export const createInventoryItem = asyncHandler(async (req: Request, res: Response) => {
  const item = await InventoryService.create(req.body);
  sendCreated(res, item, "Inventory item created");
});

export const updateInventoryItem = asyncHandler(async (req: Request, res: Response) => {
  const item = await InventoryService.update(req.params.sku, req.body);
  sendSuccess(res, item, 200, undefined, "Inventory item updated");
});

export const deleteInventoryItem = asyncHandler(async (req: Request, res: Response) => {
  await InventoryService.remove(req.params.sku);
  sendSuccess(res, null, 200, undefined, "Inventory item deleted");
});

export const adjustInventoryStock = asyncHandler(async (req: Request, res: Response) => {
  const item = await InventoryService.adjustStock(req.params.sku, req.body, req.user!.sub);
  sendSuccess(res, item, 200, undefined, "Stock adjusted");
});

export const listInventoryMovements = asyncHandler(async (req: Request, res: Response) => {
  const result = await InventoryService.listMovements({
    productSku: req.query.sku as string | undefined,
    movementType: req.query.type as never,
    orderId: req.query.orderId as string | undefined,
    page: req.query.page ? Number(req.query.page) : undefined,
    limit: req.query.limit ? Number(req.query.limit) : undefined
  });
  sendSuccess(res, result.data, 200, result.meta);
});
