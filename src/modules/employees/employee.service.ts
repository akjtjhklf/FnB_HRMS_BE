import { BaseService, HttpError } from "../../core/base";
import { Employee } from "./employee.model";
import EmployeeRepository from "./employee.repository";
import {
  PaginationQueryDto,
  PaginatedResponse,
} from "../../core/dto/pagination.dto";
import { CreateFullEmployeeDto } from "./employee.dto";
import UserService from "../users/user.service";
import { directus as DirectusClient, getAuthToken } from "../../utils/directusClient";
import { createUser, readUsers, createItem, deleteItem, deleteItems, readItems, updateUser, updateItem } from "@directus/sdk";
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

  /** Lấy 1 employee theo ID kèm user + role + policies */
  async get(id: string | number): Promise<Employee> {
    // Use readItems directly to ensure we get exactly what we want
    const employees = await DirectusClient.request(readItems('employees' as any, {
        filter: { id: { _eq: id } },
        fields: [
            '*',
            'user.*',
            'user.role.*',
            'user.policies.*' // Try to fetch policies directly if possible, though usually it's via directus_access
        ]
    }));
    
    if (!employees || employees.length === 0)
      throw new HttpError(
        404,
        "Không tìm thấy nhân viên",
        "EMPLOYEE_NOT_FOUND"
      );
      
    const emp = employees[0] as Employee;
    
    // If user is just an ID (expansion failed), try to fetch user separately
    if (emp.user && typeof emp.user === 'string') {
        try {
            const user = await DirectusClient.request(readUsers({
                filter: { id: { _eq: emp.user } },
                fields: ['*', 'role.*']
            }));
            if (user && user.length > 0) {
                emp.user = user[0] as any;
            }
        } catch (e) {
            console.error("Failed to fetch user details", e);
        }
    } else if (emp.user_id && !emp.user) {
         // If user_id exists but user is missing
         try {
            const user = await DirectusClient.request(readUsers({
                filter: { id: { _eq: emp.user_id } },
                fields: ['*', 'role.*']
            }));
            if (user && user.length > 0) {
                emp.user = user[0] as any;
            }
        } catch (e) {
            console.error("Failed to fetch user details from user_id", e);
        }
    }
    
    // Fetch policies if user exists
    if (emp.user && typeof emp.user === 'object' && emp.user.id) {
      try {
        const policies = await DirectusAccessService.getUserPolicies(emp.user.id);
        (emp.user as any).policies = policies;
      } catch (error) {
        console.error("Error fetching user policies:", error);
        (emp.user as any).policies = [];
      }
    }

    // Fetch RFID cards using raw fetch to avoid permission issues with SDK
    try {
      const directusUrl = process.env.DIRECTUS_URL || 'http://localhost:8055';
      const token = await getAuthToken();
      
      if (token) {
          const url = new URL(`${directusUrl}/items/rfid_cards`);
          url.searchParams.append('filter', JSON.stringify({ 
              employee_id: { _eq: id }, 
              status: { _eq: 'active' } 
          }));
          url.searchParams.append('fields', 'card_number,status');
          
          const response = await fetch(url.toString(), {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          });
          
          if (response.ok) {
              const result = await response.json();
              (emp as any).rfid_cards = result.data;
          } else {
              console.warn("Failed to fetch RFID cards via raw fetch", await response.text());
              (emp as any).rfid_cards = [];
          }
      } else {
           // Fallback to SDK if no token (shouldn't happen if authenticated)
           const rfidCards = await DirectusClient.request(readItems('rfid_cards' as any, {
                filter: { employee_id: { _eq: id }, status: { _eq: 'active' } },
                fields: ['card_number', 'status']
           }));
           (emp as any).rfid_cards = rfidCards;
      }
    } catch (error) {
      console.error("Error fetching RFID cards:", error);
      (emp as any).rfid_cards = [];
    }
    
    return emp;
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

  /**
   * Update Full Employee (Employee -> User -> Access -> RFID)
   */
  async updateFull(id: string, data: Partial<CreateFullEmployeeDto>) {
    const employee = await this.get(id);
    if (!employee) throw new HttpError(404, "Employee not found", "EMPLOYEE_NOT_FOUND");

    try {
      // 1. Update Employee Basic Info
      const employeePayload = { ...data };
      // Remove non-employee fields
      delete (employeePayload as any).email;
      delete (employeePayload as any).password;
      delete (employeePayload as any).roleId;
      delete (employeePayload as any).policyIds;
      delete (employeePayload as any).rfidCode;

      await this.repo.update(id, employeePayload);

      // 2. Update User Info (if user exists)
      if (employee.user && employee.user.id) {
        const userUpdates: any = {};
        if (data.email) userUpdates.email = data.email;
        if (data.roleId) userUpdates.role = data.roleId;
        if (data.password) userUpdates.password = data.password;
        
        if (Object.keys(userUpdates).length > 0) {
           await DirectusClient.request(updateUser(employee.user.id, userUpdates));
        }

        // Update Policies
        if (data.policyIds) {
           await DirectusAccessService.replaceUserPolicies(employee.user.id, data.policyIds);
        }
      } else if (data.email && data.password && data.roleId) {
        // 2b. Create User if not exists (and we have enough info)
        console.log("Creating missing User for Employee during update...");
        
        // Check if email exists
        const existingUsers = await DirectusClient.request(readUsers({ filter: { email: { _eq: data.email } } }));
        if (existingUsers && existingUsers.length > 0) {
             throw new HttpError(409, "Email already exists", "EMAIL_CONFLICT");
        }

        const userPayload = {
            email: data.email,
            password: data.password,
            first_name: data.first_name || employee.first_name,
            last_name: data.last_name || employee.last_name,
            status: "active" as const,
            role: data.roleId
        };

        const newUser = await DirectusClient.request(createUser(userPayload));
        
        // Link to employee
        await this.repo.update(id, { user_id: newUser.id });

        // Assign policies
        if (data.policyIds && data.policyIds.length > 0) {
             await DirectusAccessService.assignPoliciesToUser(newUser.id, data.policyIds);
        }
      }

      // 3. Update RFID
      if (data.rfidCode !== undefined) {
          // Find existing active RFID
          const existingRfids = (employee as any).rfid_cards || [];
          const currentActive = existingRfids.find((c: any) => c.status === 'active');

          if (data.rfidCode) {
              // If new code is different from current active
              if (!currentActive || currentActive.card_number !== data.rfidCode) {
                  // Deactivate old one
                  if (currentActive) {
                      await DirectusClient.request(updateItem('rfid_cards' as any, currentActive.id, { status: 'inactive' }));
                  }
                  
                  // Check if new code exists
                  const codeExists = await DirectusClient.request(readItems('rfid_cards' as any, {
                      filter: { card_number: { _eq: data.rfidCode } }
                  }));
                  
                  if (codeExists && codeExists.length > 0) {
                      const target = codeExists[0];
                      if (target.status === 'active' && target.employee_id !== id) {
                          throw new HttpError(409, "RFID Code already used by another employee", "RFID_CONFLICT");
                      }
                      // Update to active and assign to this employee
                      await DirectusClient.request(updateItem('rfid_cards' as any, target.id, { status: 'active', employee_id: id }));
                  } else {
                      // Create new
                      await DirectusClient.request(createItem('rfid_cards' as any, {
                          card_number: data.rfidCode,
                          employee_id: id,
                          status: 'active'
                      }));
                  }
              }
          } else {
              // If empty code provided, deactivate current active
              if (currentActive) {
                  await DirectusClient.request(updateItem('rfid_cards' as any, currentActive.id, { status: 'inactive' }));
              }
          }
      }
      
      return await this.get(id);

    } catch (error) {
      console.error("Update Full Employee Failed", error);
      throw error;
    }
  }

  // remove() method được kế thừa từ BaseService với cascade delete tự động
  // Nếu cần kiểm tra trước khi xóa, override lại và gọi super.remove(id)
}

export default EmployeeService;
