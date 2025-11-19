# 🔧 Backend Changes for Schedule Management System

## ✅ THAY ĐỔI ĐÃ HOÀN THÀNH

### 1. 📢 **Công Bố và Hoàn Tất Lịch Tuần**

#### **Files Modified:**
- `weekly-schedule.service.ts`
- `weekly-schedule.controller.ts`
- `weekly-schedule.routes.ts`

#### **New Methods Added:**

**Service Methods:**
```typescript
// Chuyển status: draft → published
async publish(id: string): Promise<WeeklySchedule>

// Chuyển status: published → finalized  
async finalize(id: string): Promise<WeeklySchedule>
```

**Controller Handlers:**
```typescript
export const publishWeeklySchedule: RequestHandler
export const finalizeWeeklySchedule: RequestHandler
```

#### **New API Endpoints:**

```bash
# Công bố lịch tuần (draft → published)
PUT /api/weekly-schedules/:id/publish
Authorization: Bearer <token>

Response 200:
{
  "success": true,
  "data": {
    "id": "uuid",
    "status": "published",
    "published_at": "2024-01-15T10:30:00Z",
    ...
  },
  "message": "Công bố lịch tuần thành công"
}
```

```bash
# Hoàn tất lịch tuần (published → finalized)
PUT /api/weekly-schedules/:id/finalize
Authorization: Bearer <token>

Response 200:
{
  "success": true,
  "data": {
    "id": "uuid",
    "status": "finalized",
    ...
  },
  "message": "Hoàn tất lịch tuần thành công"
}
```

#### **Business Logic:**
- ✅ Validate status transitions: draft → published → finalized
- ✅ Lưu timestamp `published_at` khi công bố
- ✅ Throw error 400 nếu status không hợp lệ

---

### 2. ✅ **Duyệt và Từ Chối Yêu Cầu Đổi Ca**

#### **Files Modified:**
- `schedule-change-request.service.ts`
- `schedule-change-request.controller.ts`
- `schedule-change-request.routes.ts`

#### **New Dependencies Added:**
```typescript
import ScheduleAssignmentRepository from "../schedule-assignments/schedule-assignment.repository";
```

#### **New Methods Added:**

**Service Methods:**
```typescript
// Duyệt yêu cầu + tự động swap assignments
async approveAndSwap(requestId: string, approvedBy: string): Promise<{
  request: ScheduleChangeRequest;
  swap_result: SwapResult | null;
}>

// Hoán đổi employee_id của 2 assignments
private async swapAssignments(
  assignmentId1: string, 
  assignmentId2: string
): Promise<SwapResult>

// Từ chối yêu cầu
async reject(
  requestId: string, 
  rejectedBy: string, 
  reason?: string
): Promise<ScheduleChangeRequest>
```

**Controller Handlers:**
```typescript
export const approveChangeRequest: RequestHandler
export const rejectChangeRequest: RequestHandler
```

#### **New API Endpoints:**

```bash
# Duyệt yêu cầu đổi ca
POST /api/schedule-change-requests/:id/approve
Authorization: Bearer <token>

Response 200:
{
  "success": true,
  "data": {
    "request": {
      "id": "uuid",
      "status": "approved",
      "approved_by": "user-uuid",
      "approved_at": "2024-01-15T10:30:00Z",
      ...
    },
    "swap_result": {
      "assignment1_id": "uuid-1",
      "assignment2_id": "uuid-2",
      "swapped": true
    }
  },
  "message": "Duyệt yêu cầu và hoán đổi ca thành công"
}
```

```bash
# Từ chối yêu cầu
POST /api/schedule-change-requests/:id/reject
Authorization: Bearer <token>
Content-Type: application/json

{
  "reason": "Không đủ nhân viên thay thế"
}

Response 200:
{
  "success": true,
  "data": {
    "id": "uuid",
    "status": "rejected",
    "approved_by": "user-uuid",
    "approved_at": "2024-01-15T10:30:00Z",
    "reason": "Không đủ nhân viên thay thế",
    ...
  },
  "message": "Từ chối yêu cầu thành công"
}
```

