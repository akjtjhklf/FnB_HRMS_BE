# 🏢 FnB HRMS Backend - TypeScript + Express + Directus

> **Backend API hoàn chỉnh cho hệ thống HRMS (Human Resource Management System) chuyên biệt cho ngành F&B**

[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue.svg)](https://www.typescriptlang.org/)
[![Express](https://img.shields.io/badge/Express-4.18+-green.svg)](https://expressjs.com/)
[![Directus](https://img.shields.io/badge/Directus-10.0+-purple.svg)](https://directus.io/)

## 🎯 Tính Năng Chính

### ✨ Core Features
- ✅ **Employee Management** - Quản lý nhân viên đầy đủ
- ✅ **Attendance Tracking** - Chấm công tự động với RFID/Device
- ✅ **Contract & Payroll** - Quản lý hợp đồng và lương
- ✅ **Position & Role Management** - Quản lý vị trí và phân quyền

### 🚀 Advanced Scheduling System
- ✅ **Weekly Schedule Management** - Quản lý lịch tuần
- ✅ **Shift Management** - Quản lý ca làm việc
- ✅ **Employee Availability** - Nhân viên đăng ký lịch làm
- ✅ **🤖 AUTO SCHEDULER** - **XẾP LỊCH TỰ ĐỘNG THÔNG MINH**

### 📊 Analytics & Reports
- ✅ Monthly Statistics
- ✅ Attendance Reports
- ✅ Workload Balance Analysis

## 🤖 Auto Scheduler - Tính Năng Đặc Biệt

**Thuật toán xếp lịch tự động** giúp tự động phân công nhân viên vào ca làm việc dựa trên:

- 🎯 **Priority** - Độ ưu tiên của nhân viên (1-10)
- 📍 **Position** - Vị trí mà nhân viên muốn làm
- ⚖️ **Workload Balance** - Cân bằng số ca giữa các nhân viên
- 🏆 **Fairness** - Đảm bảo công bằng cho tất cả
- ⏰ **Constraints** - Tôn trọng max shifts, rest hours, etc.

### Quick Start Auto Scheduler
```bash
# 1. Nhân viên đăng ký availability
POST /api/employee-availability
{
  "employee_id": "uuid",
  "shift_id": "uuid",
  "priority": 8
}

# 2. Chọn positions
POST /api/employee-availability-positions
{
  "availability_id": "uuid",
  "position_id": "uuid",
  "preference_order": 1
}

# 3. 🚀 Run Auto Scheduler
POST /api/schedule-assignments/auto-schedule
{
  "scheduleId": "uuid",
  "dryRun": false
}
```

**📚 Chi tiết:** Xem [AUTO_SCHEDULER_GUIDE.md](./AUTO_SCHEDULER_GUIDE.md)

## 🛠 Tech Stack

### Core
- **TypeScript** 5.0+ - Type-safe code
- **Node.js** 18+ - Runtime
- **Express.js** 4.18+ - Web framework
- **Directus SDK** 10+ - Headless CMS & Database

### Libraries
- **Zod** - Schema validation
- **Helmet** - Security headers
- **CORS** - Cross-origin resource sharing
- **Morgan** - HTTP request logger
- **Cloudinary** - File upload service

### Architecture
```
Clean Architecture Pattern:
Controller → Service → Repository → Directus
     ↓          ↓          ↓
   DTO      Business    Data Access
           Logic
```

## 🚀 Getting Started

### 1. Prerequisites
```bash
Node.js >= 18.0.0
npm >= 9.0.0
Directus instance (cloud or self-hosted)
```

### 2. Installation
```bash
# Clone repo
git clone <repo-url>
cd FnB_HRMS_BE

# Install dependencies
npm install
```

### 3. Environment Setup
Create `.env` file:
```ini
# Directus Configuration
DIRECTUS_URL=https://your-directus-instance.com
DIRECTUS_EMAIL=admin@example.com
DIRECTUS_PASSWORD=your_secure_password

# Server Configuration
PORT=5000
NODE_ENV=development

# API Security
API_KEY=your_api_key_here

# Cloudinary (Optional)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

### 4. Run Development Server
```bash
npm run dev
```
Server: http://localhost:5000

### 5. Build for Production
```bash
npm run build
npm start
```

## 📁 Project Structure

```
FnB_HRMS_BE/
├── src/
│   ├── app.ts                    # Express app setup
│   ├── server.ts                 # Server bootstrap
│   ├── config/                   # Configurations
│   │   ├── swagger.config.ts
│   │   └── cloudinary.config.ts
│   ├── core/                     # Core abstractions
│   │   ├── base.ts
│   │   ├── directus.repository.ts
│   │   └── response.ts
│   ├── middlewares/              # Express middlewares
│   │   ├── auth.middleware.ts
│   │   ├── error.middleware.ts
│   │   └── validate.middleware.ts
│   ├── modules/                  # Feature modules
│   │   ├── employees/
│   │   ├── shifts/
│   │   ├── schedule-assignments/
│   │   │   ├── schedule-assignment.model.ts
│   │   │   ├── schedule-assignment.dto.ts
│   │   │   ├── schedule-assignment.repository.ts
│   │   │   ├── schedule-assignment.service.ts
│   │   │   ├── schedule-assignment.controller.ts
│   │   │   ├── schedule-assignment.routes.ts
│   │   │   └── 🤖 auto-scheduler.service.ts
│   │   └── ... (other modules)
│   └── utils/                    # Utilities
│       ├── directusClient.ts
│       └── schedule.utils.ts
├── AUTO_SCHEDULER_GUIDE.md      # Auto Scheduler documentation
├── API_DOCUMENTATION.md          # Complete API docs
└── package.json
```

## 📚 API Documentation

### Base URL
```
http://localhost:5000/api
```

### Main Endpoints

#### 👥 Employees
```http
GET    /api/employees
GET    /api/employees/:id
POST   /api/employees
PUT    /api/employees/:id
DELETE /api/employees/:id
```

#### 🗓️ Schedule Management
```http
GET    /api/weekly-schedule
POST   /api/weekly-schedule
GET    /api/shifts
POST   /api/shifts
POST   /api/employee-availability
```

#### 🤖 Auto Scheduler
```http
POST   /api/schedule-assignments/auto-schedule
GET    /api/schedule-assignments/schedule/:id/stats
```

#### 📊 Attendance
```http
GET    /api/attendance-logs
POST   /api/attendance-logs
GET    /api/attendance-adjustments
```

#### 💰 Payroll
```http
GET    /api/salary-schemes
GET    /api/salary-requests
GET    /api/deductions
```

**📚 Full Documentation:** See [API_DOCUMENTATION.md](./API_DOCUMENTATION.md)

### Swagger UI
```
http://localhost:5000/api-docs
```

## 🔐 Authentication

### API Key (Default)
```http
GET /api/employees
X-API-Key: your_api_key_here
```

### JWT Token (Optional)
```http
POST /api/auth/login
{
  "email": "user@example.com",
  "password": "password"
}

# Then use token
GET /api/employees
Authorization: Bearer <token>
```

## 🧪 Testing

### Run Auto Scheduler Test
```bash
# Test với dry run
curl -X POST http://localhost:5000/api/schedule-assignments/auto-schedule \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your_api_key" \
  -d '{
    "scheduleId": "your-schedule-uuid",
    "dryRun": true
  }'
```

## 📊 Database Schema (Directus Collections)

### Core Collections
- `employees` - Nhân viên
- `positions` - Vị trí công việc
- `roles` - Phân quyền
- `users` - Người dùng hệ thống

### Schedule Collections
- `weekly_schedules` - Lịch tuần
- `shifts` - Ca làm việc
- `shift_types` - Loại ca
- `shift_position_requirements` - Yêu cầu vị trí cho ca

### Availability Collections
- `employee_availability` - Lịch đăng ký của nhân viên
- `employee_availability_positions` - Vị trí đăng ký
- `schedule_assignments` - Kết quả phân công (auto/manual)

### Attendance Collections
- `attendance_logs` - Log chấm công
- `attendance_shifts` - Ca chấm công
- `attendance_adjustments` - Điều chỉnh chấm công

### Payroll Collections
- `contracts` - Hợp đồng
- `salary_schemes` - Chế độ lương
- `salary_requests` - Yêu cầu lương
- `deductions` - Khấu trừ
- `monthly_employee_stats` - Thống kê tháng

### Device Collections
- `devices` - Thiết bị chấm công
- `rfid_cards` - Thẻ RFID
- `device_events` - Sự kiện từ thiết bị

## 🎨 Use Cases

### Case 1: Quán Café Xếp Lịch Tuần
```javascript
// 1. Tạo lịch tuần
const schedule = await createWeeklySchedule({
  week_start: "2025-11-11",
  week_end: "2025-11-17",
  status: "draft"
});

// 2. Tạo ca (morning, afternoon, evening)
const shifts = await bulkCreateShifts(schedule.id, [
  { date: "2025-11-11", type: "morning", positions: { barista: 2, cashier: 1 } },
  { date: "2025-11-11", type: "afternoon", positions: { barista: 2, server: 2 } },
  // ... more shifts
]);

// 3. Nhân viên đăng ký
employees.forEach(emp => {
  emp.registerAvailability(shifts, priority, positions);
});

// 4. 🚀 Auto Schedule
const result = await autoSchedule(schedule.id);

// 5. Review & Publish
if (result.stats.coverageRate > 90) {
  await publishSchedule(schedule.id);
}
```

### Case 2: Nhà Hàng Quản Lý Chấm Công
```javascript
// RFID check-in
POST /api/device-events/check-in
{
  "rfid": "1234567890",
  "device_id": "device-1",
  "timestamp": "2025-11-12T08:05:00Z"
}

// Auto create attendance log
// Link với shift assignment
// Calculate late/early/overtime
```

## 🔧 Configuration

### Auto Scheduler Settings
```typescript
// Trong auto-scheduler.service.ts
const SCORING_WEIGHTS = {
  PRIORITY: 100,      // Ưu tiên cao nhất
  WORKLOAD: 50,       // Cân bằng workload
  PREFERENCE: 30,     // Preference position
  FAIRNESS: 20        // Bonus công bằng
};

const CONSTRAINTS = {
  MAX_SHIFT_HOURS: 12,
  MIN_REST_HOURS: 12,
  MAX_CONSECUTIVE_DAYS: 6
};
```

## 🐛 Troubleshooting

### Issue: Auto Scheduler không assign được
**Solution:**
1. Check availability: `GET /api/employee-availability?shift_id=xxx`
2. Check constraints: Review `max_hours_per_week`
3. Check positions: Đảm bảo positions match
4. Run with `dryRun: true` để see warnings

### Issue: Directus connection error
**Solution:**
1. Check DIRECTUS_URL
2. Check credentials
3. Check Directus permissions
4. Check network/firewall

### Issue: Build errors
**Solution:**
```bash
rm -rf node_modules package-lock.json
npm install
npm run build
```

## 📈 Performance

### Optimizations Applied
- ✅ Batch data loading
- ✅ Efficient filtering
- ✅ Minimal database queries
- ✅ Caching strategies

### Typical Performance
- 50 shifts, 100 employees → ~2-5 seconds
- 200 shifts, 500 employees → ~10-30 seconds

## 🤝 Contributing

1. Fork the repo
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📝 License

MIT License - see LICENSE file

## 👥 Team

- **Backend Developer** - Auto Scheduler Implementation
- **Directus Expert** - Database Schema Design
- **F&B Domain Expert** - Business Logic Consulting

## 📞 Support

- 📧 Email: support@example.com
- 📚 Docs: [API_DOCUMENTATION.md](./API_DOCUMENTATION.md)
- 🤖 Auto Scheduler: [AUTO_SCHEDULER_GUIDE.md](./AUTO_SCHEDULER_GUIDE.md)
- 🐛 Issues: GitHub Issues

## 🎉 Acknowledgments

- Directus Team for amazing headless CMS
- Express.js community
- TypeScript team
- All contributors

---

**Made with ❤️ for F&B Industry**

**🚀 Happy Scheduling!**
