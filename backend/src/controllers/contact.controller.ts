import type { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { sendCreated } from "../utils/ApiResponse";
import { ContactService } from "../services/contact.service";

export const submitContactMessage = asyncHandler(async (req: Request, res: Response) => {
  const message = await ContactService.submit(req.body);
  sendCreated(res, message, "Message sent — we'll reply soon.");
});
