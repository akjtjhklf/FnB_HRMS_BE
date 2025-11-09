import { BaseService, HttpError } from "../../core/base";
import { SalaryRequest } from "./salary-request.model";
import SalaryRequestRepository from "./salary-request.repository";

export class SalaryRequestService extends BaseService<SalaryRequest> {
  constructor(repo = new SalaryRequestRepository()) {
    super(repo);
  }

  /**
   * Lấy danh sách yêu cầu lương
   */
  async list(query?: Record<string, unknown>) {
    return await this.repo.findAll(query);
  }

  /**
   * Lấy chi tiết yêu cầu theo ID
   */
  async get(id: string) {
    const request = await this.repo.findById(id);
    if (!request)
      throw new HttpError(
        404,
        "Không tìm thấy yêu cầu lương",
        "SALARY_REQUEST_NOT_FOUND"
      );
    return request;
  }

  /**
   * Tạo yêu cầu mới
   */
  async create(data: Partial<SalaryRequest>) {
    return await this.repo.create(data);
  }

  /**
   * Cập nhật yêu cầu
   */
  async update(id: string, data: Partial<SalaryRequest>) {
    const existing = await this.repo.findById(id);
    if (!existing)
      throw new HttpError(
        404,
        "Không tìm thấy yêu cầu lương",
        "SALARY_REQUEST_NOT_FOUND"
      );

    return await this.repo.update(id, data);
  }

  /**
   * Xóa yêu cầu
   */
  async remove(id: string) {
    const existing = await this.repo.findById(id);
    if (!existing)
      throw new HttpError(
        404,
        "Không tìm thấy yêu cầu lương",
        "SALARY_REQUEST_NOT_FOUND"
      );

    await this.repo.delete(id);
  }
}

export default SalaryRequestService;
