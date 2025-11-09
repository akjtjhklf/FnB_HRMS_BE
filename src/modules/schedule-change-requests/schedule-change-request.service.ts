import { BaseService, HttpError } from "../../core/base";
import { ScheduleChangeRequest } from "./schedule-change-request.model";
import ScheduleChangeRequestRepository from "./schedule-change-request.repository";

export class ScheduleChangeRequestService extends BaseService<ScheduleChangeRequest> {
  constructor(repo = new ScheduleChangeRequestRepository()) {
    super(repo);
  }

  async list(query?: Record<string, unknown>) {
    return await this.repo.findAll(query);
  }

  async get(id: string) {
    const record = await this.repo.findById(id);
    if (!record)
      throw new HttpError(404, "Không tìm thấy yêu cầu", "REQUEST_NOT_FOUND");
    return record;
  }

  async create(data: Partial<ScheduleChangeRequest>) {
    return await this.repo.create(data);
  }

  async update(id: string, data: Partial<ScheduleChangeRequest>) {
    const existing = await this.repo.findById(id);
    if (!existing)
      throw new HttpError(404, "Không tìm thấy yêu cầu", "REQUEST_NOT_FOUND");

    return await this.repo.update(id, data);
  }

  async remove(id: string) {
    const existing = await this.repo.findById(id);
    if (!existing)
      throw new HttpError(404, "Không tìm thấy yêu cầu", "REQUEST_NOT_FOUND");

    await this.repo.delete(id);
  }
}

export default ScheduleChangeRequestService;
