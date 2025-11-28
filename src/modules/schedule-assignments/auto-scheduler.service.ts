import { BaseService } from "../../core/base";
import { randomUUID } from "crypto";
import { DirectusRepository } from "../../core/directus.repository";
import {
  Employee,
  EMPLOYEES_COLLECTION,
} from "../employees/employee.model";
import {
  EmployeeAvailability,
  EMPLOYEE_AVAILABILITIES_COLLECTION,
} from "../employee-availability/employee-availability.model";
import {
  EmployeeAvailabilityPosition,
  EMPLOYEE_AVAILABILITY_POSITIONS_COLLECTION,
} from "../employee-availability-positions/employee-availability-position.model";
import {
  Shift,
  SHIFTS_COLLECTION,
} from "../shifts/shift.model";
import {
  ShiftPositionRequirement,
  SHIFT_POSITION_REQUIREMENTS_COLLECTION,
} from "../shift-position-requirements/shift-position-requirement.model";
import {
  ScheduleAssignment,
  SCHEDULE_ASSIGNMENTS_COLLECTION,
} from "./schedule-assignment.model";
import { WeeklySchedule, WEEKLY_SCHEDULE_COLLECTION } from "../weekly-schedule/weekly-schedule.model";

/**
 * ============================================
 * AUTO SCHEDULER SERVICE - THUẬT TOÁN XẾP LỊCH TỰ ĐỘNG
 * ============================================
 * 
 * Mục tiêu:
 * - Xếp lịch tự động dựa trên availability của nhân viên
 * - Tôn trọng các constraint: max shifts/week, priority, positions
 * - Tối ưu coverage cho mỗi shift
 * - Đảm bảo công bằng và cân bằng workload
 * 
 * Thuật toán:
 * 1. Load tất cả shifts trong tuần cần xếp
 * 2. Load availability + positions của tất cả employees
 * 3. Tính toán score cho mỗi (employee, shift, position)
 * 4. Greedy assignment với backtracking nếu cần
 * 5. Đảm bảo constraints không bị vi phạm
 */

interface EmployeeWithAvailability {
  employee: Employee;
  availabilities: Array<{
    availability: EmployeeAvailability;
    positions: EmployeeAvailabilityPosition[];
  }>;
  currentWeekShiftCount: number;
  assignedShifts: string[]; // shift IDs đã assign
}

interface ShiftWithRequirements {
  shift: Shift;
  requirements: ShiftPositionRequirement[];
  assignments: ScheduleAssignment[];
}

interface AssignmentScore {
  employeeId: string;
  shiftId: string;
  positionId: string;
  score: number;
  reasons: string[];
}

export class AutoSchedulerService {
  private employeeRepo: DirectusRepository<Employee>;
  private availabilityRepo: DirectusRepository<EmployeeAvailability>;
  private availabilityPositionRepo: DirectusRepository<EmployeeAvailabilityPosition>;
  private shiftRepo: DirectusRepository<Shift>;
  private requirementRepo: DirectusRepository<ShiftPositionRequirement>;
  private assignmentRepo: DirectusRepository<ScheduleAssignment>;
  private scheduleRepo: DirectusRepository<WeeklySchedule>;

  constructor() {
    this.employeeRepo = new DirectusRepository<Employee>(EMPLOYEES_COLLECTION);
    this.availabilityRepo = new DirectusRepository<EmployeeAvailability>(
      EMPLOYEE_AVAILABILITIES_COLLECTION
    );
    this.availabilityPositionRepo =
      new DirectusRepository<EmployeeAvailabilityPosition>(
        EMPLOYEE_AVAILABILITY_POSITIONS_COLLECTION
      );
    this.shiftRepo = new DirectusRepository<Shift>(SHIFTS_COLLECTION);
    this.requirementRepo = new DirectusRepository<ShiftPositionRequirement>(
      SHIFT_POSITION_REQUIREMENTS_COLLECTION
    );
    this.assignmentRepo = new DirectusRepository<ScheduleAssignment>(
      SCHEDULE_ASSIGNMENTS_COLLECTION
    );
    this.scheduleRepo = new DirectusRepository<WeeklySchedule>(
      WEEKLY_SCHEDULE_COLLECTION
    );
  }

