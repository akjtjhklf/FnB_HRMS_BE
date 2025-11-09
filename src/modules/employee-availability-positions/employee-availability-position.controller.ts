import { Request, Response, NextFunction } from "express";
import { ApiResponse, sendSuccess } from "../../core/response";
import EmployeeAvailabilityPositionsService from "./employee-availability-position.service";
import { toEmployeeAvailabilityPositionResponseDto } from "./employee-availability-position.dto";
import { HttpError } from "../../core/base";

const service = new EmployeeAvailabilityPositionsService();

export const listEmployeeAvailabilityPositions = async (
  _req: Request,
  res: Response<ApiResponse<unknown>>,
  next: NextFunction
) => {
  try {
    const data = await service.list();
    return sendSuccess(
      res,
      data.map(toEmployeeAvailabilityPositionResponseDto),
      200,
      "Lấy danh sách employee_availability_positions thành công"
    );
  } catch (err) {
    next(err);
  }
};

export const getEmployeeAvailabilityPosition = async (
  req: Request,
  res: Response<ApiResponse<unknown>>,
  next: NextFunction
) => {
  try {
    const id = String(req.params.id);
    const data = await service.get(id);
    if (!data)
      throw new HttpError(404, "Không tìm thấy dữ liệu employee_availability_position");
    return sendSuccess(
      res,
      toEmployeeAvailabilityPositionResponseDto(data),
      200,
      "Lấy chi tiết thành công"
    );
  } catch (err) {
    next(err);
  }
};

export const createEmployeeAvailabilityPosition = async (
  req: Request,
  res: Response<ApiResponse<unknown>>,
  next: NextFunction
) => {
  try {
    const data = await service.create(req.body);
    return sendSuccess(
      res,
      toEmployeeAvailabilityPositionResponseDto(data),
      201,
      "Tạo mới thành công"
    );
  } catch (err) {
    next(err);
  }
};

export const updateEmployeeAvailabilityPosition = async (
  req: Request,
  res: Response<ApiResponse<unknown>>,
  next: NextFunction
) => {
  try {
    const id = String(req.params.id);
    const data = await service.update(id, req.body);
    return sendSuccess(
      res,
      toEmployeeAvailabilityPositionResponseDto(data),
      200,
      "Cập nhật thành công"
    );
  } catch (err) {
    next(err);
  }
};

export const deleteEmployeeAvailabilityPosition = async (
  req: Request,
  res: Response<ApiResponse<unknown>>,
  next: NextFunction
) => {
  try {
    const id = String(req.params.id);
    await service.remove(id);
    return sendSuccess(res, null, 200, "Xoá thành công");
  } catch (err) {
    next(err);
  }
};
