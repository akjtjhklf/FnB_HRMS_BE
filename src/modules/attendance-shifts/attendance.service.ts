import { BaseService, HttpError } from "../../core/base";
import { AttendanceShift } from "./attendance-shift.model";
import AttendanceShiftRepository from "./attendance-shift.repository";
import ScheduleAssignmentRepository from "../schedule-assignments/schedule-assignment.repository";
import ShiftRepository from "../shifts/shift.repository";

/**
 * Attendance Service - Core business logic for check-in/check-out
 * 
 * Features:
 * - Employee check-in/check-out
 * - Automatic late/early leave calculation
 * - Working hours tracking
 * - Manual adjustments by admin
 */
export class AttendanceService extends BaseService<AttendanceShift> {
  private assignmentRepo: ScheduleAssignmentRepository;
  private shiftRepo: ShiftRepository;

  constructor() {
    super(new AttendanceShiftRepository());
    this.assignmentRepo = new ScheduleAssignmentRepository();
    this.shiftRepo = new ShiftRepository();
  }

  /**
   * CHECK-IN
   * Employee checks in for their assigned shift
   */
  async checkIn(employeeId: string, options?: {
    assignmentId?: string;
    location?: string;
    rfidCardId?: string;
  }) {
    const now = new Date();
    const assignmentId = options?.assignmentId;

    // Find today's assignment for this employee
    let assignment;
    if (assignmentId) {
      assignment = await this.assignmentRepo.findById(assignmentId);
      if (!assignment || assignment.employee_id !== employeeId) {
        throw new HttpError(403, "Không có quyền check-in ca này", "FORBIDDEN");
      }
    } else {
      // Find current shift assignment for employee
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const todayEnd = new Date();
      todayEnd.setHours(23, 59, 59, 999);

      // Query assignments for today
      const assignments = await this.assignmentRepo.findAll({
        filter: {
          employee_id: { _eq: employeeId },
          status: { _eq: "assigned" },
        },
      });

      // Find the one matching today's shift
      for (const assign of assignments) {
        const shift = await this.shiftRepo.findById(assign.shift_id);
        if (shift) {
          const shiftDate = new Date(shift.shift_date);
          if (shiftDate >= todayStart && shiftDate <= todayEnd) {
            assignment = assign;
            break;
          }
        }
      }

      if (!assignment) {
        throw new HttpError(404, "Không tìm thấy ca làm việc hôm nay", "NO_SHIFT_TODAY");
      }
    }

    // Check if already checked in
    const existing = await this.repo.findOne({
      filter: {
        schedule_assignment_id: { _eq: assignment.id },
      },
    });

    if (existing && existing.clock_in) {
      throw new HttpError(400, "Đã check-in rồi", "ALREADY_CHECKED_IN");
    }

    // Get shift details for late calculation
    const shift = await this.shiftRepo.findById(assignment.shift_id);
    if (!shift) {
      throw new HttpError(404, "Không tìm thấy ca làm việc", "SHIFT_NOT_FOUND");
    }

    // Calculate late minutes
    const shiftStart = new Date(`${shift.shift_date}T${shift.start_at}`);
    const lateMinutes = Math.max(0, Math.floor((now.getTime() - shiftStart.getTime()) / 1000 / 60));

    // Create or update attendance record
    if (existing) {
      return await this.repo.update(existing.id, {
        clock_in: now.toISOString(),
        late_minutes: lateMinutes,
        status: "partial",
      });
    } else {
      return await this.repo.create({
        schedule_assignment_id: assignment.id,
        shift_id: assignment.shift_id,
        employee_id: employeeId,
        clock_in: now.toISOString(),
        late_minutes: lateMinutes,
        status: "partial",
        manual_adjusted: false,
      });
    }
  }

  /**
   * CHECK-OUT
   * Employee checks out from their shift
   */
  async checkOut(employeeId: string, assignmentId?: string) {
    const now = new Date();

    // Find attendance record
    let attendance;
    if (assignmentId) {
      attendance = await this.repo.findOne({
        filter: {
          schedule_assignment_id: { _eq: assignmentId },
          employee_id: { _eq: employeeId },
        },
      });
    } else {
      // Find most recent check-in without check-out
      const records = await this.repo.findAll({
        filter: {
          employee_id: { _eq: employeeId },
          clock_in: { _nnull: true },
          clock_out: { _null: true },
        },
        sort: ["-clock_in"],
        limit: 1,
      });
      attendance = records[0];
    }

    if (!attendance) {
      throw new HttpError(404, "Không tìm thấy bản ghi check-in", "NO_CHECK_IN_FOUND");
    }

    if (attendance.clock_out) {
      throw new HttpError(400, "Đã check-out rồi", "ALREADY_CHECKED_OUT");
    }

    // Get shift details
    const shift = await this.shiftRepo.findById(attendance.shift_id!);
    if (!shift) {
      throw new HttpError(404, "Không tìm thấy ca làm việc", "SHIFT_NOT_FOUND");
    }

    // Calculate worked minutes and early leave
    const clockIn = new Date(attendance.clock_in!);
    const workedMinutes = Math.floor((now.getTime() - clockIn.getTime()) / 1000 / 60);

    const shiftEnd = new Date(`${shift.shift_date}T${shift.end_at}`);
    const earlyLeaveMinutes = Math.max(0, Math.floor((shiftEnd.getTime() - now.getTime()) / 1000 / 60));

    // Determine status
    let status: "present" | "partial" | "absent" = "present";
    if (earlyLeaveMinutes > 30 || (attendance.late_minutes || 0) > 30) {
      status = "partial";
    }

    return await this.repo.update(attendance.id, {
      clock_out: now.toISOString(),
      worked_minutes: workedMinutes,
      early_leave_minutes: earlyLeaveMinutes,
      status,
    });
  }

  /**
   * Get attendance records for employee in date range
   */
  async getEmployeeAttendance(employeeId: string, startDate: string, endDate: string) {
    return await this.repo.findAll({
      filter: {
        employee_id: { _eq: employeeId },
        created_at: { _between: [startDate, endDate] },
      },
      sort: ["-created_at"],
    });
  }

  /**
   * Admin: Manual adjustment
   */
  async manualAdjust(attendanceId: string, data: {
    clock_in?: string;
    clock_out?: string;
    reason: string;
  }) {
    const record = await this.repo.findById(attendanceId);
    if (!record) {
      throw new HttpError(404, "Không tìm thấy bản ghi", "NOT_FOUND");
    }

    const updates: Partial<AttendanceShift> = {
      manual_adjusted: true,
    };

    if (data.clock_in) {
      updates.clock_in = data.clock_in;
    }

    if (data.clock_out) {
      updates.clock_out = data.clock_out;
    }

    // Recalculate worked minutes if both exist
    if (updates.clock_in && updates.clock_out) {
      const start = new Date(updates.clock_in);
      const end = new Date(updates.clock_out);
      updates.worked_minutes = Math.floor((end.getTime() - start.getTime()) / 1000 / 60);
    }

    return await this.repo.update(attendanceId, updates);
  }
}

export default AttendanceService;
