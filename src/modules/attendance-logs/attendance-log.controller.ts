import { Request, Response, NextFunction } from "express";
import { ApiResponse, sendSuccess } from "../../core/response";
import { HttpError } from "../../core/base";
import AttendanceLogService from "./attendance-log.service";
import { toAttendanceLogResponseDto } from "./attendance-log.dto";

const service = new AttendanceLogService();

export const listAttendanceLogs = async (
  _req: Request,
  res: Response<ApiResponse<unknown>>,
  next: NextFunction
) => {
  try {
    const data = await service.list();
    return sendSuccess(
      res,
      data.map(toAttendanceLogResponseDto),
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
