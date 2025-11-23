import { Request, Response, NextFunction } from "express";
import { ApiResponse, sendSuccess } from "../../core/response";
import { HttpError } from "../../core/base";
import ScheduleChangeRequestService from "./schedule-change-request.service";
import { toScheduleChangeRequestResponseDto } from "./schedule-change-request.dto";
import { parsePaginationQuery } from "../../utils/query.utils";

const service = new ScheduleChangeRequestService();

export const listScheduleChangeRequests = async (
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
        items: data.data.map(toScheduleChangeRequestResponseDto),
        ...data.meta,
      },
      200,
      "Lấy danh sách yêu cầu thay đổi lịch thành công"
    );
  } catch (err) {
    next(err);
  }
};

export const getScheduleChangeRequest = async (
  req: Request,
  res: Response<ApiResponse<unknown>>,
  next: NextFunction
) => {
  try {
    const id = String(req.params.id);
    const data = await service.get(id);
    if (!data) throw new HttpError(404, "Không tìm thấy yêu cầu");
    return sendSuccess(
      res,
      toScheduleChangeRequestResponseDto(data),
      200,
      "Lấy chi tiết yêu cầu thành công"
    );
  } catch (err) {
    next(err);
  }
};

export const createScheduleChangeRequest = async (
  req: Request,
  res: Response<ApiResponse<unknown>>,
  next: NextFunction
) => {
  try {
    const data = await service.create(req.body);
    return sendSuccess(
      res,
      toScheduleChangeRequestResponseDto(data),
      201,
      "Tạo yêu cầu thay đổi lịch thành công"
    );
  } catch (err) {
    next(err);
  }
};

export const updateScheduleChangeRequest = async (
  req: Request,
  res: Response<ApiResponse<unknown>>,
  next: NextFunction
) => {
  try {
    const id = String(req.params.id);
    const data = await service.update(id, req.body);
    return sendSuccess(
      res,
      toScheduleChangeRequestResponseDto(data),
      200,
      "Cập nhật yêu cầu thành công"
    );
  } catch (err) {
    next(err);
  }
};

export const deleteScheduleChangeRequest = async (
  req: Request,
  res: Response<ApiResponse<unknown>>,
  next: NextFunction
) => {
  try {
    const id = String(req.params.id);
    await service.remove(id);
    return sendSuccess(res, null, 200, "Xoá yêu cầu thành công");
  } catch (err) {
    next(err);
  }
};

/**
 * ============================================
 * ✅ DUYỆT YÊU CẦU ĐỔI CA - APPROVE WITH AUTO SWAP
 * ============================================
 * POST /api/schedule-change-requests/:id/approve
 * 
 * Tính năng:
 * - Duyệt yêu cầu đổi ca
 * - Tự động hoán đổi assignments giữa 2 nhân viên
 * - Cập nhật trạng thái thành "approved"
 */
export const approveChangeRequest = async (
  req: Request,
  res: Response<ApiResponse<unknown>>,
  next: NextFunction
) => {
  try {
    const id = String(req.params.id);
    const userId = (req as any).user?.id; // Người duyệt

    const result = await service.approveAndSwap(id, userId);

    return sendSuccess(
      res,
      result,
      200,
      "Duyệt yêu cầu và hoán đổi ca thành công"
    );
  } catch (err) {
    next(err);
  }
};

/**
 * ============================================
 * ❌ TỪ CHỐI YÊU CẦU ĐỔI CA
 * ============================================
 * POST /api/schedule-change-requests/:id/reject
 * Body: { reason?: string }
 */
export const rejectChangeRequest = async (
  req: Request,
  res: Response<ApiResponse<unknown>>,
  next: NextFunction
) => {
  try {
    const id = String(req.params.id);
    const { reason } = req.body;
    const userId = (req as any).user?.id;

    const result = await service.reject(id, userId, reason);

    return sendSuccess(
      res,
      toScheduleChangeRequestResponseDto(result),
      200,
      "Từ chối yêu cầu thành công"
    );
  } catch (err) {
    next(err);
  }
};
