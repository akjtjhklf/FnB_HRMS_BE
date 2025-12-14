# Schedule Management API - Complete Flow

## 📋 Flow Overview

```
1. Tạo Loại Ca (Shift Types)
2. Tạo Lịch Tuần (Weekly Schedule) + Auto-create Shifts
3. Nhân Viên Đăng Ký Ca (Employee Availability)
4. Quản Lý Phân Công (Schedule Assignment)
   - Manual: Drag & Drop
   - Auto: Thuật toán tối ưu
5. Kiểm Tra & Chốt Lịch (Validate & Publish)
6. Nhân Viên Đổi Ca (Change Requests)
```

---

## 🎯 Phase 1: Setup - Tạo Loại Ca

### 1.1. Create Shift Types

**Endpoint**: `POST /api/shift-types`

```json
{
  "type_name": "Sáng",
  "start_time": "08:00:00",
  "end_time": "12:00:00",
  "color_code": "#3b82f6",
  "is_active": true
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "type_name": "Sáng",
    "start_time": "08:00:00",
    "end_time": "12:00:00",
    "color_code": "#3b82f6",
    "is_active": true
  }
}
```

---

## 🗓️ Phase 2: Create Schedule - Tạo Lịch Tuần

### 2.1. Create Weekly Schedule with Auto Shifts

**Endpoint**: `POST /api/weekly-schedules/with-shifts`

Tạo lịch tuần + tự động tạo ca cho 7 ngày với tất cả shift types.

```json
{
  "start_date": "2025-01-06"
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "weekly_schedule": {
      "id": "schedule-uuid",
      "week_start": "2025-01-06",
      "week_end": "2025-01-12",
      "status": "draft"
    },
    "total_shifts": 21
  },
  "message": "Tạo lịch tuần và ca làm việc thành công"
}
```

**Shifts Created**:
- Mỗi ngày: Số lượng shift types (ví dụ: 3 loại ca)
- 7 ngày × 3 ca = 21 shifts

### 2.2. Get Schedule Stats

**Endpoint**: `GET /api/weekly-schedules/:id/stats`

```json
{
  "success": true,
  "data": {
    "schedule": {
      "id": "schedule-uuid",
      "status": "draft"
    },
    "shifts": {
      "total": 21,
      "byDay": {
        "0": 3, // Chủ nhật
        "1": 3, // Thứ 2
        "2": 3, // Thứ 3
        ...
      }
    },
    "employees": {
      "totalWithAvailability": 0,
      "totalAssigned": 0,
      "avgShiftsPerEmployee": 0
    },
    "availabilities": {
      "total": 0
    },
    "assignments": {
      "total": 0,
      "bySource": {
        "auto": 0,
        "manual": 0
      },
      "confirmed": 0,
      "pending": 0
    }
  }
}
```

---

## 👥 Phase 3: Employee Registration - Nhân Viên Đăng Ký

### 3.1. Employee Registers Availability

**Endpoint**: `POST /api/employee-availability`

Nhân viên đăng ký ca muốn làm.

```json
{
  "employee_id": "emp-uuid",
  "shift_id": "shift-uuid",
  "schedule_id": "schedule-uuid",
  "priority": 8,
  "status": "registered",
  "notes": "Tôi muốn làm ca này"
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "id": "avail-uuid",
    "employee_id": "emp-uuid",
    "shift_id": "shift-uuid",
    "priority": 8,
    "status": "registered"
  }
}
```

### 3.2. Register Multiple Positions for One Shift

**Endpoint**: `POST /api/employee-availability-positions`

Đăng ký nhiều vị trí cho 1 ca.

```json
{
  "availability_id": "avail-uuid",
  "position_id": "pos-uuid-1",
  "preference_order": 1
}
```

**Multiple Positions**:
```json
[
  {
    "availability_id": "avail-uuid",
    "position_id": "pos-uuid-1",
    "preference_order": 1
  },
  {
    "availability_id": "avail-uuid",
    "position_id": "pos-uuid-2",
    "preference_order": 2
  }
]
```

