import { DirectusRepository } from "../../core/directus.repository";
import {
  SalaryRequest,
  SALARY_REQUESTS_COLLECTION,
} from "./salary-request.model";

/**
 * Repository cho salary_requests
 */
export class SalaryRequestRepository extends DirectusRepository<SalaryRequest> {
  protected searchFields = ["reason", "note", "manager_note", "type", "status"];

  constructor() {
    super(SALARY_REQUESTS_COLLECTION);
  }

  // Nếu cần, có thể thêm hàm custom (VD: findByEmployee)
  async findByEmployee(employeeId: string) {
    return await this.findAll({
      filter: { employee_id: { _eq: employeeId } },
    });
  }
}

export default SalaryRequestRepository;
