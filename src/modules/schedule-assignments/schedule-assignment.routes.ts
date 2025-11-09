import { Router } from "express";
import { validateBody } from "../../middlewares/validate.middleware";
import {
  listScheduleAssignments,
  getScheduleAssignment,
  createScheduleAssignment,
  updateScheduleAssignment,
  deleteScheduleAssignment,
} from "./schedule-assignment.controller";
import {
  createScheduleAssignmentSchema,
  updateScheduleAssignmentSchema,
} from "./schedule-assignment.dto";

const router = Router();

router.get("/", listScheduleAssignments);
router.get("/:id", getScheduleAssignment);
router.post("/", validateBody(createScheduleAssignmentSchema), createScheduleAssignment);
router.put("/:id", validateBody(updateScheduleAssignmentSchema), updateScheduleAssignment);
router.delete("/:id", deleteScheduleAssignment);

export default router;
