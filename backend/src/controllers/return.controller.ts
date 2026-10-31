import type { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { sendCreated, sendSuccess } from "../utils/ApiResponse";
import { ReturnService } from "../services/return.service";
import { ApiError } from "../utils/ApiError";

export const requestReturn = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw ApiError.unauthorized("Authentication required");
  const result = await ReturnService.requestReturn({ ...req.body, userId: req.user.sub });
  sendCreated(res, result, "Return request submitted");
});

export const listMyReturns = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw ApiError.unauthorized("Authentication required");
  const returns = await ReturnService.listMine(req.user.sub);
  sendSuccess(res, returns);
});

export const getReturn = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw ApiError.unauthorized("Authentication required");
  const isAdmin = req.user.role === "admin";
  const result = await ReturnService.getById(req.params.id, req.user.sub, isAdmin);
  sendSuccess(res, result);
});

export const cancelReturn = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw ApiError.unauthorized("Authentication required");
  const result = await ReturnService.cancel(req.params.id, req.user.sub);
  sendSuccess(res, result, 200, undefined, "Return request cancelled");
});

export const listReturns = asyncHandler(async (req: Request, res: Response) => {
  const { data, meta } = await ReturnService.list(req.query as never);
  sendSuccess(res, data, 200, meta);
});

export const updateReturnStatus = asyncHandler(async (req: Request, res: Response) => {
  const result = await ReturnService.updateStatus(req.params.id, req.body.status, req.body.adminNotes, req.body.refundMethod);
  sendSuccess(res, result, 200, undefined, `Return marked as ${result.status}`);
});
