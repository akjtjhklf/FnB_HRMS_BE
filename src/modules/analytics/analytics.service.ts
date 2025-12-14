import { createDirectus, rest, readItems, aggregate, staticToken } from '@directus/sdk';
import type {
  OverviewStats,
  EmployeeAnalytics,
  AttendanceAnalytics,
  ScheduleAnalytics,
  SalaryAnalytics,
  TimeSeriesData,
  ComparativeAnalytics,
  EmployeePerformance,
  AnalyticsFilters,
} from './analytics.model';
import {
  EMPLOYEES_COLLECTION,
} from '../employees/employee.model';
import { ATTENDANCE_LOGS_COLLECTION } from '../attendance-logs/attendance-log.model';
import { SCHEDULE_ASSIGNMENTS_COLLECTION } from '../schedule-assignments/schedule-assignment.model';
import { SCHEDULE_CHANGE_REQUESTS_COLLECTION } from '../schedule-change-requests/schedule-change-request.model';
import { SALARY_REQUESTS_COLLECTION } from '../salary-requests/salary-request.model';
import { MONTHLY_EMPLOYEE_STATS_COLLECTION } from '../monthly-employee-stats/monthly-employee-stat.model';

const directusUrl = process.env.DIRECTUS_URL || 'http://localhost:8055';
// Sử dụng DIRECTUS_TOKEN thay vì DIRECTUS_ADMIN_TOKEN (đồng bộ với .env)
const directusToken = process.env.DIRECTUS_TOKEN || process.env.DIRECTUS_ADMIN_TOKEN || '';

if (!directusToken) {
  console.warn('⚠️ Analytics: No DIRECTUS_TOKEN found - API calls may fail with 403');
}

const directus = createDirectus(directusUrl).with(rest()).with(staticToken(directusToken));

/**
 * Get Overview Statistics
 * Tổng quan dashboard metrics
 */
export const getOverviewStats = async (date?: string): Promise<OverviewStats> => {
  const today = date || new Date().toISOString().split('T')[0];

  try {
    // Parallel queries for better performance
    const [
      employeeStats,
      attendanceToday,
      shiftsToday,
      pendingRequests,
    ] = await Promise.all([
      // Employee counts
      getEmployeeCounts(),
      // Attendance today
      getAttendanceToday(today),
      // Shifts today
      getShiftsToday(today),
      // Pending requests
      getPendingRequests(),
    ]);

    return {
      ...employeeStats,
      ...attendanceToday,
      ...shiftsToday,
      ...pendingRequests,
    };
  } catch (error) {
    console.error('❌ Error getting overview stats:', error);
    throw error;
  }
};

/**
 * Helper: Get employee counts
 */
async function getEmployeeCounts() {
  const employees = await directus.request(
    readItems(EMPLOYEES_COLLECTION, {
      fields: ['id', 'status', 'hire_date'],
      limit: -1,
    })
  );

  const total = employees.length;
  const active = employees.filter((e: any) => e.status === 'active').length;
  const onLeave = employees.filter((e: any) => e.status === 'on_leave').length;
  const terminated = employees.filter((e: any) => e.status === 'terminated').length;

  // New employees this month
  const thisMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
  const newThisMonth = employees.filter(
    (e: any) => e.hire_date && e.hire_date.startsWith(thisMonth)
  ).length;

  return {
    totalEmployees: total,
    activeEmployees: active,
    onLeaveEmployees: onLeave,
    terminatedEmployees: terminated,
    newEmployeesThisMonth: newThisMonth,
    employeeTrend: {
      value: newThisMonth > 0 ? 5 : 0, // Simple trend calculation
      isPositive: newThisMonth > 0,
      comparedTo: 'last month',
    },
  };
}

/**
 * Helper: Get attendance today
 */
