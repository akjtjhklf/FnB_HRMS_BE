import { z } from 'zod';

/**
 * Analytics Module - DTO & Validation Schemas
 * Sử dụng Zod để validate request params
 */

// ============ Common Schemas ============
const dateStringSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format. Use YYYY-MM-DD');

const dateRangeSchema = z.object({
  startDate: dateStringSchema.optional(),
  endDate: dateStringSchema.optional(),
});

const granularitySchema = z.enum(['day', 'week', 'month', 'quarter', 'year']).optional();

// ============ Overview Query Schema ============
export const getOverviewQuerySchema = z.object({
  date: dateStringSchema.optional(),
}).strict();

export type GetOverviewQuery = z.infer<typeof getOverviewQuerySchema>;

// ============ Employee Analytics Query Schema ============
export const getEmployeeAnalyticsQuerySchema = z.object({
  startDate: dateStringSchema.optional(),
  endDate: dateStringSchema.optional(),
  departmentId: z.string().uuid().optional(),
  positionId: z.string().uuid().optional(),
  status: z.enum(['active', 'on_leave', 'suspended', 'terminated']).optional(),
}).strict();

export type GetEmployeeAnalyticsQuery = z.infer<typeof getEmployeeAnalyticsQuerySchema>;

// ============ Attendance Analytics Query Schema ============
export const getAttendanceAnalyticsQuerySchema = z.object({
  startDate: dateStringSchema.optional(),
  endDate: dateStringSchema.optional(),
  departmentId: z.string().uuid().optional(),
  positionId: z.string().uuid().optional(),
  employeeId: z.string().uuid().optional(),
}).strict();

export type GetAttendanceAnalyticsQuery = z.infer<typeof getAttendanceAnalyticsQuerySchema>;

// ============ Schedule Analytics Query Schema ============
export const getScheduleAnalyticsQuerySchema = z.object({
  startDate: dateStringSchema.optional(),
  endDate: dateStringSchema.optional(),
  departmentId: z.string().uuid().optional(),
  positionId: z.string().uuid().optional(),
}).strict();

export type GetScheduleAnalyticsQuery = z.infer<typeof getScheduleAnalyticsQuerySchema>;

// ============ Salary Analytics Query Schema ============
export const getSalaryAnalyticsQuerySchema = z.object({
  startDate: dateStringSchema.optional(),
  endDate: dateStringSchema.optional(),
  departmentId: z.string().uuid().optional(),
  positionId: z.string().uuid().optional(),
  month: z.string().regex(/^\d{4}-\d{2}$/, 'Invalid month format. Use YYYY-MM').optional(),
}).strict();

export type GetSalaryAnalyticsQuery = z.infer<typeof getSalaryAnalyticsQuerySchema>;

// ============ Trends Query Schema ============
export const getTrendsQuerySchema = z.object({
  startDate: dateStringSchema,
  endDate: dateStringSchema,
  granularity: granularitySchema.default('day'),
  metric: z.enum(['employees', 'attendance', 'schedule', 'salary']),
  departmentId: z.string().uuid().optional(),
  positionId: z.string().uuid().optional(),
}).strict();

export type GetTrendsQuery = z.infer<typeof getTrendsQuerySchema>;

// ============ Comparison Query Schema ============
export const getComparisonQuerySchema = z.object({
  currentStartDate: dateStringSchema,
  currentEndDate: dateStringSchema,
  previousStartDate: dateStringSchema,
  previousEndDate: dateStringSchema,
}).strict();

export type GetComparisonQuery = z.infer<typeof getComparisonQuerySchema>;

// ============ Performance Ranking Query Schema ============
export const getPerformanceRankingQuerySchema = z.object({
  startDate: dateStringSchema.optional(),
  endDate: dateStringSchema.optional(),
  limit: z.coerce.number().int().min(1).max(100).optional().default(10),
  sortBy: z.enum(['attendance_rate', 'late_count', 'total_shifts']).optional().default('attendance_rate'),
  order: z.enum(['asc', 'desc']).optional().default('desc'),
  departmentId: z.string().uuid().optional(),
  positionId: z.string().uuid().optional(),
}).strict();

export type GetPerformanceRankingQuery = z.infer<typeof getPerformanceRankingQuerySchema>;

// ============ Export Query Schema ============
export const getExportQuerySchema = z.object({
  format: z.enum(['csv', 'excel', 'pdf']).default('csv'),
  dataType: z.enum(['overview', 'employees', 'attendance', 'schedule', 'salary']),
  startDate: dateStringSchema.optional(),
  endDate: dateStringSchema.optional(),
  departmentId: z.string().uuid().optional(),
  positionId: z.string().uuid().optional(),
}).strict();

export type GetExportQuery = z.infer<typeof getExportQuerySchema>;

// ============ Response DTOs ============

/**
 * Transform raw data to OverviewStats DTO
 */
