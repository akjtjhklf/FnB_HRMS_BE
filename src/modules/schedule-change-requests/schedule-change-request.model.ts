export interface ScheduleChangeRequest {
  id: string;
  requester_id: string; // FK → employees.id
  type: "shift_swap" | "pass_shift" | "day_off";
  
  // OLD fields (kept for backward compatibility)
  from_shift_id?: string | null;
  to_shift_id?: string | null;
  
  // ✅ NEW fields for proper swap logic
  from_assignment_id?: string | null; // Assignment requester wants to swap
  to_assignment_id?: string | null;    // Assignment to swap with
  
  target_employee_id?: string | null;
  replacement_employee_id?: string | null;
  reason?: string | null;
  status: "pending" | "approved" | "rejected" | "cancelled";
  approved_by?: string | null;
  approved_at?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
}

export const SCHEDULE_CHANGE_REQUESTS_COLLECTION = "schedule_change_requests";
