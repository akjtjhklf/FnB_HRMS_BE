import { Router } from "express";
import { validateBody } from "../../middlewares/validate.middleware";
import {
  createPosition,
  deletePosition,
  getPosition,
  listPositions,
  updatePosition,
} from "./position.controller";
import { createPositionSchema, updatePositionSchema } from "./position.dto";

const router = Router();

router.get("/", listPositions);
router.get("/:id", getPosition);
router.post("/", validateBody(createPositionSchema), createPosition);
router.put("/:id", validateBody(updatePositionSchema), updatePosition);
router.delete("/:id", deletePosition);

export default router;
