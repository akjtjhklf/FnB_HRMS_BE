import { BaseRepository, Identifier } from "./base";
import { directus } from "../utils/directusClient";
import {
  readItems,
  readItem,
  createItem,
  createItems,
  updateItem,
  deleteItem,
  deleteItems,
} from "@directus/sdk";
import { HttpError } from "./base";
import {
  PaginationQueryDto,
  PaginatedResponse,
  parseSortParam,
  buildSearchFilter,
  mergeFilters,
} from "./dto/pagination.dto";

/**
 * Generic repository làm việc với Directus SDK
 */
export class DirectusRepository<
  T extends { id?: Identifier },
> extends BaseRepository<T> {
  protected searchFields: string[] = []; // Override in child classes
  protected client: any;

  constructor(collection: string, client?: any) {
    super(collection);
    this.client = client || directus;
  }

  /**
   * Lấy danh sách có phân trang, filter, sort, search
   */
  async findAllPaginated(
    query: PaginationQueryDto
  ): Promise<PaginatedResponse<T>> {
    try {
      const page = Math.max(1, query.page || 1);
      const limit = Math.min(Math.max(1, query.limit || 10), 100);
      const offset = (page - 1) * limit;

      // Build search filter
      const searchFilter = buildSearchFilter(query.search, this.searchFields);
      
      // Merge custom filter with search filter
      const finalFilter = mergeFilters(query.filter, searchFilter);

      // Parse sort
      const sort = parseSortParam(query.sort);

      // Build query params - only include if they have values
      const queryParams: any = {
        limit,
        offset,
      };

      if (finalFilter) {
        queryParams.filter = finalFilter;
      }

      if (sort && sort.length > 0) {
        queryParams.sort = sort;
      }

      if (query.fields && query.fields.length > 0) {
        queryParams.fields = query.fields;
      }

      // Fetch data
      const itemsReq: any = (readItems as any)(this.collection as any, queryParams);
      const items = await this.client.request(itemsReq);

      // Get total count - only with filter if it exists
      const countQueryParams: any = {
        fields: ['id'],
        limit: -1,
      };

      if (finalFilter) {
        countQueryParams.filter = finalFilter;
      }

      const allIdsReq: any = (readItems as any)(this.collection as any, countQueryParams);
      const allIds = await this.client.request(allIdsReq);

      const total = Array.isArray(allIds) ? allIds.length : 0;
      const totalPages = Math.ceil(total / limit);

      return {
        data: (items ?? []) as T[],
        meta: {
          page,
          limit,
          total,
          totalPages,
        },
      };
    } catch (error: any) {
      console.error("❌ Directus pagination error:", error);
      throw new HttpError(
        500,
        "Không thể lấy danh sách dữ liệu từ Directus",
        "DIRECTUS_FETCH_ERROR",
        error
      );
    }
  }

  /**
   * Lấy tất cả items (không phân trang)
   */
  async findAll(params?: {
    filter?: Record<string, any>;
    fields?: string[];
    sort?: string[];
    limit?: number;
  }): Promise<T[]> {
    try {
      // Build query params - only include defined values
      const queryParams: any = {};
      
      if (params?.limit !== undefined) {
        queryParams.limit = params.limit;
      } else {
        queryParams.limit = -1; // Get all by default
      }
      
      if (params?.filter) {
        queryParams.filter = params.filter;
      }
      
      if (params?.fields && params.fields.length > 0) {
        queryParams.fields = params.fields;
      }
      
      if (params?.sort && params.sort.length > 0) {
        queryParams.sort = params.sort;
      }

      const resultReq: any = (readItems as any)(this.collection as any, queryParams);
      const result = await this.client.request(resultReq);
      return (result ?? []) as T[];
    } catch (error: any) {
      console.error("❌ Directus findAll error:", error);
      throw new HttpError(
        500,
        "Không thể lấy danh sách dữ liệu từ Directus",
        "DIRECTUS_FETCH_ERROR",
        error
      );
    }
  }

  /**
   * Lấy 1 item theo ID
   */
  async findById(id: Identifier): Promise<T | null> {
    try {
      const dataReq: any = (readItem as any)(this.collection as any, id);
      const data = await this.client.request(dataReq);
      return data as T;
    } catch (error: any) {
      if (error.errors?.[0]?.extensions?.code === "RECORD_NOT_FOUND") {
        return null;
      }
      throw new HttpError(
        500,
        "Không thể lấy dữ liệu từ Directus",
        "DIRECTUS_READ_ERROR",
        error
      );
    }
  }

  /**
   * Tạo mới item
   */
  async create(data: Partial<T>): Promise<T> {
    try {
      const createReq: any = (createItem as any)(this.collection as any, data);
      const created = await this.client.request(createReq);
      return created as T;
    } catch (error: any) {
      throw new HttpError(
        500,
        "Không thể tạo mới dữ liệu",
        "DIRECTUS_CREATE_ERROR",
        error
      );
    }
  }

  /**
   * Cập nhật item
   */
  async update(id: Identifier, data: Partial<T>): Promise<T> {
    try {
      const updateReq: any = (updateItem as any)(this.collection as any, id, data);
      const updated = await this.client.request(updateReq);
      return updated as T;
    } catch (error: any) {
      throw new HttpError(
        500,
        "Không thể cập nhật dữ liệu",
        "DIRECTUS_UPDATE_ERROR",
        error
      );
    }
  }

  /**
   * Xóa item
   */
  async delete(id: Identifier): Promise<void> {
    try {
      const deleteReq: any = (deleteItem as any)(this.collection as any, id);
      await this.client.request(deleteReq);
    } catch (error: any) {
      throw new HttpError(
        500,
        "Không thể xóa dữ liệu",
        "DIRECTUS_DELETE_ERROR",
        error
      );
    }
  }

  /**
   * Tạo nhiều items cùng lúc
   */
  async createMany(data: Partial<T>[]): Promise<T[]> {
    try {
      const createManyReq: any = (createItems as any)(this.collection as any, data);
      const created = await this.client.request(createManyReq);
      return created as T[];
    } catch (error: any) {
      throw new HttpError(
        500,
        "Không thể tạo nhiều dữ liệu",
        "DIRECTUS_CREATE_MANY_ERROR",
        error
      );
    }
  }

  /**
   * Xóa nhiều items theo filter
   */
  async deleteMany(params: { filter?: Record<string, any> }): Promise<void> {
    try {
      // Lấy danh sách IDs cần xóa
      const items = await this.findAll({
        filter: params.filter,
        fields: ["id"],
      });
      
      if (items.length === 0) return;

      const ids = items.map((item: any) => item.id);
      const deleteManyReq: any = (deleteItems as any)(this.collection as any, ids);
      await this.client.request(deleteManyReq);
    } catch (error: any) {
      throw new HttpError(
        500,
        "Không thể xóa nhiều dữ liệu",
        "DIRECTUS_DELETE_MANY_ERROR",
        error
      );
    }
  }

  /**
   * Alias cho findAll (để tương thích với code cũ)
   */
  async findMany(params?: {
    filter?: Record<string, any>;
    fields?: string[];
    sort?: string[];
    limit?: number;
  }): Promise<T[]> {
    return this.findAll(params);
  }

  /**
   * Tìm một item theo filter
   */
  async findOne(params: {
    filter?: Record<string, any>;
    fields?: string[];
  }): Promise<T | null> {
    try {
      const result = await this.findAll({
        ...params,
        limit: 1,
      });
      return result.length > 0 ? result[0] : null;
    } catch (error: any) {
      throw new HttpError(
        500,
        "Không thể tìm dữ liệu",
        "DIRECTUS_FIND_ONE_ERROR",
        error
      );
    }
  }
}

export type { PaginatedResponse };
