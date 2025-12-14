import { Request, Response, NextFunction } from "express";
import { ApiResponse, sendSuccess } from "../../core/response";
import { CollectionService } from "./collection.service";

const collectionService = new CollectionService();

export const listCollections = async (
  req: Request,
  res: Response<ApiResponse<unknown>>,
  next: NextFunction
) => {
  try {
    const result = await collectionService.list();
    
    return sendSuccess(
      res,
      result,
      200,
      "Lấy danh sách collections thành công"
    );
  } catch (err) {
    next(err);
  }
};