async function getAttendanceToday(date: string) {
  // attendance_logs uses event_time (timestamp), not date
  // Directus dateTime doesn't support _starts_with, so we use range filter
  const startOfDay = `${date}T00:00:00`;
  const endOfDay = `${date}T23:59:59`;

  // Note: attendance_logs does not have 'status' field. We calculate based on event_type.
  const logs = await directus.request(
    readItems(ATTENDANCE_LOGS_COLLECTION, {
      filter: {
        event_time: {
          _gte: startOfDay,
          _lte: endOfDay
        },
      },
      fields: ['id', 'employee_id', 'event_type', 'event_time'],
      limit: -1,
    })
  );

  const total = logs.length;

  // Calculate present employees (unique employees who have clocked in)
  const presentEmployees = new Set(
    logs
      .filter((l: any) => l.event_type === 'clock_in' || l.event_type === 'tap')
      .map((l: any) => l.employee_id)
      .filter(Boolean)
  );

  const presentCount = presentEmployees.size;

  // We cannot easily determine late/absent without joining with shifts and calculating time diffs
  // For now, we'll return 0 for late/absent to avoid errors, or simple placeholders
  const late = 0;
  const absent = 0;

  return {
    totalAttendanceToday: total,
    lateToday: late,
    absentToday: absent,
    attendanceRate: 0, // Cannot calculate accurately without total scheduled count here
    attendanceTrend: {
      value: 0,
      isPositive: true,
      comparedTo: 'yesterday',
    },
  };
}

/**
 * Helper: Get shifts today
 */
async function getShiftsToday(date: string) {
  // schedule_assignments links to shifts via shift_id
  // We need to filter by shift_id.shift_date
  const assignments = await directus.request(
    readItems(SCHEDULE_ASSIGNMENTS_COLLECTION, {
      filter: {
        shift_id: {
          shift_date: { _eq: date }
        },
        status: { _neq: 'cancelled' } // Exclude cancelled shifts
      },
      fields: ['id', 'employee_id', 'status'],
      limit: -1,
    })
  );

  const total = assignments.length;
  const uniqueEmployees = new Set(assignments.map((a: any) => a.employee_id)).size;

  // Statuses are: "assigned" | "tentative" | "swapped" | "cancelled"
  // We don't have "completed" status in assignments table yet. 
  // Assuming "assigned" means scheduled.
  const assignedCount = assignments.filter((a: any) => a.status === 'assigned' || a.status === 'swapped').length;

  return {
    totalShiftsToday: total,
    scheduledEmployeesToday: uniqueEmployees,
    scheduleCompletionRate: total > 0 ? (assignedCount / total) * 100 : 0,
  };
}

/**
 * Helper: Get pending requests
 */
async function getPendingRequests() {
  const [scheduleChangeRequests, salaryRequests] = await Promise.all([
    directus.request(
      readItems(SCHEDULE_CHANGE_REQUESTS_COLLECTION, {
        filter: { status: { _eq: 'pending' } },
        aggregate: { count: '*' },
      })
    ),
    directus.request(
      readItems(SALARY_REQUESTS_COLLECTION, {
        filter: { status: { _eq: 'pending' } },
        aggregate: { count: '*' },
      })
    ),
  ]);

  const scheduleCount = scheduleChangeRequests[0]?.count || 0;
  const salaryCount = salaryRequests[0]?.count || 0;

  return {
    pendingScheduleChangeRequests: scheduleCount,
    pendingSalaryRequests: salaryCount,
    pendingRequests: scheduleCount + salaryCount,
  };
}

/**
 * Get Employee Analytics
 * Phân tích chi tiết nhân viên
 */
export const getEmployeeAnalytics = async (
  filters: AnalyticsFilters
): Promise<EmployeeAnalytics> => {
  try {
    const employees = await directus.request(
      readItems(EMPLOYEES_COLLECTION, {
        fields: ['id', 'status', 'gender', 'hire_date'], // Removed position/position_id as it causes 403 (missing field)
        filter: buildEmployeeFilter(filters),
        limit: -1,
      })
    );

    // Calculate distributions
    const byStatus = calculateStatusDistribution(employees);
    const byGender = calculateGenderDistribution(employees);
    const tenureDistribution = calculateTenureDistribution(employees);

    // TODO: Fetch position and department data when available
    const byPosition: any[] = [];
    const byDepartment: any[] = [];
    const employeeGrowth: any[] = [];

    const totalCount = employees.length;
    const activeCount = employees.filter((e: any) => e.status === 'active').length;
    const averageTenure = calculateAverageTenure(employees);

    return {
      byDepartment,
      byPosition,
      byStatus,
      byGender,
      employeeGrowth,
      averageTenure,
      tenureDistribution,
      totalCount,
      activeCount,
    };
  } catch (error) {
    console.error('❌ Error getting employee analytics:', error);
    throw error;
  }
};

/**
 * Helper: Build employee filter
 */
