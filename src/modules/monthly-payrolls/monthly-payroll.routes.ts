import { Router } from "express";
import { validateBody } from "../../middlewares/validate.middleware";
import {
  listMonthlyPayrolls,
  getMonthlyPayroll,
  createMonthlyPayroll,
  updateMonthlyPayroll,
  deleteMonthlyPayroll,
  approveMonthlyPayroll,
  markMonthlyPayrollAsPaid,
} from "./monthly-payroll.controller";
import {
  createMonthlyPayrollSchema,
  updateMonthlyPayrollSchema,
} from "./monthly-payroll.dto";

const router = Router();

router.get("/", listMonthlyPayrolls);
router.get("/:id", getMonthlyPayroll);
router.post("/", validateBody(createMonthlyPayrollSchema), createMonthlyPayroll);
router.patch("/:id", validateBody(updateMonthlyPayrollSchema), updateMonthlyPayroll);
router.delete("/:id", deleteMonthlyPayroll);
router.post("/:id/approve", approveMonthlyPayroll);
router.post("/:id/mark-paid", markMonthlyPayrollAsPaid);

export default router;
