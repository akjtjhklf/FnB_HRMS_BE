import { Router } from "express";
import { validateBody } from "../../middlewares/validate.middleware";
import {
  listEmployeeAvailabilityPositions,
  getEmployeeAvailabilityPosition,
  createEmployeeAvailabilityPosition,
  updateEmployeeAvailabilityPosition,
  deleteEmployeeAvailabilityPosition,
} from "./employee-availability-position.controller";
import {
  createEmployeeAvailabilityPositionSchema,
  updateEmployeeAvailabilityPositionSchema,
} from "./employee-availability-position.dto";

const router = Router();

router.get("/", listEmployeeAvailabilityPositions);
router.get("/:id", getEmployeeAvailabilityPosition);
router.post(
  "/",
  validateBody(createEmployeeAvailabilityPositionSchema),
  createEmployeeAvailabilityPosition
);
router.patch(
  "/:id",
  validateBody(updateEmployeeAvailabilityPositionSchema),
  updateEmployeeAvailabilityPosition
);
router.delete("/:id", deleteEmployeeAvailabilityPosition);

export default router;