function buildEmployeeFilter(filters: AnalyticsFilters) {
  const filter: any = {};

  if (filters.status) {
    filter.status = { _eq: filters.status };
  }

  // if (filters.positionId) {
  //   filter.position = { _eq: filters.positionId };
  // }

  // Date range for hire_date
  if (filters.startDate || filters.endDate) {
    filter.hire_date = {};
    if (filters.startDate) filter.hire_date._gte = filters.startDate;
    if (filters.endDate) filter.hire_date._lte = filters.endDate;
  }

  return filter;
}

/**
 * Helper: Calculate status distribution
 */
function calculateStatusDistribution(employees: any[]) {
  const total = employees.length;
  const statusCounts = employees.reduce((acc: any, emp: any) => {
    acc[emp.status] = (acc[emp.status] || 0) + 1;
    return acc;
  }, {});

  return Object.entries(statusCounts).map(([status, count]) => ({
    status: status as any,
    count: count as number,
    percentage: total > 0 ? ((count as number) / total) * 100 : 0,
  }));
}

/**
 * Helper: Calculate gender distribution
 */
function calculateGenderDistribution(employees: any[]) {
  const total = employees.length;
  const genderCounts = employees.reduce((acc: any, emp: any) => {
    const gender = emp.gender || 'other';
    acc[gender] = (acc[gender] || 0) + 1;
    return acc;
  }, {});

  return Object.entries(genderCounts).map(([gender, count]) => ({
    gender: gender as any,
    count: count as number,
    percentage: total > 0 ? ((count as number) / total) * 100 : 0,
  }));
}

/**
 * Helper: Calculate tenure distribution
 */
function calculateTenureDistribution(employees: any[]) {
  const now = new Date();
  const tenureRanges = [
    { range: '0-6 months', min: 0, max: 6 },
    { range: '6-12 months', min: 6, max: 12 },
    { range: '1-2 years', min: 12, max: 24 },
    { range: '2-5 years', min: 24, max: 60 },
    { range: '5+ years', min: 60, max: Infinity },
  ];

  const counts = tenureRanges.map((range) => ({
    range: range.range,
    count: 0,
  }));

  employees.forEach((emp: any) => {
    if (!emp.hire_date) return;

    const hireDate = new Date(emp.hire_date);
    const months = (now.getTime() - hireDate.getTime()) / (1000 * 60 * 60 * 24 * 30);

    const rangeIndex = tenureRanges.findIndex(
      (r) => months >= r.min && months < r.max
    );

    if (rangeIndex >= 0) {
      counts[rangeIndex].count++;
    }
  });

  return counts;
}

/**
 * Helper: Calculate average tenure in months
 */
function calculateAverageTenure(employees: any[]): number {
  const now = new Date();
  let totalMonths = 0;
  let count = 0;

  employees.forEach((emp: any) => {
    if (emp.hire_date) {
      const hireDate = new Date(emp.hire_date);
      const months = (now.getTime() - hireDate.getTime()) / (1000 * 60 * 60 * 24 * 30);
      totalMonths += months;
      count++;
    }
  });

  return count > 0 ? totalMonths / count : 0;
}

/**
 * Get Attendance Analytics
 * Phân tích chấm công chi tiết
 */
