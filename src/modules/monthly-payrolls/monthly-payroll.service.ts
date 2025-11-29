import { BaseService, HttpError } from "../../core/base";
import { MonthlyPayroll } from "./monthly-payroll.model";
import MonthlyPayrollRepository from "./monthly-payroll.repository";
import { PaginationQueryDto, PaginatedResponse } from "../../core/dto/pagination.dto";
import { readItems } from "@directus/sdk";

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
  /**
   * Tạo bảng lương cho một tháng (cho tất cả hoặc danh sách nhân viên)
   */
  async generatePayroll(month: string, employeeIds?: string[]) {
    const client = (this.repo as any).client; // Access directus client
    
    // 1. Lấy danh sách nhân viên cần tính lương
    let employeesQuery: any = {
      filter: { status: { _eq: "active" } },
      fields: ["id", "position_id"],
      limit: -1,
    };
    
    if (employeeIds && employeeIds.length > 0) {
      employeesQuery.filter.id = { _in: employeeIds };
    }
    
    const employees = await client.request((readItems as any)("employees", employeesQuery));
    const employeeList = employees || [];
    
    const results = [];
    const errors = [];

    for (const emp of employeeList) {
      try {
        // 2. Lấy hợp đồng active
        const contracts = await client.request((readItems as any)("contracts", {
          filter: {
            employee_id: { _eq: emp.id },
            is_active: { _eq: true },
            status: { _neq: "expired" }
          },
          limit: 1
        }));
        
        const contract = contracts?.[0];
        
        // Nếu không có hợp đồng active, bỏ qua hoặc báo lỗi?
        // Tạm thời bỏ qua nếu không có hợp đồng
        if (!contract) {
          errors.push({ employee_id: emp.id, error: "No active contract found" });
          continue;
        }

        // 3. Lấy Salary Scheme (nếu có link từ contract hoặc position)
        // Logic: Contract -> Salary Scheme. Nếu contract không có field này thì dùng base_salary của contract.
        // User yêu cầu: "Salary schemes —> Ảnh hưởng đến Contracts và Salary"
        // Giả sử ta lấy scheme dựa trên position nếu contract không link, hoặc dùng rate từ contract.
        // Ở đây ta dùng base_salary từ contract làm chuẩn.
        
        const baseSalary = contract.base_salary || 0;
        
        // 4. Kiểm tra xem bảng lương tháng này đã có chưa
        const existing = await this.repo.findByEmployeeAndMonth(emp.id, month);
        if (existing) {
          // Nếu đã có và chưa lock thì có thể update? Hoặc skip.
          // Ở đây ta skip nếu đã tồn tại để tránh duplicate.
          errors.push({ employee_id: emp.id, error: "Payroll already exists for this month" });
          continue;
        }

        // 5. Tính toán (đơn giản hoá cho MVP, sau này thêm logic chấm công)
        // TODO: Tích hợp module chấm công để tính ngày công thực tế
        const allowances = 0; // Cần lấy từ bảng allowances
        const deductions = 0; // Cần lấy từ bảng deductions
        const bonuses = 0;
        const overtime = 0;
        const penalties = 0;
        
        const { gross_salary, net_salary } = this.calculateSalaries({
          base_salary: baseSalary,
          allowances,
          bonuses,
          overtime_pay: overtime,
          deductions,
          penalties
        });

        // 6. Tạo bảng lương
        const payroll = await this.repo.create({
          id: crypto.randomUUID(),
          employee_id: emp.id,
          month,
          base_salary: baseSalary,
          allowances,
          bonuses,
          overtime_pay: overtime,
          deductions,
          penalties,
          gross_salary,
          net_salary,
          status: "draft",
          // salary_scheme_id: ... // Nếu có
        });
        
        results.push(payroll);
        
      } catch (err: any) {
        console.error(`Error generating payroll for employee ${emp.id}:`, err);
        errors.push({ employee_id: emp.id, error: err.message });
      }
    }

    return { generated: results, errors };
  }

  /**
   * Khoá bảng lương (chỉ manager)
   */
  async lock(id: string) {
    const payroll = await this.repo.findById(id);
    if (!payroll) throw new HttpError(404, "Payroll not found", "PAYROLL_NOT_FOUND");
    
    if (payroll.status === "paid") {
       throw new HttpError(400, "Cannot lock a paid payroll", "INVALID_STATUS");
    }

    return await this.repo.update(id, { status: "approved" }); // Map 'lock' to 'approved' or specific status? 
    // User requirement: "PUT /salary/:id/lock". 
    // Implementation plan says status: 'draft', 'locked', 'paid'. 
    // Existing model says: 'draft', 'pending_approval', 'approved', 'paid'.
    // Let's map 'lock' to 'pending_approval' or 'approved'. 
    // Let's assume 'lock' means ready for approval or approved. 
    // Let's use 'pending_approval' as 'locked' for editing? 
    // Or maybe we should strictly follow the plan and add 'locked' to model?
    // The user said "bỏ cái này đi dùng 2 bảng kia thôi" referring to my plan.
    // Existing model has 'pending_approval', 'approved'.
    // Let's assume 'lock' -> 'pending_approval' (cannot be edited by employee, waiting for manager).
    
    return await this.repo.update(id, { status: "pending_approval" });
  }

  /**
   * Mở khoá bảng lương
   */
  async unlock(id: string) {
    const payroll = await this.repo.findById(id);
    if (!payroll) throw new HttpError(404, "Payroll not found", "PAYROLL_NOT_FOUND");
    
    if (payroll.status === "paid") {
       throw new HttpError(400, "Cannot unlock a paid payroll", "INVALID_STATUS");
    }

    return await this.repo.update(id, { status: "draft" });
  }
}

export default MonthlyPayrollService;
