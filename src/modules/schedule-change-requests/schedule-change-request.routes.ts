import { Router } from "express";
import { validateBody } from "../../middlewares/validate.middleware";
import {
  createScheduleChangeRequest,
  deleteScheduleChangeRequest,
  getScheduleChangeRequest,
  listScheduleChangeRequests,
  updateScheduleChangeRequest,
} from "./schedule-change-request.controller";
import {
  createScheduleChangeRequestSchema,
  updateScheduleChangeRequestSchema,
} from "./schedule-change-request.dto";

const router = Router();

router.get("/", listScheduleChangeRequests);
router.get("/:id", getScheduleChangeRequest);
router.post("/", validateBody(createScheduleChangeRequestSchema), createScheduleChangeRequest);
router.put("/:id", validateBody(updateScheduleChangeRequestSchema), updateScheduleChangeRequest);
router.delete("/:id", deleteScheduleChangeRequest);

export default router;