export const getAttendanceAnalytics = async (
  filters: AnalyticsFilters
): Promise<AttendanceAnalytics> => {
  try {
    // Build filter for attendance_logs based on event_time
    const logsFilter: any = {};
    if (filters.startDate || filters.endDate) {
      logsFilter.event_time = {};
      if (filters.startDate) logsFilter.event_time._gte = `${filters.startDate}T00:00:00`;
      if (filters.endDate) logsFilter.event_time._lte = `${filters.endDate}T23:59:59`;
    }
    if (filters.employeeId) {
      logsFilter.employee_id = { _eq: filters.employeeId };
    }

    // Get all employees to have names
    const employees = await directus.request(
      readItems(EMPLOYEES_COLLECTION, {
        fields: ['id', 'full_name', 'employee_code'],
        limit: -1,
      })
    );
    const employeeNameMap = new Map(
      employees.map((e: any) => [e.id, e.full_name || e.employee_code || 'Nhân viên'])
    );

    // Get all attendance logs
    const logs = await directus.request(
      readItems(ATTENDANCE_LOGS_COLLECTION, {
        filter: logsFilter,
        fields: ['id', 'employee_id', 'event_type', 'event_time'],
        limit: -1,
      })
    );

    // Group logs by employee and date to calculate stats
    const employeeStats: Map<string, {
      workDays: Set<string>;
      clockIns: number;
      clockOuts: number;
      lateCount: number;
    }> = new Map();

    // Standard work start time (7:00 AM)
    const WORK_START_HOUR = 7;
    const LATE_THRESHOLD_MINUTES = 15; // Consider late if > 15 mins after start

    logs.forEach((log: any) => {
      const employeeId = log.employee_id;
      if (!employeeId) return;

      const eventTime = new Date(log.event_time);
      const dateKey = eventTime.toISOString().split('T')[0];

      if (!employeeStats.has(employeeId)) {
        employeeStats.set(employeeId, {
          workDays: new Set(),
          clockIns: 0,
          clockOuts: 0,
          lateCount: 0,
        });
      }

      const stats = employeeStats.get(employeeId)!;
      stats.workDays.add(dateKey);

      if (log.event_type === 'clock_in') {
        stats.clockIns++;
        // Check if late (after 7:15 AM)
        const hour = eventTime.getHours();
        const minute = eventTime.getMinutes();
        if (hour > WORK_START_HOUR || (hour === WORK_START_HOUR && minute > LATE_THRESHOLD_MINUTES)) {
          stats.lateCount++;
        }
      } else if (log.event_type === 'clock_out') {
        stats.clockOuts++;
      }
    });

    // Calculate totals
    let totalWorkDays = 0;
    let totalLate = 0;
    let totalClockIns = 0; // Total number of clock_in events

    const performanceList: EmployeePerformance[] = [];

    employeeStats.forEach((stats, employeeId) => {
      const workDays = stats.workDays.size;
      totalWorkDays += workDays;
      totalLate += stats.lateCount;
      totalClockIns += stats.clockIns;

      performanceList.push({
        employeeId,
        employeeName: employeeNameMap.get(employeeId) || 'Nhân viên',
        attendanceRate: 100, // All logged are present
        lateCount: stats.lateCount,
        absentCount: 0,
        totalShifts: workDays,
      });
    });

    // Sort for top/bottom performers
    const topPerformers = [...performanceList]
      .sort((a, b) => a.lateCount - b.lateCount) // Less late = better
      .slice(0, 10);

    const needsImprovement = [...performanceList]
      .sort((a, b) => b.lateCount - a.lateCount) // More late = needs improvement
      .filter(p => p.lateCount > 0)
      .slice(0, 10);

    const attendanceTrend: TimeSeriesData[] = [];
    const lateTrend: TimeSeriesData[] = [];

    // Late rate = totalLate / totalClockIns * 100 (percentage of clock-ins that were late)
    // Cap at 100% maximum
    const calculatedLateRate = totalClockIns > 0 ? Math.min((totalLate / totalClockIns) * 100, 100) : 0;

    return {
      totalWorkDays,
      totalPresent: totalWorkDays,
      totalLate,
      totalAbsent: 0, // Need schedule data to calculate absent
      totalOnLeave: 0,
      attendanceRate: totalWorkDays > 0 ? 100 : 0, // All logged are present
      lateRate: calculatedLateRate,
      absentRate: 0,
      attendanceTrend,
      lateTrend,
      lateByDayOfWeek: [],
      attendanceByShift: [],
      topPerformers,
      needsImprovement,
    };
  } catch (error) {
    console.error('❌ Error getting attendance analytics:', error);
    throw error;
  }
};

/**
 * Helper: Build month filter
 */
function buildMonthFilter(filters: AnalyticsFilters) {
  const filter: any = {};

  if (filters.startDate) {
    filter.month = { _gte: filters.startDate.slice(0, 7) };
  }

  if (filters.endDate) {
    filter.month = { ...filter.month, _lte: filters.endDate.slice(0, 7) };
  }

  if (filters.employeeId) {
    filter.employee_id = { _eq: filters.employeeId };
  }

  return filter;
}

/**
 * Helper: Get top performers
 */
