import { BaseService, HttpError } from "../../core/base";
import { User } from "./user.model";
import UserRepository from "./user.repository";
import { PaginationQueryDto, PaginatedResponse } from "../../core/dto/pagination.dto";

export class UserService extends BaseService<User> {
  constructor(repo = new UserRepository()) {
    super(repo);
  }

  async listPaginated(query: PaginationQueryDto): Promise<PaginatedResponse<User>> {
    return await (this.repo as UserRepository).findAllPaginated(query);
  }

  /**
   * Lấy danh sách người dùng (hỗ trợ query/pagination)
   */
  async list(query?: Record<string, unknown>) {
    return await this.repo.findAll(query);
  }

  /**
   * Lấy chi tiết người dùng theo ID
   */
  async get(id: number | string) {
    const user = await this.repo.findById(id);
    if (!user)
      throw new HttpError(404, "Không tìm thấy người dùng", "USER_NOT_FOUND");
    return user;
  }

  /**
   * Tạo người dùng mới — dùng Zod để validate
   */
  async create(data: Partial<User>) {
    // ⚡ Nếu cần có logic riêng, thêm tại đây (ví dụ kiểm tra email trùng)
    const existing = await this.repo.findAll({
      filter: { email: { _eq: data.email } },
    });
    if (existing.length > 0) {
      throw new HttpError(409, "Email đã tồn tại", "EMAIL_CONFLICT");
    }

    return await this.repo.create(data);
  }

  /**
   * Cập nhật thông tin người dùng — dùng Zod để validate
   */
  async update(id: number | string, data: Partial<User>) {
    const user = await this.repo.findById(id);
    if (!user)
      throw new HttpError(404, "Không tìm thấy người dùng", "USER_NOT_FOUND");

    return await this.repo.update(id, data);
  }

  /**
   * Xoá người dùng (soft hoặc hard delete tuỳ Directus setup)
   */
  async remove(id: number | string) {
    const user = await this.repo.findById(id);
    if (!user)
      throw new HttpError(404, "Không tìm thấy người dùng", "USER_NOT_FOUND");

    await this.repo.delete(id);
  }
}

export default UserService;
