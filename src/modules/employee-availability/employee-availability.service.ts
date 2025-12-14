import { BaseService, HttpError } from "../../core/base";
import {
  PaginatedResponse,
  PaginationQueryDto,
} from "../../core/dto/pagination.dto";
import { EmployeeAvailability } from "./employee-availability.model";
import EmployeeAvailabilityRepository from "./employee-availability.repository";
import { createItem } from "@directus/sdk";
import ShiftRepository from "../shifts/shift.repository";
import WeeklyScheduleRepository from "../weekly-schedule/weekly-schedule.repository";

export class EmployeeAvailabilityService extends BaseService<EmployeeAvailability> {
  private shiftRepo: ShiftRepository;
  private weeklyScheduleRepo: WeeklyScheduleRepository;

  constructor(repo = new EmployeeAvailabilityRepository()) {
    super(repo);
    this.shiftRepo = new ShiftRepository();
    this.weeklyScheduleRepo = new WeeklyScheduleRepository();
  }

  async list(query?: Record<string, unknown>) {
    return await this.repo.findAll(query);
  }

  async listPaginated(
    query: PaginationQueryDto
  ): Promise<PaginatedResponse<EmployeeAvailability>> {
    return await (this.repo as EmployeeAvailabilityRepository).findAllPaginated(
      query
    );
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

  async create(data: Partial<EmployeeAvailability> & { positions?: string[] }) {
    // ============================================
    // 🔒 SCHEDULE STATUS CHECK - Kiểm tra trạng thái lịch tuần
    // ============================================
    console.log(`\n🔍 [EmployeeAvailability] ====== CREATE REQUEST ======`);
    console.log(`   Incoming data:`, JSON.stringify(data, null, 2));
    console.log(`   Employee ID: ${data.employee_id}`);
    console.log(`   Shift ID: ${data.shift_id}`);

    if (data.shift_id) {
      const shift = await this.shiftRepo.findById(data.shift_id);
      if (!shift) {
        throw new HttpError(404, "Không tìm thấy ca làm việc", "SHIFT_NOT_FOUND");
      }

      if (shift.schedule_id) {
        const schedule = await this.weeklyScheduleRepo.findById(shift.schedule_id);
        if (!schedule) {
          throw new HttpError(404, "Không tìm thấy lịch tuần", "WEEKLY_SCHEDULE_NOT_FOUND");
        }

        console.log(`   Schedule ID: ${schedule.id}, Status: ${schedule.status}`);

        if (schedule.status === "draft") {
          throw new HttpError(
            400,
            "Lịch tuần chưa được công bố. Vui lòng chờ quản lý công bố lịch.",
            "SCHEDULE_NOT_PUBLISHED"
          );
        }

        if (schedule.status === "finalized") {
          throw new HttpError(
            400,
            "Lịch tuần đã hoàn tất. Không thể đăng ký thêm.",
            "SCHEDULE_FINALIZED"
          );
        }

        if (schedule.status === "cancelled") {
          throw new HttpError(
            400,
            "Lịch tuần đã bị hủy.",
            "SCHEDULE_CANCELLED"
          );
        }
      }
    }

    // ============================================
    // 🔍 DUPLICATE CHECK - Kiểm tra trùng lặp
    // ============================================

    const filterQuery = {
      filter: {
        employee_id: { _eq: data.employee_id },
        shift_id: { _eq: data.shift_id },
      },
    };
    console.log(`   Filter query:`, JSON.stringify(filterQuery, null, 2));

    // Use findOne instead of findAll for more explicit and reliable querying
    // This helps avoid potential caching issues with array results
    const existing = await this.repo.findOne(filterQuery);

    console.log(`   Existing record found: ${existing ? 'YES' : 'NO'}`);
    if (existing) {
      console.log(`   Existing record:`, JSON.stringify(existing, null, 2));
      console.log(`   ❌ Duplicate detected - rejecting registration`);
    }

    if (existing) {
      throw new HttpError(
        409,
        `Nhân viên này đã đăng ký khả dụng cho ca làm việc này (Shift ID: ${data.shift_id})`,
        "DUPLICATE_AVAILABILITY"
      );
    }

    console.log(`   ✅ No duplicate found - proceeding with registration`);

    // Extract positions array (nếu có)
    const { positions, ...availabilityData } = data;

    // Step 1: Tạo availability record
    const availability = await this.repo.create(availabilityData);

    // Step 2: Nếu có positions, tạo employee-availability-positions records
    if (positions && positions.length > 0) {
      const client = (this.repo as any).client;

      for (let i = 0; i < positions.length; i++) {
        await client.request((createItem as any)('employee_availability_positions', {
          availability_id: availability.id,
          position_id: positions[i],
          preference_order: i + 1
        }));
      }
    }

    return availability;
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

    // Cascade delete is handled by the repository based on relationships.config.ts
    // employee_availability -> employee_availability_positions
    await this.repo.delete(id);
  }
}

export default EmployeeAvailabilityService;
