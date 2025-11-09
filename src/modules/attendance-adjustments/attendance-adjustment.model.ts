export interface AttendanceAdjustment {
  id: string;
  attendance_shift_id: string;
  requested_by?: string | null;
  requested_at?: string | null;
  old_value?: Record<string, unknown> | null;
  proposed_value?: Record<string, unknown> | null;
  approved_by?: string | null;
  approved_at?: string | null;
  status: "pending" | "approved" | "rejected";
  reason?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
}

export const ATTENDANCE_ADJUSTMENTS_COLLECTION = "attendance_adjustments";
