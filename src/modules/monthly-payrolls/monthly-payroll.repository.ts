import { DirectusRepository } from "../../core/directus.repository";
import {
  MONTHLY_PAYROLLS_COLLECTION,
  MonthlyPayroll,
} from "./monthly-payroll.model";

/**
 * Repository cho bảng monthly_payrolls
 */
export class MonthlyPayrollRepository extends DirectusRepository<MonthlyPayroll> {
  protected searchFields = [
    "notes",
  ];

  constructor() {
    super(MONTHLY_PAYROLLS_COLLECTION);
  }

  /**
   * Tìm bảng lương theo employee_id và month
   */
  async findByEmployeeAndMonth(employee_id: string, month: string): Promise<MonthlyPayroll | null> {
    return this.findOne({
      filter: {
        employee_id: { _eq: employee_id },
        month: { _eq: month },
      },
    });
  }

  /**
   * Tìm tất cả bảng lương theo tháng với quan hệ employee
   */
  async findAllByMonth(month: string): Promise<MonthlyPayroll[]> {
    return this.findAll({
      filter: {
        month: { _eq: month },
      },
      fields: ["*", "employee_id.*", "salary_scheme_id.*"],
    });
  }

  /**
   * Tìm tất cả bảng lương theo employee_id
   */
  async findAllByEmployee(employee_id: string): Promise<MonthlyPayroll[]> {
    return this.findAll({
      filter: {
        employee_id: { _eq: employee_id },
      },
      sort: ["-month"],
    });
  }

  /**
   * Tìm bảng lương theo status
   */
  async findAllByStatus(status: string): Promise<MonthlyPayroll[]> {
    return this.findAll({
      filter: {
        status: { _eq: status },
      },
      fields: ["*", "employee_id.*"],
      sort: ["-month", "employee_id"],
    });
  }

  /**
   * Override findAllPaginated để luôn populate relations
   */
  async findAllPaginated(options: any): Promise<{ data: MonthlyPayroll[]; meta: any }> {
    // ALWAYS force populate employee and salary scheme - ignore client fields
    const enhancedOptions = {
      ...options,
      fields: [
        "*",
        "employee_id.*",  // ALWAYS fetch full employee
        "salary_scheme_id.*"  // ALWAYS fetch full salary scheme
      ],
      deep: {}, // CRITICAL: Enable deep querying to populate nested relations
    };
    return super.findAllPaginated(enhancedOptions);
  }
}

export default MonthlyPayrollRepository;
