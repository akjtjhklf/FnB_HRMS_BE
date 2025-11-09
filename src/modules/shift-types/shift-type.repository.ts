import { DirectusRepository } from "../../core/directus.repository";
import { ShiftType, SHIFT_TYPES_COLLECTION } from "./shift-type.model";

export class ShiftTypeRepository extends DirectusRepository<ShiftType> {
  constructor() {
    super(SHIFT_TYPES_COLLECTION);
  }

  async findByName(name: string): Promise<ShiftType | null> {
    const result = await this.findAll({
      filter: { name: { _eq: name } },
      limit: 1,
    });
    return result[0] ?? null;
  }
}

export default ShiftTypeRepository;
