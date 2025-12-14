import { Request, Response, NextFunction } from "express";
import { ApiResponse, sendSuccess } from "../../core/response";
import { HttpError } from "../../core/base";
import AttendanceAdjustmentsService from "./attendance-adjustment.service";
import { toAttendanceAdjustmentResponseDto } from "./attendance-adjustment.dto";

const service = new AttendanceAdjustmentsService();

export const listAttendanceAdjustments = async (
  _req: Request,
  res: Response<ApiResponse<unknown>>,
  next: NextFunction
) => {
  try {
    // Join with attendance_shift to get original clock times, and requested_by for employee info
    const data = await service.list({
      fields: [
        "*",
        "attendance_shift_id.*",
        "requested_by.*",
      ],
    });
    return sendSuccess(
      res,
      data.map(toAttendanceAdjustmentResponseDto),
      200,
      "Lấy danh sách điều chỉnh chấm công thành công"
    );
  } catch (err) {
    next(err);
  }
};


export const getAttendanceAdjustment = async (
  req: Request,
  res: Response<ApiResponse<unknown>>,
  next: NextFunction
) => {
  try {
    const id = String(req.params.id);
    const data = await service.get(id);
    if (!data)
      throw new HttpError(404, "Không tìm thấy bản ghi điều chỉnh chấm công");
    return sendSuccess(
      res,
      toAttendanceAdjustmentResponseDto(data),
      200,
      "Lấy chi tiết điều chỉnh chấm công thành công"
    );
  } catch (err) {
    next(err);
  }
};

export const createAttendanceAdjustment = async (
  req: Request,
  res: Response<ApiResponse<unknown>>,
  next: NextFunction
) => {
  try {
    const data = await service.create(req.body);
    return sendSuccess(
      res,
      toAttendanceAdjustmentResponseDto(data),
      201,
      "Tạo điều chỉnh chấm công thành công"
    );
  } catch (err) {
    next(err);
  }
};

export const updateAttendanceAdjustment = async (
  req: Request,
  res: Response<ApiResponse<unknown>>,
  next: NextFunction
) => {
  try {
    const id = String(req.params.id);
    const data = await service.update(id, req.body);
    return sendSuccess(
      res,
      toAttendanceAdjustmentResponseDto(data),
      200,
      "Cập nhật điều chỉnh chấm công thành công"
    );
  } catch (err) {
    next(err);
  }
};

export const deleteAttendanceAdjustment = async (
  req: Request,
  res: Response<ApiResponse<unknown>>,
  next: NextFunction
) => {
  try {
    const id = String(req.params.id);
    await service.remove(id);
    return sendSuccess(res, null, 200, "Xoá điều chỉnh chấm công thành công");
  } catch (err) {
    next(err);
  }
};

export const approveAttendanceAdjustment = async (
  req: Request,
  res: Response<ApiResponse<unknown>>,
  next: NextFunction
) => {
  try {
    const id = String(req.params.id);
    const managerId = (req as any).user?.id;
    const data = await service.approve(id, managerId);
    return sendSuccess(
      res,
      toAttendanceAdjustmentResponseDto(data),
      200,
      "Duyệt yêu cầu điều chỉnh thành công"
    );
  } catch (err) {
    next(err);
  }
};

export const rejectAttendanceAdjustment = async (
  req: Request,
  res: Response<ApiResponse<unknown>>,
  next: NextFunction
) => {
  try {
    const id = String(req.params.id);
    const managerId = (req as any).user?.id;
    const data = await service.reject(id, managerId);
    return sendSuccess(
      res,
      toAttendanceAdjustmentResponseDto(data),
      200,
      "Từ chối yêu cầu điều chỉnh thành công"
    );
  } catch (err) {
    next(err);
  }
};
