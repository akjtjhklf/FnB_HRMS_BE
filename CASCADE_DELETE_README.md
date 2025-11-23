# Cascade Delete System

## Tổng quan

Hệ thống cascade delete tự động xóa tất cả dữ liệu phụ thuộc (foreign keys) khi xóa một record, tránh lỗi foreign key constraint.

## Cách hoạt động

1. **Tự động**: Tất cả services kế thừa từ `BaseService` sẽ tự động có cascade delete
2. **Cấu hình**: Định nghĩa relationships trong `src/utils/cascade-delete.utils.ts`
3. **Thông minh**: Chỉ xóa cascade nếu có cấu hình, nếu không dùng delete bình thường

## Cấu trúc

```typescript
// src/utils/cascade-delete.utils.ts
export const CASCADE_DELETE_MAP = {
  positions: [
    { table: "shift_position_requirements", field: "position_id" },
    { table: "employee_availability_positions", field: "position_id" },
    // ...
  ],
  employees: [
    { table: "attendance_logs", field: "employee_id" },
    { table: "contracts", field: "employee_id" },
    // ...
  ],
  // ...
};
```

## Modules đã hỗ trợ Cascade Delete

✅ **positions** - Xóa vị trí sẽ xóa:
  - shift_position_requirements
  - employee_availability_positions  
  - schedule_assignments
  - salary_schemes (set null)

✅ **employees** - Xóa nhân viên sẽ xóa:
  - attendance_logs
  - attendance_shifts
  - contracts
  - deductions
  - rfid_cards
  - employee_availability
  - schedule_assignments
  - schedule_change_requests
  - monthly_employee_stats
  - salary_requests

✅ **shifts** - Xóa ca sẽ xóa:
  - shift_position_requirements
  - employee_availability
  - schedule_assignments
  - attendance_shifts
  - schedule_change_requests

✅ **shift_types** - Xóa loại ca sẽ xóa:
  - shifts (và tất cả children của shifts)

✅ **weekly_schedule** - Xóa lịch tuần sẽ xóa:
  - shifts (và tất cả children của shifts)
  - schedule_assignments

✅ **rfid_cards** - Xóa thẻ RFID sẽ xóa:
  - attendance_logs

✅ **devices** - Xóa thiết bị sẽ xóa:
  - attendance_logs

✅ **attendance_shifts** - Xóa ca chấm công sẽ xóa:
  - attendance_adjustments

✅ **employee_availability** - Xóa đăng ký ca sẽ xóa:
  - employee_availability_positions

✅ **salary_schemes** - Xóa scheme lương sẽ:
  - Set null cho employees.scheme_id
  - Xóa salary_requests

## Sử dụng

### 1. Service mới

Kế thừa từ `BaseService` và không override `remove()`:

```typescript
export class MyService extends BaseService<MyModel> {
  constructor(repo = new MyRepository()) {
    super(repo);
  }
  
  // Không cần override remove() - cascade delete tự động
}
```

### 2. Service cần validate trước khi xóa

Override `remove()` nhưng gọi `super.remove()`:

```typescript
export class MyService extends BaseService<MyModel> {
  async remove(id: string) {
    // Custom validation
    const item = await this.repo.findById(id);
    if (item.status === 'locked') {
      throw new HttpError(400, "Cannot delete locked item");
    }
    
    // Gọi cascade delete của BaseService
    return super.remove(id);
  }
}
```

### 3. Thêm cascade config cho module mới

Cập nhật `CASCADE_DELETE_MAP` trong `src/utils/cascade-delete.utils.ts`:

```typescript
export const CASCADE_DELETE_MAP = {
  // ...existing config
  
  my_new_table: [
    { table: "dependent_table_1", field: "my_table_id" },
    { table: "dependent_table_2", field: "my_table_id" },
  ],
};
```

## Logs

Khi xóa với cascade delete, console sẽ hiển thị:

```
🗑️  Starting cascade delete for positions:abc-123
📋 Found 4 dependent tables
✓ Deleted 3 records from shift_position_requirements
✓ No records in employee_availability_positions with position_id=abc-123
✓ Deleted 5 records from schedule_assignments
✓ Set scheme_id to null for 2 records in employees
✓ Deleted main record from positions
🎉 Cascade delete completed: 11 records deleted from 4 tables
```

## Testing

```typescript
// Test trong service
const positionService = new PositionService();
await positionService.remove("position-id-here");
// Sẽ tự động xóa tất cả FK

// Test utility trực tiếp
import { cascadeDelete } from './utils/cascade-delete.utils';
await cascadeDelete('positions', 'position-id-here');
```

## Lưu ý

1. **Yêu cầu Admin Token**: Set `DIRECTUS_ADMIN_TOKEN` trong `.env`
2. **Không thể hoàn tác**: Xóa cascade là permanent, cần backup trước khi test
3. **Performance**: Với nhiều FK, xóa cascade có thể chậm
4. **Set null vs Delete**: Một số FK set null thay vì delete (employees.scheme_id, devices.employee_id_pending)

## Troubleshooting

### Lỗi "Admin token is required"
```bash
# Thêm vào .env
DIRECTUS_ADMIN_TOKEN=your_admin_token_here
```

### Cascade delete không hoạt động
```typescript
// Check config
import { hasCascadeConfig } from './utils/cascade-delete.utils';
console.log(hasCascadeConfig('your_table')); // Should return true
```

### Vẫn bị FK error
1. Check CASCADE_DELETE_MAP có đầy đủ relationships không
2. Check thứ tự xóa (children phải xóa trước parents)
3. Xem logs để debug

## Mở rộng

Để thêm cascade delete cho module khác:

1. Xác định tất cả FK references đến table
2. Thêm vào `CASCADE_DELETE_MAP`
3. Test xóa một record
4. Verify trong DB không còn FK orphans
