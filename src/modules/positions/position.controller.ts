import { Request, Response, NextFunction } from "express";
import { ApiResponse, sendSuccess } from "../../core/response";
import { HttpError } from "../../core/base";
import PositionService from "./position.service";
import { toPositionResponseDto } from "./position.dto";
import { parsePaginationQuery } from "../../utils/query.utils";

const service = new PositionService();

/**
 * Lấy danh sách vị trí
 */
export const listPositions = async (
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
        items: result.data.map(toPositionResponseDto),
        ...result.meta,
      },
      200,
      "Lấy danh sách vị trí thành công"
    );
  } catch (err) {
    next(err);
  }
};

/**
 * Lấy chi tiết vị trí
 */
export const getPosition = async (
  req: Request,
  res: Response<ApiResponse<unknown>>,
  next: NextFunction
) => {
  try {
    const id = String(req.params.id);
    const data = await service.get(id);
    if (!data) throw new HttpError(404, "Không tìm thấy vị trí");
    return sendSuccess(
      res,
      toPositionResponseDto(data),
      200,
      "Lấy thông tin vị trí thành công"
    );
  } catch (err) {
    next(err);
  }
};

/**
 * Tạo vị trí mới
 */
export const createPosition = async (
  req: Request,
  res: Response<ApiResponse<unknown>>,
  next: NextFunction
) => {
  try {
    const data = await service.create(req.body);
    return sendSuccess(
      res,
      toPositionResponseDto(data),
      201,
      "Tạo vị trí thành công"
    );
  } catch (err) {
    next(err);
  }
};

/**
 * Cập nhật vị trí
 */
export const updatePosition = async (
  req: Request,
  res: Response<ApiResponse<unknown>>,
  next: NextFunction
) => {
  try {
    const id = String(req.params.id);
    const data = await service.update(id, req.body);
    return sendSuccess(
      res,
      toPositionResponseDto(data),
      200,
      "Cập nhật vị trí thành công"
    );
  } catch (err) {
    next(err);
  }
};

/**
 * Xoá vị trí
 */
export const deletePosition = async (
  req: Request,
  res: Response<ApiResponse<unknown>>,
  next: NextFunction
) => {
  try {
    const id = String(req.params.id);
    await service.remove(id);
    return sendSuccess(res, null, 200, "Xoá vị trí thành công");
  } catch (err) {
    next(err);
  }
};
