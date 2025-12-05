import { Router } from "express";
import { requireAuth } from "../../middlewares/auth.middleware";
import { checkPermission } from "../../middlewares/permission.middleware";
import * as controller from "./notification.controller";

const router = Router();

// All routes require authentication
router.use(requireAuth());

// Mark all notifications as read - must be before /:id routes
router.post(
  "/mark-all-read",
  controller.markAllAsRead
);

// CRUD operations - only admins/managers
router.post(
  "/",
  checkPermission("notifications", "create"),
  controller.createNotification
);

router.get(
  "/",
  checkPermission("notifications", "read"),
  controller.getNotifications
);

router.get(
  "/:id",
  checkPermission("notifications", "read"),
  controller.getNotification
);

router.patch(
  "/:id",
  checkPermission("notifications", "update"),
  controller.updateNotification
);

router.delete(
  "/:id",
  checkPermission("notifications", "delete"),
  controller.deleteNotification
);

// Actions
router.post(
  "/:id/send",
  checkPermission("notifications", "update"),
  controller.sendNotificationNow
);

router.post(
  "/:id/schedule",
  checkPermission("notifications", "update"),
  controller.scheduleNotification
);

// Mark as read - any authenticated user
router.post(
  "/:id/read",
  controller.markAsRead
);

// Sync subscribers to Novu - admin only
router.post(
  "/sync-subscribers",
  checkPermission("notifications", "create"),
  controller.syncSubscribers
);

export default router;
