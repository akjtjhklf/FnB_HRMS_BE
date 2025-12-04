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
const directusToken = process.env.DIRECTUS_ADMIN_TOKEN || '';

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
    // Use monthly_employee_stats for aggregated data
    const stats = await directus.request(
      readItems(MONTHLY_EMPLOYEE_STATS_COLLECTION, {
        filter: buildMonthFilter(filters),
        limit: -1,
      })
    );

    // Calculate summary
    const totalShifts = stats.reduce((sum: number, s: any) => sum + (s.total_shifts_worked || 0), 0);
    const totalLate = stats.reduce((sum: number, s: any) => sum + (s.late_count || 0), 0);
    const totalAbsent = stats.reduce((sum: number, s: any) => sum + (s.absent_count || 0), 0);

    // TODO: Implement more detailed analytics with actual attendance_logs data
    const attendanceTrend: TimeSeriesData[] = [];
    const lateTrend: TimeSeriesData[] = [];
    const lateByDayOfWeek: any[] = [];
    const attendanceByShift: any[] = [];
    
    // Get performance rankings
    const topPerformers = getTopPerformers(stats, 10);
    const needsImprovement = getBottomPerformers(stats, 10);

    return {
      totalWorkDays: totalShifts,
      totalPresent: totalShifts - totalAbsent,
      totalLate: totalLate,
      totalAbsent: totalAbsent,
      totalOnLeave: 0,
      attendanceRate: totalShifts > 0 ? ((totalShifts - totalAbsent) / totalShifts) * 100 : 0,
      lateRate: totalShifts > 0 ? (totalLate / totalShifts) * 100 : 0,
      absentRate: totalShifts > 0 ? (totalAbsent / totalShifts) * 100 : 0,
      attendanceTrend,
      lateTrend,
      lateByDayOfWeek,
      attendanceByShift,
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

    const changeRequests = await directus.request(
      readItems(SCHEDULE_CHANGE_REQUESTS_COLLECTION, {
        filter: requestFilter,
        fields: ['id', 'status', 'type'],
        limit: -1,
      })
    );

    const totalChangeRequests = changeRequests.length;
    const approvedChangeRequests = changeRequests.filter((r: any) => r.status === 'approved').length;
    const swapRequests = changeRequests.filter((r: any) => r.type === 'shift_swap').length;
    const approvedSwapRequests = changeRequests.filter((r: any) => r.type === 'shift_swap' && r.status === 'approved').length;

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
        
        if (scheme.pay_type === 'monthly') {
          estimatedMonthly = scheme.rate;
        } else if (scheme.pay_type === 'hourly') {
          // Estimate: rate * 8 hours * 22 days
          estimatedMonthly = scheme.rate * 8 * 22;
        } else if (scheme.pay_type === 'fixed_shift') {
           // Estimate: rate * 22 shifts
           estimatedMonthly = scheme.rate * 22;
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
