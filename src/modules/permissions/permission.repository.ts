import { DirectusRepository } from "../../core/directus.repository";
import { Permission, PERMISSIONS_COLLECTION } from "./permission.model";

/**
 * Repository quyền — kết nối tới Directus `permissions` collection
 */
export class PermissionRepository extends DirectusRepository<Permission> {
  constructor() {
    super(PERMISSIONS_COLLECTION);
  }

  async findByPolicy(policyId: string): Promise<Permission[]> {
    return await this.findAll({
      filter: { policy: { _eq: policyId } },
    });
  }
}

export default PermissionRepository;
