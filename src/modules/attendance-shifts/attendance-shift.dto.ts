import { z } from "zod";
import { AttendanceShift } from "./attendance-shift.model";

// ====== ZOD SCHEMAS ======
export const createAttendanceShiftSchema = z.object({
  shift_id: z.uuid().nullable().optional(),
  schedule_assignment_id: z.uuid().nullable().optional(),
  employee_id: z.uuid(),
  clock_in: z.date().nullable().optional(),
  clock_out: z.date().nullable().optional(),
  worked_minutes: z.number().int().nullable().optional(),
  late_minutes: z.number().int().nullable().optional().default(0),
  early_leave_minutes: z.number().int().nullable().optional().default(0),
  status: z.enum(["present", "absent", "partial"]).default("present"),
  manual_adjusted: z.boolean().default(false),
});

export const updateAttendanceShiftSchema =
  createAttendanceShiftSchema.partial();

export const attendanceShiftResponseSchema = z.object({
  id: z.string().uuid(),
  shift_id: z.string().uuid().nullable(),
  schedule_assignment_id: z.string().uuid().nullable(),
  employee_id: z.string().uuid(),
  clock_in: z.string().nullable(),
  clock_out: z.string().nullable(),
  worked_minutes: z.number().nullable(),
  late_minutes: z.number().nullable(),
  early_leave_minutes: z.number().nullable(),
  status: z.enum(["present", "absent", "partial"]),
  manual_adjusted: z.boolean(),
  created_at: z.string().nullable(),
  updated_at: z.string().nullable(),
});

// ====== TYPES ======
export type CreateAttendanceShiftDto = z.infer<
  typeof createAttendanceShiftSchema
>;
export type UpdateAttendanceShiftDto = z.infer<
  typeof updateAttendanceShiftSchema
>;
export type AttendanceShiftResponseDto = z.infer<
  typeof attendanceShiftResponseSchema
>;

// ====== MAPPER ======
export const toAttendanceShiftResponseDto = (
  entity: AttendanceShift
): AttendanceShiftResponseDto => ({
  id: entity.id,
  shift_id: entity.shift_id ?? null,
  schedule_assignment_id: entity.schedule_assignment_id ?? null,
  employee_id: entity.employee_id,
  clock_in: entity.clock_in ?? null,
  clock_out: entity.clock_out ?? null,
  worked_minutes: entity.worked_minutes ?? null,
  late_minutes: entity.late_minutes ?? 0,
  early_leave_minutes: entity.early_leave_minutes ?? 0,
  status: entity.status,
  manual_adjusted: entity.manual_adjusted ?? false,
  created_at: entity.created_at ?? null,
  updated_at: entity.updated_at ?? null,
});
