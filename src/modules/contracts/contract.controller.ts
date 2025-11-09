import { Request, Response, NextFunction } from "express";
import { ApiResponse, sendSuccess } from "../../core/response";
import { HttpError } from "../../core/base";
import ContractService from "./contract.service";
import { toContractResponseDto } from "./contract.dto";

const service = new ContractService();

/**
 * Lấy danh sách hợp đồng
 */
export const listContracts = async (
  _req: Request,
  res: Response<ApiResponse<unknown>>,
  next: NextFunction
) => {
  try {
    const data = await service.list();
    return sendSuccess(
      res,
      data.map(toContractResponseDto),
      200,
      "Lấy danh sách hợp đồng thành công"
    );
  } catch (err) {
    next(err);
  }
};

/**
 * Lấy chi tiết hợp đồng
 */
export const getContract = async (
  req: Request,
  res: Response<ApiResponse<unknown>>,
  next: NextFunction
) => {
  try {
    const id = String(req.params.id);
    const data = await service.get(id);
    if (!data) throw new HttpError(404, "Không tìm thấy hợp đồng");
    return sendSuccess(
      res,
      toContractResponseDto(data),
      200,
      "Lấy thông tin hợp đồng thành công"
    );
  } catch (err) {
    next(err);
  }
};

/**
 * Tạo mới hợp đồng
 */
export const createContract = async (
  req: Request,
  res: Response<ApiResponse<unknown>>,
  next: NextFunction
) => {
  try {
    const data = await service.create(req.body);
    return sendSuccess(
      res,
      toContractResponseDto(data),
      201,
      "Tạo hợp đồng thành công"
    );
  } catch (err) {
    next(err);
  }
};

/**
 * Cập nhật hợp đồng
 */
export const updateContract = async (
  req: Request,
  res: Response<ApiResponse<unknown>>,
  next: NextFunction
) => {
  try {
    const id = String(req.params.id);
    const data = await service.update(id, req.body);
    return sendSuccess(
      res,
      toContractResponseDto(data),
      200,
      "Cập nhật hợp đồng thành công"
    );
  } catch (err) {
    next(err);
  }
};

/**
 * Xoá hợp đồng
 */
export const deleteContract = async (
  req: Request,
  res: Response<ApiResponse<unknown>>,
  next: NextFunction
) => {
  try {
    const id = String(req.params.id);
    await service.remove(id);
    return sendSuccess(res, null, 200, "Xoá hợp đồng thành công");
  } catch (err) {
    next(err);
  }
};
