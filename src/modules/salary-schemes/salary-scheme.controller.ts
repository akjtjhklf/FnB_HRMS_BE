import { Request, Response, NextFunction } from "express";
import { ApiResponse, sendSuccess } from "../../core/response";
import { HttpError } from "../../core/base";
import SalarySchemeService from "./salary-scheme.service";
import { toSalarySchemeResponseDto } from "./salary-scheme.dto";

const service = new SalarySchemeService();

/**
 * Lấy danh sách chế độ lương
 */
export const listSalarySchemes = async (
  _req: Request,
  res: Response<ApiResponse<unknown>>,
  next: NextFunction
) => {
  try {
    const data = await service.list();
    return sendSuccess(
      res,
      data.map(toSalarySchemeResponseDto),
      200,
      "Lấy danh sách chế độ lương thành công"
    );
  } catch (err) {
    next(err);
  }
};

/**
 * Lấy chi tiết chế độ lương
 */
export const getSalaryScheme = async (
  req: Request,
  res: Response<ApiResponse<unknown>>,
  next: NextFunction
) => {
  try {
    const id = String(req.params.id);
    const data = await service.get(id);
    if (!data) throw new HttpError(404, "Không tìm thấy chế độ lương");
    return sendSuccess(
      res,
      toSalarySchemeResponseDto(data),
      200,
      "Lấy thông tin chế độ lương thành công"
    );
  } catch (err) {
    next(err);
  }
};

/**
 * Tạo chế độ lương
 */
export const createSalaryScheme = async (
  req: Request,
  res: Response<ApiResponse<unknown>>,
  next: NextFunction
) => {
  try {
    const data = await service.create(req.body);
    return sendSuccess(
      res,
      toSalarySchemeResponseDto(data),
      201,
      "Tạo chế độ lương thành công"
    );
  } catch (err) {
    next(err);
  }
};

/**
 * Cập nhật chế độ lương
 */
export const updateSalaryScheme = async (
  req: Request,
  res: Response<ApiResponse<unknown>>,
  next: NextFunction
) => {
  try {
    const id = String(req.params.id);
    const data = await service.update(id, req.body);
    return sendSuccess(
      res,
      toSalarySchemeResponseDto(data),
      200,
      "Cập nhật chế độ lương thành công"
    );
  } catch (err) {
    next(err);
  }
};

/**
 * Xoá chế độ lương
 */
export const deleteSalaryScheme = async (
  req: Request,
  res: Response<ApiResponse<unknown>>,
  next: NextFunction
) => {
  try {
    const id = String(req.params.id);
    await service.remove(id);
    return sendSuccess(res, null, 200, "Xoá chế độ lương thành công");
  } catch (err) {
    next(err);
  }
};
