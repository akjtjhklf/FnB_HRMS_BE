import { DirectusRepository } from "../../core/directus.repository";
import { SalaryScheme, SALARY_SCHEMES_COLLECTION } from "./salary-scheme.model";

/**
 * Repository chế độ lương — kết nối tới Directus `salary_schemes`
 */
export class SalarySchemeRepository extends DirectusRepository<SalaryScheme> {
  protected searchFields = ["name", "pay_type"];

  constructor() {
    super(SALARY_SCHEMES_COLLECTION);
  }

  // Tìm scheme theo tên
  async findByName(name: string): Promise<SalaryScheme | null> {
    const result = await this.findAll({
      filter: { name: { _eq: name } },
      limit: 1,
    });
    return result[0] ?? null;
  }
}

export default SalarySchemeRepository;
