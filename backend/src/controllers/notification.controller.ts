import type { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { sendSuccess } from "../utils/ApiResponse";
import { NotificationLogModel } from "../models/notification-log.model";
import { buildMeta } from "../utils/pagination";

export const listNotificationLog = asyncHandler(async (req: Request, res: Response) => {
  const page = parseInt((req.query.page as string) ?? "1", 10);
  const limit = parseInt((req.query.limit as string) ?? "20", 10);
  const offset = (page - 1) * limit;

  const { rows, total } = await NotificationLogModel.findMany({
    orderId: req.query.orderId as string | undefined,
    limit,
    offset
  });

  const data = rows.map((row) => ({
    id: row.id,
    channel: row.channel,
    event: row.event,
    recipient: row.recipient,
    orderId: row.order_id,
    returnId: row.return_id,
    status: row.status,
    error: row.error,
    createdAt: row.created_at
  }));

  sendSuccess(res, data, 200, buildMeta(page, limit, total));
});
