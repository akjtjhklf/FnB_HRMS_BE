import { DirectusRepository } from "../../core/directus.repository";
import {
  WeeklySchedule,
  WEEKLY_SCHEDULE_COLLECTION,
} from "./weekly-schedule.model";

/**
 * Repository quản lý Weekly Schedules
 */
export class WeeklyScheduleRepository extends DirectusRepository<WeeklySchedule> {
  constructor() {
    super(WEEKLY_SCHEDULE_COLLECTION);
  }

  // Custom methods nếu cần sau này
}

export default WeeklyScheduleRepository;
