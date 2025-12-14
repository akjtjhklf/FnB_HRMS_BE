-- ============================================================================
-- MIGRATION: SYNC DATABASE SCHEMA WITH CURRENT CODE
-- Generated: 2025-12-03
-- Purpose: Update database tables to match TypeScript model definitions
-- 
-- ⚠️  IMPORTANT: Run this after backing up your database!
-- ⚠️  Review each section before running
-- ============================================================================

SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0;
SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='TRADITIONAL';

-- ============================================================================
-- HELPER: Create stored procedure for safe column operations
-- ============================================================================

DELIMITER //

DROP PROCEDURE IF EXISTS AddColumnIfNotExists//

CREATE PROCEDURE AddColumnIfNotExists(
    IN tableName VARCHAR(64),
    IN columnName VARCHAR(64),
    IN columnDef VARCHAR(500)
)
BEGIN
    DECLARE column_exists INT DEFAULT 0;
    
    SELECT COUNT(*) INTO column_exists
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = tableName
    AND COLUMN_NAME = columnName;
    
    IF column_exists = 0 THEN
        SET @sql = CONCAT('ALTER TABLE `', tableName, '` ADD COLUMN `', columnName, '` ', columnDef);
        PREPARE stmt FROM @sql;
        EXECUTE stmt;
        DEALLOCATE PREPARE stmt;
        SELECT CONCAT('Added column: ', tableName, '.', columnName) AS result;
    ELSE
        SELECT CONCAT('Column already exists: ', tableName, '.', columnName) AS result;
    END IF;
END//

DROP PROCEDURE IF EXISTS DropIndexIfExists//

CREATE PROCEDURE DropIndexIfExists(
    IN tableName VARCHAR(64),
    IN indexName VARCHAR(64)
)
BEGIN
    DECLARE index_exists INT DEFAULT 0;
    
    SELECT COUNT(*) INTO index_exists
    FROM INFORMATION_SCHEMA.STATISTICS
    WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = tableName
    AND INDEX_NAME = indexName;
    
    IF index_exists > 0 THEN
        SET @sql = CONCAT('ALTER TABLE `', tableName, '` DROP INDEX `', indexName, '`');
        PREPARE stmt FROM @sql;
        EXECUTE stmt;
        DEALLOCATE PREPARE stmt;
        SELECT CONCAT('Dropped index: ', tableName, '.', indexName) AS result;
    END IF;
END//

DROP PROCEDURE IF EXISTS CreateIndexIfNotExists//

CREATE PROCEDURE CreateIndexIfNotExists(
    IN tableName VARCHAR(64),
    IN indexName VARCHAR(64),
    IN columnName VARCHAR(64)
)
BEGIN
    DECLARE index_exists INT DEFAULT 0;
    
    SELECT COUNT(*) INTO index_exists
    FROM INFORMATION_SCHEMA.STATISTICS
    WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = tableName
    AND INDEX_NAME = indexName;
    
    IF index_exists = 0 THEN
        SET @sql = CONCAT('CREATE INDEX `', indexName, '` ON `', tableName, '` (`', columnName, '`)');
        PREPARE stmt FROM @sql;
        EXECUTE stmt;
        DEALLOCATE PREPARE stmt;
        SELECT CONCAT('Created index: ', indexName) AS result;
    END IF;
END//

DELIMITER ;

-- ============================================================================
-- 1. UPDATE weekly_schedule TABLE
-- Model: status = 'draft' | 'scheduled' | 'finalized' | 'cancelled'
-- Current DB: status ENUM('draft', 'published', 'archived')
-- ============================================================================

-- Convert existing values first (safe updates)
UPDATE `weekly_schedule` SET `status` = 'draft' WHERE `status` = 'published';
UPDATE `weekly_schedule` SET `status` = 'draft' WHERE `status` = 'archived';

-- Modify the ENUM to include all values (both old and new for backward compatibility)
ALTER TABLE `weekly_schedule`
MODIFY COLUMN `status` ENUM('draft', 'scheduled', 'finalized', 'cancelled', 'published', 'archived') NOT NULL DEFAULT 'draft';

SELECT '✅ 1. weekly_schedule status enum updated' AS status;

