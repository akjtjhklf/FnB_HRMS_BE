import { adminDirectus as directus } from "../../utils/directusClient";
import { readMe, readItems, readPolicy, readPermissions } from "@directus/sdk";
import {
  UserIdentityDto,
  RoleWithPermissions,
  PolicyWithPermissions,
} from "./auth.dto";
import { User } from "../users/user.model";
import { Employee } from "../employees/employee.model";
import { Permission } from "../permissions/permission.model";
import { HttpError } from "../../core/base";

export class AuthService {
  /**
   * Get full user identity with Employee, Role, Policies, and Permissions
   * Optimized query strategy để giảm số lượng requests
   */
  async getUserIdentity(userClient: any): Promise<UserIdentityDto> {
    try {
      console.log('🔍 getUserIdentity called');
      
      // 1. Lấy user hiện tại với role populated
      const user = (await userClient.request(
        readMe({
          fields: [
            "*",
            "role.id",
            "role.name",
            "role.icon",
            "role.description",
          ] as any,
        })
      )) as User;

      console.log(`📊 User fetched: ${user.id}, email: ${user.email}`);

      if (!user) {
        throw new HttpError(401, "User not found", "UNAUTHORIZED");
      }

      // 2. Lấy employee liên kết (nếu có) - SỬ DỤNG ADMIN TOKEN để bypass permission
      let employee: Employee | null = null;
      const directusUrl = process.env.DIRECTUS_URL || 'http://localhost:8055';
      const adminToken = process.env.DIRECTUS_TOKEN;
      
      if (user.employee_id) {
        console.log(`📊 user.employee_id exists: ${user.employee_id}`);
        try {
          // Dùng admin token để fetch employee
          const url = new URL(`${directusUrl}/items/employees`);
          url.searchParams.append('filter', JSON.stringify({ id: { _eq: user.employee_id } }));
          url.searchParams.append('fields', '*');
          url.searchParams.append('limit', '1');
          
          const response = await fetch(url.toString(), {
            headers: {
              'Authorization': `Bearer ${adminToken}`,
              'Content-Type': 'application/json',
            },
          });
          
          if (response.ok) {
            const data = await response.json();
            employee = data?.data?.[0] || null;
          }
        } catch (error) {
          console.error("❌ Error fetching employee:", error);
        }
      } else {
        // Fallback: tìm employee theo user_id - SỬ DỤNG ADMIN TOKEN
        console.log(`📊 Looking for employee with user_id: ${user.id}`);
        try {
          const url = new URL(`${directusUrl}/items/employees`);
          url.searchParams.append('filter', JSON.stringify({ user_id: { _eq: user.id } }));
          url.searchParams.append('fields', '*');
          url.searchParams.append('limit', '1');
          
          const response = await fetch(url.toString(), {
            headers: {
              'Authorization': `Bearer ${adminToken}`,
              'Content-Type': 'application/json',
            },
          });
          
          if (response.ok) {
            const data = await response.json();
            const employees = data?.data || [];
            console.log(`📊 Found ${employees.length} employees`);
            if (employees.length > 0) {
              console.log(`📊 Employee found:`, JSON.stringify(employees[0], null, 2));
            }
            employee = employees[0] || null;
          } else {
            console.error("❌ Error fetching employee by user_id:", await response.text());
          }
        } catch (error) {
          console.error("❌ Error fetching employee by user_id:", error);
        }
      }

      // 3. Lấy role với policies và permissions (nếu user có role)
      let roleWithPermissions: RoleWithPermissions | null = null;
      let allPermissions: Permission[] = [];
      let isAdmin = false;
      let canAccessApp = false;

      if (user.role && typeof user.role === "object") {
        const roleId = (user.role as any).id;

        try {
          // Lấy policies của role (Directus v11: role → policies là many-to-many)
          // Sử dụng directus_access table để lấy policy_id của role
          // Use fetch instead of readItems for core collection - DÙNG ADMIN TOKEN
          const directusUrl = process.env.DIRECTUS_URL || 'http://localhost:8055';
          const adminToken = process.env.DIRECTUS_TOKEN; // Admin token
          
          if (!adminToken) {
            throw new Error('No admin token configured');
          }

          const url = new URL(`${directusUrl}/access`);
          url.searchParams.append('filter', JSON.stringify({ role: { _eq: roleId } }));
          url.searchParams.append('fields', 'policy');
          
          const response = await fetch(url.toString(), {
            headers: {
              'Authorization': `Bearer ${adminToken}`,
              'Content-Type': 'application/json',
            },
          });

          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${await response.text()}`);
          }

          const accessData = await response.json();

          const accessRecords = accessData?.data || [];
          const policyIds =
            accessRecords?.map((a: any) => a.policy).filter(Boolean) || [];

          // Lấy chi tiết các policies
          const policiesWithPerms: PolicyWithPermissions[] = [];

          for (const policyId of policyIds) {
            try {
              // Use SDK method for policies - SỬ DỤNG ADMIN CLIENT
              const policy = await directus.request(
                readPolicy(policyId, {
                  fields: ['*'],
                })
              );
              
              if (!policy) continue;

              // Check admin access
              if (policy.admin_access) isAdmin = true;
              if (policy.app_access) canAccessApp = true;

              // Use SDK method for permissions - SỬ DỤNG ADMIN CLIENT
              const permissions = await directus.request(
                readPermissions({
                  filter: { policy: { _eq: policyId } },
                  fields: ['*'],
                  limit: -1,
                })
              );

              policiesWithPerms.push({
                ...policy,
                permissions: (permissions || []) as any[],
              } as PolicyWithPermissions);

              // Aggregate permissions
              if (permissions) {
                allPermissions.push(...(permissions as any[]));
              }
            } catch (error) {
              console.error(`❌ Error fetching policy ${policyId}:`, error);
            }
          }

          roleWithPermissions = {
            ...user.role,
            policies: policiesWithPerms,
            all_permissions: allPermissions,
          } as RoleWithPermissions;
        } catch (error) {
          console.error("❌ Error fetching role policies:", error);
          roleWithPermissions = user.role as RoleWithPermissions;
        }
      }

      // 4. Lấy policies assigned directly cho User (nếu có) - DÙNG ADMIN TOKEN
      try {
        const directusUrl = process.env.DIRECTUS_URL || 'http://localhost:8055';
        const adminToken = process.env.DIRECTUS_TOKEN; // Admin token
        
        if (adminToken) {
          const url = new URL(`${directusUrl}/access`);
          url.searchParams.append('filter', JSON.stringify({ user: { _eq: user.id } }));
          url.searchParams.append('fields', 'policy');
          
          const response = await fetch(url.toString(), {
            headers: {
              'Authorization': `Bearer ${adminToken}`,
              'Content-Type': 'application/json',
            },
          });

          if (response.ok) {
            const accessData = await response.json();
            const accessRecords = accessData?.data || [];
            const userPolicyIds = accessRecords?.map((a: any) => a.policy).filter(Boolean) || [];

            for (const policyId of userPolicyIds) {
              try {
                // DÙNG ADMIN CLIENT
                const policy = await directus.request(
                  readPolicy(policyId, { fields: ['*'] })
                );
                
                if (!policy) continue;

                if (policy.admin_access) isAdmin = true;
                if (policy.app_access) canAccessApp = true;

                // DÙNG ADMIN CLIENT
                const permissions = await directus.request(
                  readPermissions({
                    filter: { policy: { _eq: policyId } },
                    fields: ['*'],
                    limit: -1,
                  })
                );

                if (permissions) {
                  allPermissions.push(...(permissions as any[]));
                }
              } catch (error) {
                console.error(`❌ Error fetching user policy ${policyId}:`, error);
              }
            }
          }
        }
      } catch (error) {
        console.error("❌ Error fetching user policies:", error);
      }

      // 4. Tạo display name
      const name =
        user.first_name && user.last_name
          ? `${user.first_name} ${user.last_name}`
          : user.email;

      const identity: UserIdentityDto = {
        ...user,
        employee,
        role: roleWithPermissions,
        name,
        permissions: allPermissions,
        is_admin: isAdmin,
        can_access_app: canAccessApp,
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
   * Format: action:collection (e.g., "read:employees", "create:shifts")
   */
  hasPermission(
    identity: UserIdentityDto,
    action: string,
    collection: string
  ): boolean {
    if (identity.is_admin) return true;
    if (!identity.permissions || identity.permissions.length === 0)
      return false;
    return identity.permissions.some(
      (perm) => perm.action === action && perm.collection === collection
    );
  }

  /**
   * Check if user has any of the specified permissions
   */
  hasAnyPermission(
    identity: UserIdentityDto,
    requiredPerms: Array<{ action: string; collection: string }>
  ): boolean {
    if (identity.is_admin) return true;

    return requiredPerms.some((req) =>
      this.hasPermission(identity, req.action, req.collection)
    );
  }

  /**
   * Check if user has all of the specified permissions
   */
  hasAllPermissions(
    identity: UserIdentityDto,
    requiredPerms: Array<{ action: string; collection: string }>
  ): boolean {
    if (identity.is_admin) return true;

    return requiredPerms.every((req) =>
      this.hasPermission(identity, req.action, req.collection)
    );
  }

  /**
   * Get permissions by collection
   */
  getCollectionPermissions(
    identity: UserIdentityDto,
    collection: string
  ): Permission[] {
    if (!identity.permissions) return [];

    return identity.permissions.filter(
      (perm) => perm.collection === collection
    );
  }

  /**
   * Get allowed actions for a collection
   */
  getAllowedActions(identity: UserIdentityDto, collection: string): string[] {
    if (identity.is_admin) return ["create", "read", "update", "delete"];

    const perms = this.getCollectionPermissions(identity, collection);
    return [...new Set(perms.map((p) => p.action))];
  }
}

export default new AuthService();
