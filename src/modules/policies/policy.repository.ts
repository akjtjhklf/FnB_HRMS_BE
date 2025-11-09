import { DirectusRepository } from "../../core/directus.repository";
import { Policy, POLICIES_COLLECTION } from "./policy.model";

/**
 * Repository Policy — kết nối tới Directus `policies` collection
 */
export class PolicyRepository extends DirectusRepository<Policy> {
  constructor() {
    super(POLICIES_COLLECTION);
  }

  async findByName(name: string): Promise<Policy | null> {
    const result = await this.findAll({
      filter: { name: { _eq: name } },
      limit: 1,
    });
    return result[0] ?? null;
  }
}

export default PolicyRepository;
