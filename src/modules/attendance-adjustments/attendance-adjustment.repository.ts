import { DirectusRepository } from "../../core/directus.repository";
import {
  AttendanceAdjustment,
  ATTENDANCE_ADJUSTMENTS_COLLECTION,
} from "./attendance-adjustment.model";

export class AttendanceAdjustmentsRepository extends DirectusRepository<AttendanceAdjustment> {
  constructor() {
    super(ATTENDANCE_ADJUSTMENTS_COLLECTION);
  }
}

export default AttendanceAdjustmentsRepository;
