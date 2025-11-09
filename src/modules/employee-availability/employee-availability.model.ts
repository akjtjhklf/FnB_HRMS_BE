export interface EmployeeAvailability {
  id: string;
  employee_id: string; // references employees.id
  shift_id: string; // references shifts.id
  priority?: number | null;
  expires_at?: string | null;
  note?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
}

export const EMPLOYEE_AVAILABILITIES_COLLECTION = "employee_availability";
