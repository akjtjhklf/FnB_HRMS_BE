import { Router } from "express";
import { validateBody } from "../../middlewares/validate.middleware";
import {
  createWeeklySchedule,
  createWeeklyScheduleWithShiftsHandler,
  deleteWeeklySchedule,
  getWeeklySchedule,
  listWeeklySchedules,
  updateWeeklySchedule,
  publishWeeklySchedule,
  finalizeWeeklySchedule,
  debugDirectusAccess,
} from "./weekly-schedule.controller";
import { requireAuth } from "../../middlewares/auth.middleware";
import {
  createWeeklyScheduleSchema,
  updateWeeklyScheduleSchema,
} from "./weekly-schedule.dto";

const router = Router();

/**
 * @swagger
 * tags:
 *   name: WeeklySchedules
 *   description: Quản lý lịch tuần
 */

/**
 * @swagger
 * /weekly-schedules:
 *   get:
 *     summary: Lấy danh sách lịch tuần
 *     tags: [WeeklySchedules]
 *     responses:
 *       200:
 *         description: Danh sách lịch tuần
 */
router.get("/", requireAuth(), listWeeklySchedules);


/**
 * @swagger
 * /weekly-schedules/with-shifts:
 *   post:
 *     summary: Tạo lịch tuần mới kèm ca làm việc draft tự động
 *     tags: [WeeklySchedules]
 *     responses:
 *       201:
 *         description: Tạo thành công
 */
router.post("/with-shifts", requireAuth(), createWeeklyScheduleWithShiftsHandler);

/**
 * @swagger
 * /weekly-schedules/{id}:
 *   get:
 *     summary: Lấy chi tiết lịch tuần theo ID
 *     tags: [WeeklySchedules]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID của lịch tuần
 *     responses:
 *       200:
 *         description: Chi tiết lịch tuần
 *       404:
 *         description: Không tìm thấy
 */
router.get("/:id", requireAuth(), getWeeklySchedule);

/**
 * @swagger
 * /weekly-schedules:
 *   post:
 *     summary: Tạo lịch tuần mới
 *     tags: [WeeklySchedules]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateWeeklySchedule'
 *     responses:
 *       201:
 *         description: Tạo thành công
 */
router.post(
  "/",
  validateBody(createWeeklyScheduleSchema),
  createWeeklySchedule
);

/**
 * @swagger
 * /weekly-schedules/{id}:
 *   put:
 *     summary: Cập nhật lịch tuần
 *     tags: [WeeklySchedules]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID của lịch tuần
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateWeeklySchedule'
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 *       404:
 *         description: Không tìm thấy
 */
router.put(
  "/:id",
  validateBody(updateWeeklyScheduleSchema),
  updateWeeklySchedule
);

/**
 * @swagger
 * /weekly-schedules/{id}:
 *   delete:
 *     summary: Xoá lịch tuần
 *     tags: [WeeklySchedules]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID của lịch tuần
 *     responses:
 *       200:
 *         description: Xoá thành công
 *       404:
 *         description: Không tìm thấy
 */
router.delete("/:id", deleteWeeklySchedule);

/**
 * @swagger
 * /weekly-schedules/{id}/publish:
 *   put:
 *     summary: Công bố lịch tuần (draft → published)
 *     tags: [WeeklySchedules]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID của lịch tuần
 *     responses:
 *       200:
 *         description: Công bố thành công
 *       400:
 *         description: Lỗi trạng thái không hợp lệ
 *       404:
 *         description: Không tìm thấy
 */
router.put("/:id/publish", requireAuth(), publishWeeklySchedule);

/**
 * @swagger
 * /weekly-schedules/{id}/finalize:
 *   put:
 *     summary: Hoàn tất lịch tuần (published → finalized)
 *     tags: [WeeklySchedules]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID của lịch tuần
 *     responses:
 *       200:
 *         description: Hoàn tất thành công
 *       400:
 *         description: Lỗi trạng thái không hợp lệ
 *       404:
 *         description: Không tìm thấy
 */
router.put("/:id/finalize", requireAuth(), finalizeWeeklySchedule);

router.get("/debug-directus", requireAuth(), debugDirectusAccess);

export default router;
