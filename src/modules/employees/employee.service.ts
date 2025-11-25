import { BaseService, HttpError } from "../../core/base";
import { Employee } from "./employee.model";
import EmployeeRepository from "./employee.repository";
import {
  PaginationQueryDto,
  PaginatedResponse,
} from "../../core/dto/pagination.dto";
import { CreateFullEmployeeDto } from "./employee.dto";
import UserService from "../users/user.service";
import { directus as DirectusClient } from "../../utils/directusClient";
import { createUser, readUsers, createItem, deleteItem, readItems, updateUser } from "@directus/sdk";
import DirectusAccessService from "../../core/services/directus-access.service";

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

  /**
   * Create Full Employee (User -> Access -> Employee -> RFID)
   * Transactional-like behavior with manual rollback
   */
  async createFull(data: CreateFullEmployeeDto) {
    const userService = new UserService();
    let createdUserId: string | null = null;
    let createdEmployeeId: string | null = null;
    let createdRfidId: string | null = null;

    try {
      // 1. Create User
      console.log("Creating User...");
      const userPayload = {
        email: data.email,
        password: data.password,
        first_name: data.first_name,
        last_name: data.last_name,
        status: "active" as const,
      };
      
      // Check if user exists first to avoid partial failure later
      const existingUsers = await DirectusClient.request(readUsers({ filter: { email: { _eq: data.email } } }));
      if (existingUsers && existingUsers.length > 0) {
          throw new HttpError(409, "Email already exists", "EMAIL_CONFLICT");
      }

      const user = await DirectusClient.request(createUser(userPayload));
      createdUserId = user.id;

      // 2. Assign Role to User (policies are inherited from role)
      console.log("Assigning Role to User...");
      await DirectusClient.request(updateUser(createdUserId!, {
        role: data.roleId
      }));

      // 2.1 Assign Extra Policies (if any)
      if (data.policyIds && data.policyIds.length > 0) {
        console.log("Assigning Extra Policies to User...");
        await DirectusAccessService.assignPoliciesToUser(createdUserId!, data.policyIds);
      }

      // 3. Create Employee
      console.log("Creating Employee...");
      const employeePayload = {
        ...data,
        user_id: createdUserId,
        full_name: `${data.first_name} ${data.last_name}`,
        // Remove non-employee fields
        roleId: undefined,
        policyIds: undefined,
        rfidCode: undefined,
        password: undefined,
      };
      
      // Clean up payload
      delete (employeePayload as any).roleId;
      delete (employeePayload as any).policyIds;
      delete (employeePayload as any).rfidCode;
      delete (employeePayload as any).password;

      const employee = await this.create(employeePayload);
      createdEmployeeId = employee.id;

      // 4. Create RFID (Optional)
      if (data.rfidCode) {
        console.log("Creating RFID...");
        // Check if RFID exists
        const existingRfid = await DirectusClient.request(readItems('rfid_cards' as any, {
            filter: { card_number: { _eq: data.rfidCode } }
        }));
        
        if (existingRfid && existingRfid.length > 0) {
             throw new HttpError(409, "RFID Code already exists", "RFID_CONFLICT");
        }

        const rfid = await DirectusClient.request(createItem('rfid_cards' as any, {
            card_number: data.rfidCode,
            employee_id: createdEmployeeId,
            status: "active"
        }));
        createdRfidId = rfid.id;
      }

      return await this.get(createdEmployeeId!);

    } catch (error: any) {
      console.error("Create Full Employee Failed. Rolling back...", error);
      
      // Rollback
      if (createdRfidId) {
          try { await DirectusClient.request(deleteItem('rfid_cards' as any, createdRfidId)); } catch(e) { console.error("Rollback RFID failed", e); }
      }
      if (createdEmployeeId) {
          try { await this.repo.delete(createdEmployeeId); } catch(e) { console.error("Rollback Employee failed", e); }
      }
      if (createdUserId) {
          try { await userService.remove(createdUserId); } catch(e) { console.error("Rollback User failed", e); }
      }

      throw error;
    }
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

  // remove() method được kế thừa từ BaseService với cascade delete tự động
  // Nếu cần kiểm tra trước khi xóa, override lại và gọi super.remove(id)
}

export default EmployeeService;
