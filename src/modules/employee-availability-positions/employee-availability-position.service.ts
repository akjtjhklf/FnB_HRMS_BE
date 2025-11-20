import { BaseService, HttpError } from "../../core/base";
import {
  PaginatedResponse,
  PaginationQueryDto,
} from "../../core/dto/pagination.dto";
import { EmployeeAvailabilityPosition } from "./employee-availability-position.model";
import EmployeeAvailabilityPositionsRepository from "./employee-availability-position.repository";

export class EmployeeAvailabilityPositionsService extends BaseService<EmployeeAvailabilityPosition> {
  constructor(repo = new EmployeeAvailabilityPositionsRepository()) {
    super(repo);
  }

  async list(query?: Record<string, unknown>) {
    return await this.repo.findAll(query);
  }

  async listPaginated(
    query: PaginationQueryDto
  ): Promise<PaginatedResponse<EmployeeAvailabilityPosition>> {
    return await (
      this.repo as EmployeeAvailabilityPositionsRepository
    ).findAllPaginated(query);
  }

  async get(id: string) {
    const record = await this.repo.findById(id);
    if (!record)
      throw new HttpError(
        404,
        "Không tìm thấy dữ liệu",
        "EMPLOYEE_AVAILABILITY_POSITION_NOT_FOUND"
      );
    return record;
  }

  async create(data: Partial<EmployeeAvailabilityPosition>) {
    return await this.repo.create(data);
  }

  async update(id: string, data: Partial<EmployeeAvailabilityPosition>) {
    const record = await this.repo.findById(id);
    if (!record)
      throw new HttpError(
        404,
        "Không tìm thấy dữ liệu",
        "EMPLOYEE_AVAILABILITY_POSITION_NOT_FOUND"
      );
    return await this.repo.update(id, data);
  }

  async remove(id: string) {
    const record = await this.repo.findById(id);
    if (!record)
      throw new HttpError(
        404,
        "Không tìm thấy dữ liệu",
        "EMPLOYEE_AVAILABILITY_POSITION_NOT_FOUND"
      );
    
    await this.repo.delete(id);
  }
}

export default EmployeeAvailabilityPositionsService;
