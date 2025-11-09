import { DirectusRepository } from "../../core/directus.repository";
import {
  ScheduleAssignment,
  SCHEDULE_ASSIGNMENTS_COLLECTION,
} from "./schedule-assignment.model";

/**
 * Repository cho schedule_assignments
 */
export class ScheduleAssignmentsRepository extends DirectusRepository<ScheduleAssignment> {
  constructor() {
    super(SCHEDULE_ASSIGNMENTS_COLLECTION);
  }

  async findByEmployeeId(employeeId: string) {
    return this.findAll({
      filter: { employee_id: { _eq: employeeId } },
    });
  }

  async findByShiftId(shiftId: string) {
    return this.findAll({
      filter: { shift_id: { _eq: shiftId } },
    });
  }
}

export default ScheduleAssignmentsRepository;