-- ============================================================================
-- 2. UPDATE shifts TABLE
-- Model: start_at, end_at are strings (could be TIME or DATETIME)
-- Current DB: start_at TIME, end_at TIME
-- Code is now converting to DATETIME format
-- ============================================================================

-- Change start_at and end_at from TIME to DATETIME
ALTER TABLE `shifts`
MODIFY COLUMN `start_at` DATETIME NULL,
MODIFY COLUMN `end_at` DATETIME NULL;

SELECT '✅ 2. shifts start_at/end_at changed to DATETIME' AS status;

-- ============================================================================
-- 3. UPDATE devices TABLE
-- Model: name, device_key, current_mode, employee_id_pending, etc.
-- Current DB: device_name, device_type (different structure)
-- ============================================================================

CALL AddColumnIfNotExists('devices', 'name', 'VARCHAR(255) NULL AFTER `id`');
CALL AddColumnIfNotExists('devices', 'device_key', 'VARCHAR(255) NULL AFTER `location`');
CALL AddColumnIfNotExists('devices', 'firmware_version', 'VARCHAR(100) NULL AFTER `mac_address`');
CALL AddColumnIfNotExists('devices', 'last_seen_at', 'DATETIME NULL AFTER `firmware_version`');
CALL AddColumnIfNotExists('devices', 'current_mode', "ENUM('attendance', 'enroll') NOT NULL DEFAULT 'attendance' AFTER `status`");
CALL AddColumnIfNotExists('devices', 'employee_id_pending', 'CHAR(36) NULL AFTER `current_mode`');
CALL AddColumnIfNotExists('devices', 'metadata', 'JSON NULL AFTER `employee_id_pending`');

-- Update status enum to include both old and new values
ALTER TABLE `devices`
MODIFY COLUMN `status` ENUM('online', 'offline', 'decommissioned', 'active', 'inactive', 'maintenance') NOT NULL DEFAULT 'active';

SELECT '✅ 3. devices table updated' AS status;

-- ============================================================================
-- 4. UPDATE attendance_logs TABLE
-- Model: card_uid, rfid_card_id, event_type, event_time, raw_payload, processed, match_attempted_at
-- Current DB: employee_id, check_in, check_out, work_date, etc.
-- ============================================================================

CALL AddColumnIfNotExists('attendance_logs', 'card_uid', 'VARCHAR(255) NULL AFTER `id`');
CALL AddColumnIfNotExists('attendance_logs', 'rfid_card_id', 'CHAR(36) NULL AFTER `card_uid`');
CALL AddColumnIfNotExists('attendance_logs', 'event_type', "ENUM('tap', 'clock_in', 'clock_out') NULL AFTER `device_id`");
CALL AddColumnIfNotExists('attendance_logs', 'event_time', 'DATETIME NULL AFTER `event_type`');
CALL AddColumnIfNotExists('attendance_logs', 'raw_payload', 'TEXT NULL AFTER `event_time`');
CALL AddColumnIfNotExists('attendance_logs', 'processed', 'TINYINT(1) NULL DEFAULT 0 AFTER `raw_payload`');
CALL AddColumnIfNotExists('attendance_logs', 'match_attempted_at', 'DATETIME NULL AFTER `processed`');

-- Allow employee_id to be nullable (for unmatched cards)
ALTER TABLE `attendance_logs`
MODIFY COLUMN `employee_id` CHAR(36) NULL;

-- Update existing data: set event_time from check_in if exists
UPDATE `attendance_logs` 
SET `event_time` = `check_in` 
WHERE `event_time` IS NULL AND `check_in` IS NOT NULL;

-- Set event_type for existing records
UPDATE `attendance_logs` 
SET `event_type` = 'clock_in' 
WHERE `event_type` IS NULL AND `check_in` IS NOT NULL;

SELECT '✅ 4. attendance_logs table updated' AS status;

-- ============================================================================
-- 5. UPDATE attendance_shifts TABLE
-- Model: shift_id, schedule_assignment_id, employee_id, clock_in, clock_out, etc.
-- Current DB: attendance_log_id, shift_id (M2M junction table)
-- ============================================================================

