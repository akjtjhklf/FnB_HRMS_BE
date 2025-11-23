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

const router = Router();

// ============================================
// 🤖 AUTO SCHEDULE - XẾP LỊCH TỰ ĐỘNG
// ============================================
router.post("/auto-schedule", validateBody(autoScheduleSchema), autoSchedule);
router.get("/schedule/:scheduleId/stats", getScheduleStats);

// ============================================
// CRUD ENDPOINTS
// ============================================
router.get("/", listScheduleAssignments);
router.get("/:id", getScheduleAssignment);
router.post("/", validateBody(createScheduleAssignmentSchema), createScheduleAssignment);
router.patch("/:id", validateBody(updateScheduleAssignmentSchema), updateScheduleAssignment);
router.delete("/:id", deleteScheduleAssignment);

export default router;
