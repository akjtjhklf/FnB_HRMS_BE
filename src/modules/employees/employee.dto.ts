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

export const employeeResponseSchema = createEmployeeSchema.extend({
  id: z.uuid(),
  created_at: z.string().optional().nullable(),
  updated_at: z.string().optional().nullable(),
  rfid_cards: z.array(z.object({
      card_number: z.string(),
      status: z.string()
  })).optional(),
});

export type CreateEmployeeDto = z.infer<typeof createEmployeeSchema>;
export type UpdateEmployeeDto = z.infer<typeof updateEmployeeSchema>;
export type EmployeeResponseDto = z.infer<typeof employeeResponseSchema>;

// --- Full Creation DTO ---
export const createFullEmployeeSchema = z.object({
  // Step 1: User & Access
  email: z.string().email(),
  password: z.string().optional(),
  roleId: z.string().uuid(),
  policyIds: z.array(z.string().uuid()).default([]),

  // Step 2: Employee Info
  employee_code: z.string().min(1),
  first_name: z.string().min(1),
  last_name: z.string().min(1),
  dob: z.string().optional(),
  gender: z.enum(["male", "female", "other"]).optional(),
  phone: z.string().optional(),
  department_id: z.string().optional(), // Assuming we might add this
  position_id: z.string().optional(), // Assuming we might add this
  // ... other employee fields can be passed as needed, expanding createEmployeeSchema if necessary
  // For now we'll stick to the core fields + what's in createEmployeeSchema
  
  // Step 3: RFID
  rfidCode: z.string().optional(),
}).merge(createEmployeeSchema.omit({ user_id: true, email: true })); // Merge with base employee schema, omitting user_id as it's generated

export type CreateFullEmployeeDto = z.infer<typeof createFullEmployeeSchema>;

// Mapper
import { UserResponseDto, toUserResponseDto } from "../users/user.dto"; // giả sử bạn có DTO user/role

export const toEmployeeResponseDto = (
  entity: Employee
): EmployeeResponseDto & { user?: UserResponseDto } => ({
  id: entity.id,
  user_id: entity.user_id ?? null,
  employee_code: entity.employee_code,
  first_name: entity.first_name ?? null,
  last_name: entity.last_name ?? null,
  full_name: entity.full_name ?? null,
  dob: entity.dob ?? null,
  gender: entity.gender ?? null,
  personal_id: entity.personal_id ?? null,
  phone: entity.phone ?? null,
  email: entity.email ?? null,
  address: entity.address ?? null,
  hire_date: entity.hire_date ?? null,
  termination_date: entity.termination_date ?? null,
  status: entity.status ?? "active",
  scheme_id: entity.scheme_id ?? null,
  default_work_hours_per_week: entity.default_work_hours_per_week 
    ? Number(entity.default_work_hours_per_week) 
    : null,
  max_hours_per_week: entity.max_hours_per_week 
    ? Number(entity.max_hours_per_week) 
    : null,
  max_consecutive_days: entity.max_consecutive_days 
    ? Number(entity.max_consecutive_days) 
    : null,
  min_rest_hours_between_shifts: entity.min_rest_hours_between_shifts 
    ? Number(entity.min_rest_hours_between_shifts) 
    : null,
  photo_url: entity.photo_url ?? null,
  emergency_contact_name: entity.emergency_contact_name ?? null,
  emergency_contact_phone: entity.emergency_contact_phone ?? null,
  notes: entity.notes ?? null,
  metadata: entity.metadata ?? null,
  created_at: entity.created_at ?? null,
  updated_at: entity.updated_at ?? null,
  user: entity.user ? toUserResponseDto(entity.user) : undefined,
  rfid_cards: (entity as any).rfid_cards,
});
