export interface ShiftType {
  id: string; // UUID
  name: string;
  start_time: string; // TIME (HH:mm:ss)
  end_time: string; // TIME (HH:mm:ss)
  cross_midnight?: boolean | null;
  notes?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
}

export const SHIFT_TYPES_COLLECTION = "shift_types";
