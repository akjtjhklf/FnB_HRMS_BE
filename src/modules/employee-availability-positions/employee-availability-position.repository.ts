import { DirectusRepository } from "../../core/directus.repository";
import {
  EmployeeAvailabilityPosition,
  EMPLOYEE_AVAILABILITY_POSITIONS_COLLECTION,
} from "./employee-availability-position.model";

/**
 * Repository cho employee_availability_positions
 */
export class EmployeeAvailabilityPositionsRepository extends DirectusRepository<EmployeeAvailabilityPosition> {
  constructor() {
    super(EMPLOYEE_AVAILABILITY_POSITIONS_COLLECTION);
  }

  async findByAvailabilityId(availabilityId: string) {
    return this.findAll({
      filter: { availability_id: { _eq: availabilityId } },
    });
  }
}

export default EmployeeAvailabilityPositionsRepository;
