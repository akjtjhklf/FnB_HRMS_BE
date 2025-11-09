import { z } from "zod";
import { Contract } from "./contract.model";

// ====== ZOD SCHEMAS ======
export const createContractSchema = z.object({
  employee_id: z.uuid(),
  contract_type: z
    .enum(["full_time", "part_time", "casual", "probation"])
    .nullable()
    .optional(),
  start_date: z.date().nullable().optional(),
  end_date: z.date().nullable().optional(),
  base_salary: z.number().nullable().optional(),
  probation_end_date: z.date().nullable().optional(),
  signed_doc_url: z.url().nullable().optional(),
  is_active: z.boolean().default(true).optional(),
  notes: z.string().nullable().optional(),
});

export const updateContractSchema = createContractSchema.partial();

// ====== RESPONSE SCHEMA ======
export const contractResponseSchema = z.object({
  id: z.uuid(),
  employee_id: z.uuid(),
  contract_type: z
    .enum(["full_time", "part_time", "casual", "probation"])
    .nullable(),
  start_date: z.string().nullable(),
  end_date: z.string().nullable(),
  base_salary: z.number().nullable(),
  probation_end_date: z.string().nullable(),
  signed_doc_url: z.string().nullable(),
  is_active: z.boolean().nullable(),
  notes: z.string().nullable(),
  created_at: z.string().nullable(),
  updated_at: z.string().nullable(),
});

// ====== TYPES ======
export type CreateContractDto = z.infer<typeof createContractSchema>;
export type UpdateContractDto = z.infer<typeof updateContractSchema>;
export type ContractResponseDto = z.infer<typeof contractResponseSchema>;

// ====== MAPPER ======
export const toContractResponseDto = (
  entity: Contract
): ContractResponseDto => ({
  id: entity.id,
  employee_id: entity.employee_id,
  contract_type: entity.contract_type ?? null,
  start_date: entity.start_date ?? null,
  end_date: entity.end_date ?? null,
  base_salary: entity.base_salary ?? null,
  probation_end_date: entity.probation_end_date ?? null,
  signed_doc_url: entity.signed_doc_url ?? null,
  is_active: entity.is_active ?? null,
  notes: entity.notes ?? null,
  created_at: entity.created_at ?? null,
  updated_at: entity.updated_at ?? null,
});
