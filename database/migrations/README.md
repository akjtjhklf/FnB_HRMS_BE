# Database Migrations

## Overview
This directory contains SQL migration scripts for the HRMS database schema.

## Migration Files

### 001_init_hrms_schema.sql
Complete schema initialization for HRMS system including:

**Tables Created:**
1. `employees` - Employee master data with user linkage
2. `shift_types` - Shift type definitions (morning, evening, night)
3. `positions` - Job positions (waiter, chef, manager)
4. `shifts` - Individual shift instances
5. `shift_position_requirements` - Required positions per shift
6. `weekly_schedules` - Weekly schedule master records
7. `schedule_assignments` - Employee-shift assignments
8. `employee_availability` - Employee availability preferences
9. `schedule_change_requests` - Swap/change requests
10. `attendance_shifts` - Attendance tracking

**Key Features:**
- ✅ Foreign key constraints for data integrity
- ✅ Indexes for performance optimization
- ✅ `user_id` field in employees for auth integration
- ✅ `from_assignment_id` & `to_assignment_id` for swap logic
- ✅ Attendance tracking with late/early leave calculation

## How to Run

### First Time Setup
```bash
# Make sure Directus core tables exist first
# Then run HRMS schema migration
mysql -u your_user -p your_database < database/migrations/001_init_hrms_schema.sql
```

### Docker Setup
If using Docker, the migration will run automatically on container startup.

## Important Notes

⚠️ **Prerequisites:**
- Directus core tables MUST exist before running this migration
- Specifically requires: `directus_users` table

✅ **Safe to Re-run:**
- All CREATE statements use `IF NOT EXISTS`
- Can be run multiple times without errors

🔑 **Critical Fields:**
- `employees.user_id` - Links employee to Directus user (for attendance auth)
- `schedule_change_requests.from_assignment_id` - Required for swap logic
- `schedule_change_requests.to_assignment_id` - Required for swap logic

## Schema Diagram

```
directus_users
      ↓ (user_id)
  employees ←─────────┐
      ↓               │
  schedule_assignments│
      ↓               │
  attendance_shifts   │
                      │
  schedule_change_requests
```

## Troubleshooting

**Error: Table 'directus_users' doesn't exist**
- Solution: Run Directus bootstrap first

**Error: Duplicate key**
- Solution: Check if tables already exist, migration is idempotent

**Error: Foreign key constraint fails**
- Solution: Ensure Directus tables exist and contain required data
