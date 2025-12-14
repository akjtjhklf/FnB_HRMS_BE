import { Request, Response, NextFunction } from "express";
import { ApiResponse, sendSuccess } from "../../core/response";
import { HttpError } from "../../core/base";
import WeeklyScheduleService from "./weekly-schedule.service";
import { toWeeklyScheduleResponseDto } from "./weekly-schedule.dto";
import { readItems } from "@directus/sdk";
import { z } from "zod";
import { parsePaginationQuery } from "../../utils/query.utils";

const service = new WeeklyScheduleService();

const createWeeklyScheduleSchema = z.object({
  start_date: z.string().refine((date) => !isNaN(Date.parse(date)), {
    message: "Invalid date format",
  }),
});

export const listWeeklySchedules = async (
  req: Request,
  res: Response<ApiResponse<unknown>>,
  next: NextFunction
) => {
  try {
    const query = parsePaginationQuery(req);
    const data = await service.listPaginated(query);
    return sendSuccess(
      res,
      { items: data.data.map(toWeeklyScheduleResponseDto), ...data.meta },
      200,
      "Lấy danh sách lịch làm việc tuần thành công"
    );
  } catch (err) {
    next(err);
  }
};

export const getWeeklySchedule = async (
  req: Request,
  res: Response<ApiResponse<unknown>>,
  next: NextFunction
) => {
  try {
    const id = String(req.params.id);
    const data = await service.get(id);
    if (!data) throw new HttpError(404, "Không tìm thấy lịch làm việc tuần");
    return sendSuccess(
      res,
      toWeeklyScheduleResponseDto(data),
      200,
      "Lấy chi tiết lịch làm việc tuần thành công"
    );
  } catch (err) {
    next(err);
  }
};

export const createWeeklySchedule = async (
  req: Request,
  res: Response<ApiResponse<unknown>>,
  next: NextFunction
) => {
  try {
    const data = await service.create(req.body);
    return sendSuccess(
      res,
      toWeeklyScheduleResponseDto(data),
      201,
      "Tạo lịch làm việc tuần thành công"
    );
  } catch (err) {
    next(err);
  }
};

export const updateWeeklySchedule = async (
  req: Request,
  res: Response<ApiResponse<unknown>>,
  next: NextFunction
) => {
  try {
    const id = String(req.params.id);
    const data = await service.update(id, req.body);
    return sendSuccess(
      res,
      toWeeklyScheduleResponseDto(data),
      200,
      "Cập nhật lịch làm việc tuần thành công"
    );
  } catch (err) {
    next(err);
  }
};

export const deleteWeeklySchedule = async (
  req: Request,
  res: Response<ApiResponse<unknown>>,
  next: NextFunction
) => {
  try {
    const id = String(req.params.id);
    await service.remove(id);
    return sendSuccess(res, null, 200, "Xoá lịch làm việc tuần thành công");
  } catch (err) {
    next(err);
  }
};

export const createWeeklyScheduleWithShiftsHandler = async (
  req: Request,
  res: Response<ApiResponse<unknown>>,
  next: NextFunction
) => {
  try {
    console.log("📥 Request body:", req.body); // Debug
    const parsedData = createWeeklyScheduleSchema.parse(req.body);
    const directusClient = (req as any).directusClient;

    console.log("✅ Parsed data:", parsedData); // Debug

    const result = await service.createWeeklyScheduleWithShifts(
      parsedData,
      directusClient
    );

    return sendSuccess(
      res,
      result,
      201,
      "Tạo lịch tuần và ca làm việc thành công"
    );
  } catch (err) {
    console.error("❌ Error in createWeeklyScheduleWithShifts:", err); // Debug
    if (err instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: { message: "Validation failed", details: err.issues },
      });
    }
    next(err);
  }
};

/**
 * ============================================
 * 📢 CÔNG BỐ LỊCH TUẦN - PUBLISH SCHEDULE
 * ============================================
 * PUT /api/weekly-schedules/:id/publish
 * 
 * Tính năng:
 * - Thay đổi status từ "draft" → "published"
 * - Lưu thời điểm công bố (published_at)
 * - Sau khi công bố, nhân viên có thể xem và đăng ký
 */
