import { z } from "zod";
import { EmployeeAvailability } from "./employee-availability.model";

// ====== ZOD SCHEMAS ======
export const createEmployeeAvailabilitySchema = z.object({
  employee_id: z.uuid(),
  shift_id: z.uuid(),
  priority: z.number().int().min(1).max(10).default(5).optional(),
  expires_at: z.date().nullable().optional(),
  note: z.string().nullable().optional(),
});

export const updateEmployeeAvailabilitySchema =
  createEmployeeAvailabilitySchema.partial();

export const employeeAvailabilityResponseSchema = z.object({
  id: z.uuid(),
  employee_id: z.uuid(),
  shift_id: z.uuid(),
  priority: z.number().nullable(),
  expires_at: z.string().nullable(),
  note: z.string().nullable(),
  created_at: z.string().nullable(),
  updated_at: z.string().nullable(),
});

// ====== TYPES ======
export type CreateEmployeeAvailabilityDto = z.infer<
  typeof createEmployeeAvailabilitySchema
>;
export type UpdateEmployeeAvailabilityDto = z.infer<
  typeof updateEmployeeAvailabilitySchema
>;
export type EmployeeAvailabilityResponseDto = z.infer<
  typeof employeeAvailabilityResponseSchema
>;

// ====== MAPPER ======
export const toEmployeeAvailabilityResponseDto = (
  entity: EmployeeAvailability
): EmployeeAvailabilityResponseDto => ({
  id: entity.id,
  employee_id: entity.employee_id,
  shift_id: entity.shift_id,
  priority: entity.priority ?? null,
  expires_at: entity.expires_at ?? null,
  note: entity.note ?? null,
  created_at: entity.created_at ?? null,
  updated_at: entity.updated_at ?? null,
});
