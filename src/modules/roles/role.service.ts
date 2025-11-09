import { BaseService, HttpError } from "../../core/base";
import { Role } from "./role.model";
import RoleRepository from "./role.repository";

export class RoleService extends BaseService<Role> {
  // 👇 Khai báo đúng kiểu cho repo
  declare repo: RoleRepository;

  constructor(repo = new RoleRepository()) {
    super(repo);
  }

  async list(query?: Record<string, unknown>) {
    return await this.repo.findAll(query);
  }

  async get(id: number | string) {
    const role = await this.repo.findById(id);
    if (!role)
      throw new HttpError(404, "Không tìm thấy role", "ROLE_NOT_FOUND");
    return role;
  }

  async create(data: Partial<Role>) {
    // ✅ Lúc này this.repo đã hiểu là RoleRepository
    const existing = await this.repo.findByName(String(data.name));
    if (existing) throw new HttpError(409, "Role đã tồn tại", "ROLE_CONFLICT");
    return await this.repo.create(data);
  }

  async update(id: number | string, data: Partial<Role>) {
    const role = await this.repo.findById(id);
    if (!role)
      throw new HttpError(404, "Không tìm thấy role", "ROLE_NOT_FOUND");
    return await this.repo.update(id, data);
  }

  async remove(id: number | string) {
    const role = await this.repo.findById(id);
    if (!role)
      throw new HttpError(404, "Không tìm thấy role", "ROLE_NOT_FOUND");
    await this.repo.delete(id);
  }
}

export default RoleService;
