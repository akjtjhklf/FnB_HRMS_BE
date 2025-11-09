import { DirectusRepository } from "../../core/directus.repository";
import { Role, ROLES_COLLECTION } from "./role.model";

/**
 * Repository cho bảng roles — kết nối tới Directus `roles` collection
 */
export class RoleRepository extends DirectusRepository<Role> {
  constructor() {
    super(ROLES_COLLECTION);
  }

  async findByName(name: string): Promise<Role | null> {
    const result = await this.findAll({
      filter: { name: { _eq: name } },
      limit: 1,
    });
    return result[0] ?? null;
  }
}

export default RoleRepository;
