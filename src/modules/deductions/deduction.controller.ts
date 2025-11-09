import { Request, Response, NextFunction } from "express";
import { ApiResponse, sendSuccess } from "../../core/response";
import DeductionService from "./deduction.service";
import { toDeductionResponseDto } from "./deduction.dto";
import { HttpError } from "../../core/base";

const service = new DeductionService();

export const listDeductions = async (
  _req: Request,
  res: Response<ApiResponse<unknown>>,
  next: NextFunction
) => {
  try {
    const data = await service.list();
    return sendSuccess(
      res,
      data.map(toDeductionResponseDto),
      200,
      "Lấy danh sách deductions thành công"
    );
  } catch (err) {
    next(err);
  }
};

export const getDeduction = async (
  req: Request,
  res: Response<ApiResponse<unknown>>,
  next: NextFunction
) => {
  try {
    const id = String(req.params.id);
    const data = await service.get(id);
    if (!data) throw new HttpError(404, "Không tìm thấy deduction");
    return sendSuccess(
      res,
      toDeductionResponseDto(data),
      200,
      "Lấy thông tin deduction thành công"
    );
  } catch (err) {
    next(err);
  }
};

export const createDeduction = async (
  req: Request,
  res: Response<ApiResponse<unknown>>,
  next: NextFunction
) => {
  try {
    const data = await service.create(req.body);
    return sendSuccess(
      res,
      toDeductionResponseDto(data),
      201,
      "Tạo deduction thành công"
    );
  } catch (err) {
    next(err);
  }
};

export const updateDeduction = async (
  req: Request,
  res: Response<ApiResponse<unknown>>,
  next: NextFunction
) => {
  try {
    const id = String(req.params.id);
    const data = await service.update(id, req.body);
    return sendSuccess(
      res,
      toDeductionResponseDto(data),
      200,
      "Cập nhật deduction thành công"
    );
  } catch (err) {
    next(err);
  }
};

export const deleteDeduction = async (
  req: Request,
  res: Response<ApiResponse<unknown>>,
  next: NextFunction
) => {
  try {
    const id = String(req.params.id);
    await service.remove(id);
    return sendSuccess(res, null, 200, "Xoá deduction thành công");
  } catch (err) {
    next(err);
  }
};
