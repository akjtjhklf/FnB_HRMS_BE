import { z } from "zod";
import { WeeklySchedule } from "./weekly-schedule.model";

// ====== SCHEMAS ======
export const createWeeklyScheduleSchema = z.object({
  week_start: z.string(),
  week_end: z.string(),
  created_by: z.uuid().nullable().optional(),
  status: z
    .enum(["draft", "scheduled", "finalized", "cancelled"])
    .default("draft"),
  published_at: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
});

export const updateWeeklyScheduleSchema = createWeeklyScheduleSchema.partial();

export const weeklyScheduleResponseSchema = z.object({
  id: z.uuid(),
  week_start: z.string(),
  week_end: z.string(),
  created_by: z.string().nullable(),
  status: z.enum(["draft", "scheduled", "finalized", "cancelled"]),
  published_at: z.string().nullable(),
  notes: z.string().nullable(),
  created_at: z.string().nullable(),
  updated_at: z.string().nullable(),
});

// ====== TYPES ======
export type CreateWeeklyScheduleDto = z.infer<
  typeof createWeeklyScheduleSchema
>;
export type UpdateWeeklyScheduleDto = z.infer<
  typeof updateWeeklyScheduleSchema
>;
export type WeeklyScheduleResponseDto = z.infer<
  typeof weeklyScheduleResponseSchema
>;

// ====== MAPPER ======
export const toWeeklyScheduleResponseDto = (
  entity: WeeklySchedule
): WeeklyScheduleResponseDto => ({
  id: entity.id,
  week_start: entity.week_start,
  week_end: entity.week_end,
  created_by: entity.created_by ?? null,
  status: entity.status,
  published_at: entity.published_at ?? null,
  notes: entity.notes ?? null,
  created_at: entity.created_at ?? null,
  updated_at: entity.updated_at ?? null,
});
