import { createDirectus, rest, staticToken, readMe } from "@directus/sdk";
import { UserIdentityDto, RoleWithPermissions, PolicyWithPermissions } from "./auth.dto";
import { User } from "../users/user.model";
import { Employee } from "../employees/employee.model";
import { Permission } from "../permissions/permission.model";
import { HttpError } from "../../core/base";

export class AuthService {
  /**
   * Get full user identity with Employee, Role, Policies, and Permissions
   * Sử dụng REST API trực tiếp để tránh type issues
   */
  async getUserIdentity(token: string): Promise<UserIdentityDto> {
    try {
      const directusUrl = process.env.DIRECTUS_URL!;

      // 1. Lấy user hiện tại
      const userResponse = await fetch(`${directusUrl}/users/me?fields=*`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!userResponse.ok) {
        throw new HttpError(401, "Unauthorized", "UNAUTHORIZED");
      }

      const userData = await userResponse.json();
      const user = userData.data as User;

      if (!user) {
        throw new HttpError(401, "User not found", "UNAUTHORIZED");
      }

      // 2. Lấy employee liên kết
      let employee: Employee | null = null;
      
      if (user.employee_id) {
        try {
          const empResponse = await fetch(
            `${directusUrl}/items/employees/${user.employee_id}`,
            {
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              }
            }
          );
          if (empResponse.ok) {
            const empData = await empResponse.json();
            employee = empData.data;
          }
        } catch (error) {
          console.error("❌ Error fetching employee by id:", error);
        }
      }

      // Fallback: tìm employee theo user_id
      if (!employee) {
        try {
          const empResponse = await fetch(
            `${directusUrl}/items/employees?filter[user_id][_eq]=${user.id}&limit=1`,
            {
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              }
            }
          );
          if (empResponse.ok) {
            const empData = await empResponse.json();
            employee = empData.data?.[0] || null;
          }
        } catch (error) {
          console.error("❌ Error fetching employee by user_id:", error);
        }
      }

      // 3. Lấy role với policies và permissions
      let roleWithPermissions: RoleWithPermissions | null = null;
      let allPermissions: Permission[] = [];
      let isAdmin = false;
      let canAccessApp = false;

      if (user.role) {
        const roleId = typeof user.role === 'string' ? user.role : (user.role as any).id;

        try {
          // Lấy role info
          const roleResponse = await fetch(
            `${directusUrl}/roles/${roleId}`,
            {
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              }
            }
          );

          if (roleResponse.ok) {
            const roleData = await roleResponse.json();
            const role = roleData.data;

            // Lấy access records (role → policies)
            const accessResponse = await fetch(
              `${directusUrl}/access?filter[role][_eq]=${roleId}&limit=-1`,
              {
                headers: {
                  'Authorization': `Bearer ${token}`,
                  'Content-Type': 'application/json'
                }
              }
            );

            const policiesWithPerms: PolicyWithPermissions[] = [];

            if (accessResponse.ok) {
              const accessData = await accessResponse.json();
              const accessRecords = accessData.data || [];
              const policyIds = accessRecords.map((a: any) => a.policy).filter(Boolean);

              // Lấy từng policy và permissions của nó
              for (const policyId of policyIds) {
                try {
                  const policyResponse = await fetch(
                    `${directusUrl}/policies/${policyId}`,
                    {
                      headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                      }
                    }
                  );

                  if (policyResponse.ok) {
                    const policyData = await policyResponse.json();
                    const policy = policyData.data;

                    if (policy.admin_access) isAdmin = true;
                    if (policy.app_access) canAccessApp = true;

                    // Lấy permissions của policy
                    const permResponse = await fetch(
                      `${directusUrl}/permissions?filter[policy][_eq]=${policyId}&limit=-1`,
                      {
                        headers: {
                          'Authorization': `Bearer ${token}`,
                          'Content-Type': 'application/json'
                        }
                      }
                    );

                    if (permResponse.ok) {
                      const permData = await permResponse.json();
                      const permissions = permData.data || [];

                      policiesWithPerms.push({
                        ...policy,
                        permissions
                      });

                      allPermissions.push(...permissions);
                    }
                  }
                } catch (error) {
                  console.error(`❌ Error fetching policy ${policyId}:`, error);
                }
              }
            }

            roleWithPermissions = {
              ...role,
              policies: policiesWithPerms,
              all_permissions: allPermissions
            };
          }
        } catch (error) {
          console.error("❌ Error fetching role data:", error);
        }
      }

      // 4. Tạo display name
      const name = user.first_name && user.last_name
        ? `${user.first_name} ${user.last_name}`
        : user.email;

      // 5. Return full identity
      const identity: UserIdentityDto = {
        ...user,
        employee,
        role: roleWithPermissions,
        name,
        permissions: allPermissions,
        is_admin: isAdmin,
        can_access_app: canAccessApp
      };

      return identity;

    } catch (error: any) {
      console.error("❌ Error getting user identity:", error);
      throw new HttpError(
        401, 
        error?.message || "Failed to get user identity", 
        "UNAUTHORIZED"
      );
    }
  }

  /**
   * Check if user has specific permission
   */
  hasPermission(identity: UserIdentityDto, action: string, collection: string): boolean {
    if (identity.is_admin) return true;
    if (!identity.permissions || identity.permissions.length === 0) return false;

    return identity.permissions.some(perm => 
      perm.action === action && perm.collection === collection
    );
  }

  /**
   * Check if user has any of the specified permissions
   */
  hasAnyPermission(identity: UserIdentityDto, requiredPerms: Array<{ action: string, collection: string }>): boolean {
    if (identity.is_admin) return true;

    return requiredPerms.some(req => 
      this.hasPermission(identity, req.action, req.collection)
    );
  }

  /**
   * Check if user has all of the specified permissions
   */
  hasAllPermissions(identity: UserIdentityDto, requiredPerms: Array<{ action: string, collection: string }>): boolean {
    if (identity.is_admin) return true;

    return requiredPerms.every(req => 
      this.hasPermission(identity, req.action, req.collection)
    );
  }

  /**
   * Get permissions by collection
   */
  getCollectionPermissions(identity: UserIdentityDto, collection: string): Permission[] {
    if (!identity.permissions) return [];
    
    return identity.permissions.filter(perm => perm.collection === collection);
  }

  /**
   * Get allowed actions for a collection
   */
  getAllowedActions(identity: UserIdentityDto, collection: string): string[] {
    if (identity.is_admin) return ['create', 'read', 'update', 'delete'];

    const perms = this.getCollectionPermissions(identity, collection);
    return [...new Set(perms.map(p => p.action))];
  }
}

export default new AuthService();
