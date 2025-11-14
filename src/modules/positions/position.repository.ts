import { DirectusRepository } from "../../core/directus.repository";
import { Position, POSITIONS_COLLECTION } from "./position.model";

/**
 * Repository vị trí công việc — kết nối tới Directus `positions` collection
 */
export class PositionRepository extends DirectusRepository<Position> {
  protected searchFields = ["name", "description", "code"];

  constructor() {
    super(POSITIONS_COLLECTION);
  }

  // Ví dụ: thêm hàm tìm kiếm vị trí theo tên
  async findByName(name: string): Promise<Position | null> {
    const result = await this.findAll({
      filter: { name: { _eq: name } },
      limit: 1,
    });
    return result[0] ?? null;
  }
}

export default PositionRepository;
