import { BaseService, HttpError } from "../../core/base";
import { AttendanceShift } from "./attendance-shift.model";
import AttendanceShiftRepository from "./attendance-shift.repository";
import ScheduleAssignmentRepository from "../schedule-assignments/schedule-assignment.repository";
import ShiftRepository from "../shifts/shift.repository";
import EmployeeRepository from "../employees/employee.repository";
import { dateUtil, now, startOfDay, endOfDay } from "../../core/date.util";

/**
 * Attendance Service - Core business logic for check-in/check-out
 * 
 * Features:
 * - Employee check-in/check-out
 * - Automatic late/early leave calculation
 * - Working hours tracking
 * - Manual adjustments by admin
 * - Monthly reporting
 */
export class AttendanceService extends BaseService<AttendanceShift> {
  private assignmentRepo: ScheduleAssignmentRepository;
  private shiftRepo: ShiftRepository;
  private employeeRepo: EmployeeRepository;

  constructor() {
    super(new AttendanceShiftRepository());
    this.assignmentRepo = new ScheduleAssignmentRepository();
    this.shiftRepo = new ShiftRepository();
    this.employeeRepo = new EmployeeRepository();
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
    const currentTime = now();
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
      const todayStart = startOfDay().toDate();
      const todayEnd = endOfDay().toDate();

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
          const shiftDate = dateUtil(shift.shift_date).toDate();
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
    console.log("!!! DEBUG !!! checkIn - shift:", JSON.stringify(shift));

    // Calculate late minutes
    let shiftStart;
    if (shift.start_at && (shift.start_at.includes("T") || shift.start_at.includes(" "))) {
        shiftStart = dateUtil.tz(shift.start_at, "Asia/Ho_Chi_Minh");
    } else {
        shiftStart = dateUtil.tz(`${shift.shift_date}T${shift.start_at}`, "Asia/Ho_Chi_Minh");
    }
    console.log("!!! DEBUG !!! checkIn - shiftStart:", shiftStart.format());
    console.log("!!! DEBUG !!! checkIn - currentTime:", currentTime.format());
    
    const lateMinutes = Math.max(0, Math.floor(currentTime.diff(shiftStart, "minute")));
    console.log("!!! DEBUG !!! checkIn - lateMinutes:", lateMinutes);

    // Create or update attendance record
    if (existing) {
      return await this.repo.update(existing.id, {
        clock_in: currentTime.format("YYYY-MM-DD HH:mm:ss"), // Force wall-clock time
        late_minutes: lateMinutes,
        status: "partial",
      });
    } else {
      return await this.repo.create({
        schedule_assignment_id: assignment.id,
        shift_id: assignment.shift_id,
        employee_id: employeeId,
        clock_in: currentTime.format("YYYY-MM-DD HH:mm:ss"), // Force wall-clock time
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
    const currentTime = now();

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
    console.log("!!! DEBUG !!! checkOut - shift:", JSON.stringify(shift));

    // Calculate worked minutes and early leave
    // Parse clock_in as VN time (since we save it as VN time now)
    const clockIn = dateUtil.tz(attendance.clock_in!, "Asia/Ho_Chi_Minh");
    console.log("!!! DEBUG !!! checkOut - clockIn (VN):", clockIn.format());
    console.log("!!! DEBUG !!! checkOut - currentTime:", currentTime.format());

    const workedMinutes = Math.floor(currentTime.diff(clockIn, "minute"));
    console.log("!!! DEBUG !!! checkOut - workedMinutes:", workedMinutes);

    let shiftEnd;
    if (shift.end_at && (shift.end_at.includes("T") || shift.end_at.includes(" "))) {
        shiftEnd = dateUtil.tz(shift.end_at, "Asia/Ho_Chi_Minh");
    } else {
        shiftEnd = dateUtil.tz(`${shift.shift_date}T${shift.end_at}`, "Asia/Ho_Chi_Minh");
    }
    console.log("!!! DEBUG !!! checkOut - shiftEnd:", shiftEnd.format());

    const earlyLeaveMinutes = Math.max(0, Math.floor(shiftEnd.diff(currentTime, "minute")));
    console.log("!!! DEBUG !!! checkOut - earlyLeaveMinutes:", earlyLeaveMinutes);

    // Determine status
    let status = attendance.status;
    if (status === "partial") {
      status = "present";
    }

    return await this.repo.update(attendance.id, {
      clock_out: currentTime.format("YYYY-MM-DD HH:mm:ss"), // Force wall-clock time
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
      fields: [
        "*",
        "shift_id.*",
        "shift_id.shift_type.id",
        "shift_id.shift_type.name",
      ],
    });
  }

  /**
   * Admin: Manual adjustment
   */
  async manualAdjust(attendanceId: string, data: {
    clock_in?: string;
    clock_out?: string;
    notes?: string;
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

    if (data.notes) {
      updates.notes = data.notes;
    }

    // Recalculate worked minutes if both exist
    if (updates.clock_in && updates.clock_out) {
      const start = dateUtil(updates.clock_in);
      const end = dateUtil(updates.clock_out);
      updates.worked_minutes = Math.floor(end.diff(start, "minute"));
    } else if (updates.clock_in && record.clock_out) {
        const start = dateUtil(updates.clock_in);
        const end = dateUtil(record.clock_out);
        updates.worked_minutes = Math.floor(end.diff(start, "minute"));
    } else if (record.clock_in && updates.clock_out) {
        const start = dateUtil(record.clock_in);
        const end = dateUtil(updates.clock_out);
        updates.worked_minutes = Math.floor(end.diff(start, "minute"));
    }

    return await this.repo.update(attendanceId, updates);
  }

  /**
   * Get monthly attendance report for all employees
   */
  async getMonthlyReport(month: number, year: number) {
    // Calculate start and end of month in VN time
    const startDate = dateUtil().year(year).month(month - 1).startOf("month").format("YYYY-MM-DD HH:mm:ss");
    const endDate = dateUtil().year(year).month(month - 1).endOf("month").format("YYYY-MM-DD HH:mm:ss");

    // 1. Fetch all active employees
    const employees = await this.employeeRepo.findAll({
      filter: { status: { _eq: "active" } },
      limit: 1000, // Fetch all
    });
    console.log(`[AttendanceReport] Found ${employees.length} active employees for report.`);

    // 2. Fetch all attendance records for the month
    const attendanceRecords = await this.repo.findAll({
      filter: {
        created_at: { _between: [startDate, endDate] },
      },
      limit: 10000, // Fetch all
    });

    // 3. Aggregate data per employee
    const report = employees.map((employee) => {
      const empRecords = attendanceRecords.filter((r) => r.employee_id === employee.id);

      const totalWorkDays = empRecords.length;
      const totalWorkMinutes = empRecords.reduce((sum, r) => sum + (r.worked_minutes || 0), 0);
      const totalLateMinutes = empRecords.reduce((sum, r) => sum + (r.late_minutes || 0), 0);
      const totalEarlyLeaveMinutes = empRecords.reduce((sum, r) => sum + (r.early_leave_minutes || 0), 0);

      return {
        id: employee.id,
        employee: {
          id: employee.id,
          first_name: employee.first_name,
          last_name: employee.last_name,
          avatar: (employee as any).avatar,
          department: (employee as any).department,
        },
        stats: {
          total_work_days: totalWorkDays,
          total_work_hours: parseFloat((totalWorkMinutes / 60).toFixed(1)),
          total_late_minutes: totalLateMinutes,
          total_early_leave_minutes: totalEarlyLeaveMinutes,
        },
        records: empRecords, // Include raw records for detail view if needed, or fetch separately
      };
    });

    return report;
  }
}

export default AttendanceService;
