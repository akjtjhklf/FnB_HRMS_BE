import { DirectusRepository } from "../../core/directus.repository";
import { Role, ROLES_COLLECTION } from "./role.model";
import { 
  readRoles, 
  createRole, 
  updateRole, 
  deleteRole,
  readRole
} from "@directus/sdk";
import { PaginationQueryDto, PaginatedResponse } from "../../core/dto/pagination.dto";
import { HttpError } from "../../core/base";
import { Identifier } from "../../core/base";

/**
 * Repository cho bảng roles — kết nối tới Directus `roles` collection
 * Override các method để dùng SDK functions riêng cho roles (vì directus_roles là core collection)
 */
export class RoleRepository extends DirectusRepository<Role> {
  constructor() {
    super(ROLES_COLLECTION);
  }

  async findByName(name: string): Promise<Role | null> {
    const result = await this.findAll({
      filter: { name: { _eq: name } },
      limit: 1,
    });
    return result[0] ?? null;
  }

  /**
   * Override findAllPaginated để dùng readRoles
   */
  async findAllPaginated(
    query: PaginationQueryDto
  ): Promise<PaginatedResponse<Role>> {
    try {
      const { queryParams, page, limit, finalFilter } = this.buildPaginationQueryParams(query);

      // Debug log
      console.log(`🔍 [${this.collection}] Directus query params (readRoles):`, JSON.stringify(queryParams, null, 2));

      // Fetch data using readRoles
      const itemsReq: any = readRoles(queryParams);
      const items = await this.client.request(itemsReq);
      
      console.log(`✅ [${this.collection}] Retrieved ${items?.length || 0} items`);

      // Get total count
      const countQueryParams: any = {
        fields: ['id'],
        limit: -1,
      };

      if (finalFilter) {
        countQueryParams.filter = finalFilter;
      }

      const allIdsReq: any = readRoles(countQueryParams);
      const allIds = await this.client.request(allIdsReq);

      const total = Array.isArray(allIds) ? allIds.length : 0;
      const totalPages = Math.ceil(total / limit);

      return {
        data: (items ?? []) as Role[],
        meta: {
          page,
          limit,
          total,
          totalPages,
        },
      };
    } catch (error: any) {
      console.error("❌ Directus pagination error (roles):", error);
      throw new HttpError(
        500,
        "Không thể lấy danh sách vai trò từ Directus",
        "DIRECTUS_FETCH_ERROR",
        error
      );
    }
  }

  /**
   * Override findAll để dùng readRoles
   */
  async findAll(params?: {
    filter?: Record<string, any>;
    fields?: string[];
    sort?: string[];
    limit?: number;
  }): Promise<Role[]> {
    try {
      const queryParams = this.buildQueryParams(params);

      const resultReq: any = readRoles(queryParams);
      const result = await this.client.request(resultReq);
      return (result ?? []) as Role[];
    } catch (error: any) {
      console.error("❌ Directus findAll error (roles):", error);
      throw new HttpError(
        500,
        "Không thể lấy danh sách vai trò từ Directus",
        "DIRECTUS_FETCH_ERROR",
        error
      );
    }
  }

  /**
   * Override findById để dùng readRole
   */
  async findById(id: Identifier): Promise<Role | null> {
    try {
      const dataReq: any = readRole(id as string);
      const data = await this.client.request(dataReq);
      return data as Role;
    } catch (error: any) {
      if (error.errors?.[0]?.extensions?.code === "RECORD_NOT_FOUND") {
        return null;
      }
      throw new HttpError(
        500,
        "Không thể lấy role từ Directus",
        "DIRECTUS_READ_ERROR",
        error
      );
    }
  }

  /**
   * Override create để dùng createRole
   */
  async create(data: Partial<Role>): Promise<Role> {
    try {
      // Fix type mismatch: cast data to any to bypass strict check on optional fields
      const createReq: any = createRole(data as any);
      const created = await this.client.request(createReq);
      return created as Role;
    } catch (error: any) {
      throw new HttpError(
        500,
        "Không thể tạo mới role",
        "DIRECTUS_CREATE_ERROR",
        error
      );
    }
  }

  /**
   * Override update để dùng updateRole
   */
  async update(id: Identifier, data: Partial<Role>): Promise<Role> {
    try {
      // Fix type mismatch: cast data to any
      const updateReq: any = updateRole(id as string, data as any);
      const updated = await this.client.request(updateReq);
      return updated as Role;
    } catch (error: any) {
      throw new HttpError(
        500,
        "Không thể cập nhật role",
        "DIRECTUS_UPDATE_ERROR",
        error
      );
    }
  }

  /**
   * Override delete để dùng deleteRole
   */
  async delete(id: Identifier): Promise<void> {
    try {
      const deleteReq: any = deleteRole(id as string);
      await this.client.request(deleteReq);
      
      console.log(`✅ Deleted role ${id} successfully`);
    } catch (error: any) {
      console.error(`❌ Delete error for role ${id}:`, error);
      throw new HttpError(
        500,
        "Không thể xóa role",
        "DIRECTUS_DELETE_ERROR",
        error
      );
    }
  }
}

export default RoleRepository;
