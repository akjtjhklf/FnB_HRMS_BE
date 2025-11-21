import { BaseService, HttpError } from "../../core/base";
import { WeeklySchedule } from "./weekly-schedule.model";
import WeeklyScheduleRepository from "./weekly-schedule.repository";
import ShiftTypeRepository from "../shift-types/shift-type.repository";
import ShiftRepository from "../shifts/shift.repository";
import {
  PaginatedResponse,
  PaginationQueryDto,
} from "../../core/dto/pagination.dto";

export class WeeklyScheduleService extends BaseService<WeeklySchedule> {
  constructor(repo = new WeeklyScheduleRepository()) {
    super(repo);
  }

  async list(query?: Record<string, unknown>, client?: any) {
    const repo = client ? new WeeklyScheduleRepository(client) : this.repo;
    return await repo.findAll(query as any);
  }

  async listPaginated(
    query: PaginationQueryDto
  ): Promise<PaginatedResponse<WeeklySchedule>> {
    return await (this.repo as WeeklyScheduleRepository).findAllPaginated(
      query
    );
  }
  async get(id: string) {
    const item = await this.repo.findById(id);
    if (!item)
      throw new HttpError(
        404,
        "Không tìm thấy lịch làm việc tuần",
        "WEEKLY_SCHEDULE_NOT_FOUND"
      );
    return item;
  }

  async create(data: Partial<WeeklySchedule>) {
    return await this.repo.create(data);
  }

  async update(id: string, data: Partial<WeeklySchedule>) {
    const existing = await this.repo.findById(id);
    if (!existing)
      throw new HttpError(
        404,
        "Không tìm thấy lịch làm việc tuần",
        "WEEKLY_SCHEDULE_NOT_FOUND"
      );

    return await this.repo.update(id, data);
  }

  // remove() method được kế thừa từ BaseService với cascade delete tự động

  /**
   * ============================================
   * 📢 CÔNG BỐ LỊCH TUẦN - PUBLISH
   * ============================================
   * Chuyển status từ "draft" → "scheduled"
   * Lưu thời điểm công bố
   */
  async publish(id: string) {
    const existing = await this.repo.findById(id);
    if (!existing)
      throw new HttpError(
        404,
        "Không tìm thấy lịch làm việc tuần",
        "WEEKLY_SCHEDULE_NOT_FOUND"
      );

    if (existing.status !== "draft") {
      throw new HttpError(
        400,
        "Chỉ có thể công bố lịch ở trạng thái nháp",
        "INVALID_STATUS"
      );
    }

    return await this.repo.update(id, {
      status: "scheduled",
      published_at: new Date().toISOString(),
    });
  }

  /**
   * ============================================
   * ✅ HOÀN TẤT LỊCH TUẦN - FINALIZE
   * ============================================
   * Chuyển status từ "scheduled" → "finalized"
   * Khóa lịch, không cho phép thay đổi
   */
  async finalize(id: string) {
    const existing = await this.repo.findById(id);
    if (!existing)
      throw new HttpError(
        404,
        "Không tìm thấy lịch làm việc tuần",
        "WEEKLY_SCHEDULE_NOT_FOUND"
      );

    if (existing.status !== "scheduled") {
      throw new HttpError(
        400,
        "Chỉ có thể hoàn tất lịch đã được công bố",
        "INVALID_STATUS"
      );
    }

    return await this.repo.update(id, {
      status: "finalized",
    });
  }

