import { z } from "zod";
import { ScheduleChangeRequest } from "./schedule-change-request.model";

// ====== ZOD SCHEMAS ======
export const createScheduleChangeRequestSchema = z.object({
  requester_id: z.uuid(),
  type: z.enum(["shift_swap", "pass_shift", "day_off"]),
  
  // OLD fields
  from_shift_id: z.uuid().nullable().optional(),
  to_shift_id: z.uuid().nullable().optional(),
  
  // NEW fields
  from_assignment_id: z.uuid().nullable().optional(),
  to_assignment_id: z.uuid().nullable().optional(),
  
  target_employee_id: z.uuid().nullable().optional(),
  replacement_employee_id: z.uuid().nullable().optional(),
  reason: z.string().nullable().optional(),
  status: z.enum(["pending", "approved", "rejected", "cancelled"]).default("pending"),
  approved_by: z.uuid().nullable().optional(),
  approved_at: z.date().nullable().optional(),
}).refine(
  (data) => {
    // If shift_swap, must have from_assignment_id
    if (data.type === "shift_swap") {
      return !!data.from_assignment_id;
    }
    return true;
  },
  {
    message: "shift_swap type requires from_assignment_id",
    path: ["from_assignment_id"],
  }
);

export const updateScheduleChangeRequestSchema =
  createScheduleChangeRequestSchema.partial();

export const scheduleChangeRequestResponseSchema = z.object({
  id: z.uuid(),
  requester_id: z.uuid(),
  type: z.enum(["shift_swap", "pass_shift", "day_off"]),
  from_shift_id: z.uuid().nullable(),
  to_shift_id: z.uuid().nullable(),
  target_employee_id: z.uuid().nullable(),
  replacement_employee_id: z.uuid().nullable(),
  reason: z.string().nullable(),
  status: z.enum(["pending", "approved", "rejected", "cancelled"]),
  approved_by: z.uuid().nullable(),
  approved_at: z.string().nullable(),
  created_at: z.string().nullable(),
  updated_at: z.string().nullable(),
});

// ====== TYPES ======
export type CreateScheduleChangeRequestDto = z.infer<
  typeof createScheduleChangeRequestSchema
>;
export type UpdateScheduleChangeRequestDto = z.infer<
  typeof updateScheduleChangeRequestSchema
>;
export type ScheduleChangeRequestResponseDto = z.infer<
  typeof scheduleChangeRequestResponseSchema
>;

// ====== MAPPER ======
export const toScheduleChangeRequestResponseDto = (
  entity: ScheduleChangeRequest
): ScheduleChangeRequestResponseDto => ({
  id: entity.id,
  requester_id: entity.requester_id,
  type: entity.type,
  from_shift_id: entity.from_shift_id ?? null,
  to_shift_id: entity.to_shift_id ?? null,
  target_employee_id: entity.target_employee_id ?? null,
  replacement_employee_id: entity.replacement_employee_id ?? null,
  reason: entity.reason ?? null,
  status: entity.status,
  approved_by: entity.approved_by ?? null,
  approved_at: entity.approved_at ?? null,
  created_at: entity.created_at ?? null,
  updated_at: entity.updated_at ?? null,
});
