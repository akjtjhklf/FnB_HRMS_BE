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
  // Many-to-many relationships via directus_access
  users: z.array(z.any()).optional(), // Array of user IDs or access records
  roles: z.array(z.any()).optional(), // Array of role IDs or access records
  permissions: z.array(z.any()).optional(), // One-to-many permissions
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
  users: z.array(z.any()).optional(), // Users linked via directus_access
  roles: z.array(z.any()).optional(), // Roles linked via directus_access
  permissions: z.array(z.any()).optional(), // Permissions for this policy
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
  users: (entity as any).users,
  roles: (entity as any).roles,
  permissions: (entity as any).permissions,
});
