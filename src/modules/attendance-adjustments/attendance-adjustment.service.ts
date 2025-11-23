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
}

export default AttendanceAdjustmentsService;
