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

  async remove(id: string) {
    const existing = await this.repo.findById(id);
    if (!existing)
      throw new HttpError(
        404,
        "Không tìm thấy lịch làm việc tuần",
        "WEEKLY_SCHEDULE_NOT_FOUND"
      );

    await this.repo.delete(id);
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
}

export default WeeklyScheduleService;
