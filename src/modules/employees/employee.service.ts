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

  async remove(id: string | number) {
    const employee = await this.repo.findById(id);
    if (!employee)
      throw new HttpError(
        404,
        "Không tìm thấy nhân viên",
        "EMPLOYEE_NOT_FOUND"
      );

    try {
      await this.repo.delete(id);
    } catch (error: any) {
      // Check if it's a foreign key constraint error
      if (error.message && error.message.includes("foreign key constraint")) {
        throw new HttpError(
          409,
          "Không thể xóa nhân viên này vì đang có dữ liệu liên quan (hợp đồng, chấm công, lương, v.v.). Vui lòng thay đổi trạng thái nhân viên thành 'Đã nghỉ việc' thay vì xóa.",
          "EMPLOYEE_HAS_DEPENDENCIES"
        );
      }
      throw error;
    }
  }
}

export default EmployeeService;
