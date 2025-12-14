/**
 * Định nghĩa relationships giữa các collections trong Directus
 * Format: { parentCollection: [{ collection: childCollection, field: foreignKeyField }] }
 * 
 * Ví dụ: Khi xóa 1 employee, cần xóa tất cả:
 * - attendance_logs có employee_id = employee.id
 * - contracts có employee_id = employee.id
 * - etc.
 */
export const COLLECTION_RELATIONSHIPS: Record<string, Array<{ collection: string; field: string }>> = {
  // Employees - Parent của nhiều collections
  employees: [
    { collection: 'attendance_logs', field: 'employee_id' },
    { collection: 'attendance_shifts', field: 'employee_id' },
    { collection: 'contracts', field: 'employee_id' },
    { collection: 'rfid_cards', field: 'employee_id' },
    { collection: 'employee_availability', field: 'employee_id' },
    { collection: 'schedule_assignments', field: 'employee_id' },
    { collection: 'schedule_change_requests', field: 'requester_id' },
    { collection: 'schedule_change_requests', field: 'target_employee_id' },
    { collection: 'schedule_change_requests', field: 'replacement_employee_id' },
    { collection: 'deductions', field: 'employee_id' },
    { collection: 'salary_requests', field: 'employee_id' },
    { collection: 'monthly_employee_stats', field: 'employee_id' },
    { collection: 'monthly_payrolls', field: 'employee_id' },
  ],

  // Positions
  positions: [
    { collection: 'employees', field: 'position_id' },
    { collection: 'shift_position_requirements', field: 'position_id' },
    { collection: 'schedule_assignments', field: 'position_id' },
    { collection: 'employee_availability_positions', field: 'position_id' },
  ],

  // Salary Schemes
  salary_schemes: [
    { collection: 'employees', field: 'salary_scheme_id' },
  ],

  // Shift Types
  shift_types: [
    { collection: 'shifts', field: 'shift_type_id' },
  ],

  // Weekly Schedules
  weekly_schedules: [
    { collection: 'shifts', field: 'schedule_id' },
    { collection: 'schedule_assignments', field: 'schedule_id' },
  ],

  // Shifts
  shifts: [
    { collection: 'shift_position_requirements', field: 'shift_id' },
    { collection: 'schedule_assignments', field: 'shift_id' },
    { collection: 'attendance_shifts', field: 'shift_id' },
    { collection: 'schedule_change_requests', field: 'from_shift_id' },
    { collection: 'schedule_change_requests', field: 'to_shift_id' },
    { collection: 'deductions', field: 'related_shift_id' },
  ],

  // Devices
  devices: [
    { collection: 'attendance_logs', field: 'device_id' },
  ],

  // RFID Cards
  rfid_cards: [
    { collection: 'attendance_logs', field: 'rfid_card_id' },
  ],

  // Employee Availability
  employee_availability: [
    { collection: 'employee_availability_positions', field: 'availability_id' },
  ],

  // Contracts
  contracts: [
    { collection: 'deductions', field: 'contract_id' },
  ],

  // Attendance Shifts
  attendance_shifts: [
    { collection: 'attendance_adjustments', field: 'attendance_shift_id' },
  ],

  // Monthly Payrolls
  monthly_payrolls: [
    { collection: 'deductions', field: 'payroll_id' },
  ],

  // Roles
  roles: [
    { collection: 'users', field: 'role_id' },
  ],

  // Policies
  policies: [
    { collection: 'permissions', field: 'policy_id' },
  ],
};

/**
 * Lấy danh sách collections liên quan đến một collection
 */
export function getRelatedCollections(parentCollection: string): Array<{ collection: string; field: string }> {
  return COLLECTION_RELATIONSHIPS[parentCollection] || [];
}
