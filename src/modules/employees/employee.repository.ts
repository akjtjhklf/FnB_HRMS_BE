import { DirectusRepository } from "../../core/directus.repository";
import { Employee, EMPLOYEES_COLLECTION } from "./employee.model";

export class EmployeeRepository extends DirectusRepository<Employee> {
  protected searchFields = [
    "employee_code",
    "first_name",
    "last_name",
    "full_name",
    "email",
    "phone",
    "personal_id"
  ];

  constructor() {
    super(EMPLOYEES_COLLECTION);
  }

  async findByEmployeeCode(code: string): Promise<Employee | null> {
    const result = await this.findAll({
      filter: { employee_code: { _eq: code } },
      limit: 1,
    });
    return result[0] ?? null;
  }
}

export default EmployeeRepository;
