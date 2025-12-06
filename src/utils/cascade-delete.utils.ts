/**
 * Cascade Delete Utility
 * 
 * Định nghĩa các foreign key relationships và thứ tự xóa cascade
 * để tránh lỗi foreign key constraint khi xóa dữ liệu
 */

/**
 * Map các bảng con phụ thuộc vào bảng cha
 * Key: Tên bảng cha
 * Value: Array các dependent tables cần xóa trước
 */
export const CASCADE_DELETE_MAP: Record<string, Array<{ table: string; field: string; action?: 'delete' | 'set_null' }>> = {
  // POSITIONS
  positions: [
    { table: "shift_position_requirements", field: "position_id", action: "delete" },
    { table: "employee_availability_positions", field: "position_id", action: "delete" },
    { table: "schedule_assignments", field: "position_id", action: "delete" },
    { table: "salary_schemes", field: "position_id", action: "set_null" }, // Set null instead of delete
  ],

  // EMPLOYEES
  employees: [
    { table: "attendance_logs", field: "employee_id", action: "delete" },
    { table: "attendance_shifts", field: "employee_id", action: "delete" },
    { table: "contracts", field: "employee_id", action: "delete" },
    { table: "deductions", field: "employee_id", action: "delete" },
    { table: "rfid_cards", field: "employee_id", action: "delete" },
    { table: "devices", field: "employee_id_pending", action: "set_null" }, // Set null
    { table: "employee_availability", field: "employee_id", action: "delete" },
    { table: "schedule_assignments", field: "employee_id", action: "delete" },
    { table: "schedule_change_requests", field: "requester_id", action: "delete" },
    { table: "schedule_change_requests", field: "target_employee_id", action: "set_null" },
    { table: "schedule_change_requests", field: "replacement_employee_id", action: "set_null" },
    { table: "monthly_employee_stats", field: "employee_id", action: "delete" },
    { table: "salary_requests", field: "employee_id", action: "delete" },
  ],

  // WEEKLY SCHEDULE
  weekly_schedule: [
    { table: "shifts", field: "schedule_id", action: "delete" },
    { table: "schedule_assignments", field: "schedule_id", action: "delete" },
  ],

  // SHIFTS
  shifts: [
    { table: "shift_position_requirements", field: "shift_id", action: "delete" },
    { table: "employee_availability", field: "shift_id", action: "set_null" },
    { table: "schedule_assignments", field: "shift_id", action: "delete" },
    { table: "attendance_shifts", field: "shift_id", action: "delete" },
    { table: "schedule_change_requests", field: "from_shift_id", action: "set_null" },
    { table: "schedule_change_requests", field: "to_shift_id", action: "set_null" },
    { table: "deductions", field: "related_shift_id", action: "set_null" },
  ],

  // SHIFT TYPES
  shift_types: [
    { table: "shifts", field: "shift_type_id", action: "delete" },
  ],

  // RFID CARDS
  rfid_cards: [
    { table: "attendance_logs", field: "rfid_card_id", action: "set_null" },
  ],

  // DEVICES
  devices: [
    { table: "attendance_logs", field: "device_id", action: "set_null" },
  ],

  // ATTENDANCE SHIFTS
  attendance_shifts: [
    { table: "attendance_adjustments", field: "attendance_shift_id", action: "set_null" },
  ],

  // EMPLOYEE AVAILABILITY
  employee_availability: [
    { table: "employee_availability_positions", field: "availability_id", action: "delete" },
  ],

  // SALARY SCHEMES
  salary_schemes: [
    { table: "employees", field: "scheme_id", action: "set_null" }, // Set null instead of delete
    { table: "salary_requests", field: "current_scheme_id", action: "set_null" },
    { table: "salary_requests", field: "proposed_scheme_id", action: "set_null" },
  ],
};

/**
 * Xóa cascade tất cả các records liên quan (RECURSIVE)
 * @param tableName - Tên bảng cha cần xóa
 * @param recordId - ID của record cần xóa
 * @param depth - Độ sâu recursion hiện tại (để tránh infinite loop)
 * @param visited - Set các records đã xóa (để tránh circular reference)
 */
