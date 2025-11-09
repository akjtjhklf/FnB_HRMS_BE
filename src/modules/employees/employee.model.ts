export interface Employee {
  id: string;
  user_id?: string | null;
  employee_code: string;
  first_name?: string | null;
  last_name?: string | null;
  full_name?: string | null;
  dob?: string | null;
  gender?: "male" | "female" | "other" | null;
  personal_id?: string | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  hire_date?: string | null;
  termination_date?: string | null;
  status?: "active" | "on_leave" | "suspended" | "terminated";
  scheme_id?: string | null;
  default_work_hours_per_week?: number | null;
  max_hours_per_week?: number | null;
  max_consecutive_days?: number | null;
  min_rest_hours_between_shifts?: number | null;
  photo_url?: string | null;
  emergency_contact_name?: string | null;
  emergency_contact_phone?: string | null;
  notes?: string | null;
  metadata?: Record<string, unknown> | null;
  created_at?: string | null;
  updated_at?: string | null;
  deleted_at?: string | null;
}

export const EMPLOYEES_COLLECTION = "employees";
