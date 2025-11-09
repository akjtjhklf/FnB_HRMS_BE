import { Router } from "express";
import { validateBody } from "../../middlewares/validate.middleware";
import {
  listShiftPositionRequirements,
  getShiftPositionRequirement,
  createShiftPositionRequirement,
  updateShiftPositionRequirement,
  deleteShiftPositionRequirement,
} from "./shift-position-requirement.controller";
import {
  createShiftPositionRequirementSchema,
  updateShiftPositionRequirementSchema,
} from "./shift-position-requirement.dto";

const router = Router();

router.get("/", listShiftPositionRequirements);
router.get("/:id", getShiftPositionRequirement);
router.post(
  "/",
  validateBody(createShiftPositionRequirementSchema),
  createShiftPositionRequirement
);
router.put(
  "/:id",
  validateBody(updateShiftPositionRequirementSchema),
  updateShiftPositionRequirement
);
router.delete("/:id", deleteShiftPositionRequirement);

export default router;
