import { BaseService, HttpError } from "../../core/base";
import { Contract } from "./contract.model";
import ContractRepository from "./contract.repository";
import {
  PaginationQueryDto,
  PaginatedResponse,
} from "../../core/dto/pagination.dto";
import { toEmployeeResponseDto } from "../employees/employee.dto";

export class ContractService extends BaseService<Contract> {
  constructor(repo = new ContractRepository()) {
    super(repo);
  }

  async listPaginated(
    query: PaginationQueryDto
  ): Promise<PaginatedResponse<any>> {
    const { data, meta } = await (
      this.repo as ContractRepository
    ).findAllPaginated(query);

    const mappedData = data.map((contract) => ({
      ...contract,
      employee: contract.employee_id
        ? toEmployeeResponseDto(contract.employee_id as any) // cast nếu cần
        : null,
    }));

    return { data: mappedData, meta };
  }

  /**
   * Lấy danh sách hợp đồng
   */
  async list(query?: Record<string, unknown>) {
    return await this.repo.findAll(query);
  }

  /**
   * Lấy chi tiết hợp đồng theo ID
   */
  async get(id: string) {
    const contract = await this.repo.findById(id);
    if (!contract)
      throw new HttpError(404, "Không tìm thấy hợp đồng", "CONTRACT_NOT_FOUND");
    return contract;
  }

  /**
   * Tạo hợp đồng mới
   */
  async create(data: Partial<Contract>) {
    return await this.repo.create(data);
  }

  /**
   * Cập nhật hợp đồng
   */
  async update(id: string, data: Partial<Contract>) {
    const existing = await this.repo.findById(id);
    if (!existing)
      throw new HttpError(404, "Không tìm thấy hợp đồng", "CONTRACT_NOT_FOUND");

    return await this.repo.update(id, data);
  }

  /**
   * Xóa hợp đồng
   */
  async remove(id: string) {
    const existing = await this.repo.findById(id);
    if (!existing)
      throw new HttpError(404, "Không tìm thấy hợp đồng", "CONTRACT_NOT_FOUND");

    await this.repo.delete(id);
  }
}

export default ContractService;
