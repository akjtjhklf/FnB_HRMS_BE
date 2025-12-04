import { BaseService, HttpError } from "../../core/base";
import { Notification, NOTIFICATION_STATUS, RECIPIENT_TYPE } from "./notification.model";
import NotificationRepository from "./notification.repository";
import NovuService from "./novu.service";
import { randomUUID } from "crypto";

/**
 * Notification Service - Business logic for notifications
 */
export class NotificationService extends BaseService<Notification> {
  private novuService: NovuService;

  constructor(notificationRepo: NotificationRepository, novuService: NovuService) {
    super(notificationRepo);
    this.novuService = novuService;
  }

  /**
   * Create a new notification (draft status)
   */
  async createNotification(
    data: Omit<Notification, "id" | "status" | "created_at" | "updated_at">
  ): Promise<Notification> {
    // Normalize recipient_type to uppercase
    const normalizedRecipientType = data.recipient_type?.toUpperCase() as Notification["recipient_type"];
    
    // Validate recipient type
    if (!Object.values(RECIPIENT_TYPE).includes(normalizedRecipientType)) {
      throw new HttpError(400, "Invalid recipient type. Must be 'ALL' or 'SPECIFIC'");
    }

    return await this.repo.create({
      id: randomUUID(),
      ...data,
      recipient_type: normalizedRecipientType,
      status: NOTIFICATION_STATUS.DRAFT,
    });
  }

  /**
   * Schedule notification for later
   */
  async scheduleNotification(id: string, scheduledAt: string): Promise<Notification> {
    const notification = await this.repo.findById(id);
    if (!notification) {
      throw new HttpError(404, "Notification not found");
    }

    return await this.repo.update(id, {
      status: NOTIFICATION_STATUS.SCHEDULED,
      scheduled_at: scheduledAt,
    });
  }

  /**
   * Send notification immediately via Novu
   */
  async sendNotification(id: string, workflowId: string): Promise<Notification> {
    const notification = await this.repo.findById(id);
    if (!notification) {
      throw new HttpError(404, "Notification not found");
    }

    try {
      // Determine recipients and send
      const payload = {
        title: notification.title,
        message: notification.message,
        actionUrl: notification.action_url,
      };

      if (notification.recipient_type === RECIPIENT_TYPE.ALL) {
        // Send to all-employees topic
        await this.novuService.sendToTopic({
          topicKey: "all-employees",
          workflowId,
          payload,
          triggeredBy: notification.created_by || undefined,
        });
      } else if (notification.recipient_type === RECIPIENT_TYPE.SPECIFIC) {
        // Send to specific users
        const userIds = notification.user_ids ? JSON.parse(notification.user_ids) : [];
        if (userIds.length === 0) {
          throw new HttpError(400, "No users specified for SPECIFIC recipient type");
        }
        await this.novuService.sendToMultipleUsers({
          subscriberIds: userIds,
          workflowId,
          payload,
          triggeredBy: notification.created_by || undefined,
        });
      } else {
        throw new HttpError(400, `Invalid recipient_type: ${notification.recipient_type}`);
      }

      // Update status
      return await this.repo.update(id, {
        status: NOTIFICATION_STATUS.SENT,
        sent_at: new Date().toISOString(),
      });
    } catch (error: any) {
      // Mark as failed
      await this.repo.update(id, {
        status: NOTIFICATION_STATUS.FAILED,
      });
      throw new HttpError(500, `Failed to send notification: ${error.message}`);
    }
  }
}

export default NotificationService;