function getTopPerformers(stats: any[], limit: number): EmployeePerformance[] {
  return stats
    .map((s: any) => {
      const total = s.total_shifts_worked || 0;
      const absent = s.absent_count || 0;
      const late = s.late_count || 0;

      return {
        employeeId: s.employee_id,
        employeeName: 'Employee ' + s.employee_id.slice(0, 8), // TODO: Fetch actual name
        attendanceRate: total > 0 ? ((total - absent) / total) * 100 : 0,
        lateCount: late,
        absentCount: absent,
        totalShifts: total,
      };
    })
    .sort((a, b) => b.attendanceRate - a.attendanceRate)
    .slice(0, limit);
}

/**
 * Helper: Get bottom performers
 */
function getBottomPerformers(stats: any[], limit: number): EmployeePerformance[] {
  return stats
    .map((s: any) => {
      const total = s.total_shifts_worked || 0;
      const absent = s.absent_count || 0;
      const late = s.late_count || 0;

      return {
        employeeId: s.employee_id,
        employeeName: 'Employee ' + s.employee_id.slice(0, 8),
        attendanceRate: total > 0 ? ((total - absent) / total) * 100 : 0,
        lateCount: late,
        absentCount: absent,
        totalShifts: total,
      };
    })
    .filter((p) => p.attendanceRate < 95) // Only those with issues
    .sort((a, b) => a.attendanceRate - b.attendanceRate)
    .slice(0, limit);
}

/**
 * Get Schedule Analytics
 * Phân tích lịch làm việc
 */
import { SALARY_SCHEMES_COLLECTION } from '../salary-schemes/salary-scheme.model';

/**
 * Get Schedule Analytics
 * Phân tích lịch làm việc
 */
export const getScheduleAnalytics = async (
  filters: AnalyticsFilters
): Promise<ScheduleAnalytics> => {
  try {
    // 1. Get Assignments (filtered by shift date)
    // We need to filter by shift_id.shift_date
    const assignmentFilter: any = {
      status: { _neq: 'cancelled' }
    };

    if (filters.startDate || filters.endDate) {
      assignmentFilter.shift_id = {
        shift_date: {}
      };
      if (filters.startDate) assignmentFilter.shift_id.shift_date._gte = filters.startDate;
      if (filters.endDate) assignmentFilter.shift_id.shift_date._lte = filters.endDate;
    }

    const assignments = await directus.request(
      readItems(SCHEDULE_ASSIGNMENTS_COLLECTION, {
        filter: assignmentFilter,
        fields: ['id', 'status', 'employee_id'],
        limit: -1,
      })
    );

    const total = assignments.length;
    // Statuses: "assigned" | "tentative" | "swapped" | "cancelled"
    // Assuming "assigned" and "swapped" are "completed" or "confirmed" for now
    const completed = assignments.filter((a: any) => a.status === 'assigned' || a.status === 'swapped').length;
    const inProgress = 0; // Not tracked in current status
    const pending = assignments.filter((a: any) => a.status === 'tentative').length;

    // 2. Get Change Requests (filtered by created_at)
    const requestFilter: any = {};
    if (filters.startDate || filters.endDate) {
      requestFilter.created_at = {};
      // created_at is timestamp, use range
      if (filters.startDate) requestFilter.created_at._gte = `${filters.startDate}T00:00:00`;
      if (filters.endDate) requestFilter.created_at._lte = `${filters.endDate}T23:59:59`;
    }

    // Chỉ fetch fields cơ bản để tránh lỗi permission với field 'type'
    const changeRequests = await directus.request(
      readItems(SCHEDULE_CHANGE_REQUESTS_COLLECTION, {
        filter: requestFilter,
        fields: ['id', 'status'],
        limit: -1,
      })
    );

    const totalChangeRequests = changeRequests.length;
    const approvedChangeRequests = changeRequests.filter((r: any) => r.status === 'approved').length;
    // Không có field 'type' trong Directus, set default values
    const swapRequests = 0;
    const approvedSwapRequests = 0;

    // Calculate average shifts per employee
    const uniqueEmployees = new Set(assignments.map((a: any) => a.employee_id)).size;
    const averageShiftsPerEmployee = uniqueEmployees > 0 ? total / uniqueEmployees : 0;

    return {
      totalShiftsAssigned: total,
      totalShiftsCompleted: completed,
      totalShiftsInProgress: inProgress,
      totalShiftsPending: pending,
      completionRate: total > 0 ? (completed / total) * 100 : 0,
      completionTrend: [],
      totalSwapRequests: swapRequests,
      approvedSwapRequests: approvedSwapRequests,
      totalChangeRequests: totalChangeRequests,
      approvedChangeRequests: approvedChangeRequests,
      coverageByShift: [],
      coverageByDayOfWeek: [],
      averageShiftsPerEmployee,
      overworkedEmployees: [],
    };
  } catch (error) {
    console.error('❌ Error getting schedule analytics:', error);
    throw error;
  }
};

