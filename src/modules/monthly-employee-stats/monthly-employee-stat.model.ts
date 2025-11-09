export interface MonthlyEmployeeStat {
  id: string;
  employee_id: string;
  month: string; // format: YYYY-MM
  total_shifts_assigned?: number | null;
  total_shifts_worked?: number | null;
  swaps_count?: number | null;
  pass_count?: number | null;
  off_count?: number | null;
  total_worked_minutes?: number | null;
  overtime_minutes?: number | null;
  late_minutes?: number | null;
  absent_count?: number | null;
  updated_at?: string | null;
}

export const MONTHLY_EMPLOYEE_STATS_COLLECTION = "monthly_employee_stats";
