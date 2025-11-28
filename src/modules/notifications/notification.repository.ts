import { DirectusRepository } from "../../core/directus.repository";
import { Notification, NOTIFICATIONS_COLLECTION } from "./notification.model";

export class NotificationRepository extends DirectusRepository<Notification> {
  constructor() {
    super(NOTIFICATIONS_COLLECTION);
  }
}

export default NotificationRepository;
