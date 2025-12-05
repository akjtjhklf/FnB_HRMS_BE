import { Request, Response, NextFunction } from "express";
import { ApiResponse, sendSuccess } from "../../core/response";
import { HttpError } from "../../core/base";
import NotificationService from "./notification.service";
import NotificationRepository from "./notification.repository";
import NovuService from "./novu.service";
import NotificationLogRepository from "./notification-log.repository";
import { EmployeeRepository } from "../employees/employee.repository";

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

const TOPIC_ALL_EMPLOYEES = "all-employees";

/**
 * POST /notifications
 * If send_immediately=true in body, will also send via Novu after creating
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

    // Map body to message if provided (FE may send body instead of message)
    // Map recipient_ids to user_ids (FE uses recipient_ids, BE model uses user_ids)
    const { body, message, send_immediately, recipient_ids, ...rest } = req.body;
    const notificationData = {
      ...rest,
      message: message || body, // Accept both 'message' and 'body'
      user_ids: recipient_ids ? JSON.stringify(recipient_ids) : null, // Convert array to JSON string
      created_by: userId,
    };

    const notification = await service.createNotification(notificationData);

    // Auto-send if requested
    if (send_immediately !== false) {
      try {
        const workflowId = process.env.NOVU_DEFAULT_WORKFLOW || "in-app-notification";
        const sentNotification = await service.sendNotification(notification.id!, workflowId);
        return sendSuccess(res, sentNotification, 201, "Notification created and sent");
      } catch (sendError: any) {
        console.error("⚠️ Failed to send notification:", sendError?.message);
        // Return created notification even if send failed
        return sendSuccess(res, notification, 201, "Notification created but failed to send");
      }
    }

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
    const { page = "1", limit = "10", status, sort } = req.query;

    const filter: any = {};
    if (status) filter.status = { _eq: status };

    // Use findAllPaginated to match FE data provider format
    const repo = service["repo"] as NotificationRepository;
    const result = await repo.findAllPaginated({
      filter,
      limit: parseInt(limit as string),
      page: parseInt(page as string),
      sort: sort as string || "-created_at",
    });

    // Return in format expected by FE data provider:
    // { data: { items: [...], total: N, page, limit, total_pages } }
    return sendSuccess(res, {
      items: result.data,
      total: result.meta.total,
      page: result.meta.page,
      limit: result.meta.limit,
      total_pages: result.meta.totalPages,
    });
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
    // Use default workflow if not provided
    const workflow_id = req.body.workflow_id || process.env.NOVU_DEFAULT_WORKFLOW || "in-app-notification";

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

/**
 * POST /notifications/sync-subscribers
 * Sync all employees to Novu as subscribers and add to "all-employees" topic
 */
export const syncSubscribers = async (
  req: Request,
  res: Response<ApiResponse<unknown>>,
  next: NextFunction
) => {
  try {
    const employeeRepo = new EmployeeRepository();
    const novuService = service["novuService"] as NovuService;

    // Get all active employees
    const employees = await employeeRepo.findAll({
      filter: { status: { _eq: 'active' } },
      fields: ['id', 'full_name', 'first_name', 'last_name', 'email', 'phone', 'photo_url']
    });

    let successCount = 0;
    let errorCount = 0;
    const subscriberIds: string[] = [];

    // Create/update subscribers
    for (const emp of employees) {
      try {
        await novuService.createSubscriber({
          subscriberId: emp.id,
          email: emp.email || '',
          firstName: emp.first_name || emp.full_name?.split(' ')[0],
          lastName: emp.last_name || emp.full_name?.split(' ').slice(1).join(' '),
          phone: emp.phone || undefined,
          avatar: emp.photo_url || undefined,
          data: {
            employeeId: emp.id,
            fullName: emp.full_name,
          }
        });
        subscriberIds.push(emp.id);
        successCount++;
      } catch (error: any) {
        errorCount++;
        console.error(`Failed to sync subscriber ${emp.id}:`, error?.message);
      }
    }

    // Ensure topic exists
    await novuService.ensureTopicExists(TOPIC_ALL_EMPLOYEES, "All Employees");

    // Add subscribers to topic
    if (subscriberIds.length > 0) {
      try {
        await novuService.addSubscriberToTopic(TOPIC_ALL_EMPLOYEES, subscriberIds);
      } catch (error: any) {
        console.error("Failed to add subscribers to topic:", error?.message);
      }
    }

    return sendSuccess(res, {
      total: employees.length,
      synced: successCount,
      failed: errorCount,
      topic: TOPIC_ALL_EMPLOYEES,
    }, 200, `Synced ${successCount}/${employees.length} subscribers`);
  } catch (err) {
    next(err);
  }
};

/**
 * POST /notifications/:id/read
 * Mark a notification as read for current user
 */
export const markAsRead = async (
  req: Request,
  res: Response<ApiResponse<unknown>>,
  next: NextFunction
) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      throw new HttpError(401, "Unauthorized");
    }

    const notificationId = req.params.id;
    const repo = service["repo"] as NotificationRepository;
    
    // Update notification to mark as read
    // For simplicity, we'll update the notification itself
    // In production, you might have a separate read_status table
    const updated = await repo.update(notificationId, {
      is_read: true,
      read_at: new Date().toISOString(),
    });

    return sendSuccess(res, updated, 200, "Notification marked as read");
  } catch (err) {
    next(err);
  }
};

/**
 * POST /notifications/mark-all-read
 * Mark all notifications as read for current user
 */
export const markAllAsRead = async (
  req: Request,
  res: Response<ApiResponse<unknown>>,
  next: NextFunction
) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      throw new HttpError(401, "Unauthorized");
    }

    const repo = service["repo"] as NotificationRepository;
    
    // Get all unread notifications for this user
    // Note: This is a simplified implementation. In production, 
    // you might want to filter by recipient_type or user_ids
    const result = await repo.findAll({
      filter: {
        is_read: { _eq: false },
      },
    });

    let updatedCount = 0;
    for (const notification of result) {
      try {
        await repo.update(notification.id!, {
          is_read: true,
          read_at: new Date().toISOString(),
        });
        updatedCount++;
      } catch (error) {
        console.error(`Failed to mark notification ${notification.id} as read`);
      }
    }

    return sendSuccess(res, { 
      updated: updatedCount 
    }, 200, `Marked ${updatedCount} notifications as read`);
  } catch (err) {
    next(err);
  }
};
