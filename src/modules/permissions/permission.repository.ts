import { DirectusRepository } from "../../core/directus.repository";
import { Permission, PERMISSIONS_COLLECTION } from "./permission.model";
import { 
  createPermission, 
  deletePermission, 
  readPermissions, 
  readPermission, 
  updatePermission 
} from "@directus/sdk";
import { PaginationQueryDto, PaginatedResponse } from "../../core/dto/pagination.dto";
import { HttpError } from "../../core/base";
import { Identifier } from "../../core/base";

/**
 * Repository quyền — kết nối tới Directus `permissions` collection
 */
export class PermissionRepository extends DirectusRepository<Permission> {
  constructor() {
    super(PERMISSIONS_COLLECTION);
  }

  async findByPolicy(policyId: string): Promise<Permission[]> {
    return await this.findAll({
      filter: { policy: { _eq: policyId } },
    });
  }

  /**
   * Override findAllPaginated để dùng readPermissions
   */
  async findAllPaginated(
    query: PaginationQueryDto
  ): Promise<PaginatedResponse<Permission>> {
    try {
      const { queryParams, page, limit, finalFilter } = this.buildPaginationQueryParams(query);

      // Debug log
      console.log(`🔍 [${this.collection}] Directus query params (readPermissions):`, JSON.stringify(queryParams, null, 2));

      // Fetch data using readPermissions
      const itemsReq: any = readPermissions(queryParams);
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

      const allIdsReq: any = readPermissions(countQueryParams);
      const allIds = await this.client.request(allIdsReq);

      const total = Array.isArray(allIds) ? allIds.length : 0;
      const totalPages = Math.ceil(total / limit);

      return {
        data: (items ?? []) as Permission[],
        meta: {
          page,
          limit,
          total,
          totalPages,
        },
      };
    } catch (error: any) {
      console.error("❌ Directus pagination error (permissions):", error);
      throw new HttpError(
        500,
        "Không thể lấy danh sách permissions từ Directus",
        "DIRECTUS_FETCH_ERROR",
        error
      );
    }
  }

  /**
   * Override findAll để dùng readPermissions
   */
  async findAll(params?: {
    filter?: Record<string, any>;
    fields?: string[];
    sort?: string[];
    limit?: number;
  }): Promise<Permission[]> {
    try {
      const queryParams = this.buildQueryParams(params);

      const resultReq: any = readPermissions(queryParams);
      const result = await this.client.request(resultReq);
      return (result ?? []) as Permission[];
    } catch (error: any) {
      console.error("❌ Directus findAll error (permissions):", error);
      throw new HttpError(
        500,
        "Không thể lấy danh sách permissions từ Directus",
        "DIRECTUS_FETCH_ERROR",
        error
      );
    }
  }

  /**
   * Override findById để dùng readPermission
   */
  async findById(id: Identifier): Promise<Permission | null> {
    try {
      // Permission ID is number
      const dataReq: any = readPermission(Number(id));
      const data = await this.client.request(dataReq);
      return data as Permission;
    } catch (error: any) {
      if (error.errors?.[0]?.extensions?.code === "RECORD_NOT_FOUND") {
        return null;
      }
      throw new HttpError(
        500,
        "Không thể lấy permission từ Directus",
        "DIRECTUS_READ_ERROR",
        error
      );
    }
  }

  /**
   * Override create để dùng createPermission
   */
  async create(data: Partial<Permission>): Promise<Permission> {
    try {
      const createReq: any = createPermission(data as any);
      const created = await this.client.request(createReq);
      return created as Permission;
    } catch (error: any) {
      throw new HttpError(
        500,
        "Không thể tạo mới permission",
        "DIRECTUS_CREATE_ERROR",
        error
      );
    }
  }

  /**
   * Override update để dùng updatePermission
   */
  async update(id: Identifier, data: Partial<Permission>): Promise<Permission> {
    try {
      const updateReq: any = updatePermission(Number(id), data as any);
      const updated = await this.client.request(updateReq);
      return updated as Permission;
    } catch (error: any) {
      throw new HttpError(
        500,
        "Không thể cập nhật permission",
        "DIRECTUS_UPDATE_ERROR",
        error
      );
    }
  }

  /**
   * Override delete để dùng deletePermission
   */
  async delete(id: Identifier): Promise<void> {
    try {
      const deleteReq: any = deletePermission(Number(id));
      await this.client.request(deleteReq);
      
      console.log(`✅ Deleted permission ${id} successfully`);
    } catch (error: any) {
      console.error(`❌ Delete error for permission ${id}:`, error);
      throw new HttpError(
        500,
        "Không thể xóa permission",
        "DIRECTUS_DELETE_ERROR",
        error
      );
    }
  }
}

export default PermissionRepository;
