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

    const { start_date, end_date } = req.query;
    
    const records = await service.getEmployeeAttendance(
      employeeId,
      start_date as string || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      end_date as string || new Date().toISOString()
    );

    return sendSuccess(res, records, 200, "Lấy lịch sử chấm công thành công");
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
    const { clock_in, clock_out, reason } = req.body;

    const updated = await service.manualAdjust(id, {
      clock_in,
      clock_out,
      reason,
    });

    return sendSuccess(res, updated, 200, "Điều chỉnh thành công");
  } catch (err) {
    next(err);
  }
};
