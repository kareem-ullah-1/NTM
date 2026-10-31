import type { NextFunction, Request, Response } from "express";
import { ApiError } from "../utils/ApiError";
import { verifyAccessToken, type JwtPayload } from "../utils/jwt";
import { hasPermission, type Permission } from "../config/permissions";

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

export function requireAuth(req: Request, _res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    next(ApiError.unauthorized("Authentication token missing"));
    return;
  }

  const token = header.slice("Bearer ".length);
  try {
    const payload = verifyAccessToken(token);
    req.user = payload;
    next();
  } catch {
    next(ApiError.unauthorized("Invalid or expired token"));
  }
}

export function optionalAuth(req: Request, _res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    next();
    return;
  }

  const token = header.slice("Bearer ".length);
  try {
    req.user = verifyAccessToken(token);
  } catch {

  }
  next();
}

export function requireRole(...roles: string[]) {
  return function (req: Request, _res: Response, next: NextFunction): void {
    if (!req.user) {
      next(ApiError.unauthorized("Authentication required"));
      return;
    }
    if (!roles.includes(req.user.role)) {
      next(ApiError.forbidden("Insufficient role"));
      return;
    }
    next();
  };
}

export function requirePermission(permission: Permission) {
  return function (req: Request, _res: Response, next: NextFunction): void {
    if (!req.user) {
      next(ApiError.unauthorized("Authentication required"));
      return;
    }
    if (!hasPermission(req.user.adminRole, permission)) {
      next(ApiError.forbidden("Insufficient permissions"));
      return;
    }
    next();
  };
}