/**
 * Get Salary Analytics
 * Phân tích lương bổng
 */
export const getSalaryAnalytics = async (
  filters: AnalyticsFilters
): Promise<SalaryAnalytics> => {
  try {
    // 1. Get Employees with Scheme ID
    const employees = await directus.request(
      readItems(EMPLOYEES_COLLECTION, {
        fields: ['id', 'scheme_id', 'status'],
        filter: { status: { _eq: 'active' } }, // Only active employees for payroll
        limit: -1,
      })
    );

    // 2. Get Salary Schemes
    const schemes = await directus.request(
      readItems(SALARY_SCHEMES_COLLECTION, {
        fields: ['id', 'name', 'rate', 'pay_type'],
        limit: -1,
      })
    );

    const schemeMap = new Map(schemes.map((s: any) => [s.id, s]));

    // 3. Calculate Stats
    let totalBaseSalary = 0;
    const salaryDistribution: any[] = []; // Ranges: <5M, 5-10M, 10-20M, >20M

    // Initialize ranges
    const ranges = {
      '< 5M': 0,
      '5M - 10M': 0,
      '10M - 20M': 0,
      '> 20M': 0
    };

    employees.forEach((emp: any) => {
      if (emp.scheme_id && schemeMap.has(emp.scheme_id)) {
        const scheme = schemeMap.get(emp.scheme_id);
        let estimatedMonthly = 0;

        // Parse rate as number (có thể là string từ DB)
        const rate = parseFloat(scheme.rate) || 0;

        if (scheme.pay_type === 'monthly') {
          estimatedMonthly = rate;
        } else if (scheme.pay_type === 'hourly') {
          // Estimate: rate * 8 hours * 22 days
          estimatedMonthly = rate * 8 * 22;
        } else if (scheme.pay_type === 'fixed_shift') {
          // Estimate: rate * 22 shifts
          estimatedMonthly = rate * 22;
        }

        totalBaseSalary += estimatedMonthly;

        // Distribution
        if (estimatedMonthly < 5000000) ranges['< 5M']++;
        else if (estimatedMonthly < 10000000) ranges['5M - 10M']++;
        else if (estimatedMonthly < 20000000) ranges['10M - 20M']++;
        else ranges['> 20M']++;
      }
    });

    const totalEmployees = employees.length;
    const averageSalary = totalEmployees > 0 ? totalBaseSalary / totalEmployees : 0;

    return {
      totalPayroll: totalBaseSalary, // Estimated
      averageSalary,
      medianSalary: 0, // TODO
      salaryDistribution: Object.entries(ranges).map(([range, count]) => ({
        range,
        count,
        percentage: totalEmployees > 0 ? (count / totalEmployees) * 100 : 0
      })),
      salaryByDepartment: [],
      salaryByPosition: [],
      totalBaseSalary,
      totalOvertimePay: 0,
      totalDeductions: 0,
      totalNetPay: totalBaseSalary, // Simplified
      payrollTrend: [],
      overtimeTrend: [],
      totalOvertimeHours: 0,
      averageOvertimeHours: 0,
      topOvertimeEmployees: [],
    };
  } catch (error) {
    console.error('❌ Error getting salary analytics:', error);
    throw error;
  }
};

/**
 * Get Trend Data
 * Dữ liệu xu hướng theo thời gian
 */
export const getTrendData = async (
  filters: AnalyticsFilters
): Promise<TimeSeriesData[]> => {
  // Placeholder - implement based on metric type
  return [];
};

/**
 * Get Comparative Analytics
 * So sánh giữa các kỳ
 */