export async function cascadeDelete(
  tableName: string,
  recordId: string,
  depth: number = 0,
  visited: Set<string> = new Set()
): Promise<{ deletedCount: number; deletedTables: string[] }> {
  // Prevent infinite loops
  const MAX_DEPTH = 10;
  if (depth > MAX_DEPTH) {
    console.warn(`⚠️  Max cascade depth (${MAX_DEPTH}) reached for ${tableName}:${recordId}`);
    return { deletedCount: 0, deletedTables: [] };
  }

  // Prevent circular references
  const visitKey = `${tableName}:${recordId}`;
  if (visited.has(visitKey)) {
    return { deletedCount: 0, deletedTables: [] };
  }
  visited.add(visitKey);

  // Import directus client from utils
  const { adminDirectus: directus } = await import('./directusClient');
  const client = directus;

  const deletedTables: string[] = [];
  let totalDeleted = 0;

  // Get dependent tables
  const dependents = CASCADE_DELETE_MAP[tableName] || [];

  const indent = '  '.repeat(depth);
  if (depth === 0) {
    console.log(`${indent}🗑️  Starting cascade delete for ${tableName}:${recordId}`);
  }
  console.log(`${indent}📋 Found ${dependents.length} dependent table(s) for ${tableName}`);

  // Delete dependent records first (in order) - RECURSIVE
  for (const dep of dependents) {
    try {
      // Fetch dependent records using Directus SDK
      const { readItems } = await import('@directus/sdk');
      
      const records: any = await client.request(
        readItems(dep.table as any, {
          filter: { [dep.field]: { _eq: recordId } },
          limit: -1,
        } as any)
      );

      if (!records || records.length === 0) {
        console.log(`${indent}✓ No records in ${dep.table} with ${dep.field}=${recordId}`);
        continue;
      }

      const recordIds = records.map((r: any) => r.id);

      // Check action from config: delete or set_null
      if (dep.action === 'set_null') {
        // Set field to null instead of deleting records
        const { updateItems } = await import('@directus/sdk');
        
        await client.request(
          updateItems(dep.table as any, recordIds, { [dep.field]: null })
        );
        
        console.log(`${indent}✓ Set ${dep.field} to null for ${records.length} records in ${dep.table}`);
        continue;
      }

      // 🔥 RECURSIVE CASCADE DELETE for each child record
      console.log(`${indent}→ Cascade deleting ${records.length} record(s) from ${dep.table}...`);
      for (const childRecord of records) {
        const childResult = await cascadeDelete(dep.table, childRecord.id, depth + 1, visited);
        totalDeleted += childResult.deletedCount;
        childResult.deletedTables.forEach(t => {
          if (!deletedTables.includes(t)) deletedTables.push(t);
        });
      }

      // After recursive delete, the child records should already be deleted
      // But we still try to delete them explicitly as a safety measure
      const { deleteItems } = await import('@directus/sdk');
      try {
        await client.request(deleteItems(dep.table as any, recordIds));
        console.log(`${indent}✓ Deleted ${records.length} records from ${dep.table}`);
      } catch (error: any) {
        // If records already deleted by recursive call, this will fail - that's OK
        console.log(`${indent}✓ ${dep.table} records already deleted (by recursive cascade)`);
      }
      
      if (!deletedTables.includes(dep.table)) {
        deletedTables.push(dep.table);
      }
    } catch (error: any) {
      console.error(`${indent}❌ Error processing ${dep.table}:`, error?.message || error?.errors?.[0]?.message || String(error));
      // Continue with other tables
    }
  }

  // Finally delete the main record
  try {
    const { deleteItem } = await import('@directus/sdk');
    await client.request(deleteItem(tableName as any, recordId));
    
    console.log(`${indent}✓ Deleted main record from ${tableName}`);
    totalDeleted += 1;
  } catch (error: any) {
    console.error(`${indent}❌ Error deleting main record from ${tableName}:`, error.message);
    throw error;
  }

  if (depth === 0) {
    console.log(`🎉 Cascade delete completed: ${totalDeleted} total records deleted`);
  }

  return {
    deletedCount: totalDeleted,
    deletedTables: [tableName, ...deletedTables],
  };
}

/**
 * Helper: Kiểm tra xem một bảng có cascade delete config không
 */
export function hasCascadeConfig(tableName: string): boolean {
  return tableName in CASCADE_DELETE_MAP;
}

/**
 * Helper: Lấy danh sách các bảng phụ thuộc
 */
export function getDependentTables(tableName: string): string[] {
  const deps = CASCADE_DELETE_MAP[tableName] || [];
  return [...new Set(deps.map((d) => d.table))];
}
