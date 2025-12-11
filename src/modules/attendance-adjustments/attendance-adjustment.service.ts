import { BaseService, HttpError } from "../../core/base";
import { AttendanceAdjustment } from "./attendance-adjustment.model";
import AttendanceAdjustmentsRepository from "./attendance-adjustment.repository";

export class AttendanceAdjustmentsService extends BaseService<AttendanceAdjustment> {
  constructor(repo = new AttendanceAdjustmentsRepository()) {
    super(repo);
  }

  async list(query?: Record<string, unknown>) {
    return await this.repo.findAll(query);
  }

  async get(id: string) {
    const item = await this.repo.findById(id);
    if (!item) throw new HttpError(404, "Không tìm thấy bản ghi", "NOT_FOUND");
    return item;
  }

  async create(data: Partial<AttendanceAdjustment>) {
    return await this.repo.create(data);
  }

  async update(id: string, data: Partial<AttendanceAdjustment>) {
    const existing = await this.repo.findById(id);
    if (!existing)
      throw new HttpError(404, "Không tìm thấy bản ghi", "NOT_FOUND");
    return await this.repo.update(id, data);
  }

  async remove(id: string) {
    const existing = await this.repo.findById(id);
    if (!existing)
      throw new HttpError(404, "Không tìm thấy bản ghi", "NOT_FOUND");
    
    await this.repo.delete(id);
  }

  async approve(id: string, managerId: string) {
    const adjustment = await this.repo.findById(id);
    if (!adjustment) {
      throw new HttpError(404, "Không tìm thấy yêu cầu điều chỉnh", "NOT_FOUND");
    }

    if (adjustment.status !== "pending") {
      throw new HttpError(400, "Yêu cầu đã được xử lý", "ALREADY_PROCESSED");
    }

    // Apply changes to attendance shift
    const AttendanceService = (await import("../attendance-shifts/attendance.service")).default;
    const attendanceService = new AttendanceService();

    const proposed = adjustment.proposed_value as any;
    
    // Handle case where attendance_shift_id is an object (from joined data) or a string
    const attendanceShiftId = typeof adjustment.attendance_shift_id === 'object' 
      ? (adjustment.attendance_shift_id as any).id 
      : adjustment.attendance_shift_id;
    
    await attendanceService.manualAdjust(attendanceShiftId, {
        clock_in: proposed.clock_in,
        clock_out: proposed.clock_out,
        notes: adjustment.reason || undefined,
    });

    return await this.repo.update(id, {
      status: "approved",
      approved_by: managerId,
      approved_at: new Date().toISOString(),
    });
  }

  async reject(id: string, managerId: string) {
    const adjustment = await this.repo.findById(id);
    if (!adjustment) {
      throw new HttpError(404, "Không tìm thấy yêu cầu điều chỉnh", "NOT_FOUND");
    }

    if (adjustment.status !== "pending") {
      throw new HttpError(400, "Yêu cầu đã được xử lý", "ALREADY_PROCESSED");
    }

    return await this.repo.update(id, {
      status: "rejected",
      approved_by: managerId,
      approved_at: new Date().toISOString(),
    });
  }
}

export default AttendanceAdjustmentsService;
