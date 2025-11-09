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

const router = Router();

router.get("/", listMonthlyEmployeeStats);
router.get("/:id", getMonthlyEmployeeStat);
router.post("/", validateBody(createMonthlyEmployeeStatSchema), createMonthlyEmployeeStat);
router.put("/:id", validateBody(updateMonthlyEmployeeStatSchema), updateMonthlyEmployeeStat);
router.delete("/:id", deleteMonthlyEmployeeStat);

export default router;