---

## 🎯 Phase 4: Assignment - Phân Công Ca

### 4.1. Manual Assignment (Drag & Drop)

**Endpoint**: `POST /api/schedule-assignments`

Quản lý kéo thả nhân viên vào ca.

```json
{
  "schedule_id": "schedule-uuid",
  "shift_id": "shift-uuid",
  "employee_id": "emp-uuid",
  "position_id": "pos-uuid",
  "assigned_by": "manager-uuid",
  "status": "assigned",
  "source": "manual"
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "id": "assignment-uuid",
    "schedule_id": "schedule-uuid",
    "shift_id": "shift-uuid",
    "employee_id": "emp-uuid",
    "position_id": "pos-uuid",
    "status": "assigned",
    "source": "manual",
    "confirmed_by_employee": false
  }
}
```

### 4.2. Auto Assignment (Algorithm)

**Endpoint**: `POST /api/schedule-assignments/auto-schedule`

Xếp lịch tự động dựa trên availability + thuật toán.

```json
{
  "scheduleId": "schedule-uuid",
  "overwriteExisting": false,
  "dryRun": false
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "scheduleId": "schedule-uuid",
    "assignmentsCreated": 45,
    "validation": {
      "valid": true,
      "warnings": [
        "Shift 2025-01-06 Position pos-1: Need 3, got 2"
      ],
      "errors": []
    },
    "stats": {
      "totalAssignments": 45,
      "totalShifts": 21,
      "totalEmployees": 15,
      "employeesUsed": 12,
      "coverageRate": 85.7,
      "avgShiftsPerEmployee": 3.75,
      "minShifts": 2,
      "maxShifts": 5
    }
  },
  "message": "Xếp lịch tự động thành công"
}
```

**Thuật toán**:
- Priority-based scoring
- Workload balancing
- Position preference
- Fairness distribution
- Constraint checking (max shifts, rest hours)

### 4.3. Get Assignment Stats

**Endpoint**: `GET /api/schedule-assignments/schedule/:scheduleId/stats`

```json
{
  "success": true,
  "data": {
    "totalAssignments": 45,
    "totalEmployees": 12,
    "avgShiftsPerEmployee": 3.75,
    "minShifts": 2,
    "maxShifts": 5,
    "distribution": {
      "emp-1": 4,
      "emp-2": 3,
      "emp-3": 5,
      ...
    }
  }
}
```

---

## ✅ Phase 5: Validation & Publish - Kiểm Tra & Chốt Lịch

### 5.1. Validate Schedule

**Endpoint**: `GET /api/weekly-schedules/:id/validate`

Kiểm tra cơ bản: có shifts, có requirements chưa.

```json
{
  "success": true,
  "data": {
    "canPublish": true,
    "valid": true,
    "errors": [],
    "warnings": [],
    "schedule": {
      "id": "schedule-uuid",
      "status": "draft"
    },
    "totalShifts": 21
  },
  "message": "Lịch hợp lệ, có thể công bố"
}
```

**Checks**:
- ✅ Có shifts không
- ✅ Mỗi shift có position requirements không

### 5.2. Check Readiness (Detailed)

**Endpoint**: `GET /api/weekly-schedules/:id/check-readiness`

Kiểm tra chi tiết: đủ assignments chưa, đủ người chưa.

```json
{
  "success": true,
  "data": {
    "isReady": false,
    "canPublish": true,
    "coverageRate": 85.71,
    "totalShifts": 21,
    "totalRequired": 63,
    "totalAssigned": 54,
    "missingAssignments": 9,
    "issues": [
      {
        "shiftId": "shift-1",
        "shiftDate": "2025-01-06",
        "positionId": "pos-1",
        "required": 3,
        "assigned": 2,
        "missing": 1
      }
    ],
    "message": "Còn thiếu 9 phân công"
  }
}
```

