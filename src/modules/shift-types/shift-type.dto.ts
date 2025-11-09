import { z } from "zod";
import { ShiftType } from "./shift-type.model";

// ====== ZOD SCHEMAS ======
export const createShiftTypeSchema = z.object({
  name: z.string().min(1, "Tên ca làm là bắt buộc"),
  start_time: z
    .string()
    .regex(
      /^([0-1]\d|2[0-3]):([0-5]\d):([0-5]\d)$/,
      "Sai định dạng thời gian (HH:mm:ss)"
    ),
  end_time: z
    .string()
    .regex(
      /^([0-1]\d|2[0-3]):([0-5]\d):([0-5]\d)$/,
      "Sai định dạng thời gian (HH:mm:ss)"
    ),
  cross_midnight: z.boolean().nullable().optional(),
  notes: z.string().nullable().optional(),
});

export const updateShiftTypeSchema = createShiftTypeSchema.partial();

export const shiftTypeResponseSchema = z.object({
  id: z.uuid(),
  name: z.string(),
  start_time: z.string(),
  end_time: z.string(),
  cross_midnight: z.boolean().nullable(),
  notes: z.string().nullable(),
  created_at: z.string().nullable(),
  updated_at: z.string().nullable(),
});

// ====== TYPES ======
export type CreateShiftTypeDto = z.infer<typeof createShiftTypeSchema>;
export type UpdateShiftTypeDto = z.infer<typeof updateShiftTypeSchema>;
export type ShiftTypeResponseDto = z.infer<typeof shiftTypeResponseSchema>;

// ====== MAPPER ======
export const toShiftTypeResponseDto = (
  entity: ShiftType
): ShiftTypeResponseDto => ({
  id: entity.id,
  name: entity.name,
  start_time: entity.start_time,
  end_time: entity.end_time,
  cross_midnight: entity.cross_midnight ?? null,
  notes: entity.notes ?? null,
  created_at: entity.created_at ?? null,
  updated_at: entity.updated_at ?? null,
});
