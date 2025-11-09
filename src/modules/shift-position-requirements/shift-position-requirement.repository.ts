import { DirectusRepository } from "../../core/directus.repository";
import {
  ShiftPositionRequirement,
  SHIFT_POSITION_REQUIREMENTS_COLLECTION,
} from "./shift-position-requirement.model";

/**
 * Repository cho bảng shift_position_requirements
 */
export class ShiftPositionRequirementRepository extends DirectusRepository<ShiftPositionRequirement> {
  constructor() {
    super(SHIFT_POSITION_REQUIREMENTS_COLLECTION);
  }
}

export default ShiftPositionRequirementRepository;
