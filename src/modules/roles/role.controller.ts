import { Request, Response, NextFunction } from "express";
import { ApiResponse, sendSuccess } from "../../core/response";
import { HttpError } from "../../core/base";
import RoleService from "./role.service";
import { toRoleResponseDto } from "./role.dto";

const service = new RoleService();

/**
 * Lấy danh sách role
 */
export const listRoles = async (
  _req: Request,
  res: Response<ApiResponse<unknown>>,
  next: NextFunction
) => {
  try {
    const data = await service.list();
    return sendSuccess(
      res,
      data.map(toRoleResponseDto),
      200,
      "Lấy danh sách role thành công"
    );
  } catch (err) {
    next(err);
  }
};

/**
 * Lấy chi tiết role
 */
export const getRole = async (
  req: Request,
  res: Response<ApiResponse<unknown>>,
  next: NextFunction
) => {
  try {
    const id = String(req.params.id);
    const data = await service.get(id);
    if (!data) throw new HttpError(404, "Không tìm thấy role");
    return sendSuccess(
      res,
      toRoleResponseDto(data),
      200,
      "Lấy role thành công"
    );
  } catch (err) {
    next(err);
  }
};

/**
 * Tạo role mới
 */
export const createRole = async (
  req: Request,
  res: Response<ApiResponse<unknown>>,
  next: NextFunction
) => {
  try {
    const data = await service.create(req.body);
    return sendSuccess(
      res,
      toRoleResponseDto(data),
      201,
      "Tạo role thành công"
    );
  } catch (err) {
    next(err);
  }
};

/**
 * Cập nhật role
 */
export const updateRole = async (
  req: Request,
  res: Response<ApiResponse<unknown>>,
  next: NextFunction
) => {
  try {
    const id = String(req.params.id);
    const data = await service.update(id, req.body);
    return sendSuccess(
      res,
      toRoleResponseDto(data),
      200,
      "Cập nhật role thành công"
    );
  } catch (err) {
    next(err);
  }
};

/**
 * Xoá role
 */
export const deleteRole = async (
  req: Request,
  res: Response<ApiResponse<unknown>>,
  next: NextFunction
) => {
  try {
    const id = String(req.params.id);
    await service.remove(id);
    return sendSuccess(res, null, 200, "Xoá role thành công");
  } catch (err) {
    next(err);
  }
};
