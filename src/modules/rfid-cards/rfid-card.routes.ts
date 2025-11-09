import { Router } from "express";
import { validateBody } from "../../middlewares/validate.middleware";
import {
  createRFIDCard,
  deleteRFIDCard,
  getRFIDCard,
  listRFIDCards,
  updateRFIDCard,
} from "./rfid-card.controller";
import { createRFIDCardSchema, updateRFIDCardSchema } from "./rfid-card.dto";

const router = Router();

router.get("/", listRFIDCards);
router.get("/:id", getRFIDCard);
router.post("/", validateBody(createRFIDCardSchema), createRFIDCard);
router.put("/:id", validateBody(updateRFIDCardSchema), updateRFIDCard);
router.delete("/:id", deleteRFIDCard);

export default router;
