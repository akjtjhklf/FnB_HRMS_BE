import { z } from "zod";
import { SalaryRequest } from "./salary-request.model";

// ====== CREATE / UPDATE SCHEMAS ======
export const createSalaryRequestSchema = z.object({
  employee_id: z.string().uuid(),
  type: z.enum(["raise", "adjustment"]).default("raise"),
  payroll_id: z.string().uuid().nullable().optional(),
  adjustment_amount: z.number().nullable().optional(),
  reason: z.string().nullable().optional(),
  manager_note: z.string().nullable().optional(),
  
  current_scheme_id: z.string().uuid().nullable().optional(),
  proposed_scheme_id: z.string().uuid().nullable().optional(),
  current_rate: z.number().nullable().optional(),
  proposed_rate: z.number().nullable().optional(),
  request_date: z.coerce.date(),
  status: z.enum(["pending", "approved", "rejected"]).default("pending"),
  approved_by: z.string().uuid().nullable().optional(),
  approved_at: z.coerce.date().nullable().optional(),
  note: z.string().nullable().optional(),
});

export const updateSalaryRequestSchema = createSalaryRequestSchema.partial();

// ====== RESPONSE SCHEMA ======
export const salaryRequestResponseSchema = z.object({
  id: z.string().uuid(),
  employee_id: z.string().uuid(),
  type: z.enum(["raise", "adjustment"]).nullable().optional(),
  payroll_id: z.string().uuid().nullable().optional(),
  adjustment_amount: z.number().nullable().optional(),
  reason: z.string().nullable().optional(),
  manager_note: z.string().nullable().optional(),
  
  current_scheme_id: z.string().uuid().nullable(),
  proposed_scheme_id: z.string().uuid().nullable(),
  current_rate: z.number().nullable(),
  proposed_rate: z.number().nullable(),
  request_date: z.string(),
  status: z.enum(["pending", "approved", "rejected"]),
  approved_by: z.string().uuid().nullable(),
  approved_at: z.string().nullable(),
  note: z.string().nullable(),
  created_at: z.string().nullable(),
  updated_at: z.string().nullable(),
});

// ====== TYPES ======
export type CreateSalaryRequestDto = z.infer<typeof createSalaryRequestSchema>;
export type UpdateSalaryRequestDto = z.infer<typeof updateSalaryRequestSchema>;
export type SalaryRequestResponseDto = z.infer<
  typeof salaryRequestResponseSchema
>;

// ====== MAPPER ======
export const toSalaryRequestResponseDto = (
  entity: SalaryRequest
): SalaryRequestResponseDto => ({
  id: entity.id,
  employee_id: entity.employee_id,
  type: entity.type,
  payroll_id: entity.payroll_id,
  adjustment_amount: entity.adjustment_amount,
  reason: entity.reason,
  manager_note: entity.manager_note,
  
  current_scheme_id: entity.current_scheme_id ?? null,
  proposed_scheme_id: entity.proposed_scheme_id ?? null,
  current_rate: entity.current_rate ?? null,
  proposed_rate: entity.proposed_rate ?? null,
  request_date: entity.request_date,
  status: entity.status,
  approved_by: entity.approved_by ?? null,
  approved_at: entity.approved_at ?? null,
  note: entity.note ?? null,
  created_at: entity.created_at ?? null,
  updated_at: entity.updated_at ?? null,
});
