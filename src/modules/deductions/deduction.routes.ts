import { Router } from "express";
import { validateBody } from "../../middlewares/validate.middleware";
import {
  createDeduction,
  deleteDeduction,
  getDeduction,
  listDeductions,
  updateDeduction,
} from "./deduction.controller";
import { createDeductionSchema, updateDeductionSchema } from "./deduction.dto";

const router = Router();

router.get("/", listDeductions);
router.get("/:id", getDeduction);
router.post("/", validateBody(createDeductionSchema), createDeduction);
router.patch("/:id", validateBody(updateDeductionSchema), updateDeduction);
router.delete("/:id", deleteDeduction);

export default router;
