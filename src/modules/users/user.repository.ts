import { DirectusRepository } from "../../core/directus.repository";
import { User, USERS_COLLECTION } from "./user.model";

/**
 * Repository người dùng — kết nối tới Directus `users` collection
 */
export class UserRepository extends DirectusRepository<User> {
  protected searchFields = [
    "email",
    "first_name",
    "last_name",
    "title"
  ];

  constructor() {
    super(USERS_COLLECTION);
  }

  /**
   * Override findById to populate role information
   */
  async findById(id: string | number, fields?: string[]): Promise<User | null> {
    const result = await this.findAll({
      filter: { id: { _eq: String(id) } },
      fields: fields || ["*", "role.id", "role.name", "role.icon", "role.description", "role.admin_access", "role.app_access"],
      limit: 1,
    });
    return result[0] ?? null;
  }

  /**
   * Find by email with populated role
   */
  async findByEmail(email: string): Promise<User | null> {
    const result = await this.findAll({
      filter: { email: { _eq: email } },
      fields: ["*", "role.id", "role.name", "role.icon", "role.description", "role.admin_access", "role.app_access"],
      limit: 1,
    });
    return result[0] ?? null;
  }
}

export default UserRepository;
