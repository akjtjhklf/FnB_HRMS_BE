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
    // Ensure fields are properly passed to repository for relation population
    if (!query.fields || query.fields.length === 0) {
      // Default: include all shift fields + shift_type relation
      // In Directus, we specify the foreign key field followed by the nested fields to expand the relation
      query.fields = [
        '*', 
        'shift_type_id.id',
        'shift_type_id.name', 
        'shift_type_id.start_time',
        'shift_type_id.end_time',
        'shift_type_id.color',
        'shift_type_id.cross_midnight',
        'shift_type_id.code'
      ];
    }
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
    console.log(`🔍 Found ${shiftTypeIds.length} unique shift types: ${shiftTypeIds.join(', ')}`);
    
    // Fetch all shift types at once
    const shiftTypes = await this.shiftTypeRepo.findAll({
      filter: { id: { _in: shiftTypeIds } },
    });
    console.log(`📦 Loaded ${shiftTypes.length} shift type definitions`);
    
    // Create a map for quick lookup
    const shiftTypeMap = new Map(shiftTypes.map((st: any) => [st.id, st]));

    // Process shifts: DON'T send start_at/end_at for bulk create
    // These are DATETIME fields in Directus but we only have TIME values
    // Let Directus handle these based on shift_type relationship
    const processedShifts = shifts.map((shift, index) => {
      return {
        schedule_id: shift.schedule_id,
        shift_type_id: shift.shift_type_id,
        shift_date: shift.shift_date,
        total_required: shift.total_required,
        notes: shift.notes,
        // OMIT start_at and end_at - they're DATETIME fields but we only have TIME
        // Directus will reject HH:mm:ss format for DATETIME fields
      };
    });

    console.log(`🔄 Processed ${processedShifts.length} shifts with times from shift_types`);
    console.log(`📝 First processed shift:`, JSON.stringify(processedShifts[0], null, 2));
    console.log(`📝 Last processed shift:`, JSON.stringify(processedShifts[processedShifts.length - 1], null, 2));
    
    console.log(`🚀 Calling repository.createMany with ${processedShifts.length} shifts...`);
    const created = await (this.repo as ShiftRepository).createMany(processedShifts);
    console.log(`✅ Repository createMany returned ${created.length} shifts`);
    console.log(`📋 Created shift dates:`, created.map((s: any) => s.shift_date));
    console.log(`📋 Created shift IDs:`, created.map((s: any) => s.id));
    
    return created;
  }

  /**
   * ============================================
   * 📅 LẤY CA LÀM VIỆC HÔM NAY
   * ============================================
   */
  async getTodayShifts() {
    try {
      const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
      console.log(`📅 [getTodayShifts] Fetching shifts for date: ${today}`);
      
      // Fetch all shifts for today
      const shifts = await this.repo.findAll({
        filter: {
          shift_date: { _eq: today }
        },
        fields: [
          '*',
          'shift_type_id.id',
          'shift_type_id.name',
          'shift_type_id.start_time',
          'shift_type_id.end_time',
          'shift_type_id.color',
          'shift_type_id.code'
        ]
      });

      console.log(`✅ [getTodayShifts] Found ${shifts.length} shifts`);

      // Get assignment counts for each shift
      const directus = (this.repo as any).directus;
      const results = [];

      for (const shift of shifts) {
        try {
          // Count assigned employees for this shift
          const assignments = await directus.items('schedule_assignments').readByQuery({
            filter: {
              shift_id: { _eq: shift.id },
              status: { _in: ['assigned', 'tentative'] }
            },
            aggregate: {
              count: ['id']
            }
          });

          const assignedCount = assignments?.data?.[0]?.count?.id || 0;
          const requiredCount = shift.total_required || 0;

          results.push({
            id: shift.id,
            shift_type_name: (shift.shift_type_id as any)?.name || 'N/A',
            shift_type_code: (shift.shift_type_id as any)?.code || 'N/A',
            start_time: (shift.shift_type_id as any)?.start_time || 'N/A',
            end_time: (shift.shift_type_id as any)?.end_time || 'N/A',
            color: (shift.shift_type_id as any)?.color || '#999',
            total_required: requiredCount,
            total_assigned: assignedCount,
            status: assignedCount >= requiredCount ? 'sufficient' : 'insufficient'
          });
        } catch (assignmentError) {
          console.error(`❌ [getTodayShifts] Error counting assignments for shift ${shift.id}:`, assignmentError);
          // Continue with other shifts even if one fails
          results.push({
            id: shift.id,
            shift_type_name: (shift.shift_type_id as any)?.name || 'N/A',
            shift_type_code: (shift.shift_type_id as any)?.code || 'N/A',
            start_time: (shift.shift_type_id as any)?.start_time || 'N/A',
            end_time: (shift.shift_type_id as any)?.end_time || 'N/A',
            color: (shift.shift_type_id as any)?.color || '#999',
            total_required: shift.total_required || 0,
            total_assigned: 0,
            status: 'insufficient'
          });
        }
      }

      console.log(`📊 [getTodayShifts] Returning ${results.length} results`);
      return results;
    } catch (error) {
      console.error(`❌ [getTodayShifts] Error:`, error);
      throw error;
    }
  }
}

export default ShiftService;
