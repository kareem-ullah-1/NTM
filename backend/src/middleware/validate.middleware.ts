import type { NextFunction, Request, Response } from "express";
import type { ZodTypeAny } from "zod";
import { ApiError } from "../utils/ApiError";

type Target = "body" | "query" | "params";

export function validate(schema: ZodTypeAny, target: Target = "body") {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req[target]);
    if (!result.success) {
      const details = result.error.flatten().fieldErrors;
      next(ApiError.badRequest("Validation failed", details));
      return;
    }
    (req as unknown as Record<Target, unknown>)[target] = result.data;
    next();
  };
}
