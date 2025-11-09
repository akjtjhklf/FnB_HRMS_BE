import { z } from "zod";
import { AttendanceLog } from "./attendance-log.model";

// ====== ZOD SCHEMAS ======
export const createAttendanceLogSchema = z.object({
  card_uid: z.string().min(1),
  rfid_card_id: z.uuid().nullable().optional(),
  employee_id: z.uuid().nullable().optional(),
  device_id: z.uuid().nullable().optional(),
  event_type: z.enum(["tap", "clock_in", "clock_out"]).default("tap"),
  event_time: z.string(), // ISO datetime
  raw_payload: z.string().nullable().optional(),
  processed: z.boolean().default(false),
  match_attempted_at: z.string().nullable().optional(),
});

export const updateAttendanceLogSchema = createAttendanceLogSchema.partial();

export const attendanceLogResponseSchema = z.object({
  id: z.uuid(),
  card_uid: z.string(),
  rfid_card_id: z.string().nullable(),
  employee_id: z.string().nullable(),
  device_id: z.string().nullable(),
  event_type: z.enum(["tap", "clock_in", "clock_out"]),
  event_time: z.string(),
  raw_payload: z.string().nullable(),
  processed: z.boolean(),
  match_attempted_at: z.string().nullable(),
  created_at: z.string().nullable(),
});

// ====== TYPES ======
export type CreateAttendanceLogDto = z.infer<typeof createAttendanceLogSchema>;
export type UpdateAttendanceLogDto = z.infer<typeof updateAttendanceLogSchema>;
export type AttendanceLogResponseDto = z.infer<
  typeof attendanceLogResponseSchema
>;

// ====== MAPPER ======
export const toAttendanceLogResponseDto = (
  entity: AttendanceLog
): AttendanceLogResponseDto => ({
  id: entity.id,
  card_uid: entity.card_uid,
  rfid_card_id: entity.rfid_card_id ?? null,
  employee_id: entity.employee_id ?? null,
  device_id: entity.device_id ?? null,
  event_type: entity.event_type,
  event_time: entity.event_time,
  raw_payload: entity.raw_payload ?? null,
  processed: entity.processed ?? false,
  match_attempted_at: entity.match_attempted_at ?? null,
  created_at: entity.created_at ?? null,
});
