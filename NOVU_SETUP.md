# Novu Notification Setup Guide

## 1. Tạo Account Novu

1. Truy cập https://dashboard.novu.co
2. Đăng ký/đăng nhập
3. Vào **Settings → API Keys** → Copy API Key

## 2. Cấu hình Backend (.env)

```env
# Novu Configuration
NOVU_API_KEY=your_api_key_from_novu_dashboard
NOVU_API_URL=https://api.novu.co/v1
NOVU_DEFAULT_WORKFLOW=in-app-notification
```

## 3. Tạo Workflow trên Novu Dashboard

### Bước 1: Vào Workflows
- Click **Workflows** ở sidebar trái
- Click **Create Workflow**

### Bước 2: Tạo workflow mới
- **Name**: `In-App Notification`
- **Identifier**: `in-app-notification` (⚠️ QUAN TRỌNG - phải đúng tên này!)
- Click **Create**

### Bước 3: Thêm In-App Step
1. Trong workflow editor, click **Add Step**
2. Chọn **In-App** channel
3. Configure template:

**Subject/Title**:
```
{{title}}
```

**Body**:
```
{{message}}
```

### Bước 4: Save & Activate
- Click **Save**
- Toggle **Active** = ON

## 4. Cấu hình Frontend

File: `FnB_HRMS_FE/.env.local`
```env
NEXT_PUBLIC_NOVU_APP_ID=VoHt917w84Br
```

> App ID lấy từ Novu Dashboard → Settings → API Keys → Application Identifier

## 5. Test Notification

### Cách 1: Chạy script test
```bash
cd FnB_HRMS_BE
npx ts-node scripts/test-notification.ts
```

### Cách 2: Test qua API
```bash
# Send notification
curl -X POST http://localhost:4000/api/notifications/send \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "recipient_type": "SPECIFIC",
    "recipient_ids": ["employee-id-here"],
    "title": "Test Notification",
    "message": "Hello from HRMS!"
  }'
```

### Cách 3: Test trong app
1. Login vào FE với tài khoản manager
2. Tạo yêu cầu tăng lương cho employee
3. Kiểm tra notification inbox của managers

## 6. Kiểm tra Activity

Sau khi gửi notification:
1. Vào Novu Dashboard → **Activity Feed**
2. Xem danh sách notifications đã gửi
3. Check status: Sent, Delivered, Failed

## 7. Troubleshooting

### ❌ "Workflow not found"
- Kiểm tra workflow identifier = `in-app-notification`
- Kiểm tra workflow đã **Active**

### ❌ "Subscriber not found"
- Subscriber được tạo tự động khi gửi notification lần đầu
- Hoặc tạo subscriber trước: POST /api/notifications/subscribers

### ❌ "Invalid API Key"
- Kiểm tra NOVU_API_KEY trong .env
- Đảm bảo không có spaces thừa

### ❌ FE không nhận notification
- Kiểm tra NEXT_PUBLIC_NOVU_APP_ID
- Kiểm tra subscriberId = employee.id (không phải user.id)
- Kiểm tra NovuProvider đã wrap app

## 8. Notification Types

System hỗ trợ các loại notification sau:

| Type | Trigger | Recipients |
|------|---------|------------|
| PAYSLIP_READY | markAsPaid, sendPayslip | Employee |
| SALARY_INCREASE_REQUEST | Create salary request | Managers |
| SALARY_REQUEST_APPROVED | Approve request | Employee |
| SALARY_REQUEST_REJECTED | Reject request | Employee |
| SCHEDULE_CHANGE_REQUEST | Create schedule request | Managers |
| SCHEDULE_CHANGE_APPROVED | Approve schedule | Employee |
| SCHEDULE_CHANGE_REJECTED | Reject schedule | Employee |

## 9. Extend với notification mới

```typescript
import { getNotificationHelper, NotificationType } from '../modules/notifications';

const helper = getNotificationHelper();

// Gửi cho 1 employee
await helper.notifyEmployee(employeeId, {
  title: 'Your Title',
  message: 'Your message',
  type: NotificationType.SYSTEM,
  actionUrl: '/optional-link',
});

// Gửi cho managers
await helper.notifyManagers({
  title: 'Manager Alert',
  message: 'Something happened',
  type: NotificationType.SYSTEM,
});

// Gửi cho tất cả
await helper.notifyAll({
  title: 'Announcement',
  message: 'Company announcement',
  type: NotificationType.SYSTEM,
});
```
