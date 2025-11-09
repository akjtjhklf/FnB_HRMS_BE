import { DirectusRepository } from "../../core/directus.repository";
import { User, USERS_COLLECTION } from "./user.model";

/**
 * Repository người dùng — kết nối tới Directus `users` collection
 */
export class UserRepository extends DirectusRepository<User> {
  constructor() {
    super(USERS_COLLECTION);
  }

  // bạn có thể thêm các hàm đặc biệt ở đây nếu cần (VD: findByEmail)
  async findByEmail(email: string): Promise<User | null> {
    const result = await this.findAll({
      filter: { email: { _eq: email } },
      limit: 1,
    });
    return result[0] ?? null;
  }
}

export default UserRepository;
