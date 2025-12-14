import { z } from "zod";
import { Shift } from "./shift.model";

// ====== SCHEMAS ======
export const createShiftSchema = z.object({
  schedule_id: z.uuid("schedule_id phải là UUID"),
  shift_type_id: z.uuid("shift_type_id phải là UUID"),
  shift_date: z.string(), // ISO date
  start_at: z.string().nullable().optional(),
  end_at: z.string().nullable().optional(),
  total_required: z.number().min(0).nullable().optional(),
  notes: z.string().nullable().optional(),
  metadata: z.record(z.any(), z.any()).nullable().optional(),
  created_by: z.uuid().nullable().optional(),
});

export const updateShiftSchema = createShiftSchema.partial();

export const shiftResponseSchema = z.object({
  id: z.uuid(),
  schedule_id: z.string().nullable(),
  shift_type_id: z.string(),
  shift_date: z.string(),
  start_at: z.string().nullable(),
  end_at: z.string().nullable(),
  total_required: z.number().nullable(),
  notes: z.string().nullable(),
  metadata: z.record(z.any(), z.any()).nullable(),
  created_by: z.string().nullable(),
  created_at: z.string().nullable(),
  updated_at: z.string().nullable(),
});

// ====== TYPES ======
export type CreateShiftDto = z.infer<typeof createShiftSchema>;
export type UpdateShiftDto = z.infer<typeof updateShiftSchema>;
export type ShiftResponseDto = z.infer<typeof shiftResponseSchema>;

// ====== MAPPER ======
export const toShiftResponseDto = (entity: any): any => {
  // When Directus expands relations via 'shift_type_id.field', it returns the related object
  // nested under 'shift_type_id' instead of as a separate 'shift_type' field.
  // We need to extract this and provide both shift_type_id (string) and shift_type (object).
  
  let shiftType = null;
  let shiftTypeId = entity.shift_type_id;
  
  // Check if shift_type_id is an object (expanded relation) or a string (just the ID)
  if (typeof entity.shift_type_id === 'object' && entity.shift_type_id !== null) {
    shiftType = entity.shift_type_id; // The expanded relation object
    shiftTypeId = entity.shift_type_id.id; // Extract the ID from the object
  } else if (entity.shift_type) {
    // Fallback: check if shift_type exists as a separate field
    shiftType = entity.shift_type;
  }
  
  return {
    id: entity.id,
    schedule_id: entity.schedule_id ?? null,
    shift_type_id: shiftTypeId, // Always return as string ID
    shift_date: entity.shift_date,
    start_at: entity.start_at ?? null,
    end_at: entity.end_at ?? null,
    total_required: entity.total_required ?? null,
    notes: entity.notes ?? null,
    metadata: entity.metadata ?? null,
    created_by: entity.created_by ?? null,
    created_at: entity.created_at ?? null,
    updated_at: entity.updated_at ?? null,
    // Include shift_type object if it was expanded
    ...(shiftType && { shift_type: shiftType }),
    // Pass through weekly_schedule if present
    ...(entity.weekly_schedule && { weekly_schedule: entity.weekly_schedule }),
  };
};
