import { z } from "zod";
import { AttendanceAdjustment } from "./attendance-adjustment.model";

export const createAttendanceAdjustmentSchema = z.object({
  attendance_shift_id: z.uuid(),
  requested_by: z.uuid().nullable().optional(),
  requested_at: z.string().nullable().optional(),
  old_value: z.object({
    clock_in: z.string().nullable().optional(),
    clock_out: z.string().nullable().optional(),
  }).nullable().optional(),
  proposed_value: z.object({
    clock_in: z.string().nullable().optional(),
    clock_out: z.string().nullable().optional(),
  }).nullable().optional(),
  approved_by: z.uuid().nullable().optional(),
  approved_at: z.string().nullable().optional(),
  status: z.enum(["pending", "approved", "rejected"]).default("pending"),
  reason: z.string().nullable().optional(),
});

export const updateAttendanceAdjustmentSchema =
  createAttendanceAdjustmentSchema.partial();

export const attendanceAdjustmentResponseSchema = z.object({
  id: z.uuid(),
  attendance_shift_id: z.uuid(),
  requested_by: z.uuid().nullable(),
  requested_at: z.string().nullable(),
  old_value: z.object({
    clock_in: z.string().nullable().optional(),
    clock_out: z.string().nullable().optional(),
  }).nullable(),
  proposed_value: z.object({
    clock_in: z.string().nullable().optional(),
    clock_out: z.string().nullable().optional(),
  }).nullable(),
  approved_by: z.uuid().nullable(),
  approved_at: z.string().nullable(),
  status: z.enum(["pending", "approved", "rejected"]),
  reason: z.string().nullable(),
  created_at: z.string().nullable(),
  updated_at: z.string().nullable(),
});

export type CreateAttendanceAdjustmentDto = z.infer<
  typeof createAttendanceAdjustmentSchema
>;
export type UpdateAttendanceAdjustmentDto = z.infer<
  typeof updateAttendanceAdjustmentSchema
>;
export type AttendanceAdjustmentResponseDto = z.infer<
  typeof attendanceAdjustmentResponseSchema
>;

export const toAttendanceAdjustmentResponseDto = (
  entity: AttendanceAdjustment
): AttendanceAdjustmentResponseDto => ({
  id: entity.id,
  attendance_shift_id: entity.attendance_shift_id,
  requested_by: entity.requested_by ?? null,
  requested_at: entity.requested_at ?? null,
  old_value: entity.old_value ?? null,
  proposed_value: entity.proposed_value ?? null,
  approved_by: entity.approved_by ?? null,
  approved_at: entity.approved_at ?? null,
  status: entity.status,
  reason: entity.reason ?? null,
  created_at: entity.created_at ?? null,
  updated_at: entity.updated_at ?? null,
});
