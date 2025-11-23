import { BaseService, HttpError } from "../../core/base";
import { Position } from "./position.model";
import PositionRepository from "./position.repository";
import { PaginationQueryDto, PaginatedResponse } from "../../core/dto/pagination.dto";

export class PositionService extends BaseService<Position> {
  constructor(repo = new PositionRepository()) {
    super(repo);
  }

  async listPaginated(query: PaginationQueryDto): Promise<PaginatedResponse<Position>> {
    return await (this.repo as PositionRepository).findAllPaginated(query);
  }

  /**
   * Lấy danh sách vị trí công việc
   */
  async list(query?: Record<string, unknown>) {
    return await this.repo.findAll(query);
  }

  /**
   * Lấy chi tiết theo ID
   */
  async get(id: number | string) {
    const position = await this.repo.findById(id);
    if (!position)
      throw new HttpError(404, "Không tìm thấy vị trí", "POSITION_NOT_FOUND");
    return position;
  }

  /**
   * Tạo vị trí mới
   */
  async create(data: Partial<Position>) {
    const existing = await (this.repo as PositionRepository).findByName(
      data.name!
    );
    if (existing)
      throw new HttpError(409, "Tên vị trí đã tồn tại", "NAME_CONFLICT");

    return await this.repo.create(data);
  }

  /**
   * Cập nhật vị trí
   */
  async update(id: number | string, data: Partial<Position>) {
    const position = await this.repo.findById(id);
    if (!position)
      throw new HttpError(404, "Không tìm thấy vị trí", "POSITION_NOT_FOUND");

    return await this.repo.update(id, data);
  }

  // remove() method được kế thừa từ BaseService với cascade delete tự động
}

export default PositionService;
