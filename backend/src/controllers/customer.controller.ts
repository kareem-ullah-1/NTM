import type { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { sendSuccess } from "../utils/ApiResponse";
import { CustomerService } from "../services/customer.service";

export const listCustomers = asyncHandler(async (req: Request, res: Response) => {
  const { data, meta } = await CustomerService.list(req.query as { search?: string; page?: number; limit?: number });
  sendSuccess(res, data, 200, meta);
});

export const getCustomer = asyncHandler(async (req: Request, res: Response) => {
  const customer = await CustomerService.getById(req.params.id);
  sendSuccess(res, customer);
});
