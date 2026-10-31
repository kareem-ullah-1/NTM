import type { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { sendCreated, sendSuccess } from "../utils/ApiResponse";
import { OrderService } from "../services/order.service";
import { ApiError } from "../utils/ApiError";

export const createOrder = asyncHandler(async (req: Request, res: Response) => {
  const order = await OrderService.create(req.body, req.user?.sub ?? null);
  sendCreated(res, order, "Order placed successfully");
});

export const getMyOrders = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw ApiError.unauthorized("Authentication required");
  const orders = await OrderService.listMine(req.user.sub);
  sendSuccess(res, orders);
});

export const getMyOrder = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw ApiError.unauthorized("Authentication required");
  const isAdmin = req.user.role === "admin";
  const order = await OrderService.getByIdForUser(req.params.id, req.user.sub, isAdmin);
  sendSuccess(res, order);
});

export const listOrders = asyncHandler(async (req: Request, res: Response) => {
  const { data, meta } = await OrderService.list(req.query as Record<string, unknown>);
  sendSuccess(res, data, 200, meta);
});

export const getOrder = asyncHandler(async (req: Request, res: Response) => {
  const order = await OrderService.getById(req.params.id);
  sendSuccess(res, order);
});

export const updateOrderStatus = asyncHandler(async (req: Request, res: Response) => {
  const order = await OrderService.updateStatus(req.params.id, req.body.status, {
    reason: req.body.reason
  });
  sendSuccess(res, order, 200, undefined, `Order ${order.id} marked as ${order.status}`);
});

export const cancelOrder = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw ApiError.unauthorized("Authentication required");
  const order = await OrderService.cancelByCustomer(req.params.id, req.user.sub, req.body.reason);
  sendSuccess(res, order, 200, undefined, "Order cancelled");
});
