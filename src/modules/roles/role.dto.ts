import { z } from "zod";
import { Role } from "./role.model";

// ====== ZOD SCHEMAS ======
export const createRoleSchema = z.object({
  name: z.string().min(1, "Tên role không được để trống"),
  icon: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  parent: z.uuid().optional().nullable(),
});

export const updateRoleSchema = createRoleSchema.partial();

export const roleResponseSchema = z.object({
  id: z.uuid(),
  name: z.string(),
  icon: z.string().nullable(),
  description: z.string().nullable(),
  parent: z.uuid().nullable(),
});

// ====== TYPES ======
export type CreateRoleDto = z.infer<typeof createRoleSchema>;
export type UpdateRoleDto = z.infer<typeof updateRoleSchema>;
export type RoleResponseDto = z.infer<typeof roleResponseSchema>;

// ====== MAPPER ======
export const toRoleResponseDto = (entity: Role): RoleResponseDto => ({
  id: entity.id,
  name: entity.name,
  icon: entity.icon ?? null,
  description: entity.description ?? null,
  parent: entity.parent ?? null,
});