export const getComparativeAnalytics = async (
  currentStart: string,
  currentEnd: string,
  previousStart: string,
  previousEnd: string
): Promise<ComparativeAnalytics> => {
  // Placeholder
  return {
    currentPeriod: {
      startDate: currentStart,
      endDate: currentEnd,
      totalEmployees: 0,
      attendanceRate: 0,
      lateRate: 0,
      scheduleCompletionRate: 0,
      totalPayroll: 0,
    },
    previousPeriod: {
      startDate: previousStart,
      endDate: previousEnd,
      totalEmployees: 0,
      attendanceRate: 0,
      lateRate: 0,
      scheduleCompletionRate: 0,
      totalPayroll: 0,
    },
    comparison: {
      employeeChange: 0,
      attendanceRateChange: 0,
      lateRateChange: 0,
      scheduleCompletionRateChange: 0,
      payrollChange: 0,
    },
  };
};

/**
 * Get Employee Performance Ranking
 * Xếp hạng hiệu suất nhân viên
 */
export const getEmployeePerformanceRanking = async (
  filters: AnalyticsFilters,
  limit: number = 10,
  sortBy: string = 'attendance_rate',
  order: 'asc' | 'desc' = 'desc'
): Promise<EmployeePerformance[]> => {
  const stats = await directus.request(
    readItems(MONTHLY_EMPLOYEE_STATS_COLLECTION, {
      filter: buildMonthFilter(filters),
      limit: -1,
    })
  );

  const performances = stats.map((s: any) => {
    const total = s.total_shifts_worked || 0;
    const absent = s.absent_count || 0;
    const late = s.late_count || 0;

    return {
      employeeId: s.employee_id,
      employeeName: 'Employee ' + s.employee_id.slice(0, 8),
      attendanceRate: total > 0 ? ((total - absent) / total) * 100 : 0,
      lateCount: late,
      absentCount: absent,
      totalShifts: total,
    };
  });

  // Sort based on sortBy parameter
  performances.sort((a: any, b: any) => {
    const aVal = a[sortBy] || 0;
    const bVal = b[sortBy] || 0;
    return order === 'desc' ? bVal - aVal : aVal - bVal;
  });

  return performances.slice(0, limit);
};

/**
 * Get Recent Activities
 * Hoạt động gần đây trên dashboard
 */
export interface RecentActivity {
  id: string;
  action: string;
  actor: string;
  time: string;
}

