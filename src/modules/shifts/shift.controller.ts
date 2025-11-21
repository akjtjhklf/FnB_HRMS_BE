import { Request, Response, NextFunction } from "express";
import { ApiResponse, sendSuccess } from "../../core/response";
import { HttpError } from "../../core/base";
import ShiftService from "./shift.service";
import { toShiftResponseDto } from "./shift.dto";
import { parsePaginationQuery } from "../../utils/query.utils";

const service = new ShiftService();

/**
 * Lấy danh sách ca làm việc
 */
export const listShifts = async (
  req: Request,
  res: Response<ApiResponse<unknown>>,
  next: NextFunction
) => {
  try {
    const query = parsePaginationQuery(req);
    console.log('🔍 [Shifts Controller] Parsed query:', JSON.stringify(query, null, 2));
    const result = await service.listPaginated(query);
    
    return sendSuccess(
      res,
      {
        items: result.data.map(toShiftResponseDto),
        ...result.meta,
      },
      200,
      "Lấy danh sách ca làm việc thành công"
    );
  } catch (err) {
    next(err);
  }
};

/**
 * Lấy chi tiết ca làm việc
 */
export const getShift = async (
  req: Request,
  res: Response<ApiResponse<unknown>>,
  next: NextFunction
) => {
  try {
    const id = String(req.params.id);
    const data = await service.get(id);
    if (!data) throw new HttpError(404, "Không tìm thấy ca làm việc");
    return sendSuccess(
      res,
      toShiftResponseDto(data),
      200,
      "Lấy thông tin ca làm việc thành công"
    );
  } catch (err) {
    next(err);
  }
};

/**
 * Tạo ca làm việc mới
 */
export const createShift = async (
  req: Request,
  res: Response<ApiResponse<unknown>>,
  next: NextFunction
) => {
  try {
    const data = await service.create(req.body);
    return sendSuccess(
      res,
      toShiftResponseDto(data),
      201,
      "Tạo ca làm việc thành công"
    );
  } catch (err) {
    next(err);
  }
};

/**
 * Cập nhật ca làm việc
 */
export const updateShift = async (
  req: Request,
  res: Response<ApiResponse<unknown>>,
  next: NextFunction
) => {
  try {
    const id = String(req.params.id);
    const data = await service.update(id, req.body);
    return sendSuccess(
      res,
      toShiftResponseDto(data),
      200,
      "Cập nhật ca làm việc thành công"
    );
  } catch (err) {
    next(err);
  }
};

/**
 * Xoá ca làm việc
 */
export const deleteShift = async (
  req: Request,
  res: Response<ApiResponse<unknown>>,
  next: NextFunction
) => {
  try {
    const id = String(req.params.id);
    await service.remove(id);
    return sendSuccess(res, null, 200, "Xoá ca làm việc thành công");
  } catch (err) {
    next(err);
  }
};

/**
 * ============================================
 * 📦 TẠO NHIỀU CA CÙNG LÚC - BULK CREATE
 * ============================================
 * POST /api/shifts/bulk
 * Body: {
 *   shifts: CreateShiftDto[]
 * }
 */
export const createBulkShifts = async (
  req: Request,
  res: Response<ApiResponse<unknown>>,
  next: NextFunction
) => {
  try {
    const { shifts } = req.body;
    console.log(`📦 Received bulk create request for ${shifts?.length || 0} shifts`);
    console.log("📝 First shift sample:", JSON.stringify(shifts?.[0], null, 2));
    console.log("📝 Last shift sample:", JSON.stringify(shifts?.[shifts?.length - 1], null, 2));

    if (!Array.isArray(shifts) || shifts.length === 0) {
      throw new HttpError(400, "shifts phải là mảng và không được rỗng");
    }

    const createdShifts = await service.createBulk(shifts);
    console.log(`✅ Successfully created ${createdShifts.length} shifts`);
    console.log(`📋 Created shift IDs:`, createdShifts.map((s: any) => s.id));
    
    const responseData = {
      total: createdShifts.length,
      shifts: createdShifts.map(toShiftResponseDto),
    };
    
    console.log(`📤 Sending response with ${responseData.shifts.length} shifts`);
    console.log(`📤 First shift in response:`, responseData.shifts[0]?.id);
    console.log(`📤 Last shift in response:`, responseData.shifts[responseData.shifts.length - 1]?.id);

    return sendSuccess(
      res,
      responseData,
      201,
      `Tạo thành công ${createdShifts.length} ca làm việc`
    );
  } catch (err) {
    console.error("❌ Bulk create error:", err);
    next(err);
  }
};
