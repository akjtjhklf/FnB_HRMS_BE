import { DirectusRepository } from "../../core/directus.repository";
import {
  MONTHLY_EMPLOYEE_STATS_COLLECTION,
  MonthlyEmployeeStat,
} from "./monthly-employee-stat.model";

/**
 * Repository cho bảng monthly_employee_stats
 */
export class MonthlyEmployeeStatRepository extends DirectusRepository<MonthlyEmployeeStat> {
  constructor() {
    super(MONTHLY_EMPLOYEE_STATS_COLLECTION);
  }

  async findByEmployeeAndMonth(employee_id: string, month: string) {
    const result = await this.findAll({
      filter: {
        employee_id: { _eq: employee_id },
        month: { _eq: month },
      },
      limit: 1,
    });
    return result[0] ?? null;
  }
}

export default MonthlyEmployeeStatRepository;
