import { Router } from "express";
import { validateBody } from "../../middlewares/validate.middleware";
import {
  listScheduleAssignments,
  getScheduleAssignment,
  createScheduleAssignment,
  updateScheduleAssignment,
  deleteScheduleAssignment,
  autoSchedule,
  getScheduleStats,
} from "./schedule-assignment.controller";
import {
  createScheduleAssignmentSchema,
  updateScheduleAssignmentSchema,
  autoScheduleSchema,
} from "./schedule-assignment.dto";
import { requireAuth } from "../../middlewares/auth.middleware";
import { checkPermission, loadIdentity } from "../../middlewares/permission.middleware";

const router = Router();

// ============================================
// 🤖 AUTO SCHEDULE - XẾP LỊCH TỰ ĐỘNG
// ============================================
// Only Manager/Admin can auto-schedule
router.post(
  "/auto-schedule",
  requireAuth(),
  checkPermission("create", "schedule_assignments"),
  validateBody(autoScheduleSchema),
  autoSchedule
);
router.get("/schedule/:scheduleId/stats", requireAuth(), getScheduleStats);

// ============================================
// CRUD ENDPOINTS
// ============================================
// GET /schedule-assignments - Everyone can read (filtered by identity in controller)
router.get("/", requireAuth(), loadIdentity(), listScheduleAssignments);

// GET /:id - Read single assignment
router.get("/:id", requireAuth(), checkPermission("read", "schedule_assignments"), getScheduleAssignment);

// POST / - Only Manager/Admin can create
router.post(
  "/",
  requireAuth(),
  checkPermission("create", "schedule_assignments"),
  validateBody(createScheduleAssignmentSchema),
  createScheduleAssignment
);

// PATCH /:id - Only Manager/Admin can update
router.patch(
  "/:id",
  requireAuth(),
  checkPermission("update", "schedule_assignments"),
  validateBody(updateScheduleAssignmentSchema),
  updateScheduleAssignment
);

// DELETE /:id - Only Manager/Admin can delete
router.delete(
  "/:id",
  requireAuth(),
  checkPermission("delete", "schedule_assignments"),
  deleteScheduleAssignment
);

export default router;
