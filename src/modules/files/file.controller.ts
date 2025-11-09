import { Request, Response, NextFunction } from "express";
import { ApiResponse, sendSuccess } from "../../core/response";
import { HttpError } from "../../core/base";
import FileService from "./file.service";
import { toFileResponseDto } from "./file.dto";

const service = new FileService();

export const listFiles = async (
  _req: Request,
  res: Response<ApiResponse<unknown>>,
  next: NextFunction
) => {
  try {
    const data = await service.list();
    return sendSuccess(
      res,
      data.map(toFileResponseDto),
      200,
      "Lấy danh sách file thành công"
    );
  } catch (err) {
    next(err);
  }
};

export const getFile = async (
  req: Request,
  res: Response<ApiResponse<unknown>>,
  next: NextFunction
) => {
  try {
    const file = await service.get(req.params.id);
    return sendSuccess(
      res,
      toFileResponseDto(file),
      200,
      "Lấy thông tin file thành công"
    );
  } catch (err) {
    next(err);
  }
};

export const uploadFile = async (
  req: Request,
  res: Response<ApiResponse<unknown>>,
  next: NextFunction
) => {
  try {
    const file = req.file;
    if (!file) throw new HttpError(400, "Thiếu file upload");
    const uploaded_by = req.body.uploaded_by;
    const data = await service.upload(file, uploaded_by);
    return sendSuccess(
      res,
      toFileResponseDto(data),
      201,
      "Tải file lên thành công"
    );
  } catch (err) {
    next(err);
  }
};

export const deleteFile = async (
  req: Request,
  res: Response<ApiResponse<unknown>>,
  next: NextFunction
) => {
  try {
    await service.remove(req.params.id);
    return sendSuccess(res, null, 200, "Xoá file thành công");
  } catch (err) {
    next(err);
  }
};
