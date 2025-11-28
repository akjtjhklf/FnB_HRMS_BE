import { Router } from "express";
import { requireAuth } from "../../middlewares/auth.middleware";
import { checkPermission } from "../../middlewares/permission.middleware";
import * as controller from "./notification.controller";

const router = Router();

// All routes require authentication
router.use(requireAuth());

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

export default router;
