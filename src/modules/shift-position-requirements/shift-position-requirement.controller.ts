import { Request, Response, NextFunction } from "express";
import { ApiResponse, sendSuccess } from "../../core/response";
import { HttpError } from "../../core/base";
import ShiftPositionRequirementService from "./shift-position-requirement.service";
import { toShiftPositionRequirementResponseDto } from "./shift-position-requirement.dto";

const service = new ShiftPositionRequirementService();

/**
 * Lấy danh sách yêu cầu vị trí ca làm
 */
export const listShiftPositionRequirements = async (
  req: Request,
  res: Response<ApiResponse<unknown>>,
  next: NextFunction
) => {
  try {
    const result = await service.listPaginated(req.query);
    // Cast result to PaginatedResponse<ShiftPositionRequirement>
    const paginated = result as import("../../core/directus.repository").PaginatedResponse<import("./shift-position-requirement.model").ShiftPositionRequirement>;
    return sendSuccess(
      res,
      {
        data: paginated.data.map(toShiftPositionRequirementResponseDto),
        meta: paginated.meta,
      },
      200,
      "Lấy danh sách yêu cầu vị trí ca làm thành công"
    );
  } catch (err) {
    next(err);
  }
};

/**
 * Lấy chi tiết yêu cầu vị trí ca làm
 */
export const getShiftPositionRequirement = async (
  req: Request,
  res: Response<ApiResponse<unknown>>,
  next: NextFunction
) => {
  try {
    const id = String(req.params.id);
    const data = await service.get(id);
    if (!data)
      throw new HttpError(404, "Không tìm thấy yêu cầu vị trí ca làm");
    return sendSuccess(
      res,
      toShiftPositionRequirementResponseDto(data),
      200,
      "Lấy chi tiết yêu cầu vị trí ca làm thành công"
    );
  } catch (err) {
    next(err);
  }
};

/**
 * Tạo mới yêu cầu vị trí ca làm
 */
export const createShiftPositionRequirement = async (
  req: Request,
  res: Response<ApiResponse<unknown>>,
  next: NextFunction
) => {
  try {
    const data = await service.create(req.body);
    return sendSuccess(
      res,
      toShiftPositionRequirementResponseDto(data),
      201,
      "Tạo yêu cầu vị trí ca làm thành công"
    );
  } catch (err) {
    next(err);
  }
};

/**
 * Cập nhật yêu cầu vị trí ca làm
 */
export const updateShiftPositionRequirement = async (
  req: Request,
  res: Response<ApiResponse<unknown>>,
  next: NextFunction
) => {
  try {
    const id = String(req.params.id);
    const data = await service.update(id, req.body);
    return sendSuccess(
      res,
      toShiftPositionRequirementResponseDto(data),
      200,
      "Cập nhật yêu cầu vị trí ca làm thành công"
    );
  } catch (err) {
    next(err);
  }
};

/**
 * Xoá yêu cầu vị trí ca làm
 */
export const deleteShiftPositionRequirement = async (
  req: Request,
  res: Response<ApiResponse<unknown>>,
  next: NextFunction
) => {
  try {
    const id = String(req.params.id);
    await service.remove(id);
    return sendSuccess(
      res,
      null,
      200,
      "Xoá yêu cầu vị trí ca làm thành công"
    );
  } catch (err) {
    next(err);
  }
};
