import { BaseService, HttpError } from "../../core/base";
import { Device } from "./device.model";
import DeviceRepository from "./device.repository";
import { randomUUID } from "crypto";
import { PaginationQueryDto, PaginatedResponse } from "../../core/dto/pagination.dto";

export class DeviceService extends BaseService<Device> {
  declare repo: DeviceRepository;
  constructor(repo = new DeviceRepository()) {
    super(repo);
  }

  async listPaginated(query: PaginationQueryDto): Promise<PaginatedResponse<Device>> {
    return await this.repo.findAllPaginated(query);
  }

  async list(query?: Record<string, unknown>) {
    return await this.repo.findAll(query);
  }

  async get(id: string) {
    const device = await this.repo.findById(id);
    if (!device)
      throw new HttpError(404, "Không tìm thấy thiết bị", "DEVICE_NOT_FOUND");
    return device;
  }

  async create(data: Partial<Device>) {
    // Kiểm tra device_key trùng
    const existing = await this.repo.findByKey(data.device_key!);
    if (existing) {
      throw new HttpError(409, "Device key đã tồn tại", "DEVICE_KEY_CONFLICT");
    }

    const newData = {
      id: randomUUID(),
      ...data,
    };

    return await this.repo.create(newData);
  }

  async update(id: string, data: Partial<Device>) {
    const device = await this.repo.findById(id);
    if (!device)
      throw new HttpError(404, "Không tìm thấy thiết bị", "DEVICE_NOT_FOUND");

    return await this.repo.update(id, data);
  }

  async remove(id: string) {
    const device = await this.repo.findById(id);
    if (!device)
      throw new HttpError(404, "Không tìm thấy thiết bị", "DEVICE_NOT_FOUND");

    await this.repo.delete(id);
  }
}

export default DeviceService;
