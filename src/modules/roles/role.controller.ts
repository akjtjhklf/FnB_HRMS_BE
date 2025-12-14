import { Request, Response, NextFunction } from "express";
import { ApiResponse, sendSuccess } from "../../core/response";
import { HttpError } from "../../core/base";
import RoleService from "./role.service";
import { toRoleResponseDto } from "./role.dto";
import { parsePaginationQuery } from "../../utils/query.utils";
import DirectusAccessService from "../../core/services/directus-access.service";

const service = new RoleService();

/**
 * Lấy danh sách role
 */
export const listRoles = async (
  req: Request,
  res: Response<ApiResponse<unknown>>,
  next: NextFunction
) => {
  try {
    const query = parsePaginationQuery(req);
    const data = await service.listPaginated(query);
    return sendSuccess(
      res,
      { items: data.data.map(toRoleResponseDto), ...data.meta },
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

/**
 * Lấy danh sách policies của role
 */
export const getRolePolicies = async (
  req: Request,
  res: Response<ApiResponse<unknown>>,
  next: NextFunction
) => {
  try {
    const roleId = String(req.params.id);
    const policies = await DirectusAccessService.getRolePolicies(roleId);
    return sendSuccess(
      res,
      policies,
      200,
      "Lấy policies của role thành công"
    );
  } catch (err) {
    next(err);
  }
};

/**
 * Gán policies cho role
 * Body: { policyIds: string[] }
 */
export const assignPoliciesToRole = async (
  req: Request,
  res: Response<ApiResponse<unknown>>,
  next: NextFunction
) => {
  try {
    const roleId = String(req.params.id);
    const { policyIds } = req.body;

    if (!Array.isArray(policyIds)) {
      throw new HttpError(400, "policyIds phải là một mảng");
    }

    // Replace all policies (remove old + add new)
    await DirectusAccessService.replaceRolePolicies(roleId, policyIds);

    return sendSuccess(
      res,
      { roleId, policyIds },
      200,
      "Gán policies cho role thành công"
    );
  } catch (err) {
    next(err);
  }
};

/**
 * Xoá policy khỏi role
 */
export const removeRolePolicy = async (
  req: Request,
  res: Response<ApiResponse<unknown>>,
  next: NextFunction
) => {
  try {
    const roleId = String(req.params.id);
    const policyId = String(req.params.policyId);

    await DirectusAccessService.removeRolePolicy(roleId, policyId);

    return sendSuccess(
      res,
      { roleId, policyId },
      200,
      "Xoá policy khỏi role thành công"
    );
  } catch (err) {
    next(err);
  }
};
