import { Router } from "express";
import { validateBody } from "../../middlewares/validate.middleware";
import {
  listEmployeeAvailabilities,
  getEmployeeAvailability,
  createEmployeeAvailability,
  updateEmployeeAvailability,
  deleteEmployeeAvailability,
} from "./employee-availability.controller";
import {
  createEmployeeAvailabilitySchema,
  updateEmployeeAvailabilitySchema,
} from "./employee-availability.dto";

const router = Router();

router.get("/", listEmployeeAvailabilities);
router.get("/:id", getEmployeeAvailability);
router.post(
  "/",
  validateBody(createEmployeeAvailabilitySchema),
  createEmployeeAvailability
);
router.put(
  "/:id",
  validateBody(updateEmployeeAvailabilitySchema),
  updateEmployeeAvailability
);
router.delete("/:id", deleteEmployeeAvailability);

export default router;
