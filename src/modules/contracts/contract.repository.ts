import { DirectusRepository } from "../../core/directus.repository";
import { Contract, CONTRACTS_COLLECTION } from "./contract.model";

/**
 * Repository hợp đồng lao động — kết nối tới Directus `contracts`
 */
export class ContractRepository extends DirectusRepository<Contract> {
  constructor() {
    super(CONTRACTS_COLLECTION);
  }

  // Hàm custom: tìm hợp đồng theo employee_id
  async findByEmployee(employeeId: string) {
    return await this.findAll({
      filter: { employee_id: { _eq: employeeId } },
    });
  }
}

export default ContractRepository;
