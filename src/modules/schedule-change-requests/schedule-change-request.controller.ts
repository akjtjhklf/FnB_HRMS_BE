import { Request, Response, NextFunction } from "express";
import { ApiResponse, sendSuccess } from "../../core/response";
import { HttpError } from "../../core/base";
import ScheduleChangeRequestService from "./schedule-change-request.service";
import { toScheduleChangeRequestResponseDto } from "./schedule-change-request.dto";

const service = new ScheduleChangeRequestService();

export const listScheduleChangeRequests = async (
  _req: Request,
  res: Response<ApiResponse<unknown>>,
  next: NextFunction
) => {
  try {
    const data = await service.list();
    return sendSuccess(
      res,
      data.map(toScheduleChangeRequestResponseDto),
      200,
      "Lấy danh sách yêu cầu thay đổi lịch thành công"
    );
  } catch (err) {
    next(err);
  }
};

export const getScheduleChangeRequest = async (
  req: Request,
  res: Response<ApiResponse<unknown>>,
  next: NextFunction
) => {
  try {
    const id = String(req.params.id);
    const data = await service.get(id);
    if (!data) throw new HttpError(404, "Không tìm thấy yêu cầu");
    return sendSuccess(
      res,
      toScheduleChangeRequestResponseDto(data),
      200,
      "Lấy chi tiết yêu cầu thành công"
    );
  } catch (err) {
    next(err);
  }
};

export const createScheduleChangeRequest = async (
  req: Request,
  res: Response<ApiResponse<unknown>>,
  next: NextFunction
) => {
  try {
    const data = await service.create(req.body);
    return sendSuccess(
      res,
      toScheduleChangeRequestResponseDto(data),
      201,
      "Tạo yêu cầu thay đổi lịch thành công"
    );
  } catch (err) {
    next(err);
  }
};

export const updateScheduleChangeRequest = async (
  req: Request,
  res: Response<ApiResponse<unknown>>,
  next: NextFunction
) => {
  try {
    const id = String(req.params.id);
    const data = await service.update(id, req.body);
    return sendSuccess(
      res,
      toScheduleChangeRequestResponseDto(data),
      200,
      "Cập nhật yêu cầu thành công"
    );
  } catch (err) {
    next(err);
  }
};

export const deleteScheduleChangeRequest = async (
  req: Request,
  res: Response<ApiResponse<unknown>>,
  next: NextFunction
) => {
  try {
    const id = String(req.params.id);
    await service.remove(id);
    return sendSuccess(res, null, 200, "Xoá yêu cầu thành công");
  } catch (err) {
    next(err);
  }
};
