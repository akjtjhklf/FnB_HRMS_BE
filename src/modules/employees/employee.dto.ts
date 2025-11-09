import { z } from "zod";
import { Employee } from "./employee.model";

export const createEmployeeSchema = z.object({
  user_id: z.uuid().optional().nullable(),
  employee_code: z.string().min(1),
  first_name: z.string().optional().nullable(),
  last_name: z.string().optional().nullable(),
  full_name: z.string().optional().nullable(),
  dob: z.string().optional().nullable(),
  gender: z.enum(["male", "female", "other"]).optional().nullable(),
  personal_id: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  email: z.email().optional().nullable(),
  address: z.string().optional().nullable(),
  hire_date: z.string().optional().nullable(),
  termination_date: z.string().optional().nullable(),
  status: z
    .enum(["active", "on_leave", "suspended", "terminated"])
    .default("active"),
  scheme_id: z.uuid().optional().nullable(),
  default_work_hours_per_week: z.number().optional().nullable(),
  max_hours_per_week: z.number().optional().nullable(),
  max_consecutive_days: z.number().optional().nullable(),
  min_rest_hours_between_shifts: z.number().optional().nullable(),
  photo_url: z.string().optional().nullable(),
  emergency_contact_name: z.string().optional().nullable(),
  emergency_contact_phone: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  metadata: z.record(z.any(), z.any()).optional().nullable(),
});

export const updateEmployeeSchema = createEmployeeSchema.partial();

export const employeeResponseSchema = z.object({
  id: z.string(),
  employee_code: z.string(),
  full_name: z.string().nullable(),
  status: z.enum(["active", "on_leave", "suspended", "terminated"]),
  email: z.string().nullable(),
  phone: z.string().nullable(),
  hire_date: z.string().nullable(),
  created_at: z.string().nullable(),
  updated_at: z.string().nullable(),
});

export type CreateEmployeeDto = z.infer<typeof createEmployeeSchema>;
export type UpdateEmployeeDto = z.infer<typeof updateEmployeeSchema>;
export type EmployeeResponseDto = z.infer<typeof employeeResponseSchema>;

// Mapper
export const toEmployeeResponseDto = (
  entity: Employee
): EmployeeResponseDto => ({
  id: entity.id,
  employee_code: entity.employee_code,
  full_name: entity.full_name ?? null,
  status: entity.status ?? "active",
  email: entity.email ?? null,
  phone: entity.phone ?? null,
  hire_date: entity.hire_date ?? null,
  created_at: entity.created_at ?? null,
  updated_at: entity.updated_at ?? null,
});
