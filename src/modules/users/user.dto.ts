import { z } from "zod";
import { User } from "./user.model";

// ====== ZOD SCHEMAS ======
export const createUserSchema = z.object({
  email: z.email(),
  password: z.string().min(6),
  first_name: z.string().optional().nullable(),
  last_name: z.string().optional().nullable(),
  location: z.string().optional().nullable(),
  title: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  tags: z.array(z.string()).optional().nullable(),
  avatar: z.string().optional().nullable(),
  language: z.string().optional().nullable(),
  tfa_secret: z.string().optional().nullable(),
  status: z.enum(["active", "invited", "suspended"]).default("active"),
  role: z.string().optional().nullable(),
  token: z.string().optional().nullable(),
  provider: z.string().optional().nullable(),
  email_notifications: z.boolean().optional(),
  appearance: z.string().optional().nullable(),
  theme_dark: z.string().optional().nullable(),
  theme_light: z.string().optional().nullable(),
  theme_dark_overrides: z.record(z.any(), z.any()).optional().nullable(),
  theme_light_overrides: z.record(z.any(), z.any()).optional().nullable(),
  text_direction: z.string().optional().nullable(),
});

export const updateUserSchema = createUserSchema.partial();

export const userResponseSchema = z.object({
  id: z.uuid(),
  email: z.email(),
  first_name: z.string().nullable(),
  last_name: z.string().nullable(),
  role: z.string().nullable(),
  status: z.enum(["active", "invited", "suspended"]),
  last_access: z.string().nullable(),
  language: z.string().nullable(),
  theme_light: z.string().nullable(),
  theme_dark: z.string().nullable(),
  created_at: z.string().nullable(),
  updated_at: z.string().nullable(),
});

// ====== TYPES ======
export type CreateUserDto = z.infer<typeof createUserSchema>;
export type UpdateUserDto = z.infer<typeof updateUserSchema>;
export type UserResponseDto = z.infer<typeof userResponseSchema>;

// ====== MAPPER ======
export const toUserResponseDto = (entity: User): UserResponseDto => ({
  id: entity.id,
  email: entity.email,
  first_name: entity.first_name ?? null,
  last_name: entity.last_name ?? null,
  role: entity.role ?? null,
  status: entity.status,
  last_access: entity.last_access ?? null,
  language: entity.language ?? null,
  theme_light: entity.theme_light ?? null,
  theme_dark: entity.theme_dark ?? null,
  created_at: entity.created_at ?? null,
  updated_at: entity.updated_at ?? null,
});
