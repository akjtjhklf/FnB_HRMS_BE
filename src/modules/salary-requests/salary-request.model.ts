export interface SalaryRequest {
  id: string;
  employee_id: string;
  type: "raise" | "adjustment"; // New field
  
  // For Raise
  current_scheme_id?: string | null;
  proposed_scheme_id?: string | null;
  current_rate?: number | null;
  proposed_rate?: number | null;
  
  // For Adjustment
  payroll_id?: string | null; // FK -> monthly_payrolls.id
  adjustment_amount?: number | null;
  
  reason?: string | null; // Requester's reason
  manager_note?: string | null; // Manager's note
  
  request_date: string; // datetime
  status: "pending" | "approved" | "rejected";
  approved_by?: string | null;
  approved_at?: string | null;
  note?: string | null; // Old field, maybe keep for backward compatibility or map to reason/manager_note
  created_at?: string | null;
  updated_at?: string | null;
}

export const SALARY_REQUESTS_COLLECTION = "salary_requests";
