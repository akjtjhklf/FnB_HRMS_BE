export interface Deduction {
  id: string;
  employee_id: string;
  type: "advance" | "penalty" | "expense";
  amount?: number | null;
  currency?: string | null;
  related_shift_id?: string | null;
  note?: string | null;
  status: "pending" | "applied" | "reimbursed";
  created_at?: string | null;
  updated_at?: string | null;
}

export const DEDUCTIONS_COLLECTION = "deductions";