CALL AddColumnIfNotExists('attendance_shifts', 'schedule_assignment_id', 'CHAR(36) NULL AFTER `shift_id`');
CALL AddColumnIfNotExists('attendance_shifts', 'employee_id', 'CHAR(36) NULL AFTER `schedule_assignment_id`');
CALL AddColumnIfNotExists('attendance_shifts', 'clock_in', 'DATETIME NULL AFTER `employee_id`');
CALL AddColumnIfNotExists('attendance_shifts', 'clock_out', 'DATETIME NULL AFTER `clock_in`');
CALL AddColumnIfNotExists('attendance_shifts', 'worked_minutes', 'INT NULL AFTER `clock_out`');
CALL AddColumnIfNotExists('attendance_shifts', 'late_minutes', 'INT NULL AFTER `worked_minutes`');
CALL AddColumnIfNotExists('attendance_shifts', 'early_leave_minutes', 'INT NULL AFTER `late_minutes`');
CALL AddColumnIfNotExists('attendance_shifts', 'status', "ENUM('present', 'absent', 'partial') NOT NULL DEFAULT 'present' AFTER `early_leave_minutes`");
CALL AddColumnIfNotExists('attendance_shifts', 'manual_adjusted', 'TINYINT(1) NULL DEFAULT 0 AFTER `status`');
CALL AddColumnIfNotExists('attendance_shifts', 'notes', 'TEXT NULL AFTER `manual_adjusted`');
CALL AddColumnIfNotExists('attendance_shifts', 'updated_at', 'DATETIME NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP');

-- Make shift_id nullable
ALTER TABLE `attendance_shifts`
MODIFY COLUMN `shift_id` CHAR(36) NULL;

-- Drop the old unique constraint if exists
CALL DropIndexIfExists('attendance_shifts', 'uk_attendance_shifts');

SELECT '✅ 5. attendance_shifts table updated' AS status;

-- ============================================================================
-- 6. UPDATE deductions TABLE
-- Model: employee_id, type (advance|penalty|expense), amount, currency, related_shift_id, note, status
-- Current DB: payroll_id, type, amount, notes
-- ============================================================================

CALL AddColumnIfNotExists('deductions', 'employee_id', 'CHAR(36) NULL AFTER `id`');
CALL AddColumnIfNotExists('deductions', 'currency', "VARCHAR(10) NULL DEFAULT 'VND' AFTER `amount`");
CALL AddColumnIfNotExists('deductions', 'related_shift_id', 'CHAR(36) NULL AFTER `currency`');
CALL AddColumnIfNotExists('deductions', 'note', 'TEXT NULL AFTER `related_shift_id`');
CALL AddColumnIfNotExists('deductions', 'status', "ENUM('pending', 'applied', 'reimbursed') NOT NULL DEFAULT 'pending'");

-- Modify type column to support more types
ALTER TABLE `deductions`
MODIFY COLUMN `type` VARCHAR(100) NOT NULL;

-- Make payroll_id nullable
ALTER TABLE `deductions`
MODIFY COLUMN `payroll_id` CHAR(36) NULL;

SELECT '✅ 6. deductions table updated' AS status;

-- ============================================================================
-- 7. UPDATE rfid_cards TABLE
-- Model: status = 'active' | 'suspended' | 'lost' | 'revoked'
-- Current DB: status ENUM('active', 'inactive', 'lost', 'damaged')
-- ============================================================================

-- Update existing values
UPDATE `rfid_cards` SET `status` = 'active' WHERE `status` = 'inactive';
UPDATE `rfid_cards` SET `status` = 'lost' WHERE `status` = 'damaged';

-- Modify the ENUM to include all values
ALTER TABLE `rfid_cards`
MODIFY COLUMN `status` ENUM('active', 'suspended', 'lost', 'revoked', 'inactive', 'damaged') NOT NULL DEFAULT 'active';

-- Add revoked_at column
CALL AddColumnIfNotExists('rfid_cards', 'revoked_at', 'DATETIME NULL AFTER `issued_at`');

SELECT '✅ 7. rfid_cards table updated' AS status;

-- ============================================================================
-- 8. UPDATE notifications TABLE
-- Model: title, message, action_url, recipient_type, status, user_ids, scheduled_at, sent_at, created_by
-- Current DB: type, title, message, data
-- ============================================================================

