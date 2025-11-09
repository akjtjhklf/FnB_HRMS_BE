export interface SalaryRequest {
  id: string;
  employee_id: string;
  current_scheme_id?: string | null;
  proposed_scheme_id?: string | null;
  current_rate?: number | null;
  proposed_rate?: number | null;
  request_date: string; // datetime
  status: "pending" | "approved" | "rejected";
  approved_by?: string | null;
  approved_at?: string | null;
  note?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
}

export const SALARY_REQUESTS_COLLECTION = "salary_requests";
