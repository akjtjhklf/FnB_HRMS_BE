import { BaseService, HttpError } from "../../core/base";
import { AttendanceLog } from "./attendance-log.model";
import AttendanceLogRepository from "./attendance-log.repository";

export class AttendanceLogService extends BaseService<AttendanceLog> {
  constructor(repo = new AttendanceLogRepository()) {
    super(repo);
  }

  async list(query?: Record<string, unknown>) {
    return await this.repo.findAll(query);
  }

  async get(id: string) {
    const record = await this.repo.findById(id);
    if (!record)
      throw new HttpError(404, "Không tìm thấy bản ghi điểm danh", "NOT_FOUND");
    return record;
  }

  async create(data: Partial<AttendanceLog>) {
    if (!data.card_uid)
      throw new HttpError(400, "Thiếu card_uid", "BAD_REQUEST");
    return await this.repo.create(data);
  }

  async update(id: string, data: Partial<AttendanceLog>) {
    const record = await this.repo.findById(id);
    if (!record)
      throw new HttpError(404, "Không tìm thấy bản ghi điểm danh", "NOT_FOUND");
    return await this.repo.update(id, data);
  }

  async remove(id: string) {
    const record = await this.repo.findById(id);
    if (!record)
      throw new HttpError(404, "Không tìm thấy bản ghi điểm danh", "NOT_FOUND");
    await this.repo.delete(id);
  }
}

export default AttendanceLogService;
