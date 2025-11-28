import { z } from "zod";
import { Role } from "./role.model";

// ====== ZOD SCHEMAS ======
export const createRoleSchema = z.object({
  name: z.string().min(1, "Tên role không được để trống"),
  icon: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  parent: z.uuid().optional().nullable(),
  // Relationships
  policies: z.array(z.any()).optional(), // Array of policy IDs (via directus_access)
  users: z.array(z.any()).optional(), // One-to-many users
  children: z.array(z.any()).optional(), // One-to-many child roles
});

export const updateRoleSchema = createRoleSchema.partial();

export const roleResponseSchema = z.object({
  id: z.uuid(),
  name: z.string(),
  icon: z.string().nullable(),
  description: z.string().nullable(),
  parent: z.uuid().nullable(),
  policies: z.array(z.any()).optional(), // Policies linked via directus_access
  users: z.array(z.any()).optional(), // Users with this role
  children: z.array(z.any()).optional(), // Child roles
});

// ==== == TYPES ======
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
  // ❌ Do NOT auto-populate these from Directus role object
  // They should be fetched separately via dedicated endpoints:
  // - GET /api/roles/:id/policies
  // - GET /api/users?filter[role][_eq]=:id
  // policies: (entity as any).policies,
  // users: (entity as any).users,
  // children: (entity as any).children,
});
