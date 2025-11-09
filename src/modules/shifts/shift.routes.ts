import { Router } from "express";
import { validateBody } from "../../middlewares/validate.middleware";
import {
  createShift,
  deleteShift,
  getShift,
  listShifts,
  updateShift,
} from "./shift.controller";
import { createShiftSchema, updateShiftSchema } from "./shift.dto";

const router = Router();

router.get("/", listShifts);
router.get("/:id", getShift);
router.post("/", validateBody(createShiftSchema), createShift);
router.put("/:id", validateBody(updateShiftSchema), updateShift);
router.delete("/:id", deleteShift);

export default router;
