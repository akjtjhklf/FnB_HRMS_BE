import { BaseService, HttpError } from "../../core/base";
import { ShiftPositionRequirement } from "./shift-position-requirement.model";
import ShiftPositionRequirementRepository from "./shift-position-requirement.repository";
import { DirectusRepository, PaginatedResponse } from "../../core/directus.repository";
import { PaginationQueryDto } from "../../core/dto/pagination.dto";

export class ShiftPositionRequirementService extends BaseService<ShiftPositionRequirement> {
  constructor(repo = new ShiftPositionRequirementRepository()) {
    super(repo);
  }

  async list(query?: Record<string, unknown>): Promise<ShiftPositionRequirement[]> {
    // Trả về array, không phân trang
    return await this.repo.findAll(query as any);
  }

   async listPaginated(
    query: PaginationQueryDto
  ): Promise<PaginatedResponse<ShiftPositionRequirement>> {
    return await (
      this.repo as ShiftPositionRequirementRepository
    ).findAllPaginated(query);
  }

  async get(id: string) {
    const item = await this.repo.findById(id);
    if (!item)
      throw new HttpError(
        404,
        "Không tìm thấy yêu cầu vị trí ca làm",
        "SHIFT_POSITION_REQUIREMENT_NOT_FOUND"
      );
    return item;
  }

  async create(data: Partial<ShiftPositionRequirement>) {
    return await this.repo.create(data);
  }

  async update(id: string, data: Partial<ShiftPositionRequirement>) {
    const existing = await this.repo.findById(id);
    if (!existing)
      throw new HttpError(
        404,
        "Không tìm thấy yêu cầu vị trí ca làm",
        "SHIFT_POSITION_REQUIREMENT_NOT_FOUND"
      );

    return await this.repo.update(id, data);
  }

  async remove(id: string) {
    const existing = await this.repo.findById(id);
    if (!existing)
      throw new HttpError(
        404,
        "Không tìm thấy yêu cầu vị trí ca làm",
        "SHIFT_POSITION_REQUIREMENT_NOT_FOUND"
      );

    await this.repo.delete(id);
  }
}

export default ShiftPositionRequirementService;
