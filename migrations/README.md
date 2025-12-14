# Database Migration Instructions

## ⚠️ IMPORTANT: Backup First!

Before running the migration, **BACKUP YOUR DATABASE**:

```bash
# For MySQL/MariaDB
mysqldump -u root -p your_database_name > backup_$(date +%Y%m%d_%H%M%S).sql
```

## Running the Migration

### Method 1: Using MySQL Command Line (Recommended)

```bash
# Navigate to the project directory
cd c:\Users\nguye\OneDrive\Desktop\HRMS\BE\FnB_HRMS_BE

# Run the migration
mysql -u root -p your_database_name < migrations/001_add_missing_fields.sql
```

### Method 2: Using MySQL Workbench or phpMyAdmin

1. Open MySQL Workbench or phpMyAdmin
2. Select your HRMS database
3. Open the SQL tab
4. Copy and paste the contents of `migrations/001_add_missing_fields.sql`
5. Execute the script

### Method 3: Using Directus (If applicable)

Directus may auto-detect the new fields if you restart the server after running the migration.

## What This Migration Does

### 1. `contracts` Table
- ✅ Adds `salary_scheme_id` field (CHAR(36), nullable)
- ✅ Creates foreign key to `salary_schemes`
- ✅ Adds index for performance

### 2. `salary_requests` Table
- ✅ Adds `type` enum field ('raise', 'adjustment')
- ✅ Adds `current_scheme_id`, `proposed_scheme_id` fields
- ✅ Adds `current_rate`, `proposed_rate` fields
- ✅ Adds `payroll_id`, `adjustment_amount` fields
- ✅ Adds `reason`, `manager_note` text fields
- ✅ Updates `status` enum
- ✅ Creates all foreign keys and indexes

### 3. `monthly_payrolls` Table
- ✅ Ensures `contract_id`, `salary_scheme_id` exist
- ✅ Ensures `pay_type`, `hourly_rate` exist
- ✅ Creates foreign keys and indexes

### 4. `employees` Table
- ✅ Ensures `scheme_id` exists
- ✅ Updates `position_id` to support M2M
- ✅ Creates foreign keys and indexes

## After Migration

1. **Restart Directus** (if using):
   ```bash
   # Stop and restart your Directus instance
   ```

2. **Restart Backend API**:
   ```bash
   cd c:\Users\nguye\OneDrive\Desktop\HRMS\BE\FnB_HRMS_BE
   yarn dev
   ```

3. **Test the changes**:
   - Create a new contract with a salary scheme
   - Verify the data is saved correctly
   - Check the frontend displays properly

## Rollback (If Something Goes Wrong)

If you encounter issues, restore from backup:

```bash
mysql -u root -p your_database_name < backup_YYYYMMDD_HHMMSS.sql
```

## Notes

- The migration uses `IF NOT EXISTS` to prevent errors if fields already exist
- All foreign keys are set to `ON DELETE SET NULL` for data safety
- Indexes are created for better query performance
- A validation query runs at the end to verify all constraints
