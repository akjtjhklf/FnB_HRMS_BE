import { z } from "zod";
import { MonthlyEmployeeStat } from "./monthly-employee-stat.model";

// ✅ CREATE schema
export const createMonthlyEmployeeStatSchema = z.object({
  employee_id: z.uuid(),
  month: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/, "Tháng phải có định dạng YYYY-MM"),
  total_shifts_assigned: z.number().int().nonnegative().optional().nullable(),
  total_shifts_worked: z.number().int().nonnegative().optional().nullable(),
  swaps_count: z.number().int().nonnegative().optional().nullable(),
  pass_count: z.number().int().nonnegative().optional().nullable(),
  off_count: z.number().int().nonnegative().optional().nullable(),
  total_worked_minutes: z.number().int().nonnegative().optional().nullable(),
  overtime_minutes: z.number().int().nonnegative().optional().nullable(),
  late_minutes: z.number().int().nonnegative().optional().nullable(),
  absent_count: z.number().int().nonnegative().optional().nullable(),
});

// ✅ UPDATE schema
export const updateMonthlyEmployeeStatSchema = createMonthlyEmployeeStatSchema.partial();

// ✅ RESPONSE schema
export const monthlyEmployeeStatResponseSchema = createMonthlyEmployeeStatSchema.extend({
  id: z.uuid(),
  updated_at: z.string().nullable(),
});

// ✅ Types
export type CreateMonthlyEmployeeStatDto = z.infer<typeof createMonthlyEmployeeStatSchema>;
export type UpdateMonthlyEmployeeStatDto = z.infer<typeof updateMonthlyEmployeeStatSchema>;
export type MonthlyEmployeeStatResponseDto = z.infer<typeof monthlyEmployeeStatResponseSchema>;

// ✅ Mapper
export const toMonthlyEmployeeStatResponseDto = (
  entity: MonthlyEmployeeStat
): MonthlyEmployeeStatResponseDto => ({
  id: entity.id,
  employee_id: entity.employee_id,
  month: entity.month,
  total_shifts_assigned: entity.total_shifts_assigned ?? 0,
  total_shifts_worked: entity.total_shifts_worked ?? 0,
  swaps_count: entity.swaps_count ?? 0,
  pass_count: entity.pass_count ?? 0,
  off_count: entity.off_count ?? 0,
  total_worked_minutes: entity.total_worked_minutes ?? 0,
  overtime_minutes: entity.overtime_minutes ?? 0,
  late_minutes: entity.late_minutes ?? 0,
  absent_count: entity.absent_count ?? 0,
  updated_at: entity.updated_at ?? null,
});
