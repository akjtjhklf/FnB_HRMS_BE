import { Request, Response, NextFunction } from "express";
import { ApiResponse, sendSuccess } from "../../core/response";
import MonthlyPayrollService from "./monthly-payroll.service";
import { toMonthlyPayrollResponseDto } from "./monthly-payroll.dto";
import { parsePaginationQuery } from "../../utils/query.utils";

const service = new MonthlyPayrollService();

/**
 * Lấy danh sách bảng lương với pagination, filter, sort, search
 */
export const listMonthlyPayrolls = async (
  req: Request,
  res: Response<ApiResponse<unknown>>,
  next: NextFunction
) => {
  try {
    const { month, status } = req.query;
    
    // Luôn dùng pagination format để tương thích với dataProvider
    const query = parsePaginationQuery(req);
    
    // Add month/status vào filter nếu có
    if (month && typeof month === "string") {
      query.filter = query.filter || {};
      query.filter.month = { _eq: month };
    }
    if (status && typeof status === "string") {
      query.filter = query.filter || {};
      query.filter.status = { _eq: status };
    }
    
    const result = await service.listPaginated(query);
    
    return sendSuccess(
      res,
      {
        items: result.data.map(toMonthlyPayrollResponseDto),
        ...result.meta,
      },
      200,
      "Lấy danh sách bảng lương thành công"
    );
  } catch (err) {
    next(err);
  }
};

export const getMonthlyPayroll = async (
  req: Request,
  res: Response<ApiResponse<unknown>>,
  next: NextFunction
) => {
  try {
    const data = await service.get(req.params.id);
    return sendSuccess(
      res,
      toMonthlyPayrollResponseDto(data),
      200,
      "Lấy chi tiết bảng lương thành công"
    );
  } catch (err) {
    next(err);
  }
};

export const createMonthlyPayroll = async (
  req: Request,
  res: Response<ApiResponse<unknown>>,
  next: NextFunction
) => {
  try {
    const data = await service.create(req.body);
    return sendSuccess(
      res,
      toMonthlyPayrollResponseDto(data),
      201,
      "Tạo bảng lương thành công"
    );
  } catch (err) {
    next(err);
  }
};

export const updateMonthlyPayroll = async (
  req: Request,
  res: Response<ApiResponse<unknown>>,
  next: NextFunction
) => {
  try {
    const data = await service.update(req.params.id, req.body);
    return sendSuccess(
      res,
      toMonthlyPayrollResponseDto(data),
      200,
      "Cập nhật bảng lương thành công"
    );
  } catch (err) {
    next(err);
  }
};

export const deleteMonthlyPayroll = async (
  req: Request,
  res: Response<ApiResponse<unknown>>,
  next: NextFunction
) => {
  try {
    await service.remove(req.params.id);
    return sendSuccess(res, null, 200, "Xoá bảng lương thành công");
  } catch (err) {
    next(err);
  }
};

export const approveMonthlyPayroll = async (
  req: Request,
  res: Response<ApiResponse<unknown>>,
  next: NextFunction
) => {
  try {
    const { approved_by } = req.body;
    const data = await service.approve(req.params.id, approved_by);
    return sendSuccess(
      res,
      toMonthlyPayrollResponseDto(data),
      200,
      "Phê duyệt bảng lương thành công"
    );
  } catch (err) {
    next(err);
  }
};

export const markMonthlyPayrollAsPaid = async (
  req: Request,
  res: Response<ApiResponse<unknown>>,
  next: NextFunction
) => {
  try {
    const data = await service.markAsPaid(req.params.id);
    return sendSuccess(
      res,
      toMonthlyPayrollResponseDto(data),
      200,
      "Đánh dấu đã thanh toán thành công"
    );
  } catch (err) {
    next(err);
  }
};
