import { Router } from "express";
import { validateBody } from "../../middlewares/validate.middleware";
import {
  createAttendanceLog,
  deleteAttendanceLog,
  getAttendanceLog,
  listAttendanceLogs,
  updateAttendanceLog,
} from "./attendance-log.controller";
import {
  createAttendanceLogSchema,
  updateAttendanceLogSchema,
} from "./attendance-log.dto";

const router = Router();

router.get("/", listAttendanceLogs);
router.get("/:id", getAttendanceLog);
router.post("/", validateBody(createAttendanceLogSchema), createAttendanceLog);
router.put(
  "/:id",
  validateBody(updateAttendanceLogSchema),
  updateAttendanceLog
);
router.delete("/:id", deleteAttendanceLog);

export default router;
