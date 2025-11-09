import { z } from "zod";
import { SalaryScheme } from "./salary-scheme.model";

// ====== ZOD SCHEMAS ======
export const createSalarySchemeSchema = z.object({
  name: z.string().min(1, "Tên chế độ lương không được để trống"),
  position_id: z.uuid().optional().nullable(),
  pay_type: z.enum(["hourly", "fixed_shift", "monthly"]),
  rate: z.number().positive("Mức lương phải lớn hơn 0"),
  min_hours: z.number().optional().nullable(),
  overtime_multiplier: z.number().optional().nullable(),
  effective_from: z.string().optional().nullable(),
  effective_to: z.string().optional().nullable(),
  is_active: z.boolean().default(true),
  notes: z.string().optional().nullable(),
  metadata: z.record(z.any(), z.any()).optional().nullable(),
});

export const updateSalarySchemeSchema = createSalarySchemeSchema.partial();

export const salarySchemeResponseSchema = z.object({
  id: z.string(),
  name: z.string(),
  position_id: z.string().nullable(),
  pay_type: z.enum(["hourly", "fixed_shift", "monthly"]),
  rate: z.number(),
  min_hours: z.number().nullable(),
  overtime_multiplier: z.number().nullable(),
  effective_from: z.string().nullable(),
  effective_to: z.string().nullable(),
  is_active: z.boolean(),
  notes: z.string().nullable(),
  created_at: z.string().nullable(),
  updated_at: z.string().nullable(),
});

// ====== TYPES ======
export type CreateSalarySchemeDto = z.infer<typeof createSalarySchemeSchema>;
export type UpdateSalarySchemeDto = z.infer<typeof updateSalarySchemeSchema>;
export type SalarySchemeResponseDto = z.infer<
  typeof salarySchemeResponseSchema
>;

// ====== MAPPER ======
export const toSalarySchemeResponseDto = (
  entity: SalaryScheme
): SalarySchemeResponseDto => ({
  id: entity.id,
  name: entity.name,
  position_id: entity.position_id ?? null,
  pay_type: entity.pay_type,
  rate: entity.rate,
  min_hours: entity.min_hours ?? null,
  overtime_multiplier: entity.overtime_multiplier ?? null,
  effective_from: entity.effective_from ?? null,
  effective_to: entity.effective_to ?? null,
  is_active: entity.is_active ?? true,
  notes: entity.notes ?? null,
  created_at: entity.created_at ?? null,
  updated_at: entity.updated_at ?? null,
});
