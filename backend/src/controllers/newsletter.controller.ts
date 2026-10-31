import type { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { sendSuccess } from "../utils/ApiResponse";
import { NewsletterService } from "../services/newsletter.service";

export const subscribeNewsletter = asyncHandler(async (req: Request, res: Response) => {
  const result = await NewsletterService.subscribe(req.body.email);
  const message = result.alreadySubscribed ? "You're already subscribed." : "Subscribed successfully.";
  sendSuccess(res, result, 200, undefined, message);
});
