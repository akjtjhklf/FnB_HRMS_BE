import { DirectusRepository } from "../../core/directus.repository";
import { Policy, POLICIES_COLLECTION } from "./policy.model";
import { PaginationQueryDto, PaginatedResponse } from "../../core/dto/pagination.dto";
import { HttpError } from "../../core/base";
import { Identifier } from "../../core/base";
import { createPolicy, deletePolicy, readPolicies, readPolicy, updatePolicy } from "@directus/sdk";



/**
 * Repository cho bảng policies — kết nối tới Directus `policies` collection
 */
export class PolicyRepository extends DirectusRepository<Policy> {
  constructor() {
    super(POLICIES_COLLECTION);
  }

  /**
   * Override findAllPaginated để dùng readPolicies
   */
  async findAllPaginated(
    query: PaginationQueryDto
  ): Promise<PaginatedResponse<Policy>> {
    try {
      const { queryParams, page, limit, finalFilter } = this.buildPaginationQueryParams(query);

      // Debug log
      console.log(`🔍 [${this.collection}] Directus query params (readPolicies):`, JSON.stringify(queryParams, null, 2));

      // Fetch data using readPolicies
      const itemsReq: any = readPolicies(queryParams);
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

      const allIdsReq: any = readPolicies(countQueryParams);
      const allIds = await this.client.request(allIdsReq);

      const total = Array.isArray(allIds) ? allIds.length : 0;
      const totalPages = Math.ceil(total / limit);

      return {
        data: (items ?? []) as Policy[],
        meta: {
          page,
          limit,
          total,
          totalPages,
        },
      };
    } catch (error: any) {
      console.error("❌ Directus pagination error (policies):", error);
      throw new HttpError(
        500,
        "Không thể lấy danh sách policies từ Directus",
        "DIRECTUS_FETCH_ERROR",
        error
      );
    }
  }

  /**
   * Override findAll để dùng readPolicies
   */
  async findAll(params?: {
    filter?: Record<string, any>;
    fields?: string[];
    sort?: string[];
    limit?: number;
  }): Promise<Policy[]> {
    try {
      const queryParams = this.buildQueryParams(params);

      const resultReq: any = readPolicies(queryParams);
      const result = await this.client.request(resultReq);
      return (result ?? []) as Policy[];
    } catch (error: any) {
      console.error("❌ Directus findAll error (policies):", error);
      throw new HttpError(
        500,
        "Không thể lấy danh sách policies từ Directus",
        "DIRECTUS_FETCH_ERROR",
        error
      );
    }
  }

  /**
   * Override findById để dùng readPolicy
   */
  async findById(id: Identifier): Promise<Policy | null> {
    try {
      const dataReq: any = readPolicy(id as string);
      const data = await this.client.request(dataReq);
      return data as Policy;
    } catch (error: any) {
      if (error.errors?.[0]?.extensions?.code === "RECORD_NOT_FOUND") {
        return null;
      }
      throw new HttpError(
        500,
        "Không thể lấy policy từ Directus",
        "DIRECTUS_READ_ERROR",
        error
      );
    }
  }

  /**
   * Override create để dùng createPolicy
   */
  async create(data: Partial<Policy>): Promise<Policy> {
    try {
      const createReq: any = createPolicy(data);
      const created = await this.client.request(createReq);
      return created as Policy;
    } catch (error: any) {
      throw new HttpError(
        500,
        "Không thể tạo mới policy",
        "DIRECTUS_CREATE_ERROR",
        error
      );
    }
  }

  /**
   * Override update để dùng updatePolicy
   */
  async update(id: Identifier, data: Partial<Policy>): Promise<Policy> {
    try {
      const updateReq: any = updatePolicy(id as string, data);
      const updated = await this.client.request(updateReq);
      return updated as Policy;
    } catch (error: any) {
      throw new HttpError(
        500,
        "Không thể cập nhật policy",
        "DIRECTUS_UPDATE_ERROR",
        error
      );
    }
  }

  /**
   * Override delete để dùng deletePolicy
   */
  async delete(id: Identifier): Promise<void> {
    try {
      const deleteReq: any = deletePolicy(id as string);
      await this.client.request(deleteReq);
      
      console.log(`✅ Deleted policy ${id} successfully`);
    } catch (error: any) {
      console.error(`❌ Delete error for policy ${id}:`, error);
      throw new HttpError(
        500,
        "Không thể xóa policy",
        "DIRECTUS_DELETE_ERROR",
        error
      );
    }
  }
}

export default PolicyRepository;
