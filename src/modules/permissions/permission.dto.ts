import { z } from "zod";
import { Permission } from "./permission.model";

// ====== ZOD SCHEMAS ======
export const createPermissionSchema = z.object({
  collection: z.string().min(1),
  action: z.string().min(1),
  permissions: z.record(z.any(), z.any()).optional().nullable(),
  validation: z.record(z.any(), z.any()).optional().nullable(),
  presets: z.record(z.any(), z.any()).optional().nullable(),
  fields: z.string().optional().nullable(),
  policy: z.uuid(), // liên kết đến bảng policies
});

export const updatePermissionSchema = createPermissionSchema.partial();

export const permissionResponseSchema = z.object({
  id: z.uuid(),
  collection: z.string(),
  action: z.string(),
  permissions: z.record(z.any(), z.any()).nullable(),
  validation: z.record(z.any(), z.any()).nullable(),
  presets: z.record(z.any(), z.any()).nullable(),
  fields: z.string().nullable(),
  policy: z.uuid(),
});

// ====== TYPES ======
export type CreatePermissionDto = z.infer<typeof createPermissionSchema>;
export type UpdatePermissionDto = z.infer<typeof updatePermissionSchema>;
export type PermissionResponseDto = z.infer<typeof permissionResponseSchema>;

// ====== MAPPER ======
export const toPermissionResponseDto = (
  entity: Permission
): PermissionResponseDto => ({
  id: entity.id,
  collection: entity.collection,
  action: entity.action,
  permissions: entity.permissions ?? null,
  validation: entity.validation ?? null,
  presets: entity.presets ?? null,
  fields: entity.fields ?? null,
  policy: entity.policy,
});
