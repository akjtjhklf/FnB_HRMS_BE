import { BaseService, HttpError } from "../../core/base";
import { MonthlyPayroll } from "./monthly-payroll.model";
import MonthlyPayrollRepository from "./monthly-payroll.repository";
import { PaginationQueryDto, PaginatedResponse } from "../../core/dto/pagination.dto";
import { readItems } from "@directus/sdk";
import EmployeeRepository from "../employees/employee.repository";
import { getNotificationHelper } from "../notifications";

export class MonthlyPayrollService extends BaseService<MonthlyPayroll> {
  declare repo: MonthlyPayrollRepository;
  private employeeRepo: EmployeeRepository;
  
  constructor(repo = new MonthlyPayrollRepository()) {
    super(repo);
    this.employeeRepo = new EmployeeRepository();
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
   * Lấy danh sách có phân trang - Manual Populate Employee + Search by Employee Name
   */
  async listPaginated(query: PaginationQueryDto, currentUser?: any): Promise<PaginatedResponse<MonthlyPayroll>> {
    // RBAC: Nếu là nhân viên thường (không phải admin/manager), chỉ xem được lương của mình
    if (currentUser && currentUser.role?.name !== 'Administrator' && currentUser.role?.name !== 'Manager') {
      // Tìm employee theo user_id
      try {
        const employees = await this.employeeRepo.findAll({
          filter: { user_id: { _eq: currentUser.id } },
          fields: ["id"],
          limit: 1,
        });
        
        if (employees.length > 0) {
          query.filter = query.filter || {};
          query.filter.employee_id = { _eq: employees[0].id };
        } else {
          // Không tìm thấy employee cho user này -> trả về rỗng
          return {
            data: [],
            meta: { total: 0, page: Number(query.page) || 1, limit: Number(query.limit) || 10, totalPages: 0 }
          };
        }
      } catch (err) {
        console.error("⚠️ Failed to find employee for user:", err);
        return {
          data: [],
          meta: { total: 0, page: Number(query.page) || 1, limit: Number(query.limit) || 10, totalPages: 0 }
        };
      }
    }

    // Search by employee name/code: Find matching employees first
    let employeeFilter: string[] | null = null;
    if (query.search) {
      try {
        const searchLower = query.search.toLowerCase();
        const matchingEmployees = await this.employeeRepo.findAll({
          filter: {
            _or: [
              { full_name: { _contains: query.search } },
              { employee_code: { _contains: query.search } },
            ]
          },
          fields: ["id"]
        });
        
        if (matchingEmployees.length > 0) {
          employeeFilter = matchingEmployees.map(e => e.id);
          // Add employee filter to query
          query.filter = query.filter || {};
          query.filter.employee_id = { _in: employeeFilter };
        } else {
          // No matching employees, return empty result
          return {
            data: [],
            meta: { total: 0, page: Number(query.page) || 1, limit: Number(query.limit) || 10, totalPages: 0 }
          };
        }
        // Clear search to prevent further string search in repository
        delete query.search;
      } catch (err) {
        console.error("⚠️ Failed to search employees:", err);
      }
    }

    const result = await this.repo.findAllPaginated(query);
    
    // Manual populate employee data if needed
    if (result.data.length > 0) {
      try {
        // Collect unique employee IDs that are strings
        const employeeIds = [...new Set(
          result.data
            .map(p => p.employee_id)
            .filter(id => typeof id === 'string')
        )] as string[];

        if (employeeIds.length > 0) {
          // Fetch employees
          const employees = await this.employeeRepo.findAll({
            filter: { id: { _in: employeeIds } },
            fields: ["id", "full_name", "employee_code", "department_id.*", "position_id.*"]
          });

          // Create map for fast lookup
          const employeeMap = new Map(employees.map(e => [e.id, e]));

          // Attach employee objects to payrolls
          result.data = result.data.map(payroll => {
            if (typeof payroll.employee_id === 'string') {
              const emp = employeeMap.get(payroll.employee_id);
              if (emp) {
                return { ...payroll, employee_id: emp };
              }
            }
            return payroll;
          }) as MonthlyPayroll[];
        }
      } catch (err) {
        console.error("⚠️ Failed to manual populate employees:", err);
        // Continue without population if fails
      }
    }

    return result;
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
   * Đánh dấu đã thanh toán và gửi notification cho nhân viên
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

    const updated = await this.repo.update(id, {
      status: "paid",
      paid_at: new Date().toISOString(),
    });

    // Send notification to employee about payslip
    try {
      const employeeId = typeof payroll.employee_id === 'object' 
        ? (payroll.employee_id as any).id 
        : payroll.employee_id;
      
      if (employeeId && payroll.month) {
        const notificationHelper = getNotificationHelper();
        const [year, month] = payroll.month.split('-').map(Number);
        
        await notificationHelper.notifyPayslipReady(employeeId, {
          month,
          year,
          payslipId: id,
        });
        console.log(`✅ Payslip notification sent to employee: ${employeeId}`);
      }
    } catch (notifyErr) {
      console.error('⚠️ Failed to send payslip notification:', notifyErr);
    }

    return updated;
  }

  /**
   * Gửi thông báo phiếu lương cho nhiều nhân viên (batch)
   */
  async notifyPayslipsBatch(payrollIds: string[]) {
    const notificationHelper = getNotificationHelper();
    let successCount = 0;
    let failCount = 0;

    for (const id of payrollIds) {
      try {
        const payroll = await this.repo.findById(id);
        if (!payroll || payroll.status !== "paid") continue;

        const employeeId = typeof payroll.employee_id === 'object' 
          ? (payroll.employee_id as any).id 
          : payroll.employee_id;
        
        if (employeeId && payroll.month) {
          const [year, month] = payroll.month.split('-').map(Number);
          await notificationHelper.notifyPayslipReady(employeeId, {
            month,
            year,
            payslipId: id,
          });
          successCount++;
        }
      } catch (err) {
        failCount++;
        console.error(`Failed to notify for payroll ${id}:`, err);
      }
    }

    return { successCount, failCount, total: payrollIds.length };
  }

  /**
   * Tạo bảng lương cho một tháng (tích hợp với attendance)
   */
  async generatePayroll(month: string, employeeIds?: string[]) {
    const client = (this.repo as any).client;
    
    // Parse month to get year and month number for attendance query
    const [year, monthNum] = month.split('-').map(Number);
    
    const PENALTY_RATE_PER_HOUR = 10000; // 10,000 VND/hour
    const STANDARD_WORK_DAYS = 26;
    
    // Import attendance service
    const AttendanceService = require('../attendance-shifts/attendance.service').default;
    const attendanceService = new AttendanceService();
    
    // Get attendance report for the month
    let attendanceReport;
    try {
      attendanceReport = await attendanceService.getMonthlyReport(monthNum, year);
    } catch (error) {
      console.error('Error fetching attendance report:', error);
      attendanceReport = [];
    }
    
    // 1. Lấy danh sách nhân viên
    let employeesQuery: any = {
      filter: { status: { _eq: "active" } },
      fields: ["id"], // Only need id
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
        // 2. Get active contract
        const contracts = await client.request((readItems as any)("contracts", {
          filter: {
            employee_id: { _eq: emp.id },
            is_active: { _eq: true }
          },
          fields: ["*", "salary_scheme_id.*"],
          limit: 1
        }));
        
        const contract = contracts?.[0];
        
        if (!contract) {
          errors.push({ employee_id: emp.id, error: "No active contract found" });
          continue;
        }

        // 3. Get attendance data
        const employeeAttendance = attendanceReport.find((r: any) => r.employee.id === emp.id);
        
        const attendanceData = employeeAttendance ? {
          total_work_days: employeeAttendance.stats.total_work_days,
          total_work_hours: employeeAttendance.stats.total_work_hours,
          total_late_minutes: employeeAttendance.stats.total_late_minutes,
          total_early_leave_minutes: employeeAttendance.stats.total_early_leave_minutes,
        } : {
          total_work_days: 0,
          total_work_hours: 0,
          total_late_minutes: 0,
          total_early_leave_minutes: 0,
        };
        
        // 4. Calculate base salary based on pay type
        const salaryScheme = contract.salary_scheme_id;
        let baseSalary = contract.base_salary || 0;
        let payType: string = 'monthly'; // Default to monthly
        let hourlyRate: number | null = null;
        
        if (salaryScheme && typeof salaryScheme === 'object') {
          payType = salaryScheme.pay_type || 'monthly';
          const rate = salaryScheme.rate || 0;
          
          switch (payType) {
            case 'hourly':
              baseSalary = rate * attendanceData.total_work_hours;
              hourlyRate = rate;
              break;
            case 'fixed_shift':
              baseSalary = rate * attendanceData.total_work_days;
              break;
            case 'monthly':
            default:
              const dailyRate = rate / STANDARD_WORK_DAYS;
              baseSalary = dailyRate * attendanceData.total_work_days;
              break;
          }
        } else if (baseSalary) {
          // Use base salary from contract with pro-rated calculation
          const dailyRate = baseSalary / STANDARD_WORK_DAYS;
          baseSalary = dailyRate * attendanceData.total_work_days;
        }
        
        // 5. Calculate penalties
        const latePenalty = (attendanceData.total_late_minutes / 60) * PENALTY_RATE_PER_HOUR;
        const earlyLeavePenalty = (attendanceData.total_early_leave_minutes / 60) * PENALTY_RATE_PER_HOUR;
        const totalPenalties = latePenalty + earlyLeavePenalty;
        
        // 6. Check if payroll exists
        const existing = await this.repo.findByEmployeeAndMonth(emp.id, month);
        if (existing) {
          errors.push({ employee_id: emp.id, error: "Payroll already exists for this month" });
          continue;
        }

        // 7. Calculate final amounts
        const allowances = 0; 
        const deductions = 0; 
        const bonuses = 0;
        const overtime = 0;
        
        const { gross_salary, net_salary } = this.calculateSalaries({
          base_salary: baseSalary,
          allowances,
          bonuses,
          overtime_pay: overtime,
          deductions,
          penalties: totalPenalties
        });

        // 8. Create payroll
        const payroll = await this.repo.create({
          id: crypto.randomUUID(),
          employee_id: emp.id,
          contract_id: contract.id,
          month,
          base_salary: baseSalary,
          pay_type: payType as any,
          hourly_rate: hourlyRate,
          allowances,
          bonuses,
          overtime_pay: overtime,
          deductions,
          penalties: totalPenalties,
          late_penalty: latePenalty,
          early_leave_penalty: earlyLeavePenalty,
          gross_salary,
          net_salary,
          status: "draft",
          salary_scheme_id: typeof salaryScheme === 'object' ? salaryScheme.id : salaryScheme,
          ...attendanceData
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

  /**
   * Gửi phiếu lương qua Novu (in-app notification)
   */
  async sendPayslip(id: string, sentBy?: string): Promise<{ success: boolean; message: string }> {
    const payroll = await this.repo.findById(id);
    if (!payroll) {
      throw new HttpError(404, "Không tìm thấy bảng lương", "PAYROLL_NOT_FOUND");
    }

    // Get employee info
    const employeeId = typeof payroll.employee_id === 'object' 
      ? (payroll.employee_id as any).id 
      : payroll.employee_id;
    
    const employee = await this.employeeRepo.findById(employeeId);
    if (!employee) {
      throw new HttpError(404, "Không tìm thấy nhân viên", "EMPLOYEE_NOT_FOUND");
    }

    if (!payroll.month) {
      throw new HttpError(400, "Phiếu lương không có thông tin tháng", "INVALID_PAYROLL");
    }

    try {
      const [year, month] = payroll.month.split('-').map(Number);
      const notificationHelper = getNotificationHelper();
      
      await notificationHelper.notifyPayslipReady(employeeId, {
        month,
        year,
        payslipId: id,
      });

      console.log(`✅ Payslip notification sent to employee ${employee.full_name} (${employeeId})`);

      return {
        success: true,
        message: `Đã gửi phiếu lương cho ${employee.full_name}`,
      };
    } catch (error: any) {
      console.error("❌ Failed to send payslip:", error);
      throw new HttpError(500, `Gửi phiếu lương thất bại: ${error?.message}`, "SEND_PAYSLIP_FAILED");
    }
  }

  /**
   * Gửi phiếu lương cho nhiều nhân viên (bulk)
   */
  async sendPayslipBulk(payrollIds: string[], sentBy?: string): Promise<{ sent: number; failed: number; errors: string[] }> {
    const results = { sent: 0, failed: 0, errors: [] as string[] };

    for (const id of payrollIds) {
      try {
        await this.sendPayslip(id, sentBy);
        results.sent++;
      } catch (error: any) {
        results.failed++;
        results.errors.push(`${id}: ${error?.message}`);
      }
    }

    return results;
  }

  /**
   * Thay đổi trạng thái phiếu lương (Admin/Manager only)
   * Cho phép chuyển đổi linh hoạt giữa các trạng thái
   */
  async changeStatus(
    id: string, 
    newStatus: MonthlyPayroll["status"], 
    options?: { 
      approved_by?: string; 
      note?: string;
      force?: boolean; // Bỏ qua validation status flow
    }
  ): Promise<MonthlyPayroll> {
    const payroll = await this.repo.findById(id);
    if (!payroll) {
      throw new HttpError(404, "Không tìm thấy bảng lương", "PAYROLL_NOT_FOUND");
    }

    const currentStatus = payroll.status || "draft";
    
    // Define valid transitions (unless force=true)
    const validTransitions: Record<string, string[]> = {
      draft: ["pending_approval", "approved"], // draft có thể chuyển thẳng sang approved
      pending_approval: ["draft", "approved", "paid"],
      approved: ["pending_approval", "paid", "draft"], // Có thể quay lại nếu cần
      paid: ["approved"], // Paid chỉ có thể quay lại approved (hoàn tiền)
    };

    // Check valid transition (unless force=true)
    if (!options?.force) {
      const allowedNext = validTransitions[currentStatus] || [];
      if (!allowedNext.includes(newStatus)) {
        throw new HttpError(
          400,
          `Không thể chuyển từ trạng thái "${currentStatus}" sang "${newStatus}"`,
          "INVALID_STATUS_TRANSITION"
        );
      }
    }

    // Build update data
    const updateData: Partial<MonthlyPayroll> = {
      status: newStatus,
    };

    // Add timestamp and approver based on new status
    if (newStatus === "approved") {
      updateData.approved_at = new Date().toISOString();
      if (options?.approved_by) {
        updateData.approved_by = options.approved_by;
      }
    } else if (newStatus === "paid") {
      updateData.paid_at = new Date().toISOString();
    } else if (newStatus === "draft") {
      // Reset approval info when going back to draft
      updateData.approved_at = null;
      updateData.approved_by = null;
      updateData.paid_at = null;
    } else if (newStatus === "pending_approval") {
      // Reset paid_at when going back to pending
      updateData.paid_at = null;
    }

    // Add note if provided
    if (options?.note) {
      updateData.notes = options.note;
    }

    await this.repo.update(id, updateData);
    
    // Fetch lại để đảm bảo trả về data mới nhất (Directus update không luôn trả về fresh data)
    const updatedPayroll = await this.repo.findById(id);
    if (!updatedPayroll) {
      throw new HttpError(404, "Không tìm thấy bảng lương sau khi cập nhật", "PAYROLL_NOT_FOUND");
    }
    
    return updatedPayroll;
  }

  /**
   * Thay đổi trạng thái hàng loạt
   */
  async changeStatusBulk(
    ids: string[], 
    newStatus: MonthlyPayroll["status"],
    options?: { approved_by?: string; force?: boolean }
  ): Promise<{ success: number; failed: number; errors: Array<{ id: string; error: string }> }> {
    const results = { success: 0, failed: 0, errors: [] as Array<{ id: string; error: string }> };

    for (const id of ids) {
      try {
        await this.changeStatus(id, newStatus, options);
        results.success++;
      } catch (error: any) {
        results.failed++;
        results.errors.push({ id, error: error?.message || "Unknown error" });
      }
    }

    return results;
  }

  /**
   * Lấy thống kê theo trạng thái
   */
  async getStatusStats(month?: string): Promise<Record<string, number>> {
    const filter: any = {};
    if (month) {
      filter.month = { _eq: month };
    }

    const payrolls = await this.repo.findAll({ filter });
    
    const stats: Record<string, number> = {
      draft: 0,
      pending_approval: 0,
      approved: 0,
      paid: 0,
      total: payrolls.length,
    };

    for (const p of payrolls) {
      const status = p.status || "draft";
      if (stats[status] !== undefined) {
        stats[status]++;
      }
    }

    return stats;
  }
}

export default MonthlyPayrollService;