export const publishWeeklySchedule = async (
  req: Request,
  res: Response<ApiResponse<unknown>>,
  next: NextFunction
) => {
  try {
    const id = String(req.params.id);

    const result = await service.publish(id);

    return sendSuccess(
      res,
      toWeeklyScheduleResponseDto(result),
      200,
      "Công bố lịch tuần thành công"
    );
  } catch (err) {
    next(err);
  }
};

/**
 * ============================================
 * ✅ HOÀN TẤT LỊCH TUẦN - FINALIZE SCHEDULE
 * ============================================
 * PUT /api/weekly-schedules/:id/finalize
 * 
 * Tính năng:
 * - Thay đổi status từ "published" → "finalized"
 * - Khóa lịch, không cho phép thay đổi nữa
 */
export const finalizeWeeklySchedule = async (
  req: Request,
  res: Response<ApiResponse<unknown>>,
  next: NextFunction
) => {
  try {
    const id = String(req.params.id);

    const result = await service.finalize(id);

    return sendSuccess(
      res,
      toWeeklyScheduleResponseDto(result),
      200,
      "Hoàn tất lịch tuần thành công"
    );
  } catch (err) {
    next(err);
  }
};

/**
 * ============================================
 * ✅ VALIDATE LỊCH TUẦN - KIỂM TRA TRƯỚC KHI PUBLISH
 * ============================================
 * GET /api/weekly-schedules/:id/validate
 * 
 * Kiểm tra:
 * - Có shifts chưa?
 * - Có position requirements chưa?
 * - Đủ nhân viên đăng ký chưa?
 */
export const validateWeeklySchedule = async (
  req: Request,
  res: Response<ApiResponse<unknown>>,
  next: NextFunction
) => {
  try {
    const id = String(req.params.id);
    const validation = await service.validateSchedule(id);
    
    return sendSuccess(
      res,
      validation,
      200,
      validation.canPublish ? "Lịch hợp lệ, có thể công bố" : "Lịch chưa đủ điều kiện"
    );
  } catch (err) {
    next(err);
  }
};

/**
 * ============================================
 * 🔍 KIỂM TRA ĐỦ ĐIỀU KIỆN CHỐT LỊCH
 * ============================================
 * GET /api/weekly-schedules/:id/check-readiness
 * 
 * Kiểm tra chi tiết:
 * - Tất cả shifts có đủ assignments chưa
 * - Tất cả positions có đủ người chưa
 * - Có conflicts không
 */
export const checkScheduleReadiness = async (
  req: Request,
  res: Response<ApiResponse<unknown>>,
  next: NextFunction
) => {
  try {
    const id = String(req.params.id);
    const readiness = await service.checkReadiness(id);
    
    return sendSuccess(
      res,
      readiness,
      200,
      readiness.isReady ? "Lịch đã sẵn sàng publish" : "Lịch chưa sẵn sàng"
    );
  } catch (err) {
    next(err);
  }
};

/**
 * ============================================
 * 📊 THỐNG KÊ LỊCH TUẦN
 * ============================================
 * GET /api/weekly-schedules/:id/stats
 */
export const getScheduleStats = async (
  req: Request,
  res: Response<ApiResponse<unknown>>,
  next: NextFunction
) => {
  try {
    const id = String(req.params.id);
    const stats = await service.getStats(id);
    
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

// Debug endpoint: verifies per-request Directus client access to `weekly_schedules`
export const debugDirectusAccess = async (
  req: Request,
  res: Response<ApiResponse<unknown>>,
  next: NextFunction
) => {
  try {
    const user = (req as any).user;
    const client = (req as any).directusClient;
    if (!client) {
      return res.status(400).json({
        success: false,
        error: { message: "No directus client on request" },
      });
    }

    try {
      const itemsReq: any = (readItems as any)("weekly_schedules" as any, {
        limit: 1,
      });
      const items = await client.request(itemsReq);
      return sendSuccess(
        res,
        { role: user?.role, items },
        200,
        "Directus access ok"
      );
    } catch (error: any) {
      console.error("🔍 Debug Directus access error:", error);
      return res.status(403).json({
        success: false,
        error: error.errors ?? { message: error?.message ?? "Unknown" },
      });
    }
  } catch (err) {
    next(err);
  }
};
