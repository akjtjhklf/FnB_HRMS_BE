import { Request, Response, NextFunction } from "express";
import { ApiResponse, sendSuccess } from "../../core/response";
import { HttpError } from "../../core/base";
import ShiftPositionRequirementService from "./shift-position-requirement.service";
import { toShiftPositionRequirementResponseDto } from "./shift-position-requirement.dto";
import { parsePaginationQuery } from "../../utils/query.utils";

const service = new ShiftPositionRequirementService();

/**
 * Lấy danh sách yêu cầu vị trí ca làm
 */
export const listShiftPositionRequirements = async (
  req: Request,
  res: Response<ApiResponse<unknown>>,
  next: NextFunction
) => {
  try {
    const query = parsePaginationQuery(req);
    const result = await service.listPaginated(query);
    // Cast result to PaginatedResponse<ShiftPositionRequirement>
    return sendSuccess(
      res,
      {
        items: result.data.map(toShiftPositionRequirementResponseDto),
        ...result.meta,
      },
      200,
      "Lấy danh sách yêu cầu vị trí ca làm thành công"
    );
  } catch (err) {
    next(err);
  }
};

/**
 * Lấy chi tiết yêu cầu vị trí ca làm
 */
export const getShiftPositionRequirement = async (
  req: Request,
  res: Response<ApiResponse<unknown>>,
  next: NextFunction
) => {
  try {
    const id = String(req.params.id);
    const data = await service.get(id);
    if (!data) throw new HttpError(404, "Không tìm thấy yêu cầu vị trí ca làm");
    return sendSuccess(
      res,
      toShiftPositionRequirementResponseDto(data),
      200,
      "Lấy chi tiết yêu cầu vị trí ca làm thành công"
    );
  } catch (err) {
    next(err);
  }
};

/**
 * Tạo mới yêu cầu vị trí ca làm
 */
export const createShiftPositionRequirement = async (
  req: Request,
  res: Response<ApiResponse<unknown>>,
  next: NextFunction
) => {
  try {
    const data = await service.create(req.body);
    return sendSuccess(
      res,
      toShiftPositionRequirementResponseDto(data),
      201,
      "Tạo yêu cầu vị trí ca làm thành công"
    );
  } catch (err) {
    next(err);
  }
};

/**
 * Tạo nhiều yêu cầu vị trí ca làm cùng lúc
 */
export const createBulkShiftPositionRequirements = async (
  req: Request,
  res: Response<ApiResponse<unknown>>,
  next: NextFunction
) => {
  try {
    console.log("📦 Received bulk position requirements request");
    console.log("📊 Request body:", JSON.stringify(req.body, null, 2));
    
    const items = req.body;
    if (!Array.isArray(items)) {
      console.error("❌ Body is not an array:", typeof items);
      throw new HttpError(400, "Body phải là một mảng các yêu cầu vị trí");
    }
    
    console.log(`✅ Valid array with ${items.length} items`);
    const data = await service.createBulk(items);
    console.log(`✅ Created ${data.length} position requirements successfully`);
    
    return sendSuccess(
      res,
      data.map(toShiftPositionRequirementResponseDto),
      201,
      `Tạo thành công ${data.length} yêu cầu vị trí ca làm`
    );
  } catch (err) {
    console.error("❌ Error in createBulkShiftPositionRequirements:", err);
    next(err);
  }
};

/**
 * Cập nhật yêu cầu vị trí ca làm
 */
export const updateShiftPositionRequirement = async (
  req: Request,
  res: Response<ApiResponse<unknown>>,
  next: NextFunction
) => {
  try {
    const id = String(req.params.id);
    const data = await service.update(id, req.body);
    return sendSuccess(
      res,
      toShiftPositionRequirementResponseDto(data),
      200,
      "Cập nhật yêu cầu vị trí ca làm thành công"
    );
  } catch (err) {
    next(err);
  }
};

/**
 * Xoá yêu cầu vị trí ca làm
 */
export const deleteShiftPositionRequirement = async (
  req: Request,
  res: Response<ApiResponse<unknown>>,
  next: NextFunction
) => {
  try {
    const id = String(req.params.id);
    await service.remove(id);
    return sendSuccess(res, null, 200, "Xoá yêu cầu vị trí ca làm thành công");
  } catch (err) {
    next(err);
  }
};
