import { DirectusRepository } from "../../core/directus.repository";
import { Deduction, DEDUCTIONS_COLLECTION } from "./deduction.model";

/**
 * Repository kết nối tới Directus collection `deductions`
 */
export class DeductionRepository extends DirectusRepository<Deduction> {
  constructor() {
    super(DEDUCTIONS_COLLECTION);
  }

  async findByEmployee(employeeId: string): Promise<Deduction[]> {
    return this.findAll({
      filter: { employee_id: { _eq: employeeId } },
    });
  }
}

export default DeductionRepository;
