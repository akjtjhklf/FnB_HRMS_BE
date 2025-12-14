  import { Request, Response, NextFunction } from "express";
  import { ApiResponse, sendSuccess } from "../../core/response";
  import { HttpError } from "../../core/base";
  import UserService from "./user.service";
  import { toUserResponseDto } from "./user.dto";
  import { parsePaginationQuery } from "../../utils/query.utils";

  const service = new UserService();

  /**
   * Lấy danh sách người dùng
   */
  export const listUsers = async (
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
          items: result.data.map(toUserResponseDto),
          ...result.meta,
        },
        200,
        "Lấy danh sách người dùng thành công"
      );
    } catch (err) {
      next(err);
    }
  };

  /**
   * Lấy chi tiết người dùng
   */
  export const getUser = async (
    req: Request,
    res: Response<ApiResponse<unknown>>,
    next: NextFunction
  ) => {
    try {
      const id = String(req.params.id);
      const data = await service.get(id);
      if (!data) throw new HttpError(404, "Không tìm thấy người dùng");
      return sendSuccess(
        res,
        toUserResponseDto(data),
        200,
        "Lấy thông tin người dùng thành công"
      );
    } catch (err) {
      next(err);
    }
  };

  /**
   * Tạo người dùng mới
   */
  export const createUser = async (
    req: Request,
    res: Response<ApiResponse<unknown>>,
    next: NextFunction
  ) => {
    try {
      const data = await service.create(req.body);
      return sendSuccess(
        res,
        toUserResponseDto(data),
        201,
        "Tạo người dùng thành công"
      );
    } catch (err) {
      next(err);
    }
  };

  /**
   * Cập nhật người dùng
   */
  export const updateUser = async (
    req: Request,
    res: Response<ApiResponse<unknown>>,
    next: NextFunction
  ) => {
    try {
      const id = String(req.params.id);
      const data = await service.update(id, req.body);
      return sendSuccess(
        res,
        toUserResponseDto(data),
        200,
        "Cập nhật thông tin người dùng thành công"
      );
    } catch (err) {
      next(err);
    }
  };

  /**
   * Xoá người dùng
   */
  export const deleteUser = async (
    req: Request,
    res: Response<ApiResponse<unknown>>,
    next: NextFunction
  ) => {
    try {
      const id = String(req.params.id);
      await service.remove(id);
      return sendSuccess(res, null, 200, "Xoá người dùng thành công");
    } catch (err) {
      next(err);
    }
  };

  /**
   * Lấy thông tin user hiện tại (authenticated user)
   * Bao gồm Employee, Role, Policies, và Permissions
   */
  export const getMe = async (
    req: Request,
    res: Response<ApiResponse<unknown>>,
    next: NextFunction
  ) => {
    try {
      const directusClient = (req as any).directusClient;
      
      if (!directusClient) {
        throw new HttpError(401, "Unauthorized", "UNAUTHORIZED");
      }

      // Sử dụng service để lấy full identity
      const identity = await service.getCurrentUser(directusClient);

      return sendSuccess(
        res,
        identity,
        200,
        "Lấy thông tin người dùng hiện tại thành công"
      );
    } catch (err) {
      next(err);
    }
  };
