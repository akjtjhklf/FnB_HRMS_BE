import { IsEmail, IsString } from 'class-validator';
import { z } from 'zod';
import { User } from '../users/user.model';
import { Employee } from '../employees/employee.model';
import { Role } from '../roles/role.model';
import { Permission } from '../permissions/permission.model';
import { Policy } from '../policies/policy.model';

export class LoginDto {
  @IsEmail()
  email!: string;

  @IsString()
  password!: string;
}

// Zod schema for request validation middleware
export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export type LoginRequest = z.infer<typeof loginSchema>;

export const refreshTokenSchema = z.object({
  refresh_token: z.string().min(1),
});

export type RefreshTokenRequest = z.infer<typeof refreshTokenSchema>;

/**
 * Policy với permissions đầy đủ
 */
export interface PolicyWithPermissions extends Policy {
  permissions?: Permission[];
}

/**
 * Role với policies và permissions đầy đủ
 */
export interface RoleWithPermissions extends Role {
  // Danh sách policies của role (many-to-many)
  policies?: PolicyWithPermissions[];
  
  // Flat list permissions (aggregated từ tất cả policies)
  all_permissions?: Permission[];
}

/**
 * Extended User Identity DTO
 * Kết hợp thông tin User + Employee + Role + Permissions
 * Dùng cho getIdentity() và RBAC
 */
export interface UserIdentityDto extends User {
  // Thông tin employee liên kết
  employee?: Employee | null;
  
  // Role được populate đầy đủ (thay vì chỉ là ID)
  role?: RoleWithPermissions | null;
  
  // Display name
  name?: string;
  
  // Permissions được flatten từ role → policies → permissions
  permissions?: Permission[];
  
  // Quick access flags
  is_admin?: boolean;
  can_access_app?: boolean;
}

