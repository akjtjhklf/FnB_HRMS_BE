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
    "personal_id",
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

  /** Lấy employee kèm user + role */
  async findAllWithUserRole(query?: Record<string, unknown>) {
    return this.findAll({
      filter: query,
      fields: [
        "*", // lấy tất cả field employee
        "user.*", // lấy tất cả field user
        "user.role.*", // lấy tất cả field role
      ],
    });
  }

  /** Pagination employee kèm user + role */
  async findAllPaginatedWithUserRole(paginationQuery: any) {
    return this.findAllPaginated({
      ...paginationQuery,
      fields: ["*", "user.*", "user.role.*"],
    });
  }
}

export default EmployeeRepository;
