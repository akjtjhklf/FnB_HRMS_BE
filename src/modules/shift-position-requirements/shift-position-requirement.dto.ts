import { z } from "zod";
import { ShiftPositionRequirement } from "./shift-position-requirement.model";

// ====== ZOD SCHEMAS ======
export const createShiftPositionRequirementSchema = z.object({
  shift_id: z.uuid(),
  position_id: z.uuid(),
  required_count: z.number().int().nonnegative(),
  notes: z.string().nullable().optional(),
});

export const updateShiftPositionRequirementSchema =
  createShiftPositionRequirementSchema.partial();

export const shiftPositionRequirementResponseSchema = z.object({
  id: z.uuid(),
  shift_id: z.uuid(),
  position_id: z.uuid(),
  required_count: z.number().int(),
  notes: z.string().nullable(),
  created_at: z.string().nullable(),
  updated_at: z.string().nullable(),
});

// ====== TYPES ======
export type CreateShiftPositionRequirementDto = z.infer<
  typeof createShiftPositionRequirementSchema
>;
export type UpdateShiftPositionRequirementDto = z.infer<
  typeof updateShiftPositionRequirementSchema
>;
export type ShiftPositionRequirementResponseDto = z.infer<
  typeof shiftPositionRequirementResponseSchema
>;

// ====== MAPPER ======
export const toShiftPositionRequirementResponseDto = (
  entity: ShiftPositionRequirement
): ShiftPositionRequirementResponseDto => ({
  id: entity.id,
  shift_id: entity.shift_id,
  position_id: entity.position_id,
  required_count: entity.required_count,
  notes: entity.notes ?? null,
  created_at: entity.created_at ?? null,
  updated_at: entity.updated_at ?? null,
});
