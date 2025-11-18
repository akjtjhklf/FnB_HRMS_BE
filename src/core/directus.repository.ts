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
import { getRelatedCollections } from "../config/relationships.config";

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
      const page = Math.max(1, Number(query.page) || 1);
      const limit = Math.min(Math.max(1, Number(query.limit) || 10), 100);
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
   * Xóa cascade tất cả records liên quan đến item này (recursive)
   */
  private async deleteCascade(id: Identifier, depth: number = 0, visited: Set<string> = new Set()): Promise<void> {
    // Prevent infinite loops - max depth 10
    if (depth > 10) {
      console.warn(`⚠️  Max cascade depth reached for ${this.collection}:${id}`);
      return;
    }

    // Prevent circular references
    const visitKey = `${this.collection}:${id}`;
    if (visited.has(visitKey)) {
      return;
    }
    visited.add(visitKey);

    const relatedCollections = getRelatedCollections(this.collection);
    
    if (relatedCollections.length === 0) {
      return; // No related collections, skip
    }

    const indent = '  '.repeat(depth);
    if (depth === 0) {
      console.log(`${indent}🗑️  Starting cascade delete for ${this.collection}:${id}`);
    }

    // Group by collection để deduplicate
    const collectionGroups = new Map<string, string[]>();
    
    for (const { collection, field } of relatedCollections) {
      if (!collectionGroups.has(collection)) {
        collectionGroups.set(collection, []);
      }
      collectionGroups.get(collection)!.push(field);
    }

    // Xóa tất cả records liên quan trong từng collection
    for (const [collection, fields] of collectionGroups) {
      try {
        // Build filter với OR cho tất cả các foreign key fields
        const orFilters = fields.map(field => ({ [field]: { _eq: id } }));
        const filter = orFilters.length > 1 ? { _or: orFilters } : orFilters[0];

        // Tìm tất cả records có foreign key trỏ đến item này
        const relatedItems: any = await this.client.request(
          (readItems as any)(collection, {
            filter,
            fields: ['id'],
            limit: -1,
          })
        );

        if (relatedItems && relatedItems.length > 0) {
          // Deduplicate IDs
          const relatedIds = [...new Set(relatedItems.map((item: any) => item.id))];
          console.log(`${indent}   → Deleting ${relatedIds.length} records from ${collection}`);
          
          // Tạo temporary repository cho collection này để xóa recursively
          const childRepo = new DirectusRepository(collection, this.client);
          
          // Xóa cascade cho từng child record (recursive)
          for (const childId of relatedIds) {
            await childRepo.deleteCascade(childId as Identifier, depth + 1, visited);
          }
          
          // Sau đó xóa tất cả child records
          await this.client.request(
            (deleteItems as any)(collection, relatedIds)
          );
        }
      } catch (error: any) {
        console.error(`${indent}   ❌ Failed to delete from ${collection}:`, error?.message || error);
        if (error?.errors) {
          console.error(`${indent}      Details:`, JSON.stringify(error.errors, null, 2));
        }
        // Continue with other collections even if one fails
      }
    }
  }

  /**
   * Xóa item (với cascade delete tự động)
   */
  async delete(id: Identifier): Promise<void> {
    try {
      // Xóa cascade các records liên quan trước
      await this.deleteCascade(id);
      
      // Sau đó xóa record chính
      const deleteReq: any = (deleteItem as any)(this.collection as any, id);
      await this.client.request(deleteReq);
      
      console.log(`✅ Deleted ${this.collection}:${id} successfully`);
    } catch (error: any) {
      console.error(`❌ Delete error for ${this.collection}:${id}:`, error);
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
   * Xóa nhiều items theo filter (với cascade delete tự động)
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
      
      console.log(`🗑️  Deleting ${ids.length} items from ${this.collection} with cascade`);
      
      // Xóa cascade cho từng item
      for (const id of ids) {
        await this.deleteCascade(id);
      }
      
      // Sau đó xóa tất cả records chính
      const deleteManyReq: any = (deleteItems as any)(this.collection as any, ids);
      await this.client.request(deleteManyReq);
      
      console.log(`✅ Deleted ${ids.length} items from ${this.collection} successfully`);
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
