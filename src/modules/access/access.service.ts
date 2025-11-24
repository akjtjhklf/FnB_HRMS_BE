import { BaseService, HttpError } from "../../core/base";
import { AssignAccessDto } from "./access.dto";
import { directus as DirectusClient } from "../../utils/directusClient";
import { updateUser, readUser } from "@directus/sdk";

export class AccessService {
  constructor() {}

  /**
   * Assign Role to a User
   * Note: Policies should be configured per-role in Directus admin panel
   * Direct manipulation of directus_access is not supported via REST API
   */
  async assignAccess(dto: AssignAccessDto, client: any = DirectusClient) {
    const { userId, roleId } = dto;

    try {
      // Assign Role to User
      await (client as any).request(updateUser(userId, {
        role: roleId,
      }));

      // Note: policyIds are ignored - policies are inherited from the role
      // To configure role policies, use the Directus admin panel

      return { success: true };

    } catch (error: any) {
      console.error("Failed to assign  role:", error);
      throw new HttpError(500, `Failed to assign role: ${error.message}`, "ACCESS_ASSIGNMENT_FAILED");
    }
  }

  /**
   * Get current access details for a user
   */
  async getAccess(userId: string, client: any = DirectusClient) {
      try {
          const user = await (client as any).request(readUser(userId, {
              fields: ['role.*'] as any
          }));

          return {
              role: user.role,
              policies: [] // Policies are managed at role level in Directus
          };
      } catch (error: any) {
        throw new HttpError(500, "Failed to fetch access details", "FETCH_ACCESS_FAILED");
      }
  }

  /**
   * Update policies for a specific role
   * Note: In Directus, policies are managed through the directus_policies table
   * and linked to roles via directus_access
   */
  async updateRolePolicies(roleId: string, policyIds: string[], client: any = DirectusClient) {
      try {
          // Note: This is a placeholder implementation
          // Directus manages role-policy relationships through directus_access table
          // Direct API manipulation may be limited; consider using Directus admin panel
          // or custom Directus extensions for complex policy management
          
          console.warn('updateRolePolicies: Policy management should be done via Directus admin panel');
          
          return { 
              success: true, 
              message: 'Policy updates should be managed in Directus admin panel',
              roleId,
              policyIds 
          };
      } catch (error: any) {
          console.error("Failed to update role policies:", error);
          throw new HttpError(500, `Failed to update role policies: ${error.message}`, "UPDATE_ROLE_POLICIES_FAILED");
      }
  }

  /**
   * Get policies assigned to a specific role
   */
  async getRolePolicies(roleId: string, client: any = DirectusClient) {
      try {
          // Note: This is a placeholder implementation
          // In Directus, you would query the directus_access table where role = roleId
          // and retrieve associated policies
          
          console.warn('getRolePolicies: Policy retrieval should query directus_access table');
          
          return {
              roleId,
              policies: [] // Placeholder - implement actual query if needed
          };
      } catch (error: any) {
          console.error("Failed to get role policies:", error);
          throw new HttpError(500, `Failed to get role policies: ${error.message}`, "GET_ROLE_POLICIES_FAILED");
      }
  }
}

export default new AccessService();
