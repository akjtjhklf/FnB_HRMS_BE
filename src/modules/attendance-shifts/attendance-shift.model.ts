export interface AttendanceShift {
  id: string;
  shift_id?: string | null;
  schedule_assignment_id?: string | null;
  employee_id: string;
  clock_in?: string | null;
  clock_out?: string | null;
  worked_minutes?: number | null;
  late_minutes?: number | null;
  early_leave_minutes?: number | null;
  status: "present" | "absent" | "partial";
  manual_adjusted?: boolean;
  notes?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
}

export const ATTENDANCE_SHIFTS_COLLECTION = "attendance_shifts";
