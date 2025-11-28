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
  validateWeeklySchedule,
  checkScheduleReadiness,
  getScheduleStats,
  debugDirectusAccess,
} from "./weekly-schedule.controller";
import { requireAuth } from "../../middlewares/auth.middleware";
import { checkPermission } from "../../middlewares/permission.middleware";
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
router.post(
  "/with-shifts",
  requireAuth(),
  checkPermission("create", "weekly_schedule"),
  createWeeklyScheduleWithShiftsHandler
);

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
  requireAuth(),
  checkPermission("create", "weekly_schedule"),
  validateBody(createWeeklyScheduleSchema),
  createWeeklySchedule
);

/**
 * @swagger
 * /weekly-schedules/{id}:
 *   patch:
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
router.patch(
  "/:id",
  requireAuth(),
  checkPermission("update", "weekly_schedule"),
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
router.delete(
  "/:id",
  requireAuth(),
  checkPermission("delete", "weekly_schedule"),
  deleteWeeklySchedule
);

/**
 * @swagger
 * /weekly-schedules/{id}/publish:
 *   patch:
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
router.patch(
  "/:id/publish",
  requireAuth(),
  checkPermission("update", "weekly_schedule"),
  publishWeeklySchedule
);

/**
 * @swagger
 * /weekly-schedules/{id}/finalize:
 *   patch:
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
router.patch(
  "/:id/finalize",
  requireAuth(),
  checkPermission("update", "weekly_schedule"),
  finalizeWeeklySchedule
);

/**
 * @swagger
 * /weekly-schedules/{id}/validate:
 *   get:
 *     summary: Kiểm tra lịch tuần có thể publish không
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
 *         description: Kết quả kiểm tra
 */
router.get("/:id/validate", requireAuth(), validateWeeklySchedule);

/**
 * @swagger
 * /weekly-schedules/{id}/check-readiness:
 *   get:
 *     summary: Kiểm tra đủ điều kiện chốt lịch (publish)
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
 *         description: Kết quả kiểm tra
 */
router.get("/:id/check-readiness", requireAuth(), checkScheduleReadiness);

/**
 * @swagger
 * /weekly-schedules/{id}/stats:
 *   get:
 *     summary: Lấy thống kê lịch tuần
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
 *         description: Thống kê
 */
router.get("/:id/stats", requireAuth(), getScheduleStats);

router.get("/debug-directus", requireAuth(), debugDirectusAccess);

export default router;
