import { Request, Response, NextFunction } from "express";
import { ApiResponse, sendSuccess } from "../../core/response";
import { HttpError } from "../../core/base";
import ShiftTypeService from "./shift-type.service";
import { toShiftTypeResponseDto } from "./shift-type.dto";
import { parsePaginationQuery } from "../../utils/query.utils";

const service = new ShiftTypeService();

/**
 * Lấy danh sách ca làm việc
 */
export const listShiftTypes = async (
  req: Request,
  res: Response<ApiResponse<unknown>>,
  next: NextFunction
) => {
  try {
    const query = parsePaginationQuery(req);
    const result = await service.listPaginated(query);
    // Cast result to PaginatedResponse<ShiftType>
    return sendSuccess(
      res,
      {
        items: result.data.map(toShiftTypeResponseDto),
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
export const getShiftType = async (
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
      toShiftTypeResponseDto(data),
      200,
      "Lấy thông tin ca làm việc thành công"
    );
  } catch (err) {
    next(err);
  }
};

/**
 * Tạo mới ca làm việc
 */
export const createShiftType = async (
  req: Request,
  res: Response<ApiResponse<unknown>>,
  next: NextFunction
) => {
  try {
    console.log("📝 Creating shift type with data:", req.body);
    const data = await service.create(req.body);
    return sendSuccess(res, toShiftTypeResponseDto(data), 201, "Tạo ca làm việc thành công");
  } catch (err) {
    console.error("❌ Error creating shift type:", err);
    next(err);
  }
};

/**
 * Cập nhật ca làm việc
 */
export const updateShiftType = async (
  req: Request,
  res: Response<ApiResponse<unknown>>,
  next: NextFunction
) => {
  try {
    const id = String(req.params.id);
    const data = await service.update(id, req.body);
    return sendSuccess(res, toShiftTypeResponseDto(data), 200, "Cập nhật ca làm việc thành công");
  } catch (err) {
    next(err);
  }
};

/**
 * Xoá ca làm việc
 */
export const deleteShiftType = async (
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
