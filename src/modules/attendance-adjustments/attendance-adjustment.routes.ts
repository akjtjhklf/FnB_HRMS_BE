import { Router } from "express";
import { validateBody } from "../../middlewares/validate.middleware";
import {
  listAttendanceAdjustments,
  getAttendanceAdjustment,
  createAttendanceAdjustment,
  updateAttendanceAdjustment,
  deleteAttendanceAdjustment,
  approveAttendanceAdjustment,
  rejectAttendanceAdjustment,
} from "./attendance-adjustment.controller";
import {
  createAttendanceAdjustmentSchema,
  updateAttendanceAdjustmentSchema,
} from "./attendance-adjustment.dto";

const router = Router();

router.get("/", listAttendanceAdjustments);
router.get("/:id", getAttendanceAdjustment);
router.post(
  "/",
  validateBody(createAttendanceAdjustmentSchema),
  createAttendanceAdjustment
);
router.patch(
  "/:id",
  validateBody(updateAttendanceAdjustmentSchema),
  updateAttendanceAdjustment
);
router.delete("/:id", deleteAttendanceAdjustment);

router.patch("/:id/approve", approveAttendanceAdjustment);
router.patch("/:id/reject", rejectAttendanceAdjustment);

export default router;
