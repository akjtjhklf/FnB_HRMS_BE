import { Request, Response, NextFunction } from "express";
import { ApiResponse, sendSuccess } from "../../core/response";
import { HttpError } from "../../core/base";
import DeviceService from "./device.service";
import { toDeviceResponseDto } from "./device.dto";

const service = new DeviceService();

export const listDevices = async (
  _req: Request,
  res: Response<ApiResponse<unknown>>,
  next: NextFunction
) => {
  try {
    const data = await service.list();
    return sendSuccess(
      res,
      data.map(toDeviceResponseDto),
      200,
      "Lấy danh sách thiết bị thành công"
    );
  } catch (err) {
    next(err);
  }
};

export const getDevice = async (
  req: Request,
  res: Response<ApiResponse<unknown>>,
  next: NextFunction
) => {
  try {
    const id = String(req.params.id);
    const data = await service.get(id);
    if (!data) throw new HttpError(404, "Không tìm thấy thiết bị");
    return sendSuccess(res, toDeviceResponseDto(data), 200, "Thành công");
  } catch (err) {
    next(err);
  }
};

export const createDevice = async (
  req: Request,
  res: Response<ApiResponse<unknown>>,
  next: NextFunction
) => {
  try {
    const data = await service.create(req.body);
    return sendSuccess(
      res,
      toDeviceResponseDto(data),
      201,
      "Tạo thiết bị thành công"
    );
  } catch (err) {
    next(err);
  }
};

export const updateDevice = async (
  req: Request,
  res: Response<ApiResponse<unknown>>,
  next: NextFunction
) => {
  try {
    const id = String(req.params.id);
    const data = await service.update(id, req.body);
    return sendSuccess(
      res,
      toDeviceResponseDto(data),
      200,
      "Cập nhật thành công"
    );
  } catch (err) {
    next(err);
  }
};

export const deleteDevice = async (
  req: Request,
  res: Response<ApiResponse<unknown>>,
  next: NextFunction
) => {
  try {
    const id = String(req.params.id);
    await service.remove(id);
    return sendSuccess(res, null, 200, "Xóa thiết bị thành công");
  } catch (err) {
    next(err);
  }
};
