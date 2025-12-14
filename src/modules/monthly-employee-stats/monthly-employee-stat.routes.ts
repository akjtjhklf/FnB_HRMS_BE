import { Router } from "express";
import { validateBody } from "../../middlewares/validate.middleware";
import {
  listMonthlyEmployeeStats,
  getMonthlyEmployeeStat,
  createMonthlyEmployeeStat,
  updateMonthlyEmployeeStat,
  deleteMonthlyEmployeeStat,
} from "./monthly-employee-stat.controller";
import {
  createMonthlyEmployeeStatSchema,
  updateMonthlyEmployeeStatSchema,
} from "./monthly-employee-stat.dto";

import { requireAuth } from "../../middlewares/auth.middleware";

const router = Router();

router.use(requireAuth());

router.get("/", listMonthlyEmployeeStats);
router.get("/:id", getMonthlyEmployeeStat);
router.post("/", validateBody(createMonthlyEmployeeStatSchema), createMonthlyEmployeeStat);
router.patch("/:id", validateBody(updateMonthlyEmployeeStatSchema), updateMonthlyEmployeeStat);
router.delete("/:id", deleteMonthlyEmployeeStat);

export default router;
