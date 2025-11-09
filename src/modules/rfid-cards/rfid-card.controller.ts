import { Request, Response, NextFunction } from "express";
import { ApiResponse, sendSuccess } from "../../core/response";
import { HttpError } from "../../core/base";
import RFIDCardService from "./rfid-card.service";
import { toRFIDCardResponseDto } from "./rfid-card.dto";

const service = new RFIDCardService();

/**
 * Lấy danh sách thẻ RFID
 */
export const listRFIDCards = async (
  _req: Request,
  res: Response<ApiResponse<unknown>>,
  next: NextFunction
) => {
  try {
    const data = await service.list();
    return sendSuccess(
      res,
      data.map(toRFIDCardResponseDto),
      200,
      "Lấy danh sách thẻ RFID thành công"
    );
  } catch (err) {
    next(err);
  }
};

/**
 * Lấy chi tiết thẻ RFID
 */
export const getRFIDCard = async (
  req: Request,
  res: Response<ApiResponse<unknown>>,
  next: NextFunction
) => {
  try {
    const id = String(req.params.id);
    const data = await service.get(id);
    if (!data) throw new HttpError(404, "Không tìm thấy thẻ RFID");
    return sendSuccess(
      res,
      toRFIDCardResponseDto(data),
      200,
      "Lấy thông tin thẻ RFID thành công"
    );
  } catch (err) {
    next(err);
  }
};

/**
 * Tạo mới thẻ RFID
 */
export const createRFIDCard = async (
  req: Request,
  res: Response<ApiResponse<unknown>>,
  next: NextFunction
) => {
  try {
    const data = await service.create(req.body);
    return sendSuccess(
      res,
      toRFIDCardResponseDto(data),
      201,
      "Tạo thẻ RFID thành công"
    );
  } catch (err) {
    next(err);
  }
};

/**
 * Cập nhật thẻ RFID
 */
export const updateRFIDCard = async (
  req: Request,
  res: Response<ApiResponse<unknown>>,
  next: NextFunction
) => {
  try {
    const id = String(req.params.id);
    const data = await service.update(id, req.body);
    return sendSuccess(
      res,
      toRFIDCardResponseDto(data),
      200,
      "Cập nhật thẻ RFID thành công"
    );
  } catch (err) {
    next(err);
  }
};

/**
 * Xoá thẻ RFID
 */
export const deleteRFIDCard = async (
  req: Request,
  res: Response<ApiResponse<unknown>>,
  next: NextFunction
) => {
  try {
    const id = String(req.params.id);
    await service.remove(id);
    return sendSuccess(res, null, 200, "Xoá thẻ RFID thành công");
  } catch (err) {
    next(err);
  }
};
