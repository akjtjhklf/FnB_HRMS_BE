import { DirectusRepository } from "../../core/directus.repository";
import {
  EmployeeAvailability,
  EMPLOYEE_AVAILABILITIES_COLLECTION,
} from "./employee-availability.model";

/**
 * Repository cho bảng employee_availability
 */
export class EmployeeAvailabilityRepository extends DirectusRepository<EmployeeAvailability> {
  constructor() {
    super(EMPLOYEE_AVAILABILITIES_COLLECTION);
  }

  async findByEmployee(employee_id: string) {
    return await this.findAll({
      filter: { employee_id: { _eq: employee_id } },
    });
  }

  async findByShift(shift_id: string) {
    return await this.findAll({
      filter: { shift_id: { _eq: shift_id } },
    });
  }
}

export default EmployeeAvailabilityRepository;
