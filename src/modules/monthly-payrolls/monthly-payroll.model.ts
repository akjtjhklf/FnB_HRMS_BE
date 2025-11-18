export interface MonthlyPayroll {
  id: string;
  employee_id: string; // FK → employees.id
  month: string; // format: YYYY-MM
  salary_scheme_id?: string | null; // FK → salary_schemes.id
  base_salary: number;
  allowances: number;
  bonuses: number;
  overtime_pay: number;
  deductions: number;
  penalties: number;
  gross_salary: number; // calculated: base + allowances + bonuses + overtime
  net_salary: number; // calculated: gross - deductions - penalties
  total_work_hours?: number | null;
  overtime_hours?: number | null;
  late_minutes?: number | null;
  absent_days?: number | null;
  notes?: string | null;
  status: "draft" | "pending_approval" | "approved" | "paid";
  approved_by?: string | null;
  approved_at?: string | null;
  paid_at?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
}

export const MONTHLY_PAYROLLS_COLLECTION = "monthly_payrolls";
