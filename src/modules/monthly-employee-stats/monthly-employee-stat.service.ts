import { BaseService, HttpError } from "../../core/base";
import { MonthlyEmployeeStat } from "./monthly-employee-stat.model";
import MonthlyEmployeeStatRepository from "./monthly-employee-stat.repository";

export class MonthlyEmployeeStatService extends BaseService<MonthlyEmployeeStat> {
  declare repo: MonthlyEmployeeStatRepository;
  constructor(repo = new MonthlyEmployeeStatRepository()) {
    super(repo);
  }

  async list(query?: Record<string, unknown>) {
    return await this.repo.findAll(query);
  }

  async get(id: string) {
    const stat = await this.repo.findById(id);
    if (!stat)
      throw new HttpError(
        404,
        "Không tìm thấy thống kê nhân viên",
        "STAT_NOT_FOUND"
      );
    return stat;
  }

  async create(data: Partial<MonthlyEmployeeStat>) {
    // tránh trùng employee_id + month
    const existing = await this.repo.findByEmployeeAndMonth(
      data.employee_id!,
      data.month!
    );
    if (existing) {
      throw new HttpError(
        409,
        "Thống kê cho nhân viên này trong tháng đã tồn tại",
        "STAT_CONFLICT"
      );
    }

    return await this.repo.create({
      ...data,
      id: crypto.randomUUID(), // ✅ tự generate UUID
    });
  }

  async update(id: string, data: Partial<MonthlyEmployeeStat>) {
    const stat = await this.repo.findById(id);
    if (!stat)
      throw new HttpError(
        404,
        "Không tìm thấy thống kê nhân viên",
        "STAT_NOT_FOUND"
      );

    return await this.repo.update(id, data);
  }

  async remove(id: string) {
    const stat = await this.repo.findById(id);
    if (!stat)
      throw new HttpError(
        404,
        "Không tìm thấy thống kê nhân viên",
        "STAT_NOT_FOUND"
      );

    await this.repo.delete(id);
  }
}

export default MonthlyEmployeeStatService;