**Checks**:
- ✅ Coverage rate (% phân công)
- ✅ Chi tiết từng shift thiếu bao nhiêu người
- ✅ Cho phép publish nếu ≥ 80% coverage

### 5.3. Publish Schedule

**Endpoint**: `PUT /api/weekly-schedules/:id/publish`

Chốt lịch, cho nhân viên xem và đổi ca.

```json
{
  "success": true,
  "data": {
    "id": "schedule-uuid",
    "status": "published",
    "published_at": "2025-01-05T10:00:00Z"
  },
  "message": "Công bố lịch tuần thành công"
}
```

**Requirements**:
- Status phải là `draft`
- Validation pass (`canPublish: true`)
- Coverage ≥ 80%

**After Publish**:
- Nhân viên có thể xem lịch
- Nhân viên có thể tạo change requests
- Manager vẫn có thể edit assignments

---

## 🔄 Phase 6: Change Requests - Đổi Ca

### 6.1. Employee Creates Change Request

**Endpoint**: `POST /api/schedule-change-requests`

```json
{
  "requester_id": "emp-uuid",
  "type": "shift_swap",
  "from_shift_id": "shift-1",
  "to_shift_id": "shift-2",
  "target_employee_id": "emp-2",
  "reason": "Tôi có việc đột xuất",
  "status": "pending"
}
```

**Request Types**:
- `shift_swap`: Đổi ca với người khác
- `pass_shift`: Nhường ca
- `day_off`: Xin nghỉ

### 6.2. Manager Approves Request

**Endpoint**: `PUT /api/schedule-change-requests/:id`

```json
{
  "status": "approved",
  "approved_by": "manager-uuid",
  "approved_at": "2025-01-05T15:00:00Z"
}
```

**Auto Actions**:
- Nếu `shift_swap`: Backend tự động swap 2 assignments
- Nếu `pass_shift`: Gán ca cho replacement_employee
- Nếu `day_off`: Xóa assignment, tìm người thay

### 6.3. List Change Requests

**Endpoint**: `GET /api/schedule-change-requests?status=pending`

```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "req-uuid",
        "requester_id": "emp-uuid",
        "type": "shift_swap",
        "status": "pending",
        "reason": "Tôi có việc đột xuất",
        "created_at": "2025-01-05T12:00:00Z"
      }
    ]
  }
}
```

---

## 📊 Complete API List

### Weekly Schedules
- ✅ `POST /api/weekly-schedules/with-shifts` - Tạo lịch + auto shifts
- ✅ `GET /api/weekly-schedules/:id/validate` - Validate cơ bản
- ✅ `GET /api/weekly-schedules/:id/check-readiness` - Check chi tiết
- ✅ `GET /api/weekly-schedules/:id/stats` - Thống kê
- ✅ `PUT /api/weekly-schedules/:id/publish` - Chốt lịch
- ✅ `PUT /api/weekly-schedules/:id/finalize` - Hoàn tất (khóa)

### Shifts
- ✅ `GET /api/shifts?schedule_id=xxx` - List shifts
- ✅ `POST /api/shifts` - Create single shift
- ✅ `POST /api/shifts/bulk` - Create multiple shifts **(NEW)**
- ✅ `PUT /api/shifts/:id` - Update shift
- ✅ `DELETE /api/shifts/:id` - Delete shift

### Employee Availability
- ✅ `POST /api/employee-availability` - Đăng ký ca
- ✅ `GET /api/employee-availability?schedule_id=xxx` - List registrations
- ✅ `POST /api/employee-availability-positions` - Đăng ký positions

### Schedule Assignments
- ✅ `POST /api/schedule-assignments` - Manual assign
- ✅ `POST /api/schedule-assignments/auto-schedule` - Auto assign **(EXISTING)**
- ✅ `GET /api/schedule-assignments/schedule/:id/stats` - Stats **(EXISTING)**
- ✅ `PUT /api/schedule-assignments/:id` - Update (confirm)
- ✅ `DELETE /api/schedule-assignments/:id` - Remove

