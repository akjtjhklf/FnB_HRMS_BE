import { Request, Response, NextFunction } from "express";
import { ApiResponse, sendSuccess } from "../../core/response";
import NotificationLogRepository from "./notification-log.repository";

const repo = new NotificationLogRepository();

/**
 * GET /notification-logs
 */
export const getNotificationLogs = async (
  req: Request,
  res: Response<ApiResponse<unknown>>,
  next: NextFunction
) => {
  try {
    const { page = "1", limit = "20", workflow_id, channel } = req.query;

    const filter: any = {};
    if (workflow_id) filter.workflow_id = { _eq: workflow_id };
    if (channel) filter.channel = { _eq: channel };

    const logs = await repo.findAll({
      filter,
      limit: parseInt(limit as string),
      sort: ["-created_at"],
    });

    return sendSuccess(res, logs);
  } catch (err) {
    next(err);
  }
};

/**
 * GET /notification-logs/:id
 */
export const getNotificationLog = async (
  req: Request,
  res: Response<ApiResponse<unknown>>,
  next: NextFunction
) => {
  try {
    const log = await repo.findById(req.params.id);
    return sendSuccess(res, log);
  } catch (err) {
    next(err);
  }
};
