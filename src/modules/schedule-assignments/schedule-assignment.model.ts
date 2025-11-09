export interface ScheduleAssignment {
  id: string; // uuid
  schedule_id?: string | null;
  shift_id: string;
  employee_id: string;
  position_id: string;
  assigned_by?: string | null;
  assigned_at?: string | null;
  status: "assigned" | "tentative" | "swapped" | "cancelled";
  source: "auto" | "manual";
  note?: string | null;
  confirmed_by_employee?: boolean | null;
  created_at?: string | null;
  updated_at?: string | null;
}

export const SCHEDULE_ASSIGNMENTS_COLLECTION = "schedule_assignments";
