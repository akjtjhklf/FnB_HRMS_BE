import { BaseService, HttpError } from "../../core/base";
import { Employee } from "./employee.model";
import EmployeeRepository from "./employee.repository";

export class EmployeeService extends BaseService<Employee> {
  constructor(repo = new EmployeeRepository()) {
    super(repo);
  }

  async list(query?: Record<string, unknown>) {
    return await this.repo.findAll(query);
  }

  async get(id: string | number) {
    const employee = await this.repo.findById(id);
    if (!employee)
      throw new HttpError(
        404,
        "Không tìm thấy nhân viên",
        "EMPLOYEE_NOT_FOUND"
      );
    return employee;
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

    await this.repo.delete(id);
  }
}

export default EmployeeService;
