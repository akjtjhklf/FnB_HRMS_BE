import { Router } from "express";
import { validateBody } from "../../middlewares/validate.middleware";
import {
  listAttendanceShifts,
  getAttendanceShift,
  createAttendanceShift,
  updateAttendanceShift,
  deleteAttendanceShift,
} from "./attendance-shift.controller";
import {
  createAttendanceShiftSchema,
  updateAttendanceShiftSchema,
} from "./attendance-shift.dto";

const router = Router();

router.get("/", listAttendanceShifts);
router.get("/:id", getAttendanceShift);
router.post(
  "/",
  validateBody(createAttendanceShiftSchema),
  createAttendanceShift
);
router.put(
  "/:id",
  validateBody(updateAttendanceShiftSchema),
  updateAttendanceShift
);
router.delete("/:id", deleteAttendanceShift);

export default router;
