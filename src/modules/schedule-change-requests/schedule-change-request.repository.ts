import { DirectusRepository } from "../../core/directus.repository";
import {
  ScheduleChangeRequest,
  SCHEDULE_CHANGE_REQUESTS_COLLECTION,
} from "./schedule-change-request.model";

/**
 * Repository quản lý các yêu cầu thay đổi lịch làm việc
 */
export class ScheduleChangeRequestRepository extends DirectusRepository<ScheduleChangeRequest> {
  constructor() {
    super(SCHEDULE_CHANGE_REQUESTS_COLLECTION);
  }

  // Bạn có thể thêm custom query (VD: tìm theo requester)
  async findByRequester(requesterId: string) {
    return await this.findAll({
      filter: { requester_id: { _eq: requesterId } },
    });
  }
}

export default ScheduleChangeRequestRepository;
