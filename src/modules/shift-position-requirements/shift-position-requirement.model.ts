export interface ShiftPositionRequirement {
  id: string;
  shift_id: string;
  position_id: string;
  position?: any; // Populated relation from Directus when expanded
  required_count: number;
  notes?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
}

export const SHIFT_POSITION_REQUIREMENTS_COLLECTION =
  "shift_position_requirements";
