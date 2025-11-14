import { BaseService, HttpError } from "../../core/base";
import { Shift } from "./shift.model";
import ShiftRepository from "./shift.repository";
import { PaginationQueryDto, PaginatedResponse } from "../../core/dto/pagination.dto";

export class ShiftService extends BaseService<Shift> {
  constructor(repo = new ShiftRepository()) {
    super(repo);
  }

  async listPaginated(query: PaginationQueryDto): Promise<PaginatedResponse<Shift>> {
    return await (this.repo as ShiftRepository).findAllPaginated(query);
  }

  async list(query?: Record<string, unknown>) {
    return await this.repo.findAll(query);
  }

  async get(id: string) {
    const shift = await this.repo.findById(id);
    if (!shift)
      throw new HttpError(404, "Không tìm thấy ca làm việc", "SHIFT_NOT_FOUND");
    return shift;
  }

  async create(data: Partial<Shift>) {
    return await this.repo.create(data);
  }

  async update(id: string, data: Partial<Shift>) {
    const existing = await this.repo.findById(id);
    if (!existing)
      throw new HttpError(404, "Không tìm thấy ca làm việc", "SHIFT_NOT_FOUND");

    return await this.repo.update(id, data);
  }

  async remove(id: string) {
    const existing = await this.repo.findById(id);
    if (!existing)
      throw new HttpError(404, "Không tìm thấy ca làm việc", "SHIFT_NOT_FOUND");

    await this.repo.delete(id);
  }

  async listBySchedule(scheduleId: string) {
    return await (this.repo as any).findByScheduleId(scheduleId);
  }
}

export default ShiftService;
