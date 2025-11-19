import { Request, Response, NextFunction } from "express";
import { ApiResponse, sendSuccess } from "../../core/response";
import { HttpError } from "../../core/base";
import EmployeeAvailabilityService from "./employee-availability.service";
import { toEmployeeAvailabilityResponseDto } from "./employee-availability.dto";
import { parsePaginationQuery } from "../../utils/query.utils";

const service = new EmployeeAvailabilityService();

/**
 * Lấy danh sách availability
 */
export const listEmployeeAvailabilities = async (
  req: Request,
  res: Response<ApiResponse<unknown>>,
  next: NextFunction
) => {
  try {
    const query = parsePaginationQuery(req);
    const data = await service.listPaginated(query);
    return sendSuccess(
      res,
      {
        items: data.data.map(toEmployeeAvailabilityResponseDto),
        ...data.meta,
      },
      200,
      "Lấy danh sách availability thành công"
    );
  } catch (err) {
    next(err);
  }
};

/**
 * Lấy chi tiết availability
 */
export const getEmployeeAvailability = async (
  req: Request,
  res: Response<ApiResponse<unknown>>,
  next: NextFunction
) => {
  try {
    const id = String(req.params.id);
    const data = await service.get(id);
    if (!data)
      throw new HttpError(404, "Không tìm thấy availability của nhân viên");
    return sendSuccess(
      res,
      toEmployeeAvailabilityResponseDto(data),
      200,
      "Lấy chi tiết availability thành công"
    );
  } catch (err) {
    next(err);
  }
};

/**
 * Tạo mới availability
 */
export const createEmployeeAvailability = async (
  req: Request,
  res: Response<ApiResponse<unknown>>,
  next: NextFunction
) => {
  try {
    const data = await service.create(req.body);
    return sendSuccess(
      res,
      toEmployeeAvailabilityResponseDto(data),
      201,
      "Tạo availability thành công"
    );
  } catch (err) {
    next(err);
  }
};

/**
 * Cập nhật availability
 */
export const updateEmployeeAvailability = async (
  req: Request,
  res: Response<ApiResponse<unknown>>,
  next: NextFunction
) => {
  try {
    const id = String(req.params.id);
    const data = await service.update(id, req.body);
    return sendSuccess(
      res,
      toEmployeeAvailabilityResponseDto(data),
      200,
      "Cập nhật availability thành công"
    );
  } catch (err) {
    next(err);
  }
};

/**
 * Xoá availability
 */
export const deleteEmployeeAvailability = async (
  req: Request,
  res: Response<ApiResponse<unknown>>,
  next: NextFunction
) => {
  try {
    const id = String(req.params.id);
    await service.remove(id);
    return sendSuccess(res, null, 200, "Xoá availability thành công");
  } catch (err) {
    next(err);
  }
};