export const toOverviewStatsDto = (data: any) => {
  return {
    // Employee metrics
    totalEmployees: data.totalEmployees || 0,
    activeEmployees: data.activeEmployees || 0,
    onLeaveEmployees: data.onLeaveEmployees || 0,
    terminatedEmployees: data.terminatedEmployees || 0,
    newEmployeesThisMonth: data.newEmployeesThisMonth || 0,
    
    // Attendance metrics
    totalAttendanceToday: data.totalAttendanceToday || 0,
    lateToday: data.lateToday || 0,
    absentToday: data.absentToday || 0,
    attendanceRate: Number((data.attendanceRate || 0).toFixed(2)),
    
    // Schedule metrics
    totalShiftsToday: data.totalShiftsToday || 0,
    scheduledEmployeesToday: data.scheduledEmployeesToday || 0,
    scheduleCompletionRate: Number((data.scheduleCompletionRate || 0).toFixed(2)),
    
    // Requests metrics
    pendingRequests: data.pendingRequests || 0,
    pendingScheduleChangeRequests: data.pendingScheduleChangeRequests || 0,
    pendingSalaryRequests: data.pendingSalaryRequests || 0,
    
    // Trends
    employeeTrend: data.employeeTrend,
    attendanceTrend: data.attendanceTrend,
  };
};

/**
 * Transform raw data to EmployeeAnalytics DTO
 */
export const toEmployeeAnalyticsDto = (data: any) => {
  return {
    byDepartment: data.byDepartment || [],
    byPosition: data.byPosition || [],
    byStatus: data.byStatus || [],
    byGender: data.byGender || [],
    employeeGrowth: data.employeeGrowth || [],
    averageTenure: data.averageTenure || 0,
    tenureDistribution: data.tenureDistribution || [],
    totalCount: data.totalCount || 0,
    activeCount: data.activeCount || 0,
  };
};

/**
 * Transform raw data to AttendanceAnalytics DTO
 */
export const toAttendanceAnalyticsDto = (data: any) => {
  return {
    totalWorkDays: data.totalWorkDays || 0,
    totalPresent: data.totalPresent || 0,
    totalLate: data.totalLate || 0,
    totalAbsent: data.totalAbsent || 0,
    totalOnLeave: data.totalOnLeave || 0,
    attendanceRate: Number((data.attendanceRate || 0).toFixed(2)),
    lateRate: Number((data.lateRate || 0).toFixed(2)),
    absentRate: Number((data.absentRate || 0).toFixed(2)),
    attendanceTrend: data.attendanceTrend || [],
    lateTrend: data.lateTrend || [],
    lateByDayOfWeek: data.lateByDayOfWeek || [],
    attendanceByShift: data.attendanceByShift || [],
    topPerformers: data.topPerformers || [],
    needsImprovement: data.needsImprovement || [],
  };
};

/**
 * Transform raw data to ScheduleAnalytics DTO
 */
export const toScheduleAnalyticsDto = (data: any) => {
  return {
    totalShiftsAssigned: data.totalShiftsAssigned || 0,
    totalShiftsCompleted: data.totalShiftsCompleted || 0,
    totalShiftsInProgress: data.totalShiftsInProgress || 0,
    totalShiftsPending: data.totalShiftsPending || 0,
    completionRate: Number((data.completionRate || 0).toFixed(2)),
    completionTrend: data.completionTrend || [],
    totalSwapRequests: data.totalSwapRequests || 0,
    approvedSwapRequests: data.approvedSwapRequests || 0,
    totalChangeRequests: data.totalChangeRequests || 0,
    approvedChangeRequests: data.approvedChangeRequests || 0,
    coverageByShift: data.coverageByShift || [],
    coverageByDayOfWeek: data.coverageByDayOfWeek || [],
    averageShiftsPerEmployee: Number((data.averageShiftsPerEmployee || 0).toFixed(2)),
    overworkedEmployees: data.overworkedEmployees || [],
  };
};

/**
 * Transform raw data to SalaryAnalytics DTO
 */
export const toSalaryAnalyticsDto = (data: any) => {
  return {
    totalPayroll: data.totalPayroll || 0,
    averageSalary: Number((data.averageSalary || 0).toFixed(2)),
    medianSalary: data.medianSalary || 0,
    salaryDistribution: data.salaryDistribution || [],
    salaryByDepartment: data.salaryByDepartment || [],
    salaryByPosition: data.salaryByPosition || [],
    totalBaseSalary: data.totalBaseSalary || 0,
    totalOvertimePay: data.totalOvertimePay || 0,
    totalDeductions: data.totalDeductions || 0,
    totalNetPay: data.totalNetPay || 0,
    payrollTrend: data.payrollTrend || [],
    overtimeTrend: data.overtimeTrend || [],
    totalOvertimeHours: data.totalOvertimeHours || 0,
    averageOvertimeHours: Number((data.averageOvertimeHours || 0).toFixed(2)),
    topOvertimeEmployees: data.topOvertimeEmployees || [],
  };
};
