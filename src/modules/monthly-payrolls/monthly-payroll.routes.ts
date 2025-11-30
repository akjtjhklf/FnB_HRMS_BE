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
  generateMonthlyPayroll,
  lockMonthlyPayroll,
  unlockMonthlyPayroll,
} from "./monthly-payroll.controller";
import {
  createMonthlyPayrollSchema,
  updateMonthlyPayrollSchema,
} from "./monthly-payroll.dto";

import { requireAuth } from "../../middlewares/auth.middleware";

const router = Router();

router.use(requireAuth());

router.post("/generate", generateMonthlyPayroll); // Generate first

router.get("/", listMonthlyPayrolls);
router.get("/:id", getMonthlyPayroll);
router.post("/", validateBody(createMonthlyPayrollSchema), createMonthlyPayroll);
router.patch("/:id", validateBody(updateMonthlyPayrollSchema), updateMonthlyPayroll);
router.delete("/:id", deleteMonthlyPayroll);
router.post("/:id/approve", approveMonthlyPayroll);
router.post("/:id/mark-paid", markMonthlyPayrollAsPaid);
router.put("/:id/lock", lockMonthlyPayroll);
router.put("/:id/unlock", unlockMonthlyPayroll);

export default router;
