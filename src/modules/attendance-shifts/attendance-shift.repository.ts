import { DirectusRepository } from "../../core/directus.repository";
import {
  AttendanceShift,
  ATTENDANCE_SHIFTS_COLLECTION,
} from "./attendance-shift.model";

/**
 * Repository chấm công theo ca — kết nối tới Directus collection `attendance_shifts`
 */
export class AttendanceShiftRepository extends DirectusRepository<AttendanceShift> {
  constructor() {
    super(ATTENDANCE_SHIFTS_COLLECTION);
  }

  async findByEmployee(employee_id: string): Promise<AttendanceShift[]> {
    return await this.findAll({
      filter: { employee_id: { _eq: employee_id } },
    });
  }
}

export default AttendanceShiftRepository;
