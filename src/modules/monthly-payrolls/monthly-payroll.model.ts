export interface MonthlyPayroll {
  id: string;
  employee_id: string; // FK → employees.id
  contract_id?: string | null; // FK → contracts.id
  month: string; // format: YYYY-MM
  salary_scheme_id?: string | null; // FK → salary_schemes.id
  
  // Salary calculation inputs
  base_salary: number;
  pay_type?: "hourly" | "fixed_shift" | "monthly" | null;
  hourly_rate?: number | null;
  
  // Components
  allowances: number;
  bonuses: number;
  overtime_pay: number;
  deductions: number;
  penalties: number;
  
  // Calculated amounts
  gross_salary: number; // calculated: base + allowances + bonuses + overtime
  net_salary: number; // calculated: gross - deductions - penalties
  
  // Attendance data (auto-populated from attendance system)
  total_work_days?: number | null;
  total_work_hours?: number | null;
  total_late_minutes?: number | null;
  total_early_leave_minutes?: number | null;
  late_penalty?: number | null;
  early_leave_penalty?: number | null;
  overtime_hours?: number | null;
  absent_days?: number | null;
  
  // Metadata
  notes?: string | null;
  status: "draft" | "pending_approval" | "approved" | "paid";
  approved_by?: string | null;
  approved_at?: string | null;
  paid_at?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
}

export const MONTHLY_PAYROLLS_COLLECTION = "monthly_payrolls";