#### **Business Logic:**
- ✅ Validate request status = "pending" trước khi approve/reject
- ✅ Nếu type = "shift_swap", tự động swap employee_id của 2 assignments
- ✅ Cập nhật status thành "approved" hoặc "rejected"
- ✅ Lưu approved_by, approved_at, reason
- ✅ Throw error 400 nếu request đã xử lý trước đó
- ✅ Throw error 404 nếu không tìm thấy assignments

---

## 📋 **SUMMARY OF NEW ENDPOINTS**

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| `PUT` | `/api/weekly-schedules/:id/publish` | Công bố lịch tuần | ✅ Yes |
| `PUT` | `/api/weekly-schedules/:id/finalize` | Hoàn tất lịch tuần | ✅ Yes |
| `POST` | `/api/schedule-change-requests/:id/approve` | Duyệt yêu cầu đổi ca | ✅ Yes |
| `POST` | `/api/schedule-change-requests/:id/reject` | Từ chối yêu cầu đổi ca | ✅ Yes |

---

## 🧪 **TESTING EXAMPLES**

### Test 1: Publish Schedule

```bash
curl -X PUT http://localhost:3000/api/weekly-schedules/abc-123/publish \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json"
```

### Test 2: Approve Swap Request

```bash
curl -X POST http://localhost:3000/api/schedule-change-requests/xyz-456/approve \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json"
```

### Test 3: Reject Request

```bash
curl -X POST http://localhost:3000/api/schedule-change-requests/xyz-456/reject \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"reason": "Không phù hợp"}'
```

---

## ⚠️ **NOTES FOR FRONTEND**

### 1. **Multi-Position Support**
Current `employee-availability` model supports **single shift only**:
```typescript
{
  employee_id: string;
  shift_id: string;  // ❌ Only 1 shift
}
```

**Frontend expects multiple positions:**
```typescript
{
  positions: string[];  // ✅ Array of position IDs
}
```

**TODO:** Nếu cần hỗ trợ multi-position registration, cần:
1. Thêm collection `employee_availability_positions` (many-to-many)
2. Hoặc đổi `shift_id` thành `position_ids: string[]`
3. Update DTO và validation

### 2. **Status Enum in Directus**
Đảm bảo collection `weekly_schedules` có field `status` với values:
- `draft`
- `published`
- `finalized`

### 3. **Change Request Type Enum**
Field `type` trong `schedule_change_requests` cần có value:
- `shift_swap` (để trigger auto-swap logic)
- Các type khác không tự động swap

---

## ✅ **NEXT STEPS**

1. ✅ **Completed:** All backend endpoints implemented
2. ⏳ **Frontend:** Update API calls to use new endpoints
3. ⏳ **Testing:** Test approve/reject flow with real data
4. ⏳ **Optional:** Add multi-position support if needed
5. ⏳ **Documentation:** Update API docs/Swagger

---

## 📊 **WORKFLOW DIAGRAM**

```
┌─────────────────────────────────────────────────┐
│       SCHEDULE MANAGEMENT WORKFLOW              │
└─────────────────────────────────────────────────┘

1. CREATE SCHEDULE (draft)
   POST /weekly-schedules/with-shifts
   
2. PUBLISH SCHEDULE
   PUT /weekly-schedules/:id/publish
   Status: draft → published
   
3. EMPLOYEES REGISTER AVAILABILITY
   POST /employee-availability
   
4. MANAGER ASSIGNS EMPLOYEES
   POST /schedule-assignments/auto-schedule
   
5. EMPLOYEES REQUEST SWAP
   POST /schedule-change-requests
   
6. MANAGER APPROVES SWAP
   POST /schedule-change-requests/:id/approve
   → Auto swap employee_ids in assignments
   
7. FINALIZE SCHEDULE
   PUT /weekly-schedules/:id/finalize
   Status: published → finalized
   → Locked, no more changes allowed
```

---

## 🎉 **MIGRATION COMPLETE**

All backend features for Schedule Management System are now implemented and ready for testing!
