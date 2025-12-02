import { Request, Response, NextFunction } from "express";
import { ApiResponse, sendError, sendSuccess } from "../../core/response";
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
    
    const result = await service.listPaginated(query, (req as any).user);
    
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

export const generateMonthlyPayroll = async (
  req: Request,
  res: Response<ApiResponse<unknown>>,
  next: NextFunction
) => {
  try {
    const { month, employee_ids } = req.body;
    if (!month) {
      throw new Error("Month is required (YYYY-MM)");
    }
    
    console.log('🔄 Generating payroll for month:', month);
    const result = await service.generatePayroll(month, employee_ids);
    console.log('✅ Payroll generated:', result);
    
    return sendSuccess(
      res,
      result,
      201,
      "Tạo bảng lương thành công"
    );
  } catch (err) {
    console.error('❌ Generate payroll error:', err);
    console.error('Error stack:', err instanceof Error ? err.stack : 'No stack');
    next(err);
  }
};

/**
 * Lock payroll (set to pending_approval)
 */
export const lockMonthlyPayroll = async (
  req: Request,
  res: Response<ApiResponse<unknown>>,
  next: NextFunction
) => {
  try {
    const data = await service.lock(req.params.id);
    return sendSuccess(
      res,
      toMonthlyPayrollResponseDto(data),
      200,
      "Khóa bảng lương thành công"
    );
  } catch (err) {
    next(err);
  }
};

/**
 * Unlock payroll (set to draft)
 */
export const unlockMonthlyPayroll = async (
  req: Request,
  res: Response<ApiResponse<unknown>>,
  next: NextFunction
) => {
  try {
    const data = await service.unlock(req.params.id);
    return sendSuccess(
      res,
      toMonthlyPayrollResponseDto(data),
      200,
      "Mở khóa bảng lương thành công"
    );
  } catch (err) {
    next(err);
  }
};

/**
 * Gửi phiếu lương qua Novu (in-app notification)
 */
export const sendPayslip = async (
  req: Request,
  res: Response<ApiResponse<unknown>>,
  next: NextFunction
) => {
  try {
    const sentBy = (req as any).user?.id;
    const result = await service.sendPayslip(req.params.id, sentBy);
    return sendSuccess(res, result, 200, result.message);
  } catch (err) {
    next(err);
  }
};

/**
 * Gửi phiếu lương hàng loạt
 */
export const sendPayslipBulk = async (
  req: Request,
  res: Response<ApiResponse<unknown>>,
  next: NextFunction
) => {
  try {
    const { payrollIds } = req.body;
    if (!payrollIds || !Array.isArray(payrollIds) || payrollIds.length === 0) {
      return sendError(res, "Danh sách bảng lương không hợp lệ", 400);
    }
    const sentBy = (req as any).user?.id;
    const result = await service.sendPayslipBulk(payrollIds, sentBy);
    return sendSuccess(res, result, 200, `Đã gửi ${result.sent}/${payrollIds.length} phiếu lương`);
  } catch (err) {
    next(err);
  }
};
