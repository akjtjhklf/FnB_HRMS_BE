import { Request, Response, NextFunction } from "express";
import { ApiResponse, sendSuccess } from "../../core/response";
import { HttpError } from "../../core/base";
import ScheduleAssignmentsService from "./schedule-assignment.service";
import { toScheduleAssignmentResponseDto } from "./schedule-assignment.dto";
import { AutoSchedulerService } from "./auto-scheduler.service";

const service = new ScheduleAssignmentsService();
const autoScheduler = new AutoSchedulerService();

/**
 * Lấy danh sách lịch phân công
 */
export const listScheduleAssignments = async (
  _req: Request,
  res: Response<ApiResponse<unknown>>,
  next: NextFunction
) => {
  try {
    const data = await service.list();
    return sendSuccess(
      res,
      data.map(toScheduleAssignmentResponseDto),
      200,
      "Lấy danh sách lịch phân công thành công"
    );
  } catch (err) {
    next(err);
  }
};

/**
 * Lấy chi tiết lịch phân công
 */
export const getScheduleAssignment = async (
  req: Request,
  res: Response<ApiResponse<unknown>>,
  next: NextFunction
) => {
  try {
    const id = String(req.params.id);
    const data = await service.get(id);
    if (!data)
      throw new HttpError(404, "Không tìm thấy lịch phân công");
    return sendSuccess(
      res,
      toScheduleAssignmentResponseDto(data),
      200,
      "Lấy chi tiết lịch phân công thành công"
    );
  } catch (err) {
    next(err);
  }
};

/**
 * Tạo mới lịch phân công
 */
export const createScheduleAssignment = async (
  req: Request,
  res: Response<ApiResponse<unknown>>,
  next: NextFunction
) => {
  try {
    const data = await service.create(req.body);
    return sendSuccess(
      res,
      toScheduleAssignmentResponseDto(data),
      201,
      "Tạo mới lịch phân công thành công"
    );
  } catch (err) {
    next(err);
  }
};

/**
 * Cập nhật lịch phân công
 */
export const updateScheduleAssignment = async (
  req: Request,
  res: Response<ApiResponse<unknown>>,
  next: NextFunction
) => {
  try {
    const id = String(req.params.id);
    const data = await service.update(id, req.body);
    return sendSuccess(
      res,
      toScheduleAssignmentResponseDto(data),
      200,
      "Cập nhật lịch phân công thành công"
    );
  } catch (err) {
    next(err);
  }
};

/**
 * Xoá lịch phân công
 */
export const deleteScheduleAssignment = async (
  req: Request,
  res: Response<ApiResponse<unknown>>,
  next: NextFunction
) => {
  try {
    const id = String(req.params.id);
    await service.remove(id);
    return sendSuccess(res, null, 200, "Xoá lịch phân công thành công");
  } catch (err) {
    next(err);
  }
};

/**
 * ============================================
 * 🤖 XẾP LỊCH TỰ ĐỘNG - AUTO SCHEDULE
 * ============================================
 * POST /api/schedule-assignments/auto-schedule
 * Body: {
 *   scheduleId: string,
 *   overwriteExisting?: boolean,
 *   dryRun?: boolean
 * }
 */
export const autoSchedule = async (
  req: Request,
  res: Response<ApiResponse<unknown>>,
  next: NextFunction
) => {
  try {
    const { scheduleId, overwriteExisting, dryRun } = req.body;

    if (!scheduleId) {
      throw new HttpError(400, "scheduleId là bắt buộc");
    }

    const userId = (req as any).user?.id; // Lấy từ auth middleware

    const result = await autoScheduler.autoSchedule(scheduleId, {
      overwriteExisting: overwriteExisting ?? false,
      dryRun: dryRun ?? false,
      assignedBy: userId,
    });

    return sendSuccess(
      res,
      result,
      200,
      result.dryRun 
        ? "Mô phỏng xếp lịch tự động thành công" 
        : "Xếp lịch tự động thành công"
    );
  } catch (err) {
    next(err);
  }
};

/**
 * ============================================
 * 📊 LẤY THỐNG KÊ XẾP LỊCH
 * ============================================
 * GET /api/schedule-assignments/schedule/:scheduleId/stats
 */
export const getScheduleStats = async (
  req: Request,
  res: Response<ApiResponse<unknown>>,
  next: NextFunction
) => {
  try {
    const scheduleId = String(req.params.scheduleId);
    
    // Lấy assignments theo schedule
    const assignments = await service.listBySchedule(scheduleId);
    
    // Group by employee
    const employeeStats = new Map<string, number>();
    for (const assign of assignments) {
      const count = employeeStats.get(assign.employee_id) || 0;
      employeeStats.set(assign.employee_id, count + 1);
    }

    const shiftCounts = Array.from(employeeStats.values());

    const stats = {
      totalAssignments: assignments.length,
      totalEmployees: employeeStats.size,
      avgShiftsPerEmployee: shiftCounts.length > 0 
        ? shiftCounts.reduce((a, b) => a + b, 0) / shiftCounts.length 
        : 0,
      minShifts: shiftCounts.length > 0 ? Math.min(...shiftCounts) : 0,
      maxShifts: shiftCounts.length > 0 ? Math.max(...shiftCounts) : 0,
      distribution: Object.fromEntries(employeeStats),
    };

    return sendSuccess(
      res,
      stats,
      200,
      "Lấy thống kê thành công"
    );
  } catch (err) {
    next(err);
  }
};
