import { Router } from "express";
import { validateBody } from "../../middlewares/validate.middleware";
import {
  createSalaryRequest,
  deleteSalaryRequest,
  getSalaryRequest,
  listSalaryRequests,
  updateSalaryRequest,
  approveSalaryRequest,
  rejectSalaryRequest,
} from "./salary-request.controller";
import {
  createSalaryRequestSchema,
  updateSalaryRequestSchema,
} from "./salary-request.dto";

const router = Router();

router.get("/", listSalaryRequests);
router.get("/:id", getSalaryRequest);
router.post("/", validateBody(createSalaryRequestSchema), createSalaryRequest);
router.patch(
  "/:id",
  validateBody(updateSalaryRequestSchema),
  updateSalaryRequest
);
router.delete("/:id", deleteSalaryRequest);
router.post("/:id/approve", approveSalaryRequest);
router.post("/:id/reject", rejectSalaryRequest);

export default router;
