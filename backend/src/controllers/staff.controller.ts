import type { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { sendCreated, sendSuccess } from "../utils/ApiResponse";
import { StaffService } from "../services/staff.service";
import { ApiError } from "../utils/ApiError";

export const listStaff = asyncHandler(async (_req: Request, res: Response) => {
  const staff = await StaffService.list();
  sendSuccess(res, staff);
});

export const createStaff = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw ApiError.unauthorized("Authentication required");
  const staff = await StaffService.create(req.body, req.user.adminRole);
  sendCreated(res, staff, "Staff account created");
});

export const updateStaffRole = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw ApiError.unauthorized("Authentication required");
  const staff = await StaffService.updateRole(req.params.id, req.body, req.user.adminRole, req.user.sub);
  sendSuccess(res, staff, 200, undefined, "Role updated");
});

export const updateStaffStatus = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw ApiError.unauthorized("Authentication required");
  const staff = await StaffService.setActive(req.params.id, req.body.isActive, req.user.sub);
  sendSuccess(res, staff, 200, undefined, staff.isActive ? "Staff account enabled" : "Staff account disabled");
});

export const deleteStaff = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw ApiError.unauthorized("Authentication required");
  const staff = await StaffService.delete(req.params.id, req.user.adminRole, req.user.sub);
  sendSuccess(res, staff, 200, undefined, "Staff account deleted");
});

