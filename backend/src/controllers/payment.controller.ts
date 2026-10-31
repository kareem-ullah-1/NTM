import type { Request, Response } from "express";

import { asyncHandler } from "../utils/asyncHandler";
import { sendSuccess } from "../utils/ApiResponse";
import { PaymentService } from "../services/payment.service";
import { ApiError } from "../utils/ApiError";
import { OrderModel } from "../models/order.model";

export const getOrderPayment = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw ApiError.unauthorized("Authentication required");

  const order = await OrderModel.findById(req.params.orderId);
  if (!order) throw ApiError.notFound(`Order ${req.params.orderId} not found`);

  if (req.user.role !== "admin" && order.user_id !== req.user.sub) {
    throw ApiError.forbidden("You do not have permission to view this order's payment");
  }

  const payment = await PaymentService.getForOrder(req.params.orderId);
  sendSuccess(res, payment);
});

export const updatePaymentStatus = asyncHandler(async (req: Request, res: Response) => {
  const payment = await PaymentService.updateStatus(req.params.paymentId, req.body);
  sendSuccess(res, payment, 200, undefined, `Payment marked as ${payment.status}`);
});

export const collectCodPayment = asyncHandler(async (req: Request, res: Response) => {
  const payment = await PaymentService.collectCodPayment(req.params.paymentId);
  sendSuccess(res, payment, 200, undefined, "Cash on Delivery payment marked as collected");
});
