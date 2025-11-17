import { BaseService, HttpError } from "../../core/base";
import { ShiftType } from "./shift-type.model";
import ShiftTypeRepository from "./shift-type.repository";
import { DirectusRepository, PaginatedResponse } from "../../core/directus.repository";

export class ShiftTypeService extends BaseService<ShiftType> {
  constructor(repo = new ShiftTypeRepository()) {
    super(repo);
  }

  async list(query?: Record<string, unknown>): Promise<ShiftType[]> {
    // Trả về array, không phân trang
    return await this.repo.findAll(query as any);
  }

  async listPaginated(query?: Record<string, unknown>): Promise<PaginatedResponse<ShiftType>> {
    // Nếu có page hoặc limit thì trả về paginated
    const paginationQuery = {
      page: query?.page ? Number(query.page) : 1,
      limit: query?.limit ? Number(query.limit) : 10,
      filter: query?.filter as any,
      sort: query?.sort as string,
      search: query?.search as string,
      fields: query?.fields as string[],
    };
    return await (this.repo as DirectusRepository<ShiftType>).findAllPaginated(paginationQuery);
  }

  async get(id: string) {
    const shift = await this.repo.findById(id);
    if (!shift)
      throw new HttpError(
        404,
        "Không tìm thấy loại ca làm việc",
        "SHIFT_TYPE_NOT_FOUND"
      );
    return shift;
  }

  async create(data: Partial<ShiftType>) {
    const existing = await (this.repo as ShiftTypeRepository).findByName(
      data.name ?? ""
    );
    if (existing)
      throw new HttpError(409, "Tên ca làm đã tồn tại", "SHIFT_TYPE_CONFLICT");

    return await this.repo.create(data);
  }

  async update(id: string, data: Partial<ShiftType>) {
    const shift = await this.repo.findById(id);
    if (!shift)
      throw new HttpError(
        404,
        "Không tìm thấy loại ca làm việc",
        "SHIFT_TYPE_NOT_FOUND"
      );

    return await this.repo.update(id, data);
  }

  async remove(id: string) {
    try {
      const shift = await this.repo.findById(id);
      if (!shift)
        throw new HttpError(
          404,
          "Không tìm thấy loại ca làm việc",
          "SHIFT_TYPE_NOT_FOUND"
        );
      await this.repo.delete(id);
      console.log("✅ Đã xóa ca làm việc:", id);
    } catch (err) {
      console.error("❌ Lỗi khi xóa ca làm việc:", err);
      throw err;
    }
  }
}

export default ShiftTypeService;
