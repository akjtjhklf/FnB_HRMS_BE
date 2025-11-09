import { Request, Response, NextFunction } from "express";
import { ApiResponse, sendSuccess } from "../../core/response";
import { HttpError } from "../../core/base";
import WeeklyScheduleService from "./weekly-schedule.service";
import { toWeeklyScheduleResponseDto } from "./weekly-schedule.dto";

const service = new WeeklyScheduleService();

export const listWeeklySchedules = async (
  _req: Request,
  res: Response<ApiResponse<unknown>>,
  next: NextFunction
) => {
  try {
    const data = await service.list();
    return sendSuccess(
      res,
      data.map(toWeeklyScheduleResponseDto),
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
