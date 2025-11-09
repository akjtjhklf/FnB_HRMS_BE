import { BaseService, HttpError } from "../../core/base";
import { WeeklySchedule } from "./weekly-schedule.model";
import WeeklyScheduleRepository from "./weekly-schedule.repository";

export class WeeklyScheduleService extends BaseService<WeeklySchedule> {
  constructor(repo = new WeeklyScheduleRepository()) {
    super(repo);
  }

  async list(query?: Record<string, unknown>) {
    return await this.repo.findAll(query);
  }

  async get(id: string) {
    const item = await this.repo.findById(id);
    if (!item)
      throw new HttpError(
        404,
        "Không tìm thấy lịch làm việc tuần",
        "WEEKLY_SCHEDULE_NOT_FOUND"
      );
    return item;
  }

  async create(data: Partial<WeeklySchedule>) {
    return await this.repo.create(data);
  }

  async update(id: string, data: Partial<WeeklySchedule>) {
    const existing = await this.repo.findById(id);
    if (!existing)
      throw new HttpError(
        404,
        "Không tìm thấy lịch làm việc tuần",
        "WEEKLY_SCHEDULE_NOT_FOUND"
      );

    return await this.repo.update(id, data);
  }

  async remove(id: string) {
    const existing = await this.repo.findById(id);
    if (!existing)
      throw new HttpError(
        404,
        "Không tìm thấy lịch làm việc tuần",
        "WEEKLY_SCHEDULE_NOT_FOUND"
      );

    await this.repo.delete(id);
  }
}

export default WeeklyScheduleService;
