import { z } from "zod";
import { Policy } from "./policy.model";

// ====== ZOD SCHEMAS ======
export const createPolicySchema = z.object({
  name: z.string().min(1, "Tên policy là bắt buộc"),
  icon: z.string().default("badge"),
  description: z.string().optional().nullable(),
  ip_access: z.string().optional().nullable(),
  enforce_tfa: z.boolean().default(false),
  admin_access: z.boolean().default(false),
  app_access: z.boolean().default(false),
});

export const updatePolicySchema = createPolicySchema.partial();

export const policyResponseSchema = z.object({
  id: z.uuid(),
  name: z.string(),
  icon: z.string(),
  description: z.string().nullable(),
  ip_access: z.string().nullable(),
  enforce_tfa: z.boolean(),
  admin_access: z.boolean(),
  app_access: z.boolean(),
});

// ====== TYPES ======
export type CreatePolicyDto = z.infer<typeof createPolicySchema>;
export type UpdatePolicyDto = z.infer<typeof updatePolicySchema>;
export type PolicyResponseDto = z.infer<typeof policyResponseSchema>;

// ====== MAPPER ======
export const toPolicyResponseDto = (entity: Policy): PolicyResponseDto => ({
  id: entity.id,
  name: entity.name,
  icon: entity.icon,
  description: entity.description ?? null,
  ip_access: entity.ip_access ?? null,
  enforce_tfa: entity.enforce_tfa,
  admin_access: entity.admin_access,
  app_access: entity.app_access,
});
