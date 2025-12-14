import { BaseService, HttpError } from "../../core/base";
import {
  PaginatedResponse,
  PaginationQueryDto,
} from "../../core/dto/pagination.dto";
import { AttendanceShift } from "./attendance-shift.model";
import AttendanceShiftRepository from "./attendance-shift.repository";
import crypto from "crypto";

export class AttendanceShiftService extends BaseService<AttendanceShift> {
  constructor(repo = new AttendanceShiftRepository()) {
    super(repo);
  }

  /**
   * Lấy danh sách bản ghi
   */
  async list(query?: Record<string, unknown>) {
    return await this.repo.findAll(query);
  }

  async listPaginated(
    query: PaginationQueryDto
  ): Promise<PaginatedResponse<AttendanceShift>> {
    return await (this.repo as AttendanceShiftRepository).findAllPaginated(
      query
    );
  }

  /**
   * Lấy chi tiết theo ID
   */
  async get(id: string) {
    const record = await this.repo.findById(id);
    if (!record)
      throw new HttpError(404, "Không tìm thấy ca làm việc", "SHIFT_NOT_FOUND");
    return record;
  }

  /**
   * Tạo bản ghi mới — auto UUID nếu backend không tự sinh
   */
  async create(data: Partial<AttendanceShift>) {
    if (!data.employee_id)
      throw new HttpError(400, "Thiếu employee_id", "BAD_REQUEST");

    // Tự tạo id nếu không có (vì dùng UUID)
    if (!data.id) {
      data.id = crypto.randomUUID();
    }

    return await this.repo.create(data);
  }

  /**
   * Cập nhật thông tin ca làm việc
   */
  async update(id: string, data: Partial<AttendanceShift>) {
    const record = await this.repo.findById(id);
    if (!record)
      throw new HttpError(404, "Không tìm thấy ca làm việc", "SHIFT_NOT_FOUND");

    return await this.repo.update(id, data);
  }

  /**
   * Xoá bản ghi ca làm việc (cascade delete)
   */
  async remove(id: string) {
    const record = await this.repo.findById(id);
    if (!record)
      throw new HttpError(404, "Không tìm thấy ca làm việc", "SHIFT_NOT_FOUND");

    // Cascade delete: xóa attendance_adjustments
    const directusClient = (this.repo as any).directus;
    
    await directusClient.items("attendance_adjustments").delete({
      filter: { attendance_shift_id: { _eq: id } }
    });
    
    // Cuối cùng xóa attendance_shift
    await this.repo.delete(id);
  }
}

export default AttendanceShiftService;
