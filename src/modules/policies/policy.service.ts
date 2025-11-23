import { BaseService, HttpError } from "../../core/base";
import {
  PaginatedResponse,
  PaginationQueryDto,
} from "../../core/dto/pagination.dto";
import { Policy } from "./policy.model";
import PolicyRepository from "./policy.repository";

export class PolicyService extends BaseService<Policy> {
  declare repo: PolicyRepository;

  constructor(repo = new PolicyRepository()) {
    super(repo);
  }

  /**
   * Lấy danh sách policy
   */
  async list(query?: Record<string, unknown>) {
    return await this.repo.findAll(query);
  }
  async listPaginated(
    query: PaginationQueryDto
  ): Promise<PaginatedResponse<Policy>> {
    return await (this.repo as PolicyRepository).findAllPaginated(query);
  }
  /**
   * Lấy chi tiết policy theo ID
   */
  async get(id: number | string) {
    const policy = await this.repo.findById(id);
    if (!policy)
      throw new HttpError(404, "Không tìm thấy policy", "POLICY_NOT_FOUND");
    return policy;
  }

  /**
   * Tạo policy mới
   */
  async create(data: Partial<Policy>) {
    const existing = await this.repo.findByName(String(data.name));
    if (existing)
      throw new HttpError(409, "Policy đã tồn tại", "POLICY_CONFLICT");
    return await this.repo.create(data);
  }

  /**
   * Cập nhật policy
   */
  async update(id: number | string, data: Partial<Policy>) {
    const policy = await this.repo.findById(id);
    if (!policy)
      throw new HttpError(404, "Không tìm thấy policy", "POLICY_NOT_FOUND");

    return await this.repo.update(id, data);
  }

  /**
   * Xoá policy
   */
  async remove(id: number | string) {
    const policy = await this.repo.findById(id);
    if (!policy)
      throw new HttpError(404, "Không tìm thấy policy", "POLICY_NOT_FOUND");

    await this.repo.delete(id);
  }
}

export default PolicyService;
