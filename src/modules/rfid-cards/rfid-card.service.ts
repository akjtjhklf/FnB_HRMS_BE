import { randomUUID } from "crypto";
import { BaseService, HttpError } from "../../core/base";
import { RFIDCard } from "./rfid-card.model";
import RFIDCardRepository from "./rfid-card.repository";
import { PaginatedResponse, PaginationQueryDto } from "../../core/dto/pagination.dto";
import { now, DATE_FORMATS } from "../../utils/date.utils";

export class RFIDCardService extends BaseService<RFIDCard> {
  declare repo: RFIDCardRepository;

  constructor(repo = new RFIDCardRepository()) {
    super(repo);
  }

  async list(query?: Record<string, unknown>) {
    return await this.repo.findAll(query);
  }
  async listPaginated(
    query: PaginationQueryDto
  ): Promise<PaginatedResponse<RFIDCard>> {
    return await (
      this.repo as RFIDCardRepository
    ).findAllPaginated(query);
  }
  async get(id: string) {
    const card = await this.repo.findById(id);
    if (!card)
      throw new HttpError(404, "Không tìm thấy thẻ RFID", "CARD_NOT_FOUND");
    return card;
  }

  async create(data: Partial<RFIDCard>) {
    // kiểm tra UID trùng
    const existing = await this.repo.findByCardUID(data.card_uid!);
    if (existing)
      throw new HttpError(409, "Card UID đã tồn tại", "CARD_UID_CONFLICT");

    const nowStr = now().format(DATE_FORMATS.DATETIME);
    const newCard: RFIDCard = {
      id: randomUUID(),
      employee_id: data.employee_id ?? null,
      card_uid: data.card_uid!,
      issued_at: data.issued_at ?? nowStr,
      revoked_at: data.revoked_at ?? null,
      status: data.status ?? "active",
      notes: data.notes ?? null,
      created_at: nowStr,
      updated_at: nowStr,
    };

    return await this.repo.create(newCard);
  }

  async update(id: string, data: Partial<RFIDCard>) {
    const existing = await this.repo.findById(id);
    if (!existing)
      throw new HttpError(404, "Không tìm thấy thẻ RFID", "CARD_NOT_FOUND");

    // nếu đổi UID, kiểm tra trùng
    if (data.card_uid && data.card_uid !== existing.card_uid) {
      const conflict = await this.repo.findByCardUID(data.card_uid);
      if (conflict)
        throw new HttpError(409, "Card UID đã tồn tại", "CARD_UID_CONFLICT");
    }

    return await this.repo.update(id, {
      ...data,
      updated_at: now().format(DATE_FORMATS.DATETIME),
    });
  }

  // remove() method được kế thừa từ BaseService với cascade delete tự động
}

export default RFIDCardService;
