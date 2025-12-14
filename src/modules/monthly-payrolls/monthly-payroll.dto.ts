import { z } from "zod";
import { MonthlyPayroll } from "./monthly-payroll.model";

// ✅ CREATE schema
export const createMonthlyPayrollSchema = z.object({
  employee_id: z.string().uuid(),
  month: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/, "Tháng phải có định dạng YYYY-MM"),
  salary_scheme_id: z.string().uuid().optional().nullable(),
  base_salary: z.number().nonnegative(),
  allowances: z.number().nonnegative().default(0),
  bonuses: z.number().nonnegative().default(0),
  overtime_pay: z.number().nonnegative().default(0),
  deductions: z.number().nonnegative().default(0),
  penalties: z.number().nonnegative().default(0),
  total_work_hours: z.number().nonnegative().optional().nullable(),
  overtime_hours: z.number().nonnegative().optional().nullable(),
  late_minutes: z.number().int().nonnegative().optional().nullable(),
  absent_days: z.number().int().nonnegative().optional().nullable(),
  notes: z.string().optional().nullable(),
  status: z.enum(["draft", "pending_approval", "approved", "paid"]).default("draft"),
});

// ✅ UPDATE schema
export const updateMonthlyPayrollSchema = createMonthlyPayrollSchema.partial();

// ✅ RESPONSE schema
export const monthlyPayrollResponseSchema = createMonthlyPayrollSchema.extend({
  id: z.string().uuid(),
  gross_salary: z.number(),
  net_salary: z.number(),
  approved_by: z.string().nullable().optional(),
  approved_at: z.string().nullable().optional(),
  paid_at: z.string().nullable().optional(),
  created_at: z.string().nullable().optional(),
  updated_at: z.string().nullable().optional(),
});

// ✅ Types
export type CreateMonthlyPayrollDto = z.infer<typeof createMonthlyPayrollSchema>;
export type UpdateMonthlyPayrollDto = z.infer<typeof updateMonthlyPayrollSchema>;
export type MonthlyPayrollResponseDto = z.infer<typeof monthlyPayrollResponseSchema>;

// ✅ Mapper
export const toMonthlyPayrollResponseDto = (
  entity: MonthlyPayroll
): any => {
  // Handle employee data - can be populated object or just ID string
  let employee = null;
  if (entity.employee_id && typeof entity.employee_id === 'object') {
    employee = entity.employee_id;
  } else if ((entity as any).employee) {
    employee = (entity as any).employee;
  }

  return {
    id: entity.id,
    employee_id: typeof entity.employee_id === 'string' ? entity.employee_id : (entity.employee_id as any)?.id ?? null,
    employee, // Populated employee object
    month: entity.month,
    salary_scheme_id: entity.salary_scheme_id ?? null,
    contract_id: entity.contract_id ?? null,
    pay_type: entity.pay_type ?? null,
    hourly_rate: entity.hourly_rate ?? null,
    base_salary: entity.base_salary,
    allowances: entity.allowances,
    bonuses: entity.bonuses,
    overtime_pay: entity.overtime_pay,
    deductions: entity.deductions,
    penalties: entity.penalties,
    gross_salary: entity.gross_salary,
    net_salary: entity.net_salary,
    total_work_hours: entity.total_work_hours ?? null,
    total_work_days: entity.total_work_days ?? null,
    total_late_minutes: entity.total_late_minutes ?? null,
    total_early_leave_minutes: entity.total_early_leave_minutes ?? null,
    late_penalty: entity.late_penalty ?? null,
    early_leave_penalty: entity.early_leave_penalty ?? null,
    notes: entity.notes ?? null,
    status: entity.status ?? "draft",
    approved_by: entity.approved_by ?? null,
    approved_at: entity.approved_at ?? null,
    paid_at: entity.paid_at ?? null,
    created_at: entity.created_at ?? null,
    updated_at: entity.updated_at ?? null,
  };
};
