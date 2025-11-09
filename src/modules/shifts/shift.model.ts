export interface Shift {
  id: string; // UUID
  schedule_id?: string | null; // references weekly_schedule.id
  shift_type_id: string; // references shift_types.id
  shift_date: string; // ISO date
  start_at?: string | null;
  end_at?: string | null;
  total_required?: number | null;
  notes?: string | null;
  metadata?: Record<string, unknown> | null;
  created_by?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
}

export const SHIFTS_COLLECTION = "shifts";
