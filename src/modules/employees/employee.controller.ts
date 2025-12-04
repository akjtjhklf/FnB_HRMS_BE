import { Request, Response, NextFunction } from "express";
import { ApiResponse, sendSuccess } from "../../core/response";
import { HttpError } from "../../core/base";
import EmployeeService from "./employee.service";
import { toEmployeeResponseDto } from "./employee.dto";
import { parsePaginationQuery } from "../../utils/query.utils";

const service = new EmployeeService();

/**
 * Lấy danh sách nhân viên với pagination, filter, sort, search
 */
export const listEmployees = async (
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
        items: result.data.map(toEmployeeResponseDto),
        ...result.meta,
      },
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
 * Tạo nhân viên đầy đủ (User + Access + Employee + RFID)
 */
export const createFullEmployee = async (
  req: Request,
  res: Response<ApiResponse<unknown>>,
  next: NextFunction
) => {
  try {
    const data = await service.createFull(req.body);
    return sendSuccess(
      res,
      toEmployeeResponseDto(data),
      201,
      "Tạo nhân viên đầy đủ thành công"
    );
  } catch (err) {
    next(err);
  }
};

/**
 * Cập nhật nhân viên đầy đủ (User + Access + Employee + RFID)
 */
export const updateFullEmployee = async (
  req: Request,
  res: Response<ApiResponse<unknown>>,
  next: NextFunction
) => {
  try {
    const id = String(req.params.id);
    const data = await service.updateFull(id, req.body);
    return sendSuccess(
      res,
      toEmployeeResponseDto(data),
      200,
      "Cập nhật thông tin nhân viên đầy đủ thành công"
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