export const getRecentActivities = async (limit: number = 5): Promise<RecentActivity[]> => {
  try {
    const activities: RecentActivity[] = [];

    // Helper to get employee name by ID
    const getEmployeeName = async (employeeId: string): Promise<string> => {
      if (!employeeId) return 'Hệ thống';
      try {
        const employees = await directus.request(
          readItems(EMPLOYEES_COLLECTION, {
            filter: { id: { _eq: employeeId } },
            fields: ['full_name', 'first_name', 'last_name'],
            limit: 1,
          })
        );
        if (employees.length > 0) {
          const emp = employees[0] as any;
          return emp.full_name || `${emp.first_name || ''} ${emp.last_name || ''}`.trim() || 'Unknown';
        }
      } catch (e) {
        // ignore
      }
      return 'Unknown';
    };

    // Helper to get user name by ID
    const getUserName = async (userId: string): Promise<string> => {
      if (!userId) return 'Hệ thống';
      try {
        const users = await directus.request(
          readItems('directus_users' as any, {
            filter: { id: { _eq: userId } },
            fields: ['first_name', 'last_name', 'email'],
            limit: 1,
          })
        );
        if (users.length > 0) {
          const user = users[0] as any;
          if (user.first_name || user.last_name) {
            return `${user.first_name || ''} ${user.last_name || ''}`.trim();
          }
          return user.email || 'Admin';
        }
      } catch (e) {
        // ignore
      }
      return 'Admin';
    };

    // 1. Get recent employees (newly created)
    try {
      const recentEmployees = await directus.request(
        readItems(EMPLOYEES_COLLECTION, {
          fields: ['id', 'full_name', 'first_name', 'last_name', 'created_at'],
          sort: ['-created_at'],
          limit: 5,
        })
      );
      for (const emp of recentEmployees as any[]) {
        const name = emp.full_name || `${emp.first_name || ''} ${emp.last_name || ''}`.trim();
        activities.push({
          id: `emp_${emp.id}`,
          action: `Thêm nhân viên mới: ${name}`,
          actor: 'Admin',
          time: emp.created_at,
        });
      }
    } catch (e) {
      console.log('⚠️ Error fetching employees:', e);
    }

    // 2. Get recent contracts
    try {
      const recentContracts = await directus.request(
        readItems('contracts' as any, {
          fields: ['id', 'employee_id', 'created_at', 'contract_type'],
          sort: ['-created_at'],
          limit: 5,
        })
      );
      for (const contract of recentContracts as any[]) {
        const empName = await getEmployeeName(contract.employee_id);
        activities.push({
          id: `contract_${contract.id}`,
          action: `Tạo hợp đồng ${contract.contract_type || ''} cho ${empName}`,
          actor: 'Admin',
          time: contract.created_at,
        });
      }
    } catch (e) {
      console.log('⚠️ Error fetching contracts:', e);
    }

    // 3. Get recent monthly payrolls
    try {
      const recentPayrolls = await directus.request(
        readItems('monthly_payrolls' as any, {
          fields: ['id', 'employee_id', 'month', 'status', 'created_at', 'updated_at', 'approved_by'],
          sort: ['-updated_at'],
          limit: 5,
        })
      );
      for (const payroll of recentPayrolls as any[]) {
        const empName = await getEmployeeName(payroll.employee_id);
        let action = `Tạo phiếu lương tháng ${payroll.month} cho ${empName}`;
        let actor = 'Admin';

        if (payroll.status === 'approved') {
          action = `Duyệt phiếu lương tháng ${payroll.month} của ${empName}`;
          if (payroll.approved_by) {
            actor = await getUserName(payroll.approved_by);
          }
        } else if (payroll.status === 'sent') {
          action = `Gửi phiếu lương tháng ${payroll.month} cho ${empName}`;
        }

        activities.push({
          id: `payroll_${payroll.id}`,
          action,
          actor,
          time: payroll.updated_at || payroll.created_at,
        });
      }
    } catch (e) {
      console.log('⚠️ Error fetching payrolls:', e);
    }

    // 4. Get recent salary requests
    try {
      const salaryRequests = await directus.request(
        readItems(SALARY_REQUESTS_COLLECTION, {
          fields: ['id', 'employee_id', 'request_type', 'status', 'created_at'],
          sort: ['-created_at'],
          limit: 5,
        })
      );
      for (const req of salaryRequests as any[]) {
        const empName = await getEmployeeName(req.employee_id);
        activities.push({
          id: `salary_req_${req.id}`,
          action: `Yêu cầu ${req.request_type || 'điều chỉnh lương'} từ ${empName}`,
          actor: empName,
          time: req.created_at,
        });
      }
    } catch (e) {
      console.log('⚠️ Error fetching salary requests:', e);
    }

    // 5. Get recent schedule change requests
    try {
      const scheduleRequests = await directus.request(
        readItems(SCHEDULE_CHANGE_REQUESTS_COLLECTION, {
          fields: ['id', 'employee_id', 'status', 'reason', 'created_at'],
          sort: ['-created_at'],
          limit: 5,
        })
      );
      for (const req of scheduleRequests as any[]) {
        const empName = await getEmployeeName(req.employee_id);
        activities.push({
          id: `schedule_req_${req.id}`,
          action: `Yêu cầu đổi ca: ${req.reason || 'Không có lý do'}`,
          actor: empName,
          time: req.created_at,
        });
      }
    } catch (e) {
      console.log('⚠️ Error fetching schedule requests:', e);
    }

    // 6. Get recent attendance logs
    try {
      const attendanceLogs = await directus.request(
        readItems(ATTENDANCE_LOGS_COLLECTION, {
          fields: ['id', 'employee_id', 'event_type', 'event_time'],
          sort: ['-event_time'],
          limit: 5,
        })
      );
      for (const log of attendanceLogs as any[]) {
        const empName = await getEmployeeName(log.employee_id);
        const action = log.event_type === 'clock_in' ? 'Check-in' :
          log.event_type === 'clock_out' ? 'Check-out' :
            log.event_type;
        activities.push({
          id: `attendance_${log.id}`,
          action: `${action}`,
          actor: empName,
          time: log.event_time,
        });
      }
    } catch (e) {
      console.log('⚠️ Error fetching attendance logs:', e);
    }

    // Sort all activities by time desc
    activities.sort((a, b) => {
      const timeA = a.time ? new Date(a.time).getTime() : 0;
      const timeB = b.time ? new Date(b.time).getTime() : 0;
      return timeB - timeA;
    });

    console.log(`✅ Total activities collected: ${activities.length}`);

    return activities.slice(0, limit);
  } catch (error) {
    console.error('❌ Error getting recent activities:', error);
    return [];
  }
};