CALL AddColumnIfNotExists('notifications', 'action_url', 'VARCHAR(512) NULL AFTER `message`');
CALL AddColumnIfNotExists('notifications', 'recipient_type', "ENUM('ALL', 'SPECIFIC') NOT NULL DEFAULT 'ALL' AFTER `action_url`");
CALL AddColumnIfNotExists('notifications', 'status', "ENUM('draft', 'scheduled', 'sent', 'failed') NOT NULL DEFAULT 'draft' AFTER `recipient_type`");
CALL AddColumnIfNotExists('notifications', 'user_ids', 'TEXT NULL AFTER `status`');
CALL AddColumnIfNotExists('notifications', 'scheduled_at', 'DATETIME NULL AFTER `user_ids`');
CALL AddColumnIfNotExists('notifications', 'sent_at', 'DATETIME NULL AFTER `scheduled_at`');
CALL AddColumnIfNotExists('notifications', 'created_by', 'CHAR(36) NULL AFTER `sent_at`');
CALL AddColumnIfNotExists('notifications', 'updated_at', 'DATETIME NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP');

SELECT '✅ 8. notifications table updated' AS status;

-- ============================================================================
-- 9. UPDATE employee_availability TABLE
-- Model has shift_id, status (available|unavailable|preferred)
-- Current DB has day_of_week, start_time, end_time
-- ============================================================================

CALL AddColumnIfNotExists('employee_availability', 'shift_id', 'CHAR(36) NULL AFTER `employee_id`');
CALL AddColumnIfNotExists('employee_availability', 'availability_status', "ENUM('available', 'unavailable', 'preferred') NOT NULL DEFAULT 'available'");

-- Make existing columns nullable for shift-based availability
ALTER TABLE `employee_availability`
MODIFY COLUMN `day_of_week` ENUM('monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday') NULL,
MODIFY COLUMN `start_time` TIME NULL,
MODIFY COLUMN `end_time` TIME NULL;

SELECT '✅ 9. employee_availability table updated' AS status;

-- ============================================================================
-- 10. UPDATE monthly_payrolls TABLE
-- Ensure all columns from model exist
-- ============================================================================

CALL AddColumnIfNotExists('monthly_payrolls', 'late_penalty', 'DECIMAL(12,2) NULL DEFAULT 0 AFTER `total_early_leave_minutes`');
CALL AddColumnIfNotExists('monthly_payrolls', 'early_leave_penalty', 'DECIMAL(12,2) NULL DEFAULT 0 AFTER `late_penalty`');

SELECT '✅ 10. monthly_payrolls table verified' AS status;

-- ============================================================================
-- 11. UPDATE salary_requests TABLE
-- ============================================================================

CALL AddColumnIfNotExists('salary_requests', 'adjustment_amount', 'DECIMAL(12,2) NULL AFTER `payroll_id`');
CALL AddColumnIfNotExists('salary_requests', 'manager_note', 'TEXT NULL AFTER `reason`');

SELECT '✅ 11. salary_requests table verified' AS status;

-- ============================================================================
-- 12. ADD INDEXES FOR NEW COLUMNS
-- ============================================================================

CALL CreateIndexIfNotExists('attendance_logs', 'idx_attendance_logs_card_uid', 'card_uid');
CALL CreateIndexIfNotExists('attendance_logs', 'idx_attendance_logs_event_type', 'event_type');
CALL CreateIndexIfNotExists('attendance_logs', 'idx_attendance_logs_processed', 'processed');

CALL CreateIndexIfNotExists('attendance_shifts', 'idx_attendance_shifts_employee_id', 'employee_id');
CALL CreateIndexIfNotExists('attendance_shifts', 'idx_attendance_shifts_status', 'status');

CALL CreateIndexIfNotExists('deductions', 'idx_deductions_employee_id', 'employee_id');
CALL CreateIndexIfNotExists('deductions', 'idx_deductions_status', 'status');

CALL CreateIndexIfNotExists('devices', 'idx_devices_device_key', 'device_key');
CALL CreateIndexIfNotExists('devices', 'idx_devices_current_mode', 'current_mode');