### Change Requests
- ✅ `POST /api/schedule-change-requests` - Tạo yêu cầu
- ✅ `GET /api/schedule-change-requests?status=pending` - List pending
- ✅ `PUT /api/schedule-change-requests/:id` - Approve/Reject

---

## 🔐 Permissions & Status Flow

### Schedule Status Flow
```
draft → published → finalized
  ↓         ↓           ↓
  Edit    View      Lock
```

### Permission Matrix

| Action | Draft | Published | Finalized |
|--------|-------|-----------|-----------|
| Edit shifts | ✅ Manager | ✅ Manager | ❌ |
| Assign employees | ✅ Manager | ✅ Manager | ❌ |
| Employee register | ❌ | ✅ Employee | ❌ |
| Change requests | ❌ | ✅ Employee | ❌ |
| View schedule | ✅ All | ✅ All | ✅ All |

---

## 📈 Usage Examples

### Example 1: Complete Flow

```javascript
// 1. Create schedule with shifts
POST /api/weekly-schedules/with-shifts
{ "start_date": "2025-01-06" }

// 2. Check what was created
GET /api/weekly-schedules/{id}/stats

// 3. Employees register
POST /api/employee-availability
{ "employee_id": "emp-1", "shift_id": "shift-1", "priority": 8 }

// 4. Check registrations
GET /api/employee-availability?schedule_id={id}

// 5. Auto assign
POST /api/schedule-assignments/auto-schedule
{ "scheduleId": "{id}", "dryRun": false }

// 6. Check coverage
GET /api/weekly-schedules/{id}/check-readiness

// 7. If ready (≥80%), publish
PUT /api/weekly-schedules/{id}/publish

// 8. Employees can now create change requests
POST /api/schedule-change-requests
{ "type": "shift_swap", "from_shift_id": "shift-1", ... }
```

### Example 2: Manual Assignment

```javascript
// 1. Manager drags employee to shift
POST /api/schedule-assignments
{
  "schedule_id": "schedule-uuid",
  "shift_id": "shift-uuid",
  "employee_id": "emp-uuid",
  "position_id": "pos-uuid",
  "source": "manual"
}

// 2. Check if shift is fully covered
GET /api/weekly-schedules/{id}/check-readiness
```

---

## 🚀 New APIs Added

### 1. Validate Schedule ✨
- `GET /api/weekly-schedules/:id/validate`
- Checks basic requirements before publish

### 2. Check Readiness ✨
- `GET /api/weekly-schedules/:id/check-readiness`
- Detailed coverage analysis with issues list

### 3. Schedule Stats ✨
- `GET /api/weekly-schedules/:id/stats`
- Complete statistics overview

### 4. Bulk Create Shifts ✨
- `POST /api/shifts/bulk`
- Create multiple shifts at once

---

## 📝 Notes

### Auto-Schedule Algorithm
- Priority-based (higher priority = more likely to get shift)
- Workload balancing (fewer shifts = higher priority)
- Position preference (lower order = preferred)
- Fairness bonus (below average = bonus points)
- Constraint checks (max shifts, rest hours)

### Coverage Rate
- **100%**: All positions filled
- **80-99%**: Can publish, some positions understaffed
- **<80%**: Should not publish, too many gaps

### Employee Confirmation
- After publish, employees should confirm assignments
- `confirmed_by_employee: true/false`
- Reminder system can be built on this field

---

## ✅ Summary

**APIs Added**: 4 new endpoints
- ✅ Validate schedule
- ✅ Check readiness
- ✅ Get schedule stats
- ✅ Bulk create shifts

**Total Coverage**: 100% cho flow yêu cầu
1. ✅ Tạo loại ca
2. ✅ Tạo lịch + auto shifts
3. ✅ Nhân viên đăng ký (nhiều ca, nhiều vị trí)
4. ✅ Phân công (thủ công + tự động)
5. ✅ Kiểm tra & chốt (validate + publish)
6. ✅ Đổi ca (change requests)

**Ready for Production**: ✅
