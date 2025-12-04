import { Request, Response, NextFunction } from "express";
import { ApiResponse, sendSuccess } from "../../core/response";
import { HttpError } from "../../core/base";
import SalaryRequestService from "./salary-request.service";
import { toSalaryRequestResponseDto } from "./salary-request.dto";
import { parsePaginationQuery } from "../../utils/query.utils";

const service = new SalaryRequestService();

/**
 * Lấy danh sách yêu cầu tăng/điều chỉnh lương
 */
export const listSalaryRequests = async (
  req: Request,
  res: Response<ApiResponse<unknown>>,
  next: NextFunction
) => {
  try {
    const query = parsePaginationQuery(req);
    const data = await service.listPaginated(query);
    return sendSuccess(
      res,
      { items: data.data.map(toSalaryRequestResponseDto), ...data.meta },
      200,
      "Lấy danh sách yêu cầu lương thành công"
    );
  } catch (err) {
    next(err);
  }
};

/**
 * Lấy chi tiết yêu cầu
 */
export const getSalaryRequest = async (
  req: Request,
  res: Response<ApiResponse<unknown>>,
  next: NextFunction
) => {
  try {
    const id = String(req.params.id);
    const data = await service.get(id);
    if (!data) throw new HttpError(404, "Không tìm thấy yêu cầu lương");
    return sendSuccess(
      res,
      toSalaryRequestResponseDto(data),
      200,
      "Lấy thông tin yêu cầu lương thành công"
    );
  } catch (err) {
    next(err);
  }
};

/**
 * Tạo mới yêu cầu lương
 */
export const createSalaryRequest = async (
  req: Request,
  res: Response<ApiResponse<unknown>>,
  next: NextFunction
) => {
  try {
    const currentUser = (req as any).user;
    const data = await service.create(req.body, currentUser);
    return sendSuccess(
      res,
      toSalaryRequestResponseDto(data),
      201,
      "Tạo yêu cầu lương thành công"
    );
  } catch (err) {
    next(err);
  }
};

/**
 * Cập nhật yêu cầu
 */
export const updateSalaryRequest = async (
  req: Request,
  res: Response<ApiResponse<unknown>>,
  next: NextFunction
) => {
  try {
    const id = String(req.params.id);
    const data = await service.update(id, req.body);
    return sendSuccess(
      res,
      toSalaryRequestResponseDto(data),
      200,
      "Cập nhật yêu cầu lương thành công"
    );
  } catch (err) {
    next(err);
  }
};

/**
 * Xóa yêu cầu
 */
export const deleteSalaryRequest = async (
  req: Request,
  res: Response<ApiResponse<unknown>>,
  next: NextFunction
) => {
  try {
    const id = String(req.params.id);
    await service.remove(id);
    return sendSuccess(res, null, 200, "Xoá yêu cầu lương thành công");
  } catch (err) {
    next(err);
  }
};

export const approveSalaryRequest = async (
  req: Request,
  res: Response<ApiResponse<unknown>>,
  next: NextFunction
) => {
  try {
    const { approved_by, manager_note } = req.body;
    const data = await service.approve(req.params.id, approved_by, manager_note);
    return sendSuccess(
      res,
      toSalaryRequestResponseDto(data),
      200,
      "Duyệt yêu cầu thành công"
    );
  } catch (err) {
    next(err);
  }
};

export const rejectSalaryRequest = async (
  req: Request,
  res: Response<ApiResponse<unknown>>,
  next: NextFunction
) => {
  try {
    const { rejected_by, manager_note } = req.body;
    const data = await service.reject(req.params.id, rejected_by, manager_note);
    return sendSuccess(
      res,
      toSalaryRequestResponseDto(data),
      200,
      "Từ chối yêu cầu thành công"
    );
  } catch (err) {
    next(err);
  }
};