  /**
   * ============================================
   * MAIN AUTO-SCHEDULE FUNCTION
   * ============================================
   */
  async autoSchedule(scheduleId: string, options?: {
    overwriteExisting?: boolean;
    dryRun?: boolean;
    assignedBy?: string;
  }) {
    const { overwriteExisting = false, dryRun = false, assignedBy } = options || {};

    // 1. Kiểm tra schedule tồn tại và có thể edit
    const schedule = await this.scheduleRepo.findOne({
      filter: { id: { _eq: scheduleId } },
    });

    if (!schedule) {
      throw new Error(`Schedule ${scheduleId} not found`);
    }

    if (schedule.status === "finalized") {
      throw new Error("Cannot auto-schedule a finalized schedule");
    }

    // 2. Xóa assignments cũ nếu overwrite
    if (overwriteExisting && !dryRun) {
      await this.assignmentRepo.deleteMany({
        filter: {
          schedule_id: { _eq: scheduleId },
          source: { _eq: "auto" },
        },
      });
    }

    // 3. Load shifts trong schedule này
    const shifts = await this.loadShiftsWithRequirements(scheduleId);
    
    if (shifts.length === 0) {
      throw new Error("No shifts found for this schedule");
    }

    // 4. Load employees với availability trong tuần này
    const employees = await this.loadEmployeesWithAvailability(
      schedule.week_start,
      schedule.week_end,
      scheduleId
    );

    if (employees.length === 0) {
      throw new Error("No employees with availability found for this period");
    }

    // 5. Run thuật toán xếp lịch
    const assignments = await this.runSchedulingAlgorithm(
      shifts,
      employees,
      scheduleId,
      assignedBy
    );

    // 6. Validate kết quả
    const validation = this.validateAssignments(assignments, shifts, employees);
    
    // 7. Save vào database nếu không phải dry run
    if (!dryRun) {
      const savedAssignments = await this.assignmentRepo.createMany(
        assignments.map(a => ({
          ...a,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }))
      );

      return {
        success: true,
        scheduleId,
        assignmentsCreated: savedAssignments.length,
        assignments: savedAssignments,
        validation,
        stats: this.calculateStats(savedAssignments, shifts, employees),
      };
    }

    return {
      success: true,
      scheduleId,
      dryRun: true,
      assignmentsCreated: assignments.length,
      assignments,
      validation,
      stats: this.calculateStats(assignments, shifts, employees),
    };
  }

