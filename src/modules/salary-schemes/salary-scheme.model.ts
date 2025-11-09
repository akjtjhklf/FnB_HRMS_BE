export interface SalaryScheme {
  id: string;
  name: string;
  position_id?: string | null; // references positions.id
  pay_type: "hourly" | "fixed_shift" | "monthly";
  rate: number;
  min_hours?: number | null;
  overtime_multiplier?: number | null;
  effective_from?: string | null;
  effective_to?: string | null;
  is_active?: boolean;
  notes?: string | null;
  metadata?: Record<string, unknown> | null;
  created_at?: string | null;
  updated_at?: string | null;
}

export const SALARY_SCHEMES_COLLECTION = "salary_schemes";
