import type { NextFunction, Request, Response } from "express";
import multer from "multer";
import { ApiError } from "../utils/ApiError";
import { isProduction } from "../config/env";

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction): void {
  if (err instanceof ApiError) {
    res.status(err.statusCode).json({
      success: false,
      message: err.message,
      errors: err.details ?? null
    });
    return;
  }

  if (err instanceof multer.MulterError) {
    let message = "File upload failed.";
    switch (err.code) {
      case "LIMIT_FILE_SIZE":
        message = "File is too large. Maximum size is 5MB.";
        break;
      case "LIMIT_FILE_COUNT":
        message = "Too many files. Maximum is 10 files per upload.";
        break;
      case "LIMIT_UNEXPECTED_FILE":
        message = "Unexpected field name in upload.";
        break;
      default:
        message = `Upload error: ${err.message}`;
    }
    res.status(400).json({
      success: false,
      message,
      errors: null
    });
    return;
  }

  const pgError = err as { code?: string; constraint?: string; message?: string };
  if (pgError?.code === "23505") {
    res.status(409).json({
      success: false,
      message: "A record with these details already exists",
      errors: pgError.constraint ? { constraint: pgError.constraint } : null
    });
    return;
  }

  console.error("Unhandled error:", err);
  res.status(500).json({
    success: false,
    message: "Something went wrong on the server",
    errors: isProduction ? null : (err as Error)?.message ?? null
  });
}
