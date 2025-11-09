export interface EmployeeAvailabilityPosition {
  id: string; // uuid
  availability_id: string; // references employee_availability.id
  position_id: string; // references positions.id
  preference_order?: number | null;
  created_at?: string | null;
  updated_at?: string | null;
}

export const EMPLOYEE_AVAILABILITY_POSITIONS_COLLECTION =
  "employee_availability_positions";
