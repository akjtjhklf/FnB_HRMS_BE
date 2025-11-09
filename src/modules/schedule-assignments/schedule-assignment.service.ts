import { BaseService, HttpError } from "../../core/base";
import { ScheduleAssignment } from "./schedule-assignment.model";
import ScheduleAssignmentsRepository from "./schedule-assignment.repository";

export class ScheduleAssignmentsService extends BaseService<ScheduleAssignment> {
  constructor(repo = new ScheduleAssignmentsRepository()) {
    super(repo);
  }

  async list(query?: Record<string, unknown>) {
    return await this.repo.findAll(query);
  }

  async get(id: string) {
    const record = await this.repo.findById(id);
    if (!record)
      throw new HttpError(404, "Không tìm thấy lịch phân công", "SCHEDULE_ASSIGNMENT_NOT_FOUND");
    return record;
  }

  async create(data: Partial<ScheduleAssignment>) {
    return await this.repo.create(data);
  }

  async update(id: string, data: Partial<ScheduleAssignment>) {
    const record = await this.repo.findById(id);
    if (!record)
      throw new HttpError(404, "Không tìm thấy lịch phân công", "SCHEDULE_ASSIGNMENT_NOT_FOUND");
    return await this.repo.update(id, data);
  }

  async remove(id: string) {
    const record = await this.repo.findById(id);
    if (!record)
      throw new HttpError(404, "Không tìm thấy lịch phân công", "SCHEDULE_ASSIGNMENT_NOT_FOUND");
    await this.repo.delete(id);
  }
}

export default ScheduleAssignmentsService;
