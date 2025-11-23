import { DirectusRepository } from "../../core/directus.repository";
import { User, USERS_COLLECTION } from "./user.model";
import { 
  readUsers, 
  createUser, 
  updateUser, 
  deleteUser,
  readUser
} from "@directus/sdk";
import { PaginationQueryDto, PaginatedResponse } from "../../core/dto/pagination.dto";
import { HttpError } from "../../core/base";
import { Identifier } from "../../core/base";

/**
 * Repository cho bảng users — kết nối tới Directus `users` collection
 */
export class UserRepository extends DirectusRepository<User> {
  constructor() {
    super(USERS_COLLECTION);
  }

  async findByEmail(email: string): Promise<User | null> {
    const result = await this.findAll({
      filter: { email: { _eq: email } },
      limit: 1,
    });
    return result[0] ?? null;
  }

  /**
   * Override findAllPaginated để dùng readUsers
   */
  async findAllPaginated(
    query: PaginationQueryDto
  ): Promise<PaginatedResponse<User>> {
    try {
      const { queryParams, page, limit, finalFilter } = this.buildPaginationQueryParams(query);

      // Debug log
      console.log(`🔍 [${this.collection}] Directus query params (readUsers):`, JSON.stringify(queryParams, null, 2));

      // Fetch data using readUsers
      const itemsReq: any = readUsers(queryParams);
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

      const allIdsReq: any = readUsers(countQueryParams);
      const allIds = await this.client.request(allIdsReq);

      const total = Array.isArray(allIds) ? allIds.length : 0;
      const totalPages = Math.ceil(total / limit);

      return {
        data: (items ?? []) as User[],
        meta: {
          page,
          limit,
          total,
          totalPages,
        },
      };
    } catch (error: any) {
      console.error("❌ Directus pagination error (users):", error);
      throw new HttpError(
        500,
        "Không thể lấy danh sách users từ Directus",
        "DIRECTUS_FETCH_ERROR",
        error
      );
    }
  }

  /**
   * Override findAll để dùng readUsers
   */
  async findAll(params?: {
    filter?: Record<string, any>;
    fields?: string[];
    sort?: string[];
    limit?: number;
  }): Promise<User[]> {
    try {
      const queryParams = this.buildQueryParams(params);

      const resultReq: any = readUsers(queryParams);
      const result = await this.client.request(resultReq);
      return (result ?? []) as User[];
    } catch (error: any) {
      console.error("❌ Directus findAll error (users):", error);
      throw new HttpError(
        500,
        "Không thể lấy danh sách users từ Directus",
        "DIRECTUS_FETCH_ERROR",
        error
      );
    }
  }

  /**
   * Override findById để dùng readUser
   */
  async findById(id: Identifier): Promise<User | null> {
    try {
      const dataReq: any = readUser(id as string);
      const data = await this.client.request(dataReq);
      return data as User;
    } catch (error: any) {
      if (error.errors?.[0]?.extensions?.code === "RECORD_NOT_FOUND") {
        return null;
      }
      throw new HttpError(
        500,
        "Không thể lấy user từ Directus",
        "DIRECTUS_READ_ERROR",
        error
      );
    }
  }

  /**
   * Override create để dùng createUser
   */
  async create(data: Partial<User>): Promise<User> {
    try {
      // Fix type mismatch: cast data to any
      const createReq: any = createUser(data as any);
      const created = await this.client.request(createReq);
      return created as User;
    } catch (error: any) {
      throw new HttpError(
        500,
        "Không thể tạo mới user",
        "DIRECTUS_CREATE_ERROR",
        error
      );
    }
  }

  /**
   * Override update để dùng updateUser
   */
  async update(id: Identifier, data: Partial<User>): Promise<User> {
    try {
      // Fix type mismatch: cast data to any
      const updateReq: any = updateUser(id as string, data as any);
      const updated = await this.client.request(updateReq);
      return updated as User;
    } catch (error: any) {
      throw new HttpError(
        500,
        "Không thể cập nhật user",
        "DIRECTUS_UPDATE_ERROR",
        error
      );
    }
  }

  /**
   * Override delete để dùng deleteUser
   */
  async delete(id: Identifier): Promise<void> {
    try {
      const deleteReq: any = deleteUser(id as string);
      await this.client.request(deleteReq);
      
      console.log(`✅ Deleted user ${id} successfully`);
    } catch (error: any) {
      console.error(`❌ Delete error for user ${id}:`, error);
      throw new HttpError(
        500,
        "Không thể xóa user",
        "DIRECTUS_DELETE_ERROR",
        error
      );
    }
  }
}

export default UserRepository;
