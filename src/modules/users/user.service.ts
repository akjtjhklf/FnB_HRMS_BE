import { BaseService, HttpError } from "../../core/base";
import { User } from "./user.model";
import UserRepository from "./user.repository";
import { PaginationQueryDto, PaginatedResponse } from "../../core/dto/pagination.dto";

export class UserService extends BaseService<User> {
  constructor(repo = new UserRepository()) {
    super(repo);
  }

  async listPaginated(query: PaginationQueryDto): Promise<PaginatedResponse<User>> {
    return await (this.repo as UserRepository).findAllPaginated(query);
  }

  /**
   * Lấy danh sách người dùng (hỗ trợ query/pagination)
   */
  async list(query?: Record<string, unknown>) {
    return await this.repo.findAll(query);
  }

  /**
   * Lấy chi tiết người dùng theo ID
   */
  async get(id: number | string) {
    const user = await this.repo.findById(id);
    if (!user)
      throw new HttpError(404, "Không tìm thấy người dùng", "USER_NOT_FOUND");
    return user;
  }

  /**
   * Tạo người dùng mới — dùng Zod để validate
   */
  async create(data: Partial<User>) {
    // ⚡ Nếu cần có logic riêng, thêm tại đây (ví dụ kiểm tra email trùng)
    const existing = await this.repo.findAll({
      filter: { email: { _eq: data.email } },
    });
    if (existing.length > 0) {
      throw new HttpError(409, "Email đã tồn tại", "EMAIL_CONFLICT");
    }

    return await this.repo.create(data);
  }

  /**
   * Cập nhật thông tin người dùng — dùng Zod để validate
   */
  async update(id: number | string, data: Partial<User>) {
    const user = await this.repo.findById(id);
    if (!user)
      throw new HttpError(404, "Không tìm thấy người dùng", "USER_NOT_FOUND");

    return await this.repo.update(id, data);
  }

  /**
   * Xoá người dùng (cascade delete - xóa employee liên quan trước)
   */
  async remove(id: number | string) {
    const user = await this.repo.findById(id);
    if (!user)
      throw new HttpError(404, "Không tìm thấy người dùng", "USER_NOT_FOUND");

    // Cascade delete: tìm và xóa employee liên quan
    const directusClient = (this.repo as any).directus;
    
    // Tìm employee có user_id này
    const employees = await directusClient.items("employees").readByQuery({
      filter: { user_id: { _eq: id } },
      fields: ["id"]
    });
    
    const employeeIds = employees.data?.map((e: any) => e.id) || [];
    
    // Xóa từng employee (sẽ trigger cascade delete của employee)
    for (const empId of employeeIds) {
      // Xóa contracts
      await directusClient.items("contracts").delete({
        filter: { employee_id: { _eq: empId } }
      });
      
      // Xóa deductions
      await directusClient.items("deductions").delete({
        filter: { employee_id: { _eq: empId } }
      });
      
      // Xóa rfid_cards
      await directusClient.items("rfid_cards").delete({
        filter: { employee_id: { _eq: empId } }
      });
      
      // Xóa attendance_logs
      await directusClient.items("attendance_logs").delete({
        filter: { employee_id: { _eq: empId } }
      });
      
      // Xóa attendance_shifts
      await directusClient.items("attendance_shifts").delete({
        filter: { employee_id: { _eq: empId } }
      });
      
      // Xóa employee_availability
      await directusClient.items("employee_availability").delete({
        filter: { employee_id: { _eq: empId } }
      });
      
      // Xóa schedule_assignments
      await directusClient.items("schedule_assignments").delete({
        filter: { employee_id: { _eq: empId } }
      });
      
      // Xóa monthly_employee_stats
      await directusClient.items("monthly_employee_stats").delete({
        filter: { employee_id: { _eq: empId } }
      });
      
      // Xóa salary_requests
      await directusClient.items("salary_requests").delete({
        filter: { employee_id: { _eq: empId } }
      });
      
      // Xóa schedule_change_requests
      await directusClient.items("schedule_change_requests").delete({
        filter: { requester_id: { _eq: empId } }
      });
      
      // Update devices
      await directusClient.items("devices").update(
        { employee_id_pending: null },
        { filter: { employee_id_pending: { _eq: empId } } }
      );
      
      // Xóa employee
      await directusClient.items("employees").delete(empId);
    }
    
    // Cuối cùng xóa user
    await this.repo.delete(id);
  }
}

export default UserService;
