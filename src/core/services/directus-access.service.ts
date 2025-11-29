import { directus, getAuthToken } from "../../utils/directusClient";
import { createItem, createItems, readItems, deleteItem } from "@directus/sdk";
import { HttpError } from "../base";

/**
 * DirectusAccessService
 * Manages the directus_access table for role-policy and user-policy relationships
 * 
 * The directus_access table structure:
 * - id: UUID
 * - role: UUID (nullable) - references directus_roles
 * - user: UUID (nullable) - references directus_users
 * - policy: UUID - references directus_policies
 * - sort: number (nullable)
 */
export class DirectusAccessService {
  /**
   * Assign multiple policies to a role
   * Creates access records linking role to policies
   */
  async assignPoliciesToRole(
    roleId: string,
    policyIds: string[],
    client: any = directus
  ): Promise<void> {
    try {
      // Create access records for each policy
      const accessRecords = policyIds.map((policyId, index) => ({
        role: roleId,
        policy: policyId,
        sort: index + 1,
      }));

      // Use native fetch to create records
      const directusUrl = process.env.DIRECTUS_URL || 'http://localhost:8055';
      const token = await getAuthToken();
      
      if (!token) {
        throw new Error('No authentication token available');
      }

      // Create each record individually (Directus doesn't support batch create for access)
      for (const record of accessRecords) {
        const response = await fetch(`${directusUrl}/access`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(record),
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${await response.text()}`);
        }
      }
    } catch (error: any) {
      console.error("Failed to assign policies to role:", error);
      throw new HttpError(
        500,
        `Failed to assign policies to role: ${error.message}`,
        "ASSIGN_POLICIES_TO_ROLE_FAILED"
      );
    }
  }

  /**
   * Assign multiple policies to a user
   * Creates access records linking user to policies
   */
  async assignPoliciesToUser(
    userId: string,
    policyIds: string[],
    client: any = directus
  ): Promise<void> {
    try {
      // Create access records for each policy
      const accessRecords = policyIds.map((policyId, index) => ({
        user: userId,
        policy: policyId,
        sort: index + 1,
      }));

      // Use native fetch to create records
      const directusUrl = process.env.DIRECTUS_URL || 'http://localhost:8055';
      const token = await getAuthToken();
      
      if (!token) {
        throw new Error('No authentication token available');
      }

      // Create each record individually
      for (const record of accessRecords) {
        const response = await fetch(`${directusUrl}/access`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(record),
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${await response.text()}`);
        }
      }
    } catch (error: any) {
      console.error("Failed to assign policies to user:", error);
      throw new HttpError(
        500,
        `Failed to assign policies to user: ${error.message}`,
        "ASSIGN_POLICIES_TO_USER_FAILED"
      );
    }
  }

  /**
   * Get all policies assigned to a role
   */
  async getRolePolicies(
    roleId: string,
    client: any = directus
  ): Promise<any[]> {
    try {
      // Use native fetch since SDK blocks core collections
      const directusUrl = process.env.DIRECTUS_URL || 'http://localhost:8055';
      const token = await getAuthToken();
      
      if (!token) {
        throw new Error('No authentication token available');
      }

      const url = new URL(`${directusUrl}/access`);
      url.searchParams.append('filter', JSON.stringify({ role: { _eq: roleId } }));
      url.searchParams.append('fields', 'id,policy.*');
      
      const response = await fetch(url.toString(), {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${await response.text()}`);
      }

      const result = await response.json();
      const accessRecords = result.data || result;
      
      // Extract policy objects and deduplicate by ID
      const policiesMap = new Map();
      for (const record of accessRecords || []) {
        if (record.policy && !policiesMap.has(record.policy.id)) {
          // Remove unnecessary fields (users, roles arrays from reverse relationship)
          const { users, roles, ...policyData } = record.policy;
          policiesMap.set(record.policy.id, policyData);
        }
      }
      
      return Array.from(policiesMap.values());
    } catch (error: any) {
      console.error("Failed to get role policies:", error);
      throw new HttpError(
        500,
        `Failed to get role policies: ${error.message}`,
        "GET_ROLE_POLICIES_FAILED"
      );
    }
  }

  /**
   * Get all direct policies assigned to a user (not via role)
   */
  async getUserPolicies(
    userId: string,
    client: any = directus
  ): Promise<any[]> {
    try {
      // Use native fetch since SDK blocks core collections
      const directusUrl = process.env.DIRECTUS_URL || 'http://localhost:8055';
      const token = await getAuthToken();
      
      if (!token) {
        throw new Error('No authentication token available');
      }

      const url = new URL(`${directusUrl}/access`);
      url.searchParams.append('filter', JSON.stringify({ user: { _eq: userId } }));
      url.searchParams.append('fields', 'id,policy.*');
      
      const response = await fetch(url.toString(), {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${await response.text()}`);
      }

      const result = await response.json();
      const accessRecords = result.data || result;
      
      // Extract policy objects from access records
      return accessRecords?.map((record: any) => record.policy).filter(Boolean) || [];
    } catch (error: any) {
      console.error("Failed to get user policies:", error);
      throw new HttpError(
        500,
        `Failed to get user policies: ${error.message}`,
        "GET_USER_POLICIES_FAILED"
      );
    }
  }

  /**
   * Remove a specific policy from a role
   */
  async removeRolePolicy(
    roleId: string,
    policyId: string,
    client: any = directus
  ): Promise<void> {
    try {
      // Use native fetch to find access records
      const directusUrl = process.env.DIRECTUS_URL || 'http://localhost:8055';
      const token = await getAuthToken();
      
      if (!token) {
        throw new Error('No authentication token available');
      }

      const url = new URL(`${directusUrl}/access`);
      url.searchParams.append('filter', JSON.stringify({
        role: { _eq: roleId },
        policy: { _eq: policyId },
      }));
      url.searchParams.append('fields', 'id');
      
      const response = await fetch(url.toString(), {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${await response.text()}`);
      }

      const result = await response.json();
      const accessRecords = result.data || result;

      if (accessRecords && accessRecords.length > 0) {
        // Use fetch DELETE instead of SDK deleteItem
        const delDirectusUrl = process.env.DIRECTUS_URL || 'http://localhost:8055';
        const delToken = await getAuthToken();
        
        if (!delToken) {
          throw new Error('No authentication token available');
        }

        const deleteResponse = await fetch(`${delDirectusUrl}/access/${accessRecords[0].id}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${delToken}`,
          },
        });

        if (!deleteResponse.ok) {
          throw new Error(`HTTP ${deleteResponse.status}: ${await deleteResponse.text()}`);
        }
      }
    } catch (error: any) {
      console.error("Failed to remove policy from role:", error);
      throw new HttpError(
        500,
        `Failed to remove policy from role: ${error.message}`,
        "REMOVE_ROLE_POLICY_FAILED"
      );
    }
  }

  /**
   * Remove a specific policy from a user
   */
  async removeUserPolicy(
    userId: string,
    policyId: string,
    client: any = directus
  ): Promise<void> {
    try {
      // Use native fetch to find access records
      const directusUrl = process.env.DIRECTUS_URL || 'http://localhost:8055';
      const token = await getAuthToken();
      
      if (!token) {
        throw new Error('No authentication token available');
      }

      const url = new URL(`${directusUrl}/access`);
      url.searchParams.append('filter', JSON.stringify({
        user: { _eq: userId },
        policy: { _eq: policyId },
      }));
      url.searchParams.append('fields', 'id');
      
      const response = await fetch(url.toString(), {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${await response.text()}`);
      }

      const result = await response.json();
      const accessRecords = result.data || result;

      if (accessRecords && accessRecords.length > 0) {
        // Use fetch DELETE instead of SDK deleteItem
        const delDirectusUrl = process.env.DIRECTUS_URL || 'http://localhost:8055';
        const delToken = await getAuthToken();
        
        if (!delToken) {
          throw new Error('No authentication token available');
        }

        const deleteResponse = await fetch(`${delDirectusUrl}/access/${accessRecords[0].id}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${delToken}`,
          },
        });

        if (!deleteResponse.ok) {
          throw new Error(`HTTP ${deleteResponse.status}: ${await deleteResponse.text()}`);
        }
      }
    } catch (error: any) {
      console.error("Failed to remove policy from user:", error);
      throw new HttpError(
        500,
        `Failed to remove policy from user: ${error.message}`,
        "REMOVE_USER_POLICY_FAILED"
      );
    }
  }

  /**
   * Remove all policies from a role
   */
  async removeAllRolePolicies(
    roleId: string,
    client: any = directus
  ): Promise<void> {
    try {
      // Use native fetch to get all access records
      const directusUrl = process.env.DIRECTUS_URL || 'http://localhost:8055';
      const token = await getAuthToken();
      
      if (!token) {
        throw new Error('No authentication token available');
      }

      const url = new URL(`${directusUrl}/access`);
      url.searchParams.append('filter', JSON.stringify({ role: { _eq: roleId } }));
      url.searchParams.append('fields', 'id');
      url.searchParams.append('limit', '-1');
      
      const response = await fetch(url.toString(), {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${await response.text()}`);
      }

      const result = await response.json();
      const accessRecords = result.data || result;
      
      for (const record of accessRecords || []) {
        const deleteResponse = await fetch(`${directusUrl}/access/${record.id}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (!deleteResponse.ok) {
          console.error(`Failed to delete access record ${record.id}`);
        }
      }
    } catch (error: any) {
      console.error("Failed to remove all policies from role:", error);
      throw new HttpError(
        500,
        `Failed to remove all policies from role: ${error.message}`,
        "REMOVE_ALL_ROLE_POLICIES_FAILED"
      );
    }
  }

  /**
   * Replace all policies for a role (remove old + add new)
   */
  async replaceRolePolicies(
    roleId: string,
    policyIds: string[],
    client: any = directus
  ): Promise<void> {
    try {
      // 1. Get current policies to calculate diff
      const currentPolicies = await this.getRolePolicies(roleId, client);
      const currentPolicyIds = currentPolicies.map((p: any) => p.id);

      // 2. Identify policies to add and remove
      const policiesToAdd = policyIds.filter(id => !currentPolicyIds.includes(id));
      const policiesToRemove = currentPolicyIds.filter(id => !policyIds.includes(id));

      // 3. Remove policies that are no longer needed
      for (const policyId of policiesToRemove) {
        await this.removeRolePolicy(roleId, policyId, client);
      }
      
      // 4. Add new policies
      if (policiesToAdd.length > 0) {
        await this.assignPoliciesToRole(roleId, policiesToAdd, client);
      }
    } catch (error: any) {
      console.error("Failed to replace role policies:", error);
      throw new HttpError(
        500,
        `Failed to replace role policies: ${error.message}`,
        "REPLACE_ROLE_POLICIES_FAILED"
      );
    }
  }

  /**
   * Replace all policies for a user (remove old + add new)
   */
  async replaceUserPolicies(
    userId: string,
    policyIds: string[],
    client: any = directus
  ): Promise<void> {
    try {
      // 1. Get current policies to calculate diff
      const currentPolicies = await this.getUserPolicies(userId, client);
      const currentPolicyIds = currentPolicies.map((p: any) => p.id);

      // 2. Identify policies to add and remove
      const policiesToAdd = policyIds.filter(id => !currentPolicyIds.includes(id));
      const policiesToRemove = currentPolicyIds.filter(id => !policyIds.includes(id));

      // 3. Remove policies that are no longer needed
      for (const policyId of policiesToRemove) {
        await this.removeUserPolicy(userId, policyId, client);
      }
      
      // 4. Add new policies
      if (policiesToAdd.length > 0) {
        await this.assignPoliciesToUser(userId, policiesToAdd, client);
      }
    } catch (error: any) {
      console.error("Failed to replace user policies:", error);
      throw new HttpError(
        500,
        `Failed to replace user policies: ${error.message}`,
        "REPLACE_USER_POLICIES_FAILED"
      );
    }
  }
}

export default new DirectusAccessService();
