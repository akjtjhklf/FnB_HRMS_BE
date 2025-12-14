import { Request, Response, NextFunction } from "express";
import { ApiResponse, sendSuccess } from "../../core/response";
import { HttpError } from "../../core/base";
import MonthlyEmployeeStatService from "./monthly-employee-stat.service";
import { toMonthlyEmployeeStatResponseDto } from "./monthly-employee-stat.dto";
import { parsePaginationQuery } from "../../utils/query.utils";

const service = new MonthlyEmployeeStatService();

export const listMonthlyEmployeeStats = async (
  req: Request,
  res: Response<ApiResponse<unknown>>,
  next: NextFunction
) => {
  try {
    const query = parsePaginationQuery(req);
    const data = await service.listPaginated(query);
    return sendSuccess(
      res,
      {
        items: data.data.map(toMonthlyEmployeeStatResponseDto),
        ...data.meta,
      },
      200,
      "Lấy danh sách thống kê nhân viên thành công"
    );
  } catch (err) {
    next(err);
  }
};

export const getMonthlyEmployeeStat = async (
  req: Request,
  res: Response<ApiResponse<unknown>>,
  next: NextFunction
) => {
  try {
    const data = await service.get(req.params.id);
    return sendSuccess(
      res,
      toMonthlyEmployeeStatResponseDto(data),
      200,
      "Lấy chi tiết thống kê nhân viên thành công"
    );
  } catch (err) {
    next(err);
  }
};

export const createMonthlyEmployeeStat = async (
  req: Request,
  res: Response<ApiResponse<unknown>>,
  next: NextFunction
) => {
  try {
    const data = await service.create(req.body);
    return sendSuccess(
      res,
      toMonthlyEmployeeStatResponseDto(data),
      201,
      "Tạo thống kê nhân viên thành công"
    );
  } catch (err) {
    next(err);
  }
};

export const updateMonthlyEmployeeStat = async (
  req: Request,
  res: Response<ApiResponse<unknown>>,
  next: NextFunction
) => {
  try {
    const data = await service.update(req.params.id, req.body);
    return sendSuccess(
      res,
      toMonthlyEmployeeStatResponseDto(data),
      200,
      "Cập nhật thống kê nhân viên thành công"
    );
  } catch (err) {
    next(err);
  }
};

export const deleteMonthlyEmployeeStat = async (
  req: Request,
  res: Response<ApiResponse<unknown>>,
  next: NextFunction
) => {
  try {
    await service.remove(req.params.id);
    return sendSuccess(res, null, 200, "Xoá thống kê nhân viên thành công");
  } catch (err) {
    next(err);
  }
};
