import { Request, Response, NextFunction } from "express";
import { ApiResponse, sendSuccess } from "../../core/response";
import { HttpError } from "../../core/base";
import AttendanceService from "./attendance.service";

const service = new AttendanceService();

/**
 * POST /attendance/check-in
 * Employee checks in
 */
export const checkIn = async (
  req: Request,
  res: Response<ApiResponse<unknown>>,
  next: NextFunction
) => {
  try {
    const employeeId = (req as any).user?.employee_id;
    if (!employeeId) {
      throw new HttpError(400, "User không liên kết với employee", "NO_EMPLOYEE");
    }  

    const { assignment_id, location, rfid_card_id } = req.body;

    const attendance = await service.checkIn(employeeId, {
      assignmentId: assignment_id,
      location,
      rfidCardId: rfid_card_id,
    });

    return sendSuccess(res, attendance, 200, "Check-in thành công");
  } catch (err) {
    next(err);
  }
};

/**
 * POST /attendance/check-out
 * Employee checks out
 */
export const checkOut = async (
  req: Request,
  res: Response<ApiResponse<unknown>>,
  next: NextFunction
) => {
  try {
    const employeeId = (req as any).user?.employee_id;
    if (!employeeId) {
      throw new HttpError(400, "User không liên kết với employee", "NO_EMPLOYEE");
    }

    const { assignment_id } = req.body;

    const attendance = await service.checkOut(employeeId, assignment_id);

    return sendSuccess(res, attendance, 200, "Check-out thành công");
  } catch (err) {
    next(err);
  }
};

/**
 * GET /attendance/my-attendance
 * Get my attendance records
 */
export const getMyAttendance = async (
  req: Request,
  res: Response<ApiResponse<unknown>>,
  next: NextFunction
) => {
  try {
    const employeeId = (req as any).user?.employee_id;
    if (!employeeId) {
      throw new HttpError(400, "User không liên kết với employee", "NO_EMPLOYEE");
    }

    const { start_date, end_date, filter } = req.query as any;
    
    const queryStartDate = start_date || filter?.start_date;
    const queryEndDate = end_date || filter?.end_date;

    const records = await service.getEmployeeAttendance(
      employeeId,
      queryStartDate as string || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      queryEndDate as string || new Date().toISOString()
    );

    return sendSuccess(res, {
      items: records,
      total: records.length,
    }, 200, "Lấy lịch sử chấm công thành công");
  } catch (err) {
    next(err);
  }
};

/**
 * PATCH /attendance/:id/manual-adjust
 * Admin manual adjustment
 */
export const manualAdjust = async (
  req: Request,
  res: Response<ApiResponse<unknown>>,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const { clock_in, clock_out, notes } = req.body;

    const updated = await service.manualAdjust(id, {
      clock_in,
      clock_out,
      notes,
    });

    return sendSuccess(res, updated, 200, "Điều chỉnh thành công");
  } catch (err) {
    next(err);
  }
};

/**
 * GET /attendance/report
 * Get monthly attendance report
 */
export const getMonthlyReport = async (
  req: Request,
  res: Response<ApiResponse<unknown>>,
  next: NextFunction
) => {
  try {
    const { month, year, filter } = req.query as any;

    // Support both direct query params and filter object (from Refine)
    const queryMonth = month || filter?.month;
    const queryYear = year || filter?.year;

    if (!queryMonth || !queryYear) {
      throw new HttpError(400, "Month and Year are required", "INVALID_PARAMS");
    }

    const report = await service.getMonthlyReport(
      parseInt(queryMonth as string),
      parseInt(queryYear as string)
    );

    // Return structure compatible with Refine DataProvider getList
    return sendSuccess(res, {
      items: report,
      total: report.length,
    }, 200, "Lấy báo cáo thành công");
  } catch (err) {
    next(err);
  }
};
