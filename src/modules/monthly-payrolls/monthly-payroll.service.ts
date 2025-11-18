import { BaseService, HttpError } from "../../core/base";
import { MonthlyPayroll } from "./monthly-payroll.model";
import MonthlyPayrollRepository from "./monthly-payroll.repository";
import { PaginationQueryDto, PaginatedResponse } from "../../core/dto/pagination.dto";

export class MonthlyPayrollService extends BaseService<MonthlyPayroll> {
  declare repo: MonthlyPayrollRepository;
  
  constructor(repo = new MonthlyPayrollRepository()) {
    super(repo);
  }

  /**
   * Tính toán gross_salary và net_salary
   */
  private calculateSalaries(data: Partial<MonthlyPayroll>): {
    gross_salary: number;
    net_salary: number;
  } {
    const base = data.base_salary || 0;
    const allowances = data.allowances || 0;
    const bonuses = data.bonuses || 0;
    const overtime = data.overtime_pay || 0;
    const deductions = data.deductions || 0;
    const penalties = data.penalties || 0;

    const gross_salary = base + allowances + bonuses + overtime;
    const net_salary = gross_salary - deductions - penalties;

    return { gross_salary, net_salary };
  }

  /**
   * Lấy danh sách có phân trang
   */
  async listPaginated(query: PaginationQueryDto): Promise<PaginatedResponse<MonthlyPayroll>> {
    return await this.repo.findAllPaginated(query);
  }

  /**
   * Lấy danh sách (không phân trang)
   */
  async list(query?: Record<string, unknown>): Promise<MonthlyPayroll[]> {
    return await this.repo.findAll({
      ...query,
      fields: ["*", "employee_id.*", "salary_scheme_id.*"],
    });
  }

  async get(id: string) {
    const payroll = await this.repo.findById(id);
    if (!payroll) {
      throw new HttpError(404, "Không tìm thấy bảng lương", "PAYROLL_NOT_FOUND");
    }
    return payroll;
  }

  async create(data: Partial<MonthlyPayroll>) {
    // Kiểm tra trùng employee_id + month
    const existing = await this.repo.findByEmployeeAndMonth(
      data.employee_id!,
      data.month!
    );
    if (existing) {
      throw new HttpError(
        409,
        "Bảng lương cho nhân viên này trong tháng đã tồn tại",
        "PAYROLL_CONFLICT"
      );
    }

    // Tính toán lương
    const { gross_salary, net_salary } = this.calculateSalaries(data);

    return await this.repo.create({
      ...data,
      id: crypto.randomUUID(),
      gross_salary,
      net_salary,
      status: data.status || "draft",
    });
  }

  async update(id: string, data: Partial<MonthlyPayroll>) {
    const payroll = await this.repo.findById(id);
    if (!payroll) {
      throw new HttpError(404, "Không tìm thấy bảng lương", "PAYROLL_NOT_FOUND");
    }

    // Tính lại lương nếu có thay đổi các trường liên quan
    const updatedData = { ...data };
    if (
      data.base_salary !== undefined ||
      data.allowances !== undefined ||
      data.bonuses !== undefined ||
      data.overtime_pay !== undefined ||
      data.deductions !== undefined ||
      data.penalties !== undefined
    ) {
      const merged = { ...payroll, ...data };
      const { gross_salary, net_salary } = this.calculateSalaries(merged);
      updatedData.gross_salary = gross_salary;
      updatedData.net_salary = net_salary;
    }

    return await this.repo.update(id, updatedData);
  }

  async remove(id: string) {
    const payroll = await this.repo.findById(id);
    if (!payroll) {
      throw new HttpError(404, "Không tìm thấy bảng lương", "PAYROLL_NOT_FOUND");
    }

    await this.repo.delete(id);
  }

  /**
   * Lấy tất cả bảng lương theo tháng
   */
  async getByMonth(month: string) {
    return await this.repo.findAllByMonth(month);
  }

  /**
   * Lấy tất cả bảng lương của một nhân viên
   */
  async getByEmployee(employee_id: string): Promise<MonthlyPayroll[]> {
    return await this.repo.findAllByEmployee(employee_id);
  }

  /**
   * Lấy tất cả bảng lương theo status
   */
  async getByStatus(status: string): Promise<MonthlyPayroll[]> {
    return await this.repo.findAllByStatus(status);
  }

  /**
   * Phê duyệt bảng lương
   */
  async approve(id: string, approved_by: string) {
    const payroll = await this.repo.findById(id);
    if (!payroll) {
      throw new HttpError(404, "Không tìm thấy bảng lương", "PAYROLL_NOT_FOUND");
    }

    if (payroll.status !== "pending_approval") {
      throw new HttpError(
        400,
        "Chỉ có thể duyệt bảng lương ở trạng thái chờ duyệt",
        "INVALID_STATUS"
      );
    }

    return await this.repo.update(id, {
      status: "approved",
      approved_by,
      approved_at: new Date().toISOString(),
    });
  }

  /**
   * Đánh dấu đã thanh toán
   */
  async markAsPaid(id: string) {
    const payroll = await this.repo.findById(id);
    if (!payroll) {
      throw new HttpError(404, "Không tìm thấy bảng lương", "PAYROLL_NOT_FOUND");
    }

    if (payroll.status !== "approved") {
      throw new HttpError(
        400,
        "Chỉ có thể thanh toán bảng lương đã được duyệt",
        "INVALID_STATUS"
      );
    }

    return await this.repo.update(id, {
      status: "paid",
      paid_at: new Date().toISOString(),
    });
  }
}

export default MonthlyPayrollService;
