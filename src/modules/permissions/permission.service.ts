import { BaseService, HttpError } from "../../core/base";
import {
  PaginatedResponse,
  PaginationQueryDto,
} from "../../core/dto/pagination.dto";
import { Permission } from "./permission.model";
import PermissionRepository from "./permission.repository";

export class PermissionService extends BaseService<Permission> {
  constructor(repo = new PermissionRepository()) {
    super(repo);
  }

  async list(query?: Record<string, unknown>) {
    return await this.repo.findAll(query);
  }
  async listPaginated(
    query: PaginationQueryDto
  ): Promise<PaginatedResponse<Permission>> {
    return await (this.repo as PermissionRepository).findAllPaginated(query);
  }
  async get(id: number | string) {
    const permission = await this.repo.findById(id);
    if (!permission)
      throw new HttpError(404, "Không tìm thấy quyền", "PERMISSION_NOT_FOUND");
    return permission;
  }

  async create(data: Partial<Permission>) {
    return await this.repo.create(data);
  }

  async update(id: number | string, data: Partial<Permission>) {
    const permission = await this.repo.findById(id);
    if (!permission)
      throw new HttpError(404, "Không tìm thấy quyền", "PERMISSION_NOT_FOUND");

    return await this.repo.update(id, data);
  }

  async remove(id: number | string) {
    const permission = await this.repo.findById(id);
    if (!permission)
      throw new HttpError(404, "Không tìm thấy quyền", "PERMISSION_NOT_FOUND");

    await this.repo.delete(id);
  }
}

export default PermissionService;
