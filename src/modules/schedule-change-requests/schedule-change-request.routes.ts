import { Router } from "express";
import { validateBody } from "../../middlewares/validate.middleware";
import {
  createScheduleChangeRequest,
  deleteScheduleChangeRequest,
  getScheduleChangeRequest,
  listScheduleChangeRequests,
  updateScheduleChangeRequest,
  approveChangeRequest,
  rejectChangeRequest,
} from "./schedule-change-request.controller";
import {
  createScheduleChangeRequestSchema,
  updateScheduleChangeRequestSchema,
} from "./schedule-change-request.dto";
import { requireAuth } from "../../middlewares/auth.middleware";

const router = Router();

router.get("/", listScheduleChangeRequests);
router.get("/:id", getScheduleChangeRequest);
router.post("/", validateBody(createScheduleChangeRequestSchema), createScheduleChangeRequest);
router.put("/:id", validateBody(updateScheduleChangeRequestSchema), updateScheduleChangeRequest);
router.delete("/:id", deleteScheduleChangeRequest);

// ✅ NEW: Approve/Reject endpoints
router.post("/:id/approve", requireAuth(), approveChangeRequest);
router.post("/:id/reject", requireAuth(), rejectChangeRequest);

export default router;
