import { Router } from "express";
import { validateBody } from "../../middlewares/validate.middleware";
import {
  listEmployees,
  getEmployee,
  createEmployee,
  updateEmployee,
  deleteEmployee,
} from "./employee.controller";
import { createEmployeeSchema, updateEmployeeSchema } from "./employee.dto";

const router = Router();

router.get("/", listEmployees);
router.get("/:id", getEmployee);
router.post("/", validateBody(createEmployeeSchema), createEmployee);
router.put("/:id", validateBody(updateEmployeeSchema), updateEmployee);
router.delete("/:id", deleteEmployee);

export default router;
