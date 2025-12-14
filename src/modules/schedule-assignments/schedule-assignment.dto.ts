import { z } from "zod";
import { ScheduleAssignment } from "./schedule-assignment.model";

// ====== ZOD SCHEMAS ======
export const createScheduleAssignmentSchema = z.object({
  schedule_id: z.uuid().nullable().optional(),
  shift_id: z.uuid(),
  employee_id: z.uuid(),
  position_id: z.uuid(),
  assigned_by: z.uuid().nullable().optional(),
  assigned_at: z.coerce.date().nullable().optional(),
  status: z.enum(["assigned", "tentative", "swapped", "cancelled"]).default("assigned"),
  source: z.enum(["auto", "manual"]).default("auto"),
  note: z.string().nullable().optional(),
  confirmed_by_employee: z.boolean().default(false).nullable().optional(),
});

export const updateScheduleAssignmentSchema = createScheduleAssignmentSchema.partial();

// ====== AUTO SCHEDULE SCHEMA ======
export const autoScheduleSchema = z.object({
  scheduleId: z.string().uuid("scheduleId phải là UUID hợp lệ"),
  overwriteExisting: z.boolean().default(false).optional(),
  dryRun: z.boolean().default(false).optional(),
});

export const scheduleAssignmentResponseSchema = z.object({
  id: z.uuid(),
  schedule_id: z.uuid().nullable(),
  shift_id: z.uuid(),
  employee_id: z.uuid(),
  position_id: z.uuid(),
  assigned_by: z.uuid().nullable(),
  assigned_at: z.string().nullable(),
  status: z.enum(["assigned", "tentative", "swapped", "cancelled"]),
  source: z.enum(["auto", "manual"]),
  note: z.string().nullable(),
  confirmed_by_employee: z.boolean().nullable(),
  created_at: z.string().nullable(),
  updated_at: z.string().nullable(),
});

// ====== TYPES ======
export type CreateScheduleAssignmentDto = z.infer<typeof createScheduleAssignmentSchema>;
export type UpdateScheduleAssignmentDto = z.infer<typeof updateScheduleAssignmentSchema>;
export type AutoScheduleDto = z.infer<typeof autoScheduleSchema>;
export type ScheduleAssignmentResponseDto = z.infer<typeof scheduleAssignmentResponseSchema>;

// ====== MAPPER ======
export const toScheduleAssignmentResponseDto = (
  entity: ScheduleAssignment
): ScheduleAssignmentResponseDto => ({
  id: entity.id,
  schedule_id: entity.schedule_id ?? null,
  shift_id: entity.shift_id,
  employee_id: entity.employee_id,
  position_id: entity.position_id,
  assigned_by: entity.assigned_by ?? null,
  assigned_at: entity.assigned_at ?? null,
  status: entity.status,
  source: entity.source,
  note: entity.note ?? null,
  confirmed_by_employee: entity.confirmed_by_employee ?? null,
  created_at: entity.created_at ?? null,
  updated_at: entity.updated_at ?? null,
});
