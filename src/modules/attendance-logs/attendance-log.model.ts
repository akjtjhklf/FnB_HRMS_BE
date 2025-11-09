export interface AttendanceLog {
  id: string;
  card_uid: string;
  rfid_card_id?: string | null;
  employee_id?: string | null;
  device_id?: string | null;
  event_type: "tap" | "clock_in" | "clock_out";
  event_time: string;
  raw_payload?: string | null;
  processed?: boolean;
  match_attempted_at?: string | null;
  created_at?: string | null;
}

export const ATTENDANCE_LOGS_COLLECTION = "attendance_logs";
