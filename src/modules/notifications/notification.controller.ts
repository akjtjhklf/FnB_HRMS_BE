import { Request, Response, NextFunction } from "express";
import { ApiResponse, sendSuccess } from "../../core/response";
import { HttpError } from "../../core/base";
import NotificationService from "./notification.service";
import NotificationRepository from "./notification.repository";
import NovuService from "./novu.service";
import NotificationLogRepository from "./notification-log.repository";

const service = new NotificationService(
  new NotificationRepository(),
  new NovuService(
    {
      apiKey: process.env.NOVU_API_KEY || "",
      apiUrl: process.env.NOVU_API_URL,
    },
    new NotificationLogRepository()
  )
);

/**
 * POST /notifications
 */
export const createNotification = async (
  req: Request,
  res: Response<ApiResponse<unknown>>,
  next: NextFunction
) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      throw new HttpError(401, "Unauthorized");
    }

    const notification = await service.createNotification({
      ...req.body,
      created_by: userId,
    });

    return sendSuccess(res, notification, 201, "Notification created");
  } catch (err) {
    next(err);
  }
};

/**
 * GET /notifications
 */
export const getNotifications = async (
  req: Request,
  res: Response<ApiResponse<unknown>>,
  next: NextFunction
) => {
  try {
    const { page = "1", limit = "10", status } = req.query;

    const filter: any = {};
    if (status) filter.status = { _eq: status };

    const notifications = await service["repo"].findAll({
      filter,
      limit: parseInt(limit as string),
      page: parseInt(page as string),
      sort: ["-created_at"],
    });

    return sendSuccess(res, notifications);
  } catch (err) {
    next(err);
  }
};

/**
 * GET /notifications/:id
 */
export const getNotification = async (
  req: Request,
  res: Response<ApiResponse<unknown>>,
  next: NextFunction
) => {
  try {
    const notification = await service["repo"].findById(req.params.id);
    if (!notification) {
      throw new HttpError(404, "Notification not found");
    }
    return sendSuccess(res, notification);
  } catch (err) {
    next(err);
  }
};

/**
 * PATCH /notifications/:id
 */
export const updateNotification = async (
  req: Request,
  res: Response<ApiResponse<unknown>>,
  next: NextFunction
) => {
  try {
    const updated = await service["repo"].update(req.params.id, req.body);
    return sendSuccess(res, updated, 200, "Notification updated");
  } catch (err) {
    next(err);
  }
};

/**
 * DELETE /notifications/:id
 */
export const deleteNotification = async (
  req: Request,
  res: Response<ApiResponse<unknown>>,
  next: NextFunction
) => {
  try {
    await service["repo"].delete(req.params.id);
    return sendSuccess(res, null, 200, "Notification deleted");
  } catch (err) {
    next(err);
  }
};

/**
 * POST /notifications/:id/send
 */
export const sendNotificationNow = async (
  req: Request,
  res: Response<ApiResponse<unknown>>,
  next: NextFunction
) => {
  try {
    const { workflow_id } = req.body;
    if (!workflow_id) {
      throw new HttpError(400, "workflow_id is required");
    }

    const notification = await service.sendNotification(req.params.id, workflow_id);
    return sendSuccess(res, notification, 200, "Notification sent");
  } catch (err) {
    next(err);
  }
};

/**
 * POST /notifications/:id/schedule
 */
export const scheduleNotification = async (
  req: Request,
  res: Response<ApiResponse<unknown>>,
  next: NextFunction
) => {
  try {
    const { scheduled_at } = req.body;
    if (!scheduled_at) {
      throw new HttpError(400, "scheduled_at is required");
    }

    const notification = await service.scheduleNotification(req.params.id, scheduled_at);
    return sendSuccess(res, notification, 200, "Notification scheduled");
  } catch (err) {
    next(err);
  }
};
