import { DirectusRepository } from "../../core/directus.repository";
import {
  AttendanceLog,
  ATTENDANCE_LOGS_COLLECTION,
} from "./attendance-log.model";

export class AttendanceLogRepository extends DirectusRepository<AttendanceLog> {
  constructor() {
    super(ATTENDANCE_LOGS_COLLECTION);
  }

  // Custom methods
  async findByCardUid(card_uid: string): Promise<AttendanceLog[]> {
    return await this.findAll({
      filter: { card_uid: { _eq: card_uid } },
    });
  }
}

export default AttendanceLogRepository;
