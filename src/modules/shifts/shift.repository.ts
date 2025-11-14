import { DirectusRepository } from "../../core/directus.repository";
import { Shift, SHIFTS_COLLECTION } from "./shift.model";

/**
 * Repository cho bảng shifts — quản lý dữ liệu ca làm việc
 */
export class ShiftRepository extends DirectusRepository<Shift> {
  protected searchFields = [
    "shift_name",
    "location",
    "notes"
  ];

  constructor(client?: any) {
    super(SHIFTS_COLLECTION, client);
  }

  async findByScheduleId(scheduleId: string): Promise<Shift[]> {
    return await this.findAll({
      filter: { schedule_id: { _eq: scheduleId } },
    });
  }

  async findByDate(date: string): Promise<Shift[]> {
    return await this.findAll({
      filter: { shift_date: { _eq: date } },
    });
  }
}

export default ShiftRepository;
