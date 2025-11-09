import { BaseService, HttpError } from "../../core/base";
import { EmployeeAvailability } from "./employee-availability.model";
import EmployeeAvailabilityRepository from "./employee-availability.repository";

export class EmployeeAvailabilityService extends BaseService<EmployeeAvailability> {
  constructor(repo = new EmployeeAvailabilityRepository()) {
    super(repo);
  }

  async list(query?: Record<string, unknown>) {
    return await this.repo.findAll(query);
  }

  async get(id: string) {
    const item = await this.repo.findById(id);
    if (!item)
      throw new HttpError(
        404,
        "Không tìm thấy thông tin khả dụng của nhân viên",
        "EMPLOYEE_AVAILABILITY_NOT_FOUND"
      );
    return item;
  }

  async create(data: Partial<EmployeeAvailability>) {
    // kiểm tra trùng employee_id + shift_id nếu cần
    const existing = await this.repo.findAll({
      filter: {
        employee_id: { _eq: data.employee_id },
        shift_id: { _eq: data.shift_id },
      },
    });
    if (existing.length > 0)
      throw new HttpError(
        409,
        "Nhân viên này đã có đăng ký khả dụng cho ca này",
        "DUPLICATE_AVAILABILITY"
      );

    return await this.repo.create(data);
  }

  async update(id: string, data: Partial<EmployeeAvailability>) {
    const existing = await this.repo.findById(id);
    if (!existing)
      throw new HttpError(
        404,
        "Không tìm thấy thông tin khả dụng của nhân viên",
        "EMPLOYEE_AVAILABILITY_NOT_FOUND"
      );

    return await this.repo.update(id, data);
  }

  async remove(id: string) {
    const existing = await this.repo.findById(id);
    if (!existing)
      throw new HttpError(
        404,
        "Không tìm thấy thông tin khả dụng của nhân viên",
        "EMPLOYEE_AVAILABILITY_NOT_FOUND"
      );

    await this.repo.delete(id);
  }
}

export default EmployeeAvailabilityService;
