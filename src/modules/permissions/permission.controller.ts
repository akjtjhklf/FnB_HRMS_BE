import { Request, Response, NextFunction } from "express";
import { ApiResponse, sendSuccess } from "../../core/response";
import { HttpError } from "../../core/base";
import PermissionService from "./permission.service";
import { toPermissionResponseDto } from "./permission.dto";

const service = new PermissionService();

/**
 * Lấy danh sách quyền
 */
export const listPermissions = async (
  _req: Request,
  res: Response<ApiResponse<unknown>>,
  next: NextFunction
) => {
  try {
    const data = await service.list();
    return sendSuccess(
      res,
      data.map(toPermissionResponseDto),
      200,
      "Lấy danh sách quyền thành công"
    );
  } catch (err) {
    next(err);
  }
};

/**
 * Lấy chi tiết quyền
 */
export const getPermission = async (
  req: Request,
  res: Response<ApiResponse<unknown>>,
  next: NextFunction
) => {
  try {
    const id = req.params.id;
    const data = await service.get(id);
    return sendSuccess(
      res,
      toPermissionResponseDto(data),
      200,
      "Lấy thông tin quyền thành công"
    );
  } catch (err) {
    next(err);
  }
};

/**
 * Tạo quyền mới
 */
export const createPermission = async (
  req: Request,
  res: Response<ApiResponse<unknown>>,
  next: NextFunction
) => {
  try {
    const data = await service.create(req.body);
    return sendSuccess(
      res,
      toPermissionResponseDto(data),
      201,
      "Tạo quyền thành công"
    );
  } catch (err) {
    next(err);
  }
};

/**
 * Cập nhật quyền
 */
export const updatePermission = async (
  req: Request,
  res: Response<ApiResponse<unknown>>,
  next: NextFunction
) => {
  try {
    const id = req.params.id;
    const data = await service.update(id, req.body);
    return sendSuccess(
      res,
      toPermissionResponseDto(data),
      200,
      "Cập nhật quyền thành công"
    );
  } catch (err) {
    next(err);
  }
};

/**
 * Xoá quyền
 */
export const deletePermission = async (
  req: Request,
  res: Response<ApiResponse<unknown>>,
  next: NextFunction
) => {
  try {
    const id = req.params.id;
    await service.remove(id);
    return sendSuccess(res, null, 200, "Xoá quyền thành công");
  } catch (err) {
    next(err);
  }
};
