import { BaseService, HttpError } from "../../core/base";
import {
  PaginatedResponse,
  PaginationQueryDto,
} from "../../core/dto/pagination.dto";
import { SalaryScheme } from "./salary-scheme.model";
import SalarySchemeRepository from "./salary-scheme.repository";

export class SalarySchemeService extends BaseService<SalaryScheme> {
  constructor(repo = new SalarySchemeRepository()) {
    super(repo);
  }

  /**
   * Lấy danh sách chế độ lương
   */
  async list(query?: Record<string, unknown>) {
    return await this.repo.findAll(query);
  }

  async listPaginated(
    query: PaginationQueryDto
  ): Promise<PaginatedResponse<SalaryScheme>> {
    return await (this.repo as SalarySchemeRepository).findAllPaginated(query);
  }

  /**
   * Lấy chi tiết chế độ lương
   */
  async get(id: number | string) {
    const scheme = await this.repo.findById(id);
    if (!scheme)
      throw new HttpError(
        404,
        "Không tìm thấy chế độ lương",
        "SCHEME_NOT_FOUND"
      );
    return scheme;
  }

  /**
   * Tạo chế độ lương mới
   */
  async create(data: Partial<SalaryScheme>) {
    const existing = await (this.repo as SalarySchemeRepository).findByName(
      data.name!
    );
    if (existing)
      throw new HttpError(409, "Tên chế độ lương đã tồn tại", "NAME_CONFLICT");

    return await this.repo.create(data);
  }

  /**
   * Cập nhật chế độ lương
   */
  async update(id: number | string, data: Partial<SalaryScheme>) {
    const scheme = await this.repo.findById(id);
    if (!scheme)
      throw new HttpError(
        404,
        "Không tìm thấy chế độ lương",
        "SCHEME_NOT_FOUND"
      );

    return await this.repo.update(id, data);
  }

  /**
   * Xoá chế độ lương
   */
  async remove(id: number | string) {
    const scheme = await this.repo.findById(id);
    if (!scheme)
      throw new HttpError(
        404,
        "Không tìm thấy chế độ lương",
        "SCHEME_NOT_FOUND"
      );

    await this.repo.delete(id);
  }
}

export default SalarySchemeService;
