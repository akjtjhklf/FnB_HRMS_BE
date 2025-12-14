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
  entity: any
): any => {
  // When Directus expands relations via 'position_id.field', it returns the related object
  // nested under 'position_id' instead of as a separate 'position' field.
  // We need to extract this and provide both position_id (string) and position (object).
  
  let position = null;
  let positionId = entity.position_id;
  
  // Check if position_id is an object (expanded relation) or a string (just the ID)
  if (typeof entity.position_id === 'object' && entity.position_id !== null) {
    position = entity.position_id; // The expanded relation object
    positionId = entity.position_id.id; // Extract the ID from the object
  } else if (entity.position) {
    // Fallback: check if position exists as a separate field
    position = entity.position;
  }
  
  return {
    id: entity.id,
    shift_id: entity.shift_id,
    position_id: positionId, // Always return as string ID
    required_count: entity.required_count,
    notes: entity.notes ?? null,
    created_at: entity.created_at ?? null,
    updated_at: entity.updated_at ?? null,
    // Include position object if it was expanded
    ...(position && { position }),
  };
};
