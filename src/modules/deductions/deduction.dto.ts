import { z } from "zod";
import { Deduction } from "./deduction.model";

export const createDeductionSchema = z.object({
  employee_id: z.uuid(),
  type: z.enum(["advance", "penalty", "expense"]),
  amount: z.number().nonnegative().optional().nullable(),
  currency: z.string().default("VND").optional().nullable(),
  related_shift_id: z.uuid().optional().nullable(),
  note: z.string().optional().nullable(),
  status: z.enum(["pending", "applied", "reimbursed"]).default("pending"),
});

export const updateDeductionSchema = createDeductionSchema.partial();

export const deductionResponseSchema = z.object({
  id: z.uuid(),
  employee_id: z.uuid(),
  type: z.enum(["advance", "penalty", "expense"]),
  amount: z.number().nullable(),
  currency: z.string().nullable(),
  related_shift_id: z.uuid().nullable(),
  note: z.string().nullable(),
  status: z.enum(["pending", "applied", "reimbursed"]),
  created_at: z.string().nullable(),
  updated_at: z.string().nullable(),
});

export type CreateDeductionDto = z.infer<typeof createDeductionSchema>;
export type UpdateDeductionDto = z.infer<typeof updateDeductionSchema>;
export type DeductionResponseDto = z.infer<typeof deductionResponseSchema>;

export const toDeductionResponseDto = (
  entity: Deduction
): DeductionResponseDto => ({
  id: entity.id,
  employee_id: entity.employee_id,
  type: entity.type,
  amount: entity.amount ?? null,
  currency: entity.currency ?? null,
  related_shift_id: entity.related_shift_id ?? null,
  note: entity.note ?? null,
  status: entity.status,
  created_at: entity.created_at ?? null,
  updated_at: entity.updated_at ?? null,
});
