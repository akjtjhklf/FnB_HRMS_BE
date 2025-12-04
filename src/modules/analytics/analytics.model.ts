/**
 * Analytics Module - TypeScript Interfaces
 * Định nghĩa các type cho analytics data
 */

// ============ Overview Stats ============
export interface OverviewStats {
  // Employee metrics
  totalEmployees: number;
  activeEmployees: number;
  onLeaveEmployees: number;
  terminatedEmployees: number;
  newEmployeesThisMonth: number;
  
  // Attendance metrics
  totalAttendanceToday: number;
  lateToday: number;
  absentToday: number;
  attendanceRate: number; // percentage
  
  // Schedule metrics
  totalShiftsToday: number;
  scheduledEmployeesToday: number;
  scheduleCompletionRate: number; // percentage
  
  // Requests metrics
  pendingRequests: number;
  pendingScheduleChangeRequests: number;
  pendingSalaryRequests: number;
  
  // Trends
  employeeTrend?: TrendIndicator;
  attendanceTrend?: TrendIndicator;
}

export interface TrendIndicator {
  value: number; // percentage change
  isPositive: boolean;
  comparedTo?: string; // "last week", "last month"
}

// ============ Employee Analytics ============
export interface EmployeeAnalytics {
  // Distribution
  byDepartment: DepartmentStats[];
  byPosition: PositionStats[];
  byStatus: StatusStats[];
  byGender: GenderStats[];
  
  // Growth
  employeeGrowth: TimeSeriesData[];
  
  // Tenure
  averageTenure: number; // in months
  tenureDistribution: TenureDistribution[];
  
  // Summary
  totalCount: number;
  activeCount: number;
}

export interface DepartmentStats {
  departmentId: string;
  departmentName: string;
  count: number;
  percentage: number;
}

export interface PositionStats {
  positionId: string;
  positionName: string;
  count: number;
  percentage: number;
}

export interface StatusStats {
  status: 'active' | 'on_leave' | 'suspended' | 'terminated';
  count: number;
  percentage: number;
}

export interface GenderStats {
  gender: 'male' | 'female' | 'other';
  count: number;
  percentage: number;
}

export interface TenureDistribution {
  range: string; // "0-6 months", "6-12 months", etc.
  count: number;
}

// ============ Attendance Analytics ============
export interface AttendanceAnalytics {
  // Summary
  totalWorkDays: number;
  totalPresent: number;
  totalLate: number;
  totalAbsent: number;
  totalOnLeave: number;
  
  // Rates
  attendanceRate: number; // percentage
  lateRate: number; // percentage
  absentRate: number; // percentage
  
  // Trends
  attendanceTrend: TimeSeriesData[];
  lateTrend: TimeSeriesData[];
  
  // Patterns
  lateByDayOfWeek: DayOfWeekStats[];
  attendanceByShift: ShiftAttendanceStats[];
  
  // Top performers
  topPerformers: EmployeePerformance[];
  needsImprovement: EmployeePerformance[];
}

export interface DayOfWeekStats {
  dayOfWeek: string; // "Monday", "Tuesday", etc.
  lateCount: number;
  absentCount: number;
}

export interface ShiftAttendanceStats {
  shiftType: string;
  attendanceRate: number;
  lateRate: number;
}

export interface EmployeePerformance {
  employeeId: string;
  employeeName: string;
  positionName?: string;
  attendanceRate: number;
  lateCount: number;
  absentCount: number;
  totalShifts: number;
}

// ============ Schedule Analytics ============
export interface ScheduleAnalytics {
  // Summary
  totalShiftsAssigned: number;
  totalShiftsCompleted: number;
  totalShiftsInProgress: number;
  totalShiftsPending: number;
  
  // Completion
  completionRate: number; // percentage
  completionTrend: TimeSeriesData[];
  
  // Changes
  totalSwapRequests: number;
  approvedSwapRequests: number;
  totalChangeRequests: number;
  approvedChangeRequests: number;
  
  // Coverage
  coverageByShift: ShiftCoverageStats[];
  coverageByDayOfWeek: DayOfWeekCoverageStats[];
  
  // Efficiency
  averageShiftsPerEmployee: number;
  overworkedEmployees: OverworkedEmployee[];
}

export interface ShiftCoverageStats {
  shiftType: string;
  required: number;
  assigned: number;
  coverageRate: number; // percentage
}

export interface DayOfWeekCoverageStats {
  dayOfWeek: string;
  averageCoverage: number; // percentage
}

export interface OverworkedEmployee {
  employeeId: string;
  employeeName: string;
  totalShifts: number;
  totalHours: number;
  maxAllowedHours: number;
  exceedPercentage: number;
}

// ============ Salary Analytics ============
export interface SalaryAnalytics {
  // Summary
  totalPayroll: number;
  averageSalary: number;
  medianSalary: number;
  
  // Distribution
  salaryDistribution: SalaryDistribution[];
  salaryByDepartment: DepartmentSalaryStats[];
  salaryByPosition: PositionSalaryStats[];
  
  // Components
  totalBaseSalary: number;
  totalOvertimePay: number;
  totalDeductions: number;
  totalNetPay: number;
  
  // Trends
  payrollTrend: TimeSeriesData[];
  overtimeTrend: TimeSeriesData[];
  
  // Overtime
  totalOvertimeHours: number;
  averageOvertimeHours: number;
  topOvertimeEmployees: OvertimeEmployee[];
}

export interface SalaryDistribution {
  range: string; // "0-5M", "5M-10M", etc.
  count: number;
  percentage: number;
}

export interface DepartmentSalaryStats {
  departmentName: string;
  totalSalary: number;
  averageSalary: number;
  employeeCount: number;
}

export interface PositionSalaryStats {
  positionName: string;
  averageSalary: number;
  minSalary: number;
  maxSalary: number;
  employeeCount: number;
}

export interface OvertimeEmployee {
  employeeId: string;
  employeeName: string;
  overtimeHours: number;
  overtimePay: number;
}

// ============ Time Series Data ============
export interface TimeSeriesData {
  date: string; // ISO date string
  value: number;
  label?: string;
}

// ============ Comparative Analytics ============
export interface ComparativeAnalytics {
  currentPeriod: PeriodStats;
  previousPeriod: PeriodStats;
  comparison: ComparisonStats;
}

export interface PeriodStats {
  startDate: string;
  endDate: string;
  totalEmployees: number;
  attendanceRate: number;
  lateRate: number;
  scheduleCompletionRate: number;
  totalPayroll: number;
}

export interface ComparisonStats {
  employeeChange: number; // percentage
  attendanceRateChange: number; // percentage
  lateRateChange: number; // percentage
  scheduleCompletionRateChange: number; // percentage
  payrollChange: number; // percentage
}

// ============ Filters ============
export interface AnalyticsFilters {
  startDate?: string;
  endDate?: string;
  departmentId?: string;
  positionId?: string;
  employeeId?: string;
  status?: string;
  granularity?: 'day' | 'week' | 'month' | 'quarter' | 'year';
}

// ============ Export Options ============
export interface ExportOptions {
  format: 'csv' | 'excel' | 'pdf';
  dataType: 'overview' | 'employees' | 'attendance' | 'schedule' | 'salary';
  filters?: AnalyticsFilters;
}
