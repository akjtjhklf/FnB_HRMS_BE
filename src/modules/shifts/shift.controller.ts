import { Request, Response, NextFunction } from "express";
import { ApiResponse, sendSuccess } from "../../core/response";
import { HttpError } from "../../core/base";
import ShiftService from "./shift.service";
import { toShiftResponseDto } from "./shift.dto";
import { parsePaginationQuery } from "../../utils/query.utils";

const service = new ShiftService();

/**
 * Lấy danh sách ca làm việc
 */
export const listShifts = async (
  req: Request,
  res: Response<ApiResponse<unknown>>,
  next: NextFunction
) => {
  try {
    const query = parsePaginationQuery(req);
    const result = await service.listPaginated(query);
    
    return sendSuccess(
      res,
      {
        items: result.data.map(toShiftResponseDto),
        ...result.meta,
      },
      200,
      "Lấy danh sách ca làm việc thành công"
    );
  } catch (err) {
    next(err);
  }
};

/**
 * Lấy chi tiết ca làm việc
 */
export const getShift = async (
  req: Request,
  res: Response<ApiResponse<unknown>>,
  next: NextFunction
) => {
  try {
    const id = String(req.params.id);
    const data = await service.get(id);
    if (!data) throw new HttpError(404, "Không tìm thấy ca làm việc");
    return sendSuccess(
      res,
      toShiftResponseDto(data),
      200,
      "Lấy thông tin ca làm việc thành công"
    );
  } catch (err) {
    next(err);
  }
};

/**
 * Tạo ca làm việc mới
 */
export const createShift = async (
  req: Request,
  res: Response<ApiResponse<unknown>>,
  next: NextFunction
) => {
  try {
    const data = await service.create(req.body);
    return sendSuccess(
      res,
      toShiftResponseDto(data),
      201,
      "Tạo ca làm việc thành công"
    );
  } catch (err) {
    next(err);
  }
};

/**
 * Cập nhật ca làm việc
 */
export const updateShift = async (
  req: Request,
  res: Response<ApiResponse<unknown>>,
  next: NextFunction
) => {
  try {
    const id = String(req.params.id);
    const data = await service.update(id, req.body);
    return sendSuccess(
      res,
      toShiftResponseDto(data),
      200,
      "Cập nhật ca làm việc thành công"
    );
  } catch (err) {
    next(err);
  }
};

/**
 * Xoá ca làm việc
 */
export const deleteShift = async (
  req: Request,
  res: Response<ApiResponse<unknown>>,
  next: NextFunction
) => {
  try {
    const id = String(req.params.id);
    await service.remove(id);
    return sendSuccess(res, null, 200, "Xoá ca làm việc thành công");
  } catch (err) {
    next(err);
  }
};
