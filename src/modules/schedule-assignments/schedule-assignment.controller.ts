import { Request, Response, NextFunction } from "express";
import { ApiResponse, sendSuccess } from "../../core/response";
import { HttpError } from "../../core/base";
import ScheduleAssignmentsService from "./schedule-assignment.service";
import { toScheduleAssignmentResponseDto } from "./schedule-assignment.dto";

const service = new ScheduleAssignmentsService();

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
