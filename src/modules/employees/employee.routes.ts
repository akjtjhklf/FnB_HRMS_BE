import { Router } from "express";
import { validateBody } from "../../middlewares/validate.middleware";
import {
  listEmployees,
  getEmployee,
  createEmployee,
  createFullEmployee,
  updateFullEmployee,
  updateEmployee,
  deleteEmployee,
} from "./employee.controller";
import { createEmployeeSchema, updateEmployeeSchema, createFullEmployeeSchema } from "./employee.dto";

const router = Router();

router.get("/", listEmployees);
router.get("/:id", getEmployee);
router.post("/", validateBody(createEmployeeSchema), createEmployee);
router.post("/full", validateBody(createFullEmployeeSchema), createFullEmployee);
router.patch("/:id/full", validateBody(createFullEmployeeSchema.partial()), updateFullEmployee);
router.patch("/:id", validateBody(updateEmployeeSchema), updateEmployee);
router.delete("/:id", deleteEmployee);

export default router;
