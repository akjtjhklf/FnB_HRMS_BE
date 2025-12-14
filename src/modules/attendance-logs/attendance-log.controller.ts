import { Request, Response, NextFunction } from "express";
import { ApiResponse, sendSuccess } from "../../core/response";
import { HttpError } from "../../core/base";
import AttendanceLogService from "./attendance-log.service";
import { toAttendanceLogResponseDto } from "./attendance-log.dto";
import { parsePaginationQuery } from "../../utils/query.utils";

const service = new AttendanceLogService();

/**
 * Transform date filter to event_time filter
 * attendance_logs uses event_time (datetime), not date field
 */
function transformDateFilter(query: any): any {
  if (query.filter?.date) {
    const dateValue = query.filter.date._eq || query.filter.date;
    // Convert date to datetime range filter for event_time
    const startOfDay = `${dateValue}T00:00:00`;
    const endOfDay = `${dateValue}T23:59:59`;
    
    // Replace date filter with event_time range filter
    delete query.filter.date;
    query.filter.event_time = {
      _between: [startOfDay, endOfDay]
    };
  }
  return query;
}

export const listAttendanceLogs = async (
  req: Request,
  res: Response<ApiResponse<unknown>>,
  next: NextFunction
) => {
  try {
    let query = parsePaginationQuery(req);
    
    // Transform date filter to event_time filter
    query = transformDateFilter(query);

    const result = await service.listPaginated(query);
    return sendSuccess(
      res,
      { items: result.data.map(toAttendanceLogResponseDto), ...result.meta },

      200,
      "Lấy danh sách logs thành công"
    );
  } catch (err) {
    next(err);
  }
};

export const getAttendanceLog = async (
  req: Request,
  res: Response<ApiResponse<unknown>>,
  next: NextFunction
) => {
  try {
    const id = String(req.params.id);
    const data = await service.get(id);
    return sendSuccess(
      res,
      toAttendanceLogResponseDto(data),
      200,
      "Lấy chi tiết log thành công"
    );
  } catch (err) {
    next(err);
  }
};

export const createAttendanceLog = async (
  req: Request,
  res: Response<ApiResponse<unknown>>,
  next: NextFunction
) => {
  try {
    const data = await service.create(req.body);
    return sendSuccess(
      res,
      toAttendanceLogResponseDto(data),
      201,
      "Tạo log điểm danh thành công"
    );
  } catch (err) {
    next(err);
  }
};

export const updateAttendanceLog = async (
  req: Request,
  res: Response<ApiResponse<unknown>>,
  next: NextFunction
) => {
  try {
    const id = String(req.params.id);
    const data = await service.update(id, req.body);
    return sendSuccess(
      res,
      toAttendanceLogResponseDto(data),
      200,
      "Cập nhật log điểm danh thành công"
    );
  } catch (err) {
    next(err);
  }
};

export const deleteAttendanceLog = async (
  req: Request,
  res: Response<ApiResponse<unknown>>,
  next: NextFunction
) => {
  try {
    const id = String(req.params.id);
    await service.remove(id);
    return sendSuccess(res, null, 200, "Xoá log điểm danh thành công");
  } catch (err) {
    next(err);
  }
};
