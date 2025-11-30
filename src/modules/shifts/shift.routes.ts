import { Router } from "express";
import { validateBody } from "../../middlewares/validate.middleware";
import {
  createShift,
  deleteShift,
  getShift,
  listShifts,
  updateShift,
  createBulkShifts,
  getTodayShifts,
} from "./shift.controller";
import { createShiftSchema, updateShiftSchema } from "./shift.dto";

const router = Router();

router.get("/", listShifts);
router.get("/today", getTodayShifts); // Must be before /:id to avoid route conflict
router.get("/:id", getShift);
router.post("/", validateBody(createShiftSchema), createShift);

/**
 * @swagger
 * /shifts/bulk:
 *   post:
 *     summary: Tạo nhiều ca làm việc cùng lúc
 *     tags: [Shifts]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               shifts:
 *                 type: array
 *                 items:
 *                   $ref: '#/components/schemas/CreateShift'
 *     responses:
 *       201:
 *         description: Tạo thành công
 */
router.post("/bulk", createBulkShifts);

router.patch("/:id", validateBody(updateShiftSchema), updateShift);
router.delete("/:id", deleteShift);

export default router;
