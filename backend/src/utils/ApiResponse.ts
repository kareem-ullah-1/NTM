import type { Response } from "express";

export interface Meta {
  page?: number;
  limit?: number;
  total?: number;
  totalPages?: number;
  [key: string]: unknown;
}

export function sendSuccess<T>(
  res: Response,
  data: T,
  statusCode = 200,
  meta?: Meta,
  message?: string
): Response {
  return res.status(statusCode).json({
    success: true,
    message: message ?? null,
    data,
    meta: meta ?? null
  });
}

export function sendCreated<T>(res: Response, data: T, message = "Created successfully"): Response {
  return sendSuccess(res, data, 201, undefined, message);
}
