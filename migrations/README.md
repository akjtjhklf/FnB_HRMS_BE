# 🚀 How to Use init.sql

## Quick Start

### 1. Create Database

```bash
mysql -u root -p
```

```sql
CREATE DATABASE hrms_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 2. Run Init Script

```bash
mysql -u root -p hrms_db < migrations/init.sql
```

### 3. Verify Installation

```sql
USE hrms_db;
SHOW TABLES;
SELECT * FROM directus_roles;
SELECT * FROM positions;
SELECT * FROM shift_types;
```

---

## What Gets Created

### ✅ Tables (31 total)

- **System**: 5 tables (roles, users, policies, permissions, files)
- **HR**: 6 tables (employees, positions, contracts, salary schemes, requests, deductions)
- **Schedule**: 9 tables (schedules, shifts, assignments, availability, change requests)
- **Attendance**: 5 tables (logs, shifts, adjustments, devices, RFID cards)
- **Payroll**: 2 tables (monthly payrolls, employee stats)
- **Notifications**: 2 tables (notifications, logs)

### ✅ Relationships

- All foreign keys with proper cascading rules
- Parent-child relationships between entities

### ✅ Performance Indexes

- Primary keys on all tables
- Foreign key indexes
- 5 composite indexes for common queries
- Status and date indexes

### ✅ Seed Data

- 3 default roles (Admin, Manager, Employee)
- 5 positions (Server, Bartender, Chef, Cashier, Host)
- 4 shift types (Morning, Afternoon, Night, Full Day)

### ✅ Database Views

- `v_employee_details` - Full employee information
- `v_active_contracts` - Active contracts with salary info
- `v_current_month_attendance` - Current month attendance summary

---

## Environment Variables

Update your `.env`:

```env
DB_HOST=localhost
DB_PORT=3306
DB_DATABASE=hrms_db
DB_USER=root
DB_PASSWORD=your_password

# Directus
DIRECTUS_URL=http://localhost:8055
```

---

## Reset Database (Caution!)

To reset and re-initialize:

```bash
# Drop and recreate
mysql -u root -p -e "DROP DATABASE IF EXISTS hrms_db; CREATE DATABASE hrms_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

# Re-run init
mysql -u root -p hrms_db < migrations/init.sql
```

---

## Database Statistics

After initialization:

- **Total Tables**: 31
- **Total Indexes**: ~70+ (including auto-created FK indexes)
- **Total Views**: 3
- **Initial Records**: ~12 (roles + positions + shift types)

---

## Next Steps

1. ✅ Run the init script
2. Configure Directus connection
3. Test user authentication
4. Create your first admin user
5. Begin adding employees

---

## Troubleshooting

### Error: "Table already exists"

Switch to `DROP TABLE IF EXISTS` or reset database.

### Error: "Foreign key constraint fails"

Ensure parent tables are created first (already handled in init.sql).

### Error: "Access denied"

Check MySQL user permissions:

```sql
GRANT ALL PRIVILEGES ON hrms_db.* TO 'your_user'@'localhost';
FLUSH PRIVILEGES;
```

---

## Schema Updates

For future schema changes, create migration files in `migrations/`:

- `migrations/001_add_new_feature.sql`
- `migrations/002_update_employee_fields.sql`
- etc.

Keep `init.sql` as the source of truth for fresh installations.
