import { DirectusRepository } from "../../core/directus.repository";
import { NotificationLog, NOTIFICATION_LOGS_COLLECTION } from "./notification-log.model";

export class NotificationLogRepository extends DirectusRepository<NotificationLog> {
  constructor() {
    super(NOTIFICATION_LOGS_COLLECTION);
  }
}

export default NotificationLogRepository;