CALL CreateIndexIfNotExists('employee_availability', 'idx_employee_availability_shift_id', 'shift_id');

CALL CreateIndexIfNotExists('notifications', 'idx_notifications_status', 'status');
CALL CreateIndexIfNotExists('notifications', 'idx_notifications_recipient_type', 'recipient_type');

SELECT '✅ 12. Indexes created' AS status;

-- ============================================================================
-- 13. DATA MIGRATION FOR EXISTING RECORDS
-- ============================================================================

-- Set default processed flag for attendance_logs
UPDATE `attendance_logs` SET `processed` = 1 WHERE `processed` IS NULL;

-- Set default status for attendance_shifts that don't have one
UPDATE `attendance_shifts` SET `status` = 'present' WHERE `status` IS NULL OR `status` = '';

SELECT '✅ 13. Data migration completed' AS status;

-- ============================================================================
-- 14. FIX shifts TABLE DATA - Convert TIME to DATETIME with shift_date
-- ⚠️  This is a complex migration - review carefully
-- ============================================================================

-- For shifts that have null start_at/end_at after column type change,
-- reconstruct them using shift_type's times
UPDATE `shifts` s
JOIN `shift_types` st ON s.`shift_type_id` = st.`id`
SET 
    s.`start_at` = CONCAT(DATE_FORMAT(s.`shift_date`, '%Y-%m-%d'), ' ', TIME_FORMAT(st.`start_time`, '%H:%i:%s')),
    s.`end_at` = CONCAT(DATE_FORMAT(s.`shift_date`, '%Y-%m-%d'), ' ', TIME_FORMAT(st.`end_time`, '%H:%i:%s'))
WHERE (s.`start_at` IS NULL OR s.`end_at` IS NULL OR s.`start_at` = '0000-00-00 00:00:00')
AND st.`start_time` IS NOT NULL AND st.`end_time` IS NOT NULL;

-- Handle cross-midnight shifts: if end_time < start_time, add 1 day to end_at
UPDATE `shifts` s
JOIN `shift_types` st ON s.`shift_type_id` = st.`id`
SET s.`end_at` = DATE_ADD(s.`end_at`, INTERVAL 1 DAY)
WHERE st.`cross_midnight` = 1 
AND TIME(s.`end_at`) < TIME(s.`start_at`);

SELECT '✅ 14. shifts datetime reconstruction completed' AS status;

-- ============================================================================
-- CLEANUP: Remove helper procedures
-- ============================================================================

DROP PROCEDURE IF EXISTS AddColumnIfNotExists;
DROP PROCEDURE IF EXISTS DropIndexIfExists;
DROP PROCEDURE IF EXISTS CreateIndexIfNotExists;

-- ============================================================================
-- RESTORE SETTINGS
-- ============================================================================
SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS;
SET SQL_MODE=@OLD_SQL_MODE;

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

SELECT '========================================' AS '=';
SELECT 'VERIFICATION RESULTS' AS 'Section';
SELECT '========================================' AS '=';

-- Check weekly_schedule status values
SELECT 'weekly_schedule status values:' AS 'Table';
SELECT DISTINCT `status`, COUNT(*) as count FROM `weekly_schedule` GROUP BY `status`;

-- Check shifts columns
SELECT 'shifts table structure:' AS 'Table';
SELECT COLUMN_NAME, COLUMN_TYPE, IS_NULLABLE, COLUMN_DEFAULT 
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'shifts'
ORDER BY ORDINAL_POSITION;

-- Sample shift data to verify datetime conversion
SELECT 'Sample shifts after datetime conversion:' AS 'Table';
SELECT id, shift_date, start_at, end_at FROM `shifts` LIMIT 5;

SELECT '========================================' AS '=';
SELECT '✅ SCHEMA SYNC MIGRATION COMPLETED!' AS 'Status';
SELECT '========================================' AS '=';

SELECT 'NOTES:' AS 'Info';
SELECT '1. Review the verification results above' AS 'Note';
SELECT '2. Check that shifts have correct start_at/end_at values' AS 'Note';
SELECT '3. Test your application thoroughly after this migration' AS 'Note';
