import { BaseService, HttpError } from "../../core/base";
import { Employee } from "./employee.model";
import EmployeeRepository from "./employee.repository";
import {
  PaginationQueryDto,
  PaginatedResponse,
} from "../../core/dto/pagination.dto";

export class EmployeeService extends BaseService<Employee> {
  constructor(repo = new EmployeeRepository()) {
    super(repo);
  }

  /** Pagination employee kèm user + role */
  async listPaginated(
    query: PaginationQueryDto
  ): Promise<PaginatedResponse<Employee>> {
    return await (this.repo as EmployeeRepository).findAllPaginatedWithUserRole(
      query
    );
  }

  /** Lấy danh sách employee kèm user + role */
  async list(query?: Record<string, unknown>) {
    return await (this.repo as EmployeeRepository).findAllWithUserRole(query);
  }

  /** Lấy 1 employee theo ID kèm user + role */
  async get(id: string | number) {
    const employee = await (
      this.repo as EmployeeRepository
    ).findAllWithUserRole({ id: { _eq: id } });
    if (!employee?.[0])
      throw new HttpError(
        404,
        "Không tìm thấy nhân viên",
        "EMPLOYEE_NOT_FOUND"
      );
    return employee[0];
  }

  async create(data: Partial<Employee>) {
    const existing = await (this.repo as EmployeeRepository).findByEmployeeCode(
      data.employee_code!
    );
    if (existing) {
      throw new HttpError(
        409,
        "Mã nhân viên đã tồn tại",
        "EMPLOYEE_CODE_CONFLICT"
      );
    }
    return await this.repo.create(data);
  }

  async update(id: string | number, data: Partial<Employee>) {
    const employee = await this.repo.findById(id);
    if (!employee)
      throw new HttpError(
        404,
        "Không tìm thấy nhân viên",
        "EMPLOYEE_NOT_FOUND"
      );

    return await this.repo.update(id, data);
  }

  // remove() method được kế thừa từ BaseService với cascade delete tự động
  // Nếu cần kiểm tra trước khi xóa, override lại và gọi super.remove(id)
}

export default EmployeeService;
