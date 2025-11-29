import { BaseService, HttpError } from "../../core/base";
import {
  PaginatedResponse,
  PaginationQueryDto,
} from "../../core/dto/pagination.dto";
import { SalaryRequest } from "./salary-request.model";
import SalaryRequestRepository from "./salary-request.repository";

export class SalaryRequestService extends BaseService<SalaryRequest> {
  constructor(repo = new SalaryRequestRepository()) {
    super(repo);
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
    return await (this.repo as SalaryRequestRepository).findAllPaginated(query);
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
   */
  async create(data: Partial<SalaryRequest>) {
    return await this.repo.create(data);
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

    const directus = (this.repo as any).directus;

    // Logic xử lý khi duyệt
    if (request.type === "raise") {
      // Cập nhật contract hoặc tạo contract mới?
      // User yêu cầu: "Cập nhật lại contract hiện tại hoặc tạo contract amendment."
      // Ở đây ta cập nhật contract hiện tại (base_salary)
      
      // Tìm contract active của employee
      const contracts = await directus.items("contracts").readByQuery({
        filter: {
          employee_id: { _eq: request.employee_id },
          is_active: { _eq: true },
        },
        limit: 1,
      });
      
      const contract = contracts.data?.[0];
      if (contract) {
        await directus.items("contracts").update(contract.id, {
           base_salary: request.proposed_rate,
           // salary_scheme_id: request.proposed_scheme_id // Nếu có
        });
      } else {
        // Nếu không có contract, có thể log warning hoặc tạo mới (tuỳ business logic)
        console.warn(`No active contract found for employee ${request.employee_id} to apply raise.`);
      }
      
    } else if (request.type === "adjustment") {
      // Cập nhật bảng lương
      if (request.payroll_id && request.adjustment_amount) {
        const payroll = await directus.items("monthly_payrolls").readOne(request.payroll_id);
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
           
           await directus.items("monthly_payrolls").update(request.payroll_id, {
             bonuses: newBonuses,
             deductions: newDeductions,
             gross_salary,
             net_salary
           });
        }
      }
    }

    return await this.repo.update(id, {
      status: "approved",
      approved_by,
      approved_at: new Date().toISOString(),
      manager_note,
    });
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

    return await this.repo.update(id, {
      status: "rejected",
      approved_by: rejected_by, // Reuse approved_by for rejected_by or add new field? 
      // Model only has approved_by. Let's use it as "action_by".
      approved_at: new Date().toISOString(),
      manager_note,
    });
  }
}

export default SalaryRequestService;
