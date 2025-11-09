import { DirectusRepository } from "../../core/directus.repository";
import { Device, DEVICES_COLLECTION } from "./device.model";

export class DeviceRepository extends DirectusRepository<Device> {
  constructor() {
    super(DEVICES_COLLECTION);
  }

  async findByKey(device_key: string): Promise<Device | null> {
    const result = await this.findAll({
      filter: { device_key: { _eq: device_key } },
      limit: 1,
    });
    return result[0] ?? null;
  }
}

export default DeviceRepository;
