import { Router } from "express";
import { validateBody } from "../../middlewares/validate.middleware";
import {
  listShiftTypes,
  getShiftType,
  createShiftType,
  updateShiftType,
  deleteShiftType,
} from "./shift-type.controller";
import { createShiftTypeSchema, updateShiftTypeSchema } from "./shift-type.dto";

const router = Router();

router.get("/", listShiftTypes);
router.get("/:id", getShiftType);
router.post("/", validateBody(createShiftTypeSchema), createShiftType);
router.patch("/:id", validateBody(updateShiftTypeSchema), updateShiftType);
router.delete("/:id", deleteShiftType);

export default router;