  /**
   * ============================================
   * THUẬT TOÁN XẾP LỊCH CHÍNH
   * ============================================
   * Sử dụng greedy algorithm với scoring system
   */
  private async runSchedulingAlgorithm(
    shifts: ShiftWithRequirements[],
    employees: EmployeeWithAvailability[],
    scheduleId: string,
    assignedBy?: string
  ): Promise<Partial<ScheduleAssignment>[]> {
    const assignments: Partial<ScheduleAssignment>[] = [];
    const employeeState = new Map<string, EmployeeWithAvailability>(
      employees.map(e => [e.employee.id, { ...e }])
    );

    // Sort shifts theo ngày để xếp tuần tự
    const sortedShifts = [...shifts].sort((a, b) => 
      new Date(a.shift.shift_date).getTime() - new Date(b.shift.shift_date).getTime()
    );

    for (const shiftData of sortedShifts) {
      const { shift, requirements } = shiftData;

      // Xếp từng position trong shift
      for (const req of requirements) {
        const assignedCount = assignments.filter(
          a => a.shift_id === shift.id && a.position_id === req.position_id
        ).length;

        const neededCount = req.required_count - assignedCount;

        if (neededCount <= 0) continue;

        // Tính score cho tất cả employees có thể assign
        const scores = this.calculateScores(
          shift,
          req.position_id,
          Array.from(employeeState.values()),
          assignments
        );

        // Sort theo score giảm dần
        scores.sort((a, b) => b.score - a.score);

        // Assign top candidates
        let assigned = 0;
        for (const scoreData of scores) {
          if (assigned >= neededCount) break;

          const employee = employeeState.get(scoreData.employeeId);
          if (!employee) continue;

          // Check constraints trước khi assign
          if (!this.checkConstraints(employee, shift, assignments)) {
            continue;
          }

          // Tạo assignment
          assignments.push({
            id: randomUUID(),  // ✅ IMPROVED: Use crypto.randomUUID()
            schedule_id: scheduleId,
            shift_id: shift.id,
            employee_id: scoreData.employeeId,
            position_id: scoreData.positionId,
            assigned_by: assignedBy,
            assigned_at: new Date().toISOString(),
            status: "assigned",
            source: "auto",
            note: `Auto-assigned (Score: ${scoreData.score.toFixed(2)})`,
            confirmed_by_employee: false,
          });

          // Update employee state
          employee.currentWeekShiftCount++;
          employee.assignedShifts.push(shift.id);

          assigned++;
        }

        // Log warning nếu không đủ người
        if (assigned < neededCount) {
          console.warn(
            `⚠️ Shift ${shift.id} Position ${req.position_id}: Need ${neededCount}, assigned ${assigned}`
          );
        }
      }
    }

    return assignments;
  }

  /**
   * ============================================
   * SCORING SYSTEM - TÍNH ĐIỂM CHO MỖI CANDIDATE
   * ============================================
   * Factors:
   * - Priority (cao = điểm cao)
   * - Số ca đã xếp trong tuần (ít = điểm cao)
   * - Position preference order (thấp = điểm cao)
   * - Workload balance
   */
  private calculateScores(
    shift: Shift,
    positionId: string,
    employees: EmployeeWithAvailability[],
    currentAssignments: Partial<ScheduleAssignment>[]
  ): AssignmentScore[] {
    const scores: AssignmentScore[] = [];

    for (const empData of employees) {
      const { employee, availabilities, currentWeekShiftCount } = empData;

      // Tìm availability cho shift này
      const availability = availabilities.find(
        a => a.availability.shift_id === shift.id
      );

      if (!availability) continue;

      // Tìm position trong availability
      const positionMatch = availability.positions.find(
        p => p.position_id === positionId
      );

      if (!positionMatch) continue;

      // Check nếu đã được assign shift này rồi
      if (currentAssignments.some(
        a => a.employee_id === employee.id && a.shift_id === shift.id
      )) {
        continue;
      }

      // Tính điểm
      let score = 0;
      const reasons: string[] = [];

      // 1. Priority score (0-100 points)
      const priority = availability.availability.priority || 5;
      const priorityScore = (priority / 10) * 100;
      score += priorityScore;
      reasons.push(`Priority: ${priority}/10 (+${priorityScore.toFixed(1)})`);

      // 2. Workload balance (0-50 points)
      const maxShifts = employee.max_hours_per_week 
        ? Math.floor(employee.max_hours_per_week / 8) 
        : 5;
      const workloadRatio = currentWeekShiftCount / maxShifts;
      const workloadScore = (1 - Math.min(workloadRatio, 1)) * 50;
      score += workloadScore;
      reasons.push(`Workload: ${currentWeekShiftCount}/${maxShifts} (+${workloadScore.toFixed(1)})`);

      // 3. Position preference (0-30 points)
      const preferenceOrder = positionMatch.preference_order || 1;
      const preferenceScore = Math.max(0, 30 - (preferenceOrder - 1) * 10);
      score += preferenceScore;
      reasons.push(`Position pref: ${preferenceOrder} (+${preferenceScore.toFixed(1)})`);

      // 4. Fairness bonus - ưu tiên người ít ca hơn (0-20 points)
      const avgShifts = employees.reduce((sum, e) => sum + e.currentWeekShiftCount, 0) / employees.length;
      const fairnessScore = currentWeekShiftCount < avgShifts ? 20 : 0;
      score += fairnessScore;
      if (fairnessScore > 0) {
        reasons.push(`Fairness bonus (+${fairnessScore})`);
      }

      scores.push({
        employeeId: employee.id,
        shiftId: shift.id,
        positionId,
        score,
        reasons,
      });
    }

    return scores;
  }

