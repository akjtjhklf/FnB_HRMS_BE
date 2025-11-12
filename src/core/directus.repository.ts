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

/**
 * Generic repository làm việc với Directus SDK
 */
export class DirectusRepository<
  T extends { id?: Identifier },
> extends BaseRepository<T> {
  constructor(collection: string) {
    super(collection);
  }

  /**
   * Lấy tất cả items (hỗ trợ filter/sort/fields)
   */
  async findAll(params?: {
    filter?: Record<string, any>;
    fields?: string[];
    sort?: string[];
    limit?: number;
  }): Promise<T[]> {
    try {
      const result = await directus.request(
        readItems(this.collection, {
          limit: params?.limit ?? -1,
          filter: params?.filter,
          fields: params?.fields,
          sort: params?.sort,
        })
      );
      return (result ?? []) as T[];
    } catch (error: any) {
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
      const data = await directus.request(readItem(this.collection, id));
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
      const created = await directus.request(createItem(this.collection, data));
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
      const updated = await directus.request(
        updateItem(this.collection, id, data)
      );
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
      await directus.request(deleteItem(this.collection, id));
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
      const created = await directus.request(createItems(this.collection, data));
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
      await directus.request(deleteItems(this.collection, ids));
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
