import { randomUUID } from "crypto";
import { BaseService, HttpError } from "../../core/base";
import { Deduction } from "./deduction.model";
import DeductionRepository from "./deduction.repository";

export class DeductionService extends BaseService<Deduction> {
  constructor(repo = new DeductionRepository()) {
    super(repo);
  }

  async list(query?: Record<string, unknown>) {
    return await this.repo.findAll(query);
  }

  async get(id: string) {
    const item = await this.repo.findById(id);
    if (!item)
      throw new HttpError(404, "Không tìm thấy bản ghi deduction", "NOT_FOUND");
    return item;
  }

  async create(data: Partial<Deduction>) {
    if (!data.employee_id)
      throw new HttpError(400, "Thiếu employee_id", "BAD_REQUEST");

    const newItem: Deduction = {
      id: randomUUID(),
      employee_id: data.employee_id,
      type: data.type ?? "expense",
      amount: data.amount ?? null,
      currency: data.currency ?? "VND",
      related_shift_id: data.related_shift_id ?? null,
      note: data.note ?? null,
      status: data.status ?? "pending",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    return await this.repo.create(newItem);
  }

  async update(id: string, data: Partial<Deduction>) {
    const existing = await this.repo.findById(id);
    if (!existing)
      throw new HttpError(404, "Không tìm thấy deduction", "NOT_FOUND");

    return await this.repo.update(id, {
      ...data,
      updated_at: new Date().toISOString(),
    });
  }

  async remove(id: string) {
    const existing = await this.repo.findById(id);
    if (!existing)
      throw new HttpError(404, "Không tìm thấy deduction", "NOT_FOUND");

    await this.repo.delete(id);
  }
}

export default DeductionService;
