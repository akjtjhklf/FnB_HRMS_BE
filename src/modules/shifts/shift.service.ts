import { BaseService, HttpError } from "../../core/base";
import { Shift } from "./shift.model";
import ShiftRepository from "./shift.repository";
import { PaginationQueryDto, PaginatedResponse } from "../../core/dto/pagination.dto";
import ShiftTypeRepository from "../shift-types/shift-type.repository";

export class ShiftService extends BaseService<Shift> {
  private shiftTypeRepo: ShiftTypeRepository;

  constructor(repo = new ShiftRepository(), shiftTypeRepo = new ShiftTypeRepository()) {
    super(repo);
    this.shiftTypeRepo = shiftTypeRepo;
  }

  async listPaginated(query: PaginationQueryDto): Promise<PaginatedResponse<Shift>> {
    return await (this.repo as ShiftRepository).findAllPaginated(query);
  }

  async list(query?: Record<string, unknown>) {
    return await this.repo.findAll(query);
  }

  async get(id: string) {
    const shift = await this.repo.findById(id);
    if (!shift)
      throw new HttpError(404, "Không tìm thấy ca làm việc", "SHIFT_NOT_FOUND");
    return shift;
  }

  async create(data: Partial<Shift>) {
    return await this.repo.create(data);
  }

  async update(id: string, data: Partial<Shift>) {
    const existing = await this.repo.findById(id);
    if (!existing)
      throw new HttpError(404, "Không tìm thấy ca làm việc", "SHIFT_NOT_FOUND");

    return await this.repo.update(id, data);
  }

  // remove() method được kế thừa từ BaseService với cascade delete tự động

  async listBySchedule(scheduleId: string) {
    return await (this.repo as any).findByScheduleId(scheduleId);
  }

  /**
   * ============================================
   * 📦 TẠO NHIỀU CA CÙNG LÚC
   * ============================================
   */
  async createBulk(shifts: Partial<Shift>[]) {
    if (!Array.isArray(shifts) || shifts.length === 0) {
      throw new HttpError(400, "shifts phải là mảng và không được rỗng");
    }

    // Validate each shift
    for (let i = 0; i < shifts.length; i++) {
      const shift = shifts[i];
      if (!shift.schedule_id) {
        throw new HttpError(400, `Shift #${i}: schedule_id là bắt buộc`);
      }
      if (!shift.shift_type_id) {
        throw new HttpError(400, `Shift #${i}: shift_type_id là bắt buộc`);
      }
      if (!shift.shift_date) {
        throw new HttpError(400, `Shift #${i}: shift_date là bắt buộc`);
      }
    }

    console.log(`✅ Validation passed for ${shifts.length} shifts`);

    // Get all unique shift type IDs
    const shiftTypeIds = [...new Set(shifts.map(s => s.shift_type_id).filter(Boolean))];
    
    // Fetch all shift types at once
    const shiftTypes = await this.shiftTypeRepo.findAll({
      filter: { id: { _in: shiftTypeIds } },
    });
    
    // Create a map for quick lookup
    const shiftTypeMap = new Map(shiftTypes.map((st: any) => [st.id, st]));

    // Process shifts: fill in missing start_at/end_at from shift_type, convert to ISO datetime
    const processedShifts = shifts.map((shift) => {
      const shiftType = shiftTypeMap.get(shift.shift_type_id!);
      
      // Use shift's times if provided, otherwise fallback to shift_type's default times
      let startTime = shift.start_at;
      let endTime = shift.end_at;
      
      if (!startTime && shiftType) {
        startTime = (shiftType as any).default_start_time || (shiftType as any).start_time;
      }
      if (!endTime && shiftType) {
        endTime = (shiftType as any).default_end_time || (shiftType as any).end_time;
      }

      return {
        ...shift,
        start_at: shift.shift_date && startTime 
          ? `${shift.shift_date}T${startTime}` 
          : startTime || null,
        end_at: shift.shift_date && endTime 
          ? `${shift.shift_date}T${endTime}` 
          : endTime || null,
      };
    });

    console.log(`🔄 Processed ${processedShifts.length} shifts with times from shift_types`);
    console.log(`📝 Sample shift:`, JSON.stringify(processedShifts[0], null, 2));
    
    return await (this.repo as ShiftRepository).createMany(processedShifts);
  }
}

export default ShiftService;
