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
export const toShiftResponseDto = (entity: Shift): ShiftResponseDto => ({
  id: entity.id,
  schedule_id: entity.schedule_id ?? null,
  shift_type_id: entity.shift_type_id,
  shift_date: entity.shift_date,
  start_at: entity.start_at ?? null,
  end_at: entity.end_at ?? null,
  total_required: entity.total_required ?? null,
  notes: entity.notes ?? null,
  metadata: entity.metadata ?? null,
  created_by: entity.created_by ?? null,
  created_at: entity.created_at ?? null,
  updated_at: entity.updated_at ?? null,
});
