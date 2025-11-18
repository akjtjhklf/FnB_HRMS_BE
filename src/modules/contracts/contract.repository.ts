import { DirectusRepository } from "../../core/directus.repository";
import { Contract, CONTRACTS_COLLECTION } from "./contract.model";

/**
 * Repository hợp đồng lao động — kết nối tới Directus `contracts`
 */
export class ContractRepository extends DirectusRepository<Contract> {
  protected searchFields = ["contract_number", "contract_type", "job_title"];

  constructor() {
    super(CONTRACTS_COLLECTION);
  }

  // Hàm custom: tìm hợp đồng theo employee_id
  async findByEmployee(employeeId: string) {
    return await this.findAll({
      filter: { employee_id: { _eq: employeeId } },
      fields: [
        "*",
        "employee_id.*",
        "employee_id.user.*",
        "employee_id.user.role.*",
      ],
    });
  }

  /**
   * Override findAllPaginated để luôn populate employee relation
   */
  async findAllPaginated(
    options: any
  ): Promise<{ data: Contract[]; meta: any }> {
    const enhancedOptions = {
      ...options,
      fields: options.fields || [
        "*",
        "employee_id.*", // tất cả thông tin employee
        "employee_id.user.*", // thông tin user liên kết
        "employee_id.user.role.*", // thông tin role
      ],
    };
    return super.findAllPaginated(enhancedOptions);
  }
}

export default ContractRepository;
