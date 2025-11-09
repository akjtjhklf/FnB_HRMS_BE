import { z } from "zod";
import { EmployeeAvailabilityPosition } from "./employee-availability-position.model";

// ====== ZOD SCHEMAS ======
export const createEmployeeAvailabilityPositionSchema = z.object({
  availability_id: z.uuid(),
  position_id: z.uuid(),
  preference_order: z.number().int().nullable().optional(),
});

export const updateEmployeeAvailabilityPositionSchema =
  createEmployeeAvailabilityPositionSchema.partial();

export const employeeAvailabilityPositionResponseSchema = z.object({
  id: z.uuid(),
  availability_id: z.uuid(),
  position_id: z.uuid(),
  preference_order: z.number().nullable(),
  created_at: z.string().nullable(),
  updated_at: z.string().nullable(),
});

// ====== TYPES ======
export type CreateEmployeeAvailabilityPositionDto = z.infer<
  typeof createEmployeeAvailabilityPositionSchema
>;
export type UpdateEmployeeAvailabilityPositionDto = z.infer<
  typeof updateEmployeeAvailabilityPositionSchema
>;
export type EmployeeAvailabilityPositionResponseDto = z.infer<
  typeof employeeAvailabilityPositionResponseSchema
>;

// ====== MAPPER ======
export const toEmployeeAvailabilityPositionResponseDto = (
  entity: EmployeeAvailabilityPosition
): EmployeeAvailabilityPositionResponseDto => ({
  id: entity.id,
  availability_id: entity.availability_id,
  position_id: entity.position_id,
  preference_order: entity.preference_order ?? null,
  created_at: entity.created_at ?? null,
  updated_at: entity.updated_at ?? null,
});