  async createWeeklyScheduleWithShifts(
    data: Partial<WeeklySchedule> & { start_date: string },
    client?: any
  ) {
    try {
      const weeklyRepo = new WeeklyScheduleRepository(client);
      const shiftTypeRepo = new ShiftTypeRepository(client);
      const shiftRepo = new ShiftRepository(client);

      console.log("🔧 Creating weekly schedule with client:", !!client);

      // 1. Tạo lịch tuần
      const startDate = new Date(data.start_date);
      const endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + 6);

      const weeklySchedule = await weeklyRepo.create({
        week_start: startDate.toISOString().split("T")[0],
        week_end: endDate.toISOString().split("T")[0],
        status: "draft",
      });

      console.log("✅ Created weekly schedule:", weeklySchedule.id);

      // 2. Lấy shift types
      const shiftTypes = await shiftTypeRepo.findAll();
      console.log("✅ Found shift types:", shiftTypes.length);

      // 3. Tạo shifts
      const shiftsToCreate = [];
      for (let i = 0; i < 7; i++) {
        const currentDate = new Date(startDate);
        currentDate.setDate(startDate.getDate() + i);
        const dayOfWeek = currentDate.getDay();
        const dayLabel = [
          "Chủ nhật",
          "Thứ 2",
          "Thứ 3",
          "Thứ 4",
          "Thứ 5",
          "Thứ 6",
          "Thứ 7",
        ][dayOfWeek];
        const dateStr = currentDate.toISOString().slice(0, 10);

        for (const type of shiftTypes) {
          shiftsToCreate.push({
            weekly_schedule_id: weeklySchedule.id,
            shift_type_id: type.id,
            name: `${dayLabel} ca ${type.name} ngày ${dateStr}`,
            shift_date: dateStr, // ✅ FIXED: Đổi từ "date" thành "shift_date"
            start_time: type.start_time,
            end_time: type.end_time,
            cross_midnight: type.cross_midnight ?? false,
            status: "draft",
          });
        }
      }

      console.log("📝 Creating", shiftsToCreate.length, "shifts");

      // 4. Tạo shifts
      const createdShifts = await shiftRepo.createMany(shiftsToCreate);

      console.log("✅ Created shifts:", createdShifts.length);

      return {
        weekly_schedule: weeklySchedule,
        total_shifts: createdShifts.length,
      };
    } catch (error: any) {
      console.error("❌ Service error:", error);
      throw error;
    }
  }

  /**
   * ============================================
   * ✅ VALIDATE SCHEDULE - KIỂM TRA HỢP LỆ
   * ============================================
   */
  async validateSchedule(id: string) {
    const schedule = await this.repo.findById(id);
    if (!schedule) {
      throw new HttpError(404, "Không tìm thấy lịch tuần", "WEEKLY_SCHEDULE_NOT_FOUND");
    }

    const shiftRepo = new ShiftRepository();
    const shifts = await shiftRepo.findAll({
      filter: { schedule_id: { _eq: id } },
    });

    const warnings: string[] = [];
    const errors: string[] = [];

    // Check 1: Có shifts chưa
    if (shifts.length === 0) {
      errors.push("Chưa có ca làm việc nào");
    }

    // Check 2: Mỗi shift có position requirements chưa
    const ShiftPositionRequirementRepository = require("../shift-position-requirements/shift-position-requirement.repository").default;
    const reqRepo = new ShiftPositionRequirementRepository();
    
    for (const shift of shifts) {
      const reqs = await reqRepo.findAll({
        filter: { shift_id: { _eq: shift.id } },
      });

      if (reqs.length === 0) {
        warnings.push(`Ca ${shift.shift_date} chưa có yêu cầu vị trí`);
      }
    }

    return {
      canPublish: errors.length === 0,
      valid: errors.length === 0 && warnings.length === 0,
      errors,
      warnings,
      schedule,
      totalShifts: shifts.length,
    };
  }

  /**
   * ============================================
   * 🔍 CHECK READINESS - KIỂM TRA ĐỦ ĐIỀU KIỆN
   * ============================================
   */
  async checkReadiness(id: string) {
    const schedule = await this.repo.findById(id);
    if (!schedule) {
      throw new HttpError(404, "Không tìm thấy lịch tuần", "WEEKLY_SCHEDULE_NOT_FOUND");
    }

    const shiftRepo = new ShiftRepository();
    const shifts = await shiftRepo.findAll({
      filter: { schedule_id: { _eq: id } },
    });

    const ShiftPositionRequirementRepository = require("../shift-position-requirements/shift-position-requirement.repository").default;
    const ScheduleAssignmentRepository = require("../schedule-assignments/schedule-assignment.repository").default;
    
    const reqRepo = new ShiftPositionRequirementRepository();
    const assignRepo = new ScheduleAssignmentRepository();

    const issues: Array<{
      shiftId: string;
      shiftDate: string;
      positionId: string;
      required: number;
      assigned: number;
      missing: number;
    }> = [];

    let totalRequired = 0;
    let totalAssigned = 0;

    for (const shift of shifts) {
      const reqs = await reqRepo.findAll({
        filter: { shift_id: { _eq: shift.id } },
      });

      for (const req of reqs) {
        const assignments = await assignRepo.findAll({
          filter: {
            shift_id: { _eq: shift.id },
            position_id: { _eq: req.position_id },
            status: { _nin: ["cancelled"] },
          },
        });

        const assignedCount = assignments.length;
        const requiredCount = req.required_count;

        totalRequired += requiredCount;
        totalAssigned += assignedCount;

        if (assignedCount < requiredCount) {
          issues.push({
            shiftId: shift.id,
            shiftDate: shift.shift_date,
            positionId: req.position_id,
            required: requiredCount,
            assigned: assignedCount,
            missing: requiredCount - assignedCount,
          });
        }
      }
    }

    const isReady = issues.length === 0 && totalRequired > 0;
    const coverageRate = totalRequired > 0 ? (totalAssigned / totalRequired) * 100 : 0;

    return {
      isReady,
      canPublish: coverageRate >= 80, // Cho phép publish nếu đạt 80% coverage
      coverageRate: Math.round(coverageRate * 100) / 100,
      totalShifts: shifts.length,
      totalRequired,
      totalAssigned,
      missingAssignments: totalRequired - totalAssigned,
      issues,
      message: isReady
        ? "Lịch đã đủ điều kiện publish"
        : `Còn thiếu ${totalRequired - totalAssigned} phân công`,
    };
  }

  /**
   * ============================================
   * 📊 GET STATS - THỐNG KÊ
   * ============================================
   */
  async getStats(id: string) {
    const schedule = await this.repo.findById(id);
    if (!schedule) {
      throw new HttpError(404, "Không tìm thấy lịch tuần", "WEEKLY_SCHEDULE_NOT_FOUND");
    }

    const shiftRepo = new ShiftRepository();
    const shifts = await shiftRepo.findAll({
      filter: { schedule_id: { _eq: id } },
    });

    const EmployeeAvailabilityRepository = require("../employee-availability/employee-availability.repository").default;
    const ScheduleAssignmentRepository = require("../schedule-assignments/schedule-assignment.repository").default;
    
    const availRepo = new EmployeeAvailabilityRepository();
    const assignRepo = new ScheduleAssignmentRepository();

    const shiftIds = shifts.map((s) => s.id);

    const availabilities = await availRepo.findAll({
      filter: { shift_id: { _in: shiftIds } },
    });

    const assignments = await assignRepo.findAll({
      filter: {
        schedule_id: { _eq: id },
        status: { _nin: ["cancelled"] },
      },
    });

    // Group by employee
    const employeeStats = new Map<string, { availabilities: number; assignments: number }>();

    for (const avail of availabilities) {
      const stats = employeeStats.get(avail.employee_id) || { availabilities: 0, assignments: 0 };
      stats.availabilities++;
      employeeStats.set(avail.employee_id, stats);
    }

    for (const assign of assignments) {
      const stats = employeeStats.get(assign.employee_id) || { availabilities: 0, assignments: 0 };
      stats.assignments++;
      employeeStats.set(assign.employee_id, stats);
    }

    const employeeAssignmentCounts = Array.from(employeeStats.values()).map((s) => s.assignments);

    return {
      schedule,
      shifts: {
        total: shifts.length,
        byDay: shifts.reduce((acc: Record<number, number>, shift) => {
          const day = new Date(shift.shift_date).getDay();
          acc[day] = (acc[day] || 0) + 1;
          return acc;
        }, {} as Record<number, number>),
      },
      employees: {
        totalWithAvailability: availabilities.length > 0 
          ? new Set(availabilities.map((a: any) => a.employee_id)).size 
          : 0,
        totalAssigned: assignments.length > 0 
          ? new Set(assignments.map((a: any) => a.employee_id)).size 
          : 0,
        avgShiftsPerEmployee:
          employeeAssignmentCounts.length > 0
            ? Math.round(
                (employeeAssignmentCounts.reduce((a: number, b: number) => a + b, 0) / employeeAssignmentCounts.length) * 100
              ) / 100
            : 0,
        minShifts: employeeAssignmentCounts.length > 0 ? Math.min(...employeeAssignmentCounts) : 0,
        maxShifts: employeeAssignmentCounts.length > 0 ? Math.max(...employeeAssignmentCounts) : 0,
      },
      availabilities: {
        total: availabilities.length,
      },
      assignments: {
        total: assignments.length,
        bySource: {
          auto: assignments.filter((a: any) => a.source === "auto").length,
          manual: assignments.filter((a: any) => a.source === "manual").length,
        },
        confirmed: assignments.filter((a: any) => a.confirmed_by_employee).length,
        pending: assignments.filter((a: any) => !a.confirmed_by_employee).length,
      },
    };
  }
}

export default WeeklyScheduleService;