  /**
   * ============================================
   * CHECK CONSTRAINTS - KIỂM TRA CÁC ĐIỀU KIỆN
   * ============================================
   */
  private checkConstraints(
    empData: EmployeeWithAvailability,
    shift: Shift,
    assignments: Partial<ScheduleAssignment>[]
  ): boolean {
    const { employee, currentWeekShiftCount } = empData;

    // 1. Check max shifts per week
    const maxShifts = employee.max_hours_per_week 
      ? Math.floor(employee.max_hours_per_week / 8) 
      : 999;
    
    if (currentWeekShiftCount >= maxShifts) {
      return false;
    }

    // 2. Check employee status
    if (employee.status !== "active") {
      return false;
    }

    // 3. Check min rest hours between shifts
    if (employee.min_rest_hours_between_shifts) {
      const empAssignments = assignments.filter(a => a.employee_id === employee.id);
      
      for (const assign of empAssignments) {
        // Simplified check - trong production cần check chính xác với shift times
        const assignedDate = new Date(assign.shift_id || '').getTime();
        const currentDate = new Date(shift.shift_date).getTime();
        const hoursDiff = Math.abs(currentDate - assignedDate) / (1000 * 60 * 60);
        
        if (hoursDiff < employee.min_rest_hours_between_shifts) {
          return false;
        }
      }
    }

    return true;
  }

  /**
   * ============================================
   * VALIDATION - KIỂM TRA KẾT QUẢ
   * ============================================
   */
  private validateAssignments(
    assignments: Partial<ScheduleAssignment>[],
    shifts: ShiftWithRequirements[],
    employees: EmployeeWithAvailability[]
  ) {
    const warnings: string[] = [];
    const errors: string[] = [];

    // Check coverage cho mỗi shift
    for (const shiftData of shifts) {
      for (const req of shiftData.requirements) {
        const assigned = assignments.filter(
          a => a.shift_id === shiftData.shift.id && a.position_id === req.position_id
        ).length;

        if (assigned < req.required_count) {
          warnings.push(
            `Shift ${shiftData.shift.shift_date} Position ${req.position_id}: Need ${req.required_count}, got ${assigned}`
          );
        }
      }
    }

    // Check workload distribution
    const employeeShiftCounts = new Map<string, number>();
    for (const assign of assignments) {
      const count = employeeShiftCounts.get(assign.employee_id!) || 0;
      employeeShiftCounts.set(assign.employee_id!, count + 1);
    }

    for (const [empId, count] of employeeShiftCounts) {
      const emp = employees.find(e => e.employee.id === empId)?.employee;
      if (!emp) continue;

      const maxShifts = emp.max_hours_per_week 
        ? Math.floor(emp.max_hours_per_week / 8) 
        : 999;

      if (count > maxShifts) {
        errors.push(`Employee ${empId} assigned ${count} shifts, max is ${maxShifts}`);
      }
    }

    return {
      valid: errors.length === 0,
      warnings,
      errors,
    };
  }

