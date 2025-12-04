import { BaseService, HttpError } from "../../core/base";
import {
  PaginatedResponse,
  PaginationQueryDto,
} from "../../core/dto/pagination.dto";
import { SalaryRequest } from "./salary-request.model";
import SalaryRequestRepository from "./salary-request.repository";
import { updateItem, readItems, readItem } from "@directus/sdk";
import { directus } from "../../utils/directusClient";
import { getNotificationHelper, NotificationType } from "../notifications";

import EmployeeRepository from "../employees/employee.repository";

export class SalaryRequestService extends BaseService<SalaryRequest> {
  private employeeRepo: EmployeeRepository;

  constructor(repo = new SalaryRequestRepository()) {
    super(repo);
    this.employeeRepo = new EmployeeRepository();
  }

  /**
   * Lấy danh sách yêu cầu lương
   */
  async list(query?: Record<string, unknown>) {
    return await this.repo.findAll(query);
  }

  async listPaginated(
    query: PaginationQueryDto
  ): Promise<PaginatedResponse<SalaryRequest>> {
    // Search by employee name/code: Find matching employees first
    if (query.search) {
      try {
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
          const employeeFilter = matchingEmployees.map(e => e.id);
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

    const result = await (this.repo as SalaryRequestRepository).findAllPaginated(query);

    // Manual populate employee data
    if (result.data.length > 0) {
      try {
        const employeeIds = [...new Set(
          result.data
            .map(p => p.employee_id)
            .filter(id => typeof id === 'string')
        )] as string[];

        if (employeeIds.length > 0) {
          const employees = await this.employeeRepo.findAll({
            filter: { id: { _in: employeeIds } },
            fields: ["id", "full_name", "employee_code", "department_id.*", "position_id.*"]
          });

          const employeeMap = new Map(employees.map(e => [e.id, e]));

          (result.data as any[]) = result.data.map(request => {
            if (typeof request.employee_id === 'string') {
              const emp = employeeMap.get(request.employee_id);
              if (emp) {
                return { ...request, employee_id: emp };
              }
            }
            return request;
          });
        }
      } catch (err) {
        console.error("⚠️ Failed to manual populate employees in requests:", err);
      }
    }

    return result;
  }

  /**
   * Lấy chi tiết yêu cầu theo ID
   */
  async get(id: string) {
    const request = await this.repo.findById(id);
    if (!request)
      throw new HttpError(
        404,
        "Không tìm thấy yêu cầu lương",
        "SALARY_REQUEST_NOT_FOUND"
      );
    return request;
  }

  /**
   * Tạo yêu cầu mới
   * @param data - Dữ liệu yêu cầu
   * @param currentUser - User hiện tại (từ auth middleware)
   */
  async create(data: Partial<SalaryRequest>, currentUser?: any) {
    // RBAC: Admin/Manager không được tạo yêu cầu chỉnh sửa lương
    if (currentUser && (currentUser.role?.name === 'Administrator' || currentUser.role?.name === 'Manager')) {
      throw new HttpError(
        403,
        "Admin và Manager không được tạo yêu cầu chỉnh sửa lương",
        "FORBIDDEN"
      );
    }

    // Employee chỉ được tạo request cho chính mình
    if (currentUser && currentUser.role?.name !== 'Administrator' && currentUser.role?.name !== 'Manager') {
      // Tìm employee theo user_id
      const employees = await this.employeeRepo.findAll({
        filter: { user_id: { _eq: currentUser.id } },
        fields: ["id"],
        limit: 1,
      });
      
      if (employees.length === 0) {
        throw new HttpError(
          403,
          "Không tìm thấy thông tin nhân viên của bạn",
          "EMPLOYEE_NOT_FOUND"
        );
      }
      
      const myEmployeeId = employees[0].id;
      
      // Kiểm tra employee_id trong request có phải là của chính mình không
      if (data.employee_id && data.employee_id !== myEmployeeId) {
        throw new HttpError(
          403,
          "Bạn chỉ có thể tạo yêu cầu cho chính mình",
          "FORBIDDEN"
        );
      }
      
      // Gán employee_id nếu chưa có
      data.employee_id = myEmployeeId;
    }

    const created = await this.repo.create(data);

    // Send notification to managers
    try {
      const employee = data.employee_id 
        ? await this.employeeRepo.findById(data.employee_id as string)
        : null;
      
      if (employee) {
        const notificationHelper = getNotificationHelper();
        await notificationHelper.notifySalaryIncreaseRequest(
          employee.id!,
          employee.full_name || 'Nhân viên',
          created.id!,
          employee.department_id ?? undefined
        );
      }
    } catch (notifyErr) {
      console.error('⚠️ Failed to send notification:', notifyErr);
      // Don't fail the request if notification fails
    }

    return created;
  }

  /**
   * Cập nhật yêu cầu
   */
  async update(id: string, data: Partial<SalaryRequest>) {
    const existing = await this.repo.findById(id);
    if (!existing)
      throw new HttpError(
        404,
        "Không tìm thấy yêu cầu lương",
        "SALARY_REQUEST_NOT_FOUND"
      );

    return await this.repo.update(id, data);
  }

  /**
   * Xóa yêu cầu
   */
  async remove(id: string) {
    const existing = await this.repo.findById(id);
    if (!existing)
      throw new HttpError(
        404,
        "Không tìm thấy yêu cầu lương",
        "SALARY_REQUEST_NOT_FOUND"
      );

    await this.repo.delete(id);
  }
  /**
   * Phê duyệt yêu cầu
   */
  async approve(id: string, approved_by: string, manager_note?: string) {
    const request = await this.repo.findById(id);
    if (!request)
      throw new HttpError(
        404,
        "Không tìm thấy yêu cầu lương",
        "SALARY_REQUEST_NOT_FOUND"
      );

    if (request.status !== "pending") {
      throw new HttpError(
        400,
        "Chỉ có thể duyệt yêu cầu đang chờ",
        "INVALID_STATUS"
      );
    }

    // Determine request type - check type field or fallback to checking proposed_rate for legacy data
    const isRaiseRequest = request.type === "raise" || (!request.type && request.proposed_rate);
    const isAdjustmentRequest = request.type === "adjustment" || (!request.type && request.adjustment_amount);

    console.log('🔍 [SalaryRequest] Processing approval:', {
      requestId: id,
      type: request.type,
      isRaiseRequest,
      isAdjustmentRequest,
      proposed_rate: request.proposed_rate,
      adjustment_amount: request.adjustment_amount,
    });

    // Logic xử lý khi duyệt
    if (isRaiseRequest) {
      // Cập nhật contract hoặc tạo contract mới?
      // User yêu cầu: "Cập nhật lại contract hiện tại hoặc tạo contract amendment."
      // Ở đây ta cập nhật contract hiện tại (base_salary)
      
      // Get employee_id as string (in case it's populated object)
      const employeeId = typeof request.employee_id === 'object' 
        ? (request.employee_id as any).id 
        : request.employee_id;
      
      console.log('🔍 [SalaryRequest] Approving raise request:', {
        requestId: id,
        employeeId,
        proposed_rate: request.proposed_rate,
        type: request.type,
      });
      
      // Tìm contract active của employee using Directus SDK
      // @ts-ignore - Directus SDK type issue with dynamic collection names
      const readContractsReq = readItems("contracts", {
        filter: {
          employee_id: { _eq: employeeId },
          is_active: { _eq: true },
        },
        limit: 1,
      });
      const contracts = await directus.request(readContractsReq) as any[];
      
      console.log('📄 [SalaryRequest] Found contracts:', contracts);
      
      const contract = contracts?.[0];
      if (contract && request.proposed_rate) {
        console.log('✏️ [SalaryRequest] Updating contract:', contract.id, 'with base_salary:', request.proposed_rate);
        
        // Use Directus SDK properly
        // @ts-ignore - Directus SDK type issue with dynamic collection names
        const updateReq = updateItem("contracts", contract.id, {
          base_salary: request.proposed_rate,
        });
        await directus.request(updateReq);
        
        console.log('✅ [SalaryRequest] Contract updated successfully');
      } else {
        // Nếu không có contract, có thể log warning hoặc tạo mới (tuỳ business logic)
        console.warn(`⚠️ No active contract found for employee ${employeeId} to apply raise, or proposed_rate is missing.`);
      }
      
    } else if (isAdjustmentRequest) {
      // Cập nhật bảng lương
      if (request.payroll_id && request.adjustment_amount) {
        // @ts-ignore - Directus SDK type issue with dynamic collection names
        const readPayrollReq = readItem("monthly_payrolls", request.payroll_id);
        const payroll = await directus.request(readPayrollReq) as any;
        if (payroll) {
           // Cộng vào bonuses hoặc deductions tuỳ dấu?
           // Giả sử adjustment_amount có thể âm hoặc dương.
           // Nếu dương -> bonuses, âm -> deductions?
           // Hoặc cộng thẳng vào net_salary?
           // Tốt nhất là cộng vào bonuses (nếu dương) hoặc deductions (nếu âm).
           // Nhưng để đơn giản, ta cộng vào bonuses (nếu âm thì bonuses giảm, hoặc dùng field adjustment riêng nếu có).
           // Vì model MonthlyPayroll có bonuses và deductions.
           
           let newBonuses = (payroll.bonuses || 0);
           let newDeductions = (payroll.deductions || 0);
           
           if (request.adjustment_amount > 0) {
             newBonuses += request.adjustment_amount;
           } else {
             newDeductions += Math.abs(request.adjustment_amount);
           }
           
           // Recalculate gross/net?
           // MonthlyPayrollService logic calculates: gross = base + allowances + bonuses + overtime
           // net = gross - deductions - penalties
           
           const gross_salary = (payroll.base_salary || 0) + (payroll.allowances || 0) + newBonuses + (payroll.overtime_pay || 0);
           const net_salary = gross_salary - newDeductions - (payroll.penalties || 0);
           
           // @ts-ignore - Directus SDK type issue with dynamic collection names
           const updatePayrollReq = updateItem("monthly_payrolls", request.payroll_id, {
             bonuses: newBonuses,
             deductions: newDeductions,
             gross_salary,
             net_salary
           });
           await directus.request(updatePayrollReq);
        }
      }
    }

    const updatedRequest = await this.repo.update(id, {
      status: "approved",
      approved_by,
      approved_at: new Date().toISOString(),
      manager_note,
    });

    // Send notification to employee about approval
    try {
      const employeeId = typeof request.employee_id === 'object' 
        ? (request.employee_id as any).id 
        : request.employee_id;
      
      if (employeeId) {
        const notificationHelper = getNotificationHelper();
        await notificationHelper.notifySalaryRequestResult(
          employeeId,
          true, // approved
          id
        );
      }
    } catch (notifyErr) {
      console.error('⚠️ Failed to send approval notification:', notifyErr);
    }

    return updatedRequest;
  }

  /**
   * Từ chối yêu cầu
   */
  async reject(id: string, rejected_by: string, manager_note?: string) {
    const request = await this.repo.findById(id);
    if (!request)
      throw new HttpError(
        404,
        "Không tìm thấy yêu cầu lương",
        "SALARY_REQUEST_NOT_FOUND"
      );

    if (request.status !== "pending") {
      throw new HttpError(
        400,
        "Chỉ có thể từ chối yêu cầu đang chờ",
        "INVALID_STATUS"
      );
    }

    const updatedRequest = await this.repo.update(id, {
      status: "rejected",
      approved_by: rejected_by, // Reuse approved_by for rejected_by or add new field? 
      // Model only has approved_by. Let's use it as "action_by".
      approved_at: new Date().toISOString(),
      manager_note,
    });

    // Send notification to employee about rejection
    try {
      const employeeId = typeof request.employee_id === 'object' 
        ? (request.employee_id as any).id 
        : request.employee_id;
      
      if (employeeId) {
        const notificationHelper = getNotificationHelper();
        await notificationHelper.notifySalaryRequestResult(
          employeeId,
          false, // rejected
          id
        );
      }
    } catch (notifyErr) {
      console.error('⚠️ Failed to send rejection notification:', notifyErr);
    }

    return updatedRequest;
  }
}

export default SalaryRequestService;
