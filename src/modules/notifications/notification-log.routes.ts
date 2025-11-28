import { Router } from "express";
import { requireAuth } from "../../middlewares/auth.middleware";
import { checkPermission } from "../../middlewares/permission.middleware";
import * as controller from "./notification-log.controller";

const router = Router();

// All routes require authentication
router.use(requireAuth());

// Read-only logs
router.get(
  "/",
  checkPermission("notification_logs", "read"),
  controller.getNotificationLogs
);

router.get(
  "/:id",
  checkPermission("notification_logs", "read"),
  controller.getNotificationLog
);

export default router;
