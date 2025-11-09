import { Request, Response, NextFunction } from "express";
import { ApiResponse, sendSuccess } from "../../core/response";
import { HttpError } from "../../core/base";
import PolicyService from "./policy.service";
import { toPolicyResponseDto } from "./policy.dto";

const service = new PolicyService();

/**
 * Lấy danh sách policy
 */
export const listPolicies = async (
  _req: Request,
  res: Response<ApiResponse<unknown>>,
  next: NextFunction
) => {
  try {
    const data = await service.list();
    return sendSuccess(
      res,
      data.map(toPolicyResponseDto),
      200,
      "Lấy danh sách policy thành công"
    );
  } catch (err) {
    next(err);
  }
};

/**
 * Lấy chi tiết policy
 */
export const getPolicy = async (
  req: Request,
  res: Response<ApiResponse<unknown>>,
  next: NextFunction
) => {
  try {
    const id = String(req.params.id);
    const data = await service.get(id);
    if (!data) throw new HttpError(404, "Không tìm thấy policy");
    return sendSuccess(
      res,
      toPolicyResponseDto(data),
      200,
      "Lấy thông tin policy thành công"
    );
  } catch (err) {
    next(err);
  }
};

/**
 * Tạo policy mới
 */
export const createPolicy = async (
  req: Request,
  res: Response<ApiResponse<unknown>>,
  next: NextFunction
) => {
  try {
    const data = await service.create(req.body);
    return sendSuccess(
      res,
      toPolicyResponseDto(data),
      201,
      "Tạo policy thành công"
    );
  } catch (err) {
    next(err);
  }
};

/**
 * Cập nhật policy
 */
export const updatePolicy = async (
  req: Request,
  res: Response<ApiResponse<unknown>>,
  next: NextFunction
) => {
  try {
    const id = String(req.params.id);
    const data = await service.update(id, req.body);
    return sendSuccess(
      res,
      toPolicyResponseDto(data),
      200,
      "Cập nhật policy thành công"
    );
  } catch (err) {
    next(err);
  }
};

/**
 * Xoá policy
 */
export const deletePolicy = async (
  req: Request,
  res: Response<ApiResponse<unknown>>,
  next: NextFunction
) => {
  try {
    const id = String(req.params.id);
    await service.remove(id);
    return sendSuccess(res, null, 200, "Xoá policy thành công");
  } catch (err) {
    next(err);
  }
};