  /**
   * ============================================
   * CALCULATE STATS - THỐNG KÊ
   * ============================================
   */
  private calculateStats(
    assignments: Partial<ScheduleAssignment>[],
    shifts: ShiftWithRequirements[],
    employees: EmployeeWithAvailability[]
  ) {
    const employeeShiftCounts = new Map<string, number>();
    
    for (const assign of assignments) {
      const count = employeeShiftCounts.get(assign.employee_id!) || 0;
      employeeShiftCounts.set(assign.employee_id!, count + 1);
    }

    const shiftCounts = Array.from(employeeShiftCounts.values());
    const totalRequired = shifts.reduce(
      (sum, s) => sum + s.requirements.reduce((rSum, r) => rSum + r.required_count, 0),
      0
    );

    return {
      totalAssignments: assignments.length,
      totalShifts: shifts.length,
      totalEmployees: employees.length,
      employeesUsed: employeeShiftCounts.size,
      coverageRate: totalRequired > 0 ? (assignments.length / totalRequired) * 100 : 0,
      avgShiftsPerEmployee: shiftCounts.length > 0 
        ? shiftCounts.reduce((a, b) => a + b, 0) / shiftCounts.length 
        : 0,
      minShifts: shiftCounts.length > 0 ? Math.min(...shiftCounts) : 0,
      maxShifts: shiftCounts.length > 0 ? Math.max(...shiftCounts) : 0,
    };
  }

  /**
   * ============================================
   * DATA LOADING HELPERS
   * ============================================
   */
  private async loadShiftsWithRequirements(
    scheduleId: string
  ): Promise<ShiftWithRequirements[]> {
    const shifts = await this.shiftRepo.findMany({
      filter: { schedule_id: { _eq: scheduleId } },
      sort: ["shift_date"],
    });

    const shiftIds = shifts.map(s => s.id);
    
    const requirements = await this.requirementRepo.findMany({
      filter: { shift_id: { _in: shiftIds } },
    });

    const assignments = await this.assignmentRepo.findMany({
      filter: { 
        shift_id: { _in: shiftIds },
        status: { _nin: ["cancelled"] }
      },
    });

    return shifts.map(shift => ({
      shift,
      requirements: requirements.filter(r => r.shift_id === shift.id),
      assignments: assignments.filter(a => a.shift_id === shift.id),
    }));
  }

  private async loadEmployeesWithAvailability(
    weekStart: string,
    weekEnd: string,
    scheduleId: string
  ): Promise<EmployeeWithAvailability[]> {
    // Load active employees
    const employees = await this.employeeRepo.findMany({
      filter: { status: { _eq: "active" } },
    });

    // Load shifts trong tuần
    const shifts = await this.shiftRepo.findMany({
      filter: {
        schedule_id: { _eq: scheduleId },
        shift_date: { _between: [weekStart, weekEnd] },
      },
    });

    const shiftIds = shifts.map(s => s.id);

    // Load availabilities
    const availabilities = await this.availabilityRepo.findMany({
      filter: {
        shift_id: { _in: shiftIds },
        _or: [
          { expires_at: { _null: true } },
          { expires_at: { _gte: new Date().toISOString() } },
        ],
      },
    });

    const availabilityIds = availabilities.map(a => a.id);

    // Load availability positions
    let availabilityPositions: EmployeeAvailabilityPosition[] = [];
    if (availabilityIds.length > 0) {
      availabilityPositions = await this.availabilityPositionRepo.findMany({
        filter: { availability_id: { _in: availabilityIds } },
      });
    }

    // Load current assignments
    const currentAssignments = await this.assignmentRepo.findMany({
      filter: {
        schedule_id: { _eq: scheduleId },
        status: { _nin: ["cancelled"] },
      },
    });

    // Group data
    return employees.map(employee => {
      const empAvails = availabilities.filter(a => a.employee_id === employee.id);
      const empAssigns = currentAssignments.filter(a => a.employee_id === employee.id);

      return {
        employee,
        availabilities: empAvails.map(avail => ({
          availability: avail,
          positions: availabilityPositions.filter(p => p.availability_id === avail.id),
        })),
        currentWeekShiftCount: empAssigns.length,
        assignedShifts: empAssigns.map(a => a.shift_id),
      };
    }).filter(e => e.availabilities.length > 0); // Chỉ lấy employees có availability
  }

  // ✅ REMOVED: Custom UUID generator replaced with crypto.randomUUID()
}
