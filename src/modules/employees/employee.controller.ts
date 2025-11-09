import { Request, Response, NextFunction } from "express";
import { ApiResponse, sendSuccess } from "../../core/response";
import { HttpError } from "../../core/base";
import EmployeeService from "./employee.service";
import { toEmployeeResponseDto } from "./employee.dto";

const service = new EmployeeService();

/**
 * Lấy danh sách nhân viên
 */
export const listEmployees = async (
  _req: Request,
  res: Response<ApiResponse<unknown>>,
  next: NextFunction
) => {
  try {
    const data = await service.list();
    return sendSuccess(
      res,
      data.map(toEmployeeResponseDto),
      200,
      "Lấy danh sách nhân viên thành công"
    );
  } catch (err) {
    next(err);
  }
};

/**
 * Lấy chi tiết nhân viên
 */
export const getEmployee = async (
  req: Request,
  res: Response<ApiResponse<unknown>>,
  next: NextFunction
) => {
  try {
    const id = String(req.params.id);
    const data = await service.get(id);
    if (!data) throw new HttpError(404, "Không tìm thấy nhân viên");
    return sendSuccess(
      res,
      toEmployeeResponseDto(data),
      200,
      "Lấy thông tin nhân viên thành công"
    );
  } catch (err) {
    next(err);
  }
};

/**
 * Tạo nhân viên mới
 */
export const createEmployee = async (
  req: Request,
  res: Response<ApiResponse<unknown>>,
  next: NextFunction
) => {
  try {
    const data = await service.create(req.body);
    return sendSuccess(
      res,
      toEmployeeResponseDto(data),
      201,
      "Tạo nhân viên thành công"
    );
  } catch (err) {
    next(err);
  }
};

/**
 * Cập nhật nhân viên
 */
export const updateEmployee = async (
  req: Request,
  res: Response<ApiResponse<unknown>>,
  next: NextFunction
) => {
  try {
    const id = String(req.params.id);
    const data = await service.update(id, req.body);
    return sendSuccess(
      res,
      toEmployeeResponseDto(data),
      200,
      "Cập nhật thông tin nhân viên thành công"
    );
  } catch (err) {
    next(err);
  }
};

/**
 * Xoá nhân viên
 */
export const deleteEmployee = async (
  req: Request,
  res: Response<ApiResponse<unknown>>,
  next: NextFunction
) => {
  try {
    const id = String(req.params.id);
    await service.remove(id);
    return sendSuccess(res, null, 200, "Xoá nhân viên thành công");
  } catch (err) {
    next(err);
  }
};
