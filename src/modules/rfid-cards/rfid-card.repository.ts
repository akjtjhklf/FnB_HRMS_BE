import { DirectusRepository } from "../../core/directus.repository";
import { RFIDCard, RFID_CARDS_COLLECTION } from "./rfid-card.model";

/**
 * Repository kết nối tới Directus `rfid_cards`
 */
export class RFIDCardRepository extends DirectusRepository<RFIDCard> {
  constructor() {
    super(RFID_CARDS_COLLECTION);
  }

  async findByCardUID(cardUID: string): Promise<RFIDCard | null> {
    const result = await this.findAll({
      filter: { card_uid: { _eq: cardUID } },
      limit: 1,
    });
    return result[0] ?? null;
  }

  async findByEmployee(employeeId: string): Promise<RFIDCard[]> {
    return await this.findAll({
      filter: { employee_id: { _eq: employeeId } },
    });
  }
}

export default RFIDCardRepository;
