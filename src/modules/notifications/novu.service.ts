import { Novu } from "@novu/node";
import { HttpError } from "../../core/base";
import { NotificationLogRepository } from "./notification-log.repository";
import { NOTIFICATION_CHANNEL } from "./notification-log.model";

export interface NovuConfig {
  apiKey: string;
  apiUrl?: string;
}

export interface SendToUserOptions {
  subscriberId: string;
  workflowId: string;
  payload: Record<string, any>;
  triggeredBy?: string;
}

export interface SendToMultipleUsersOptions {
  subscriberIds: string[];
  workflowId: string;
  payload: Record<string, any>;
  triggeredBy?: string;
}

export interface SendToTopicOptions {
  topicKey: string;
  workflowId: string;
  payload: Record<string, any>;
  triggeredBy?: string;
}

export interface CreateSubscriberOptions {
  subscriberId: string;
  email: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  avatar?: string;
  data?: Record<string, any>;
}

/**
 * Novu Service - Wrapper around @novu/node SDK
 * Handles all Novu API interactions and auto-logging to database
 */
export class NovuService {
  private client: Novu;
  private apiKey: string;
  private notificationLogRepo: NotificationLogRepository;

  constructor(config: NovuConfig, notificationLogRepo: NotificationLogRepository) {
    this.apiKey = config.apiKey;
    this.client = new Novu(config.apiKey);
    this.notificationLogRepo = notificationLogRepo;
  }

  /**
   * Send notification to a single user
   */
  async sendToUser(options: SendToUserOptions): Promise<void> {
    try {
      const response = await this.client.trigger(options.workflowId, {
        to: {
          subscriberId: options.subscriberId,
        },
        payload: options.payload,
      });

      console.log("✅ Notification sent to user:", options.subscriberId);

      // Auto-log to database
      await this.createNotificationLog({
        triggerData: response.data,
        workflowId: options.workflowId,
        payload: options.payload,
        recipients: [options.subscriberId],
        triggeredBy: options.triggeredBy,
      });
    } catch (error: any) {
      console.error("❌ Failed to send notification:", error?.message);
      throw new HttpError(500, `Failed to send notification: ${error?.message}`);
    }
  }

  /**
   * Send notification to multiple users
   */
  async sendToMultipleUsers(options: SendToMultipleUsersOptions): Promise<void> {
    const errors: string[] = [];
    const successfulIds: string[] = [];

    for (const subscriberId of options.subscriberIds) {
      try {
        await this.client.trigger(options.workflowId, {
          to: {
            subscriberId,
          },
          payload: options.payload,
        });
        successfulIds.push(subscriberId);
      } catch (error: any) {
        errors.push(`${subscriberId}: ${error?.message}`);
      }
    }

    console.log(`✅ Sent to ${successfulIds.length}/${options.subscriberIds.length} users`);

    // Create one log for all successful sends
    if (successfulIds.length > 0) {
      await this.createNotificationLog({
        triggerData: null,
        workflowId: options.workflowId,
        payload: options.payload,
        recipients: successfulIds,
        triggeredBy: options.triggeredBy,
      });
    }

    if (errors.length > 0) {
      throw new HttpError(
        500,
        `Failed to send ${errors.length} notifications: ${errors.join("; ")}`
      );
    }
  }

  /**
   * Send notification to a topic (broadcast to all subscribers in topic)
   */
  async sendToTopic(options: SendToTopicOptions): Promise<void> {
    try {
      const response = await this.client.trigger(options.workflowId, {
        to: [
          {
            type: "Topic" as any, // Novu SDK type compatibility
            topicKey: options.topicKey,
          },
        ],
        payload: options.payload,
      });

      console.log("✅ Notification sent to topic:", options.topicKey);

      // Auto-log
      await this.createNotificationLog({
        triggerData: response.data,
        workflowId: options.workflowId,
        payload: options.payload,
        recipients: [`topic:${options.topicKey}`],
        triggeredBy: options.triggeredBy,
      });
    } catch (error: any) {
      console.error("❌ Failed to send to topic:", error?.message);
      throw new HttpError(500, `Failed to send to topic: ${error?.message}`);
    }
  }

  /**
   * Create a subscriber in Novu
   */
  async createSubscriber(options: CreateSubscriberOptions): Promise<void> {
    try {
      await this.client.subscribers.identify(options.subscriberId, {
        email: options.email,
        firstName: options.firstName,
        lastName: options.lastName,
        phone: options.phone,
        avatar: options.avatar,
        data: options.data,
      });

      console.log("✅ Subscriber created:", options.subscriberId);
    } catch (error: any) {
      console.error("❌ Failed to create subscriber:", error?.message);
      throw new HttpError(500, `Failed to create subscriber: ${error?.message}`);
    }
  }

  /**
   * Create a topic in Novu
   */
  async createTopic(topicKey: string, topicName: string): Promise<void> {
    try {
      await this.client.topics.create({
        key: topicKey,
        name: topicName,
      });

      console.log("✅ Topic created:", topicKey);
    } catch (error: any) {
      // Topic might already exist - that's OK
      if (error?.message?.includes("already exists")) {
        console.log("ℹ️ Topic already exists:", topicKey);
        return;
      }
      console.error("❌ Failed to create topic:", error?.message);
      throw new HttpError(500, `Failed to create topic: ${error?.message}`);
    }
  }

  /**
   * Ensure a topic exists (create if not exists)
   */
  async ensureTopicExists(topicKey: string, topicName: string): Promise<void> {
    try {
      await this.createTopic(topicKey, topicName);
    } catch (error: any) {
      // If topic already exists, that's fine
      if (!error?.message?.includes("already exists")) {
        console.error("⚠️ Failed to ensure topic exists:", error?.message);
      }
    }
  }

  /**
   * Add subscribers to a topic
   */
  async addSubscriberToTopic(topicKey: string, subscriberIds: string[]): Promise<void> {
    try {
      await this.client.topics.addSubscribers(topicKey, {
        subscribers: subscriberIds,
      });

      console.log(`✅ Added ${subscriberIds.length} subscribers to topic:`, topicKey);
    } catch (error: any) {
      console.error("❌ Failed to add subscribers to topic:", error?.message);
      throw new HttpError(500, `Failed to add subscribers to topic: ${error?.message}`);
    }
  }

  /**
   * Internal: Create notification log entry
   */
  private async createNotificationLog(data: {
    triggerData: any;
    workflowId: string;
    payload: Record<string, any>;
    recipients: string[];
    notificationId?: string;
    triggeredBy?: string;
  }): Promise<void> {
    try {
      // Extract trigger ID from response
      const triggerId =
        data.triggerData?.transactionId || `${data.workflowId}_${Date.now()}`;

      // Extract title and content from payload
      const title =
        data.payload.title ||
        data.payload.subject ||
        data.payload.heading ||
        "Notification";
      const content =
        data.payload.message ||
        data.payload.body ||
        data.payload.content ||
        data.payload.text ||
        "";

      // Create log entry
      await this.notificationLogRepo.create({
        trigger_id: triggerId,
        notification_id: data.notificationId || null,
       title,
        content,
        channel: NOTIFICATION_CHANNEL.IN_APP,
        recipients: JSON.stringify(data.recipients),
        workflow_id: data.workflowId,
        payload: JSON.stringify(data.payload),
        triggered_by: data.triggeredBy || null,
      });

      console.log("📝 Notification log created:", triggerId);
    } catch (error: any) {
      console.error("⚠️ Failed to create notification log:", error?.message);
      // Don't throw - logging failure shouldn't break notification send
    }
  }
}

export default NovuService;
