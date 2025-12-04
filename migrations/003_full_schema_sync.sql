-- ============================================================================
-- FULL DATABASE SCHEMA SYNC
-- Generated: 2025-12-03
-- Purpose: Complete database schema that matches current TypeScript code
-- 
-- ⚠️  This script will CREATE tables if not exist and UPDATE existing tables
-- ⚠️  Safe to run multiple times (idempotent)
-- ⚠️  Backup your database before running!
-- ============================================================================

SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0;
SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='TRADITIONAL';

-- ============================================================================
-- HELPER PROCEDURES
-- ============================================================================

DELIMITER //

DROP PROCEDURE IF EXISTS AddColumnIfNotExists//
CREATE PROCEDURE AddColumnIfNotExists(
    IN p_table VARCHAR(64),
    IN p_column VARCHAR(64),
    IN p_definition VARCHAR(500)
)
BEGIN
    DECLARE col_exists INT DEFAULT 0;
    SELECT COUNT(*) INTO col_exists
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = p_table AND COLUMN_NAME = p_column;
    
    IF col_exists = 0 THEN
        SET @sql = CONCAT('ALTER TABLE `', p_table, '` ADD COLUMN `', p_column, '` ', p_definition);
        PREPARE stmt FROM @sql;
        EXECUTE stmt;
        DEALLOCATE PREPARE stmt;
    END IF;
END//

DROP PROCEDURE IF EXISTS CreateIndexIfNotExists//
CREATE PROCEDURE CreateIndexIfNotExists(
    IN p_table VARCHAR(64),
    IN p_index VARCHAR(64),
    IN p_column VARCHAR(128)
)
BEGIN
    DECLARE idx_exists INT DEFAULT 0;
    SELECT COUNT(*) INTO idx_exists
    FROM INFORMATION_SCHEMA.STATISTICS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = p_table AND INDEX_NAME = p_index;
    
    IF idx_exists = 0 THEN
        SET @sql = CONCAT('CREATE INDEX `', p_index, '` ON `', p_table, '` (', p_column, ')');
        PREPARE stmt FROM @sql;
        EXECUTE stmt;
        DEALLOCATE PREPARE stmt;
    END IF;
END//

DROP PROCEDURE IF EXISTS DropFKIfExists//
CREATE PROCEDURE DropFKIfExists(
    IN p_table VARCHAR(64),
    IN p_fk VARCHAR(64)
)
BEGIN
    DECLARE fk_exists INT DEFAULT 0;
    SELECT COUNT(*) INTO fk_exists
    FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = p_table AND CONSTRAINT_NAME = p_fk AND CONSTRAINT_TYPE = 'FOREIGN KEY';
    
    IF fk_exists > 0 THEN
        SET @sql = CONCAT('ALTER TABLE `', p_table, '` DROP FOREIGN KEY `', p_fk, '`');
        PREPARE stmt FROM @sql;
        EXECUTE stmt;
        DEALLOCATE PREPARE stmt;
    END IF;
END//

DELIMITER ;

-- ============================================================================
-- 1. POSITIONS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS `positions` (
    `id` CHAR(36) NOT NULL PRIMARY KEY DEFAULT (UUID()),
    `name` VARCHAR(255) NOT NULL,
    `description` TEXT NULL,
    `department_id` CHAR(36) NULL,
    `created_at` DATETIME NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CALL CreateIndexIfNotExists('positions', 'idx_positions_name', '`name`');

-- ============================================================================
-- 2. SALARY_SCHEMES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS `salary_schemes` (
    `id` CHAR(36) NOT NULL PRIMARY KEY DEFAULT (UUID()),
    `name` VARCHAR(255) NOT NULL,
    `position_id` CHAR(36) NULL,
    `pay_type` ENUM('hourly', 'fixed_shift', 'monthly') NOT NULL DEFAULT 'monthly',
    `rate` DECIMAL(12,2) NOT NULL,
    `min_hours` INT NULL,
    `overtime_multiplier` DECIMAL(4,2) NULL DEFAULT 1.5,
    `effective_from` DATE NULL,
    `effective_to` DATE NULL,
    `is_active` TINYINT(1) NOT NULL DEFAULT 1,
    `notes` TEXT NULL,
    `metadata` JSON NULL,
    `created_at` DATETIME NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CALL AddColumnIfNotExists('salary_schemes', 'position_id', 'CHAR(36) NULL AFTER `name`');
CALL AddColumnIfNotExists('salary_schemes', 'pay_type', "ENUM('hourly', 'fixed_shift', 'monthly') NOT NULL DEFAULT 'monthly' AFTER `position_id`");
CALL AddColumnIfNotExists('salary_schemes', 'min_hours', 'INT NULL AFTER `rate`');
CALL AddColumnIfNotExists('salary_schemes', 'overtime_multiplier', 'DECIMAL(4,2) NULL DEFAULT 1.5 AFTER `min_hours`');
CALL AddColumnIfNotExists('salary_schemes', 'effective_from', 'DATE NULL AFTER `overtime_multiplier`');
CALL AddColumnIfNotExists('salary_schemes', 'effective_to', 'DATE NULL AFTER `effective_from`');
CALL AddColumnIfNotExists('salary_schemes', 'is_active', 'TINYINT(1) NOT NULL DEFAULT 1 AFTER `effective_to`');
CALL AddColumnIfNotExists('salary_schemes', 'metadata', 'JSON NULL AFTER `notes`');

CALL CreateIndexIfNotExists('salary_schemes', 'idx_salary_schemes_name', '`name`');
CALL CreateIndexIfNotExists('salary_schemes', 'idx_salary_schemes_position_id', '`position_id`');
CALL CreateIndexIfNotExists('salary_schemes', 'idx_salary_schemes_is_active', '`is_active`');
CALL CreateIndexIfNotExists('salary_schemes', 'idx_salary_schemes_pay_type', '`pay_type`');

-- ============================================================================
-- 3. EMPLOYEES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS `employees` (
    `id` CHAR(36) NOT NULL PRIMARY KEY DEFAULT (UUID()),
    `user_id` CHAR(36) NULL,
    `employee_code` VARCHAR(50) NOT NULL,
    `first_name` VARCHAR(100) NULL,
    `last_name` VARCHAR(100) NULL,
    `full_name` VARCHAR(200) NULL,
    `dob` DATE NULL,
    `gender` ENUM('male', 'female', 'other') NULL,
    `personal_id` VARCHAR(50) NULL,
    `phone` VARCHAR(20) NULL,
    `email` VARCHAR(255) NULL,
    `address` TEXT NULL,
    `hire_date` DATE NULL,
    `termination_date` DATE NULL,
    `status` ENUM('active', 'on_leave', 'suspended', 'terminated') NOT NULL DEFAULT 'active',
    `scheme_id` CHAR(36) NULL,
    `position_id` TEXT NULL,
    `default_work_hours_per_week` DECIMAL(5,2) NULL DEFAULT 40.00,
    `max_hours_per_week` DECIMAL(5,2) NULL DEFAULT 40.00,
    `max_consecutive_days` INT NULL DEFAULT 7,
    `min_rest_hours_between_shifts` INT NULL DEFAULT 8,
    `photo_url` VARCHAR(512) NULL,
    `emergency_contact_name` VARCHAR(255) NULL,
    `emergency_contact_phone` VARCHAR(20) NULL,
    `notes` TEXT NULL,
    `metadata` JSON NULL,
    `created_at` DATETIME NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    `deleted_at` DATETIME NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CALL AddColumnIfNotExists('employees', 'user_id', 'CHAR(36) NULL AFTER `id`');
CALL AddColumnIfNotExists('employees', 'full_name', 'VARCHAR(200) NULL AFTER `last_name`');
CALL AddColumnIfNotExists('employees', 'gender', "ENUM('male', 'female', 'other') NULL AFTER `dob`");
CALL AddColumnIfNotExists('employees', 'personal_id', 'VARCHAR(50) NULL AFTER `gender`');
CALL AddColumnIfNotExists('employees', 'termination_date', 'DATE NULL AFTER `hire_date`');
CALL AddColumnIfNotExists('employees', 'scheme_id', 'CHAR(36) NULL AFTER `status`');
CALL AddColumnIfNotExists('employees', 'position_id', 'TEXT NULL AFTER `scheme_id`');
CALL AddColumnIfNotExists('employees', 'default_work_hours_per_week', 'DECIMAL(5,2) NULL DEFAULT 40.00 AFTER `position_id`');
CALL AddColumnIfNotExists('employees', 'max_hours_per_week', 'DECIMAL(5,2) NULL DEFAULT 40.00 AFTER `default_work_hours_per_week`');
CALL AddColumnIfNotExists('employees', 'max_consecutive_days', 'INT NULL DEFAULT 7 AFTER `max_hours_per_week`');
CALL AddColumnIfNotExists('employees', 'min_rest_hours_between_shifts', 'INT NULL DEFAULT 8 AFTER `max_consecutive_days`');
CALL AddColumnIfNotExists('employees', 'photo_url', 'VARCHAR(512) NULL AFTER `min_rest_hours_between_shifts`');
CALL AddColumnIfNotExists('employees', 'emergency_contact_name', 'VARCHAR(255) NULL AFTER `photo_url`');
CALL AddColumnIfNotExists('employees', 'emergency_contact_phone', 'VARCHAR(20) NULL AFTER `emergency_contact_name`');
CALL AddColumnIfNotExists('employees', 'metadata', 'JSON NULL AFTER `notes`');
CALL AddColumnIfNotExists('employees', 'deleted_at', 'DATETIME NULL AFTER `updated_at`');

CALL CreateIndexIfNotExists('employees', 'idx_employees_user_id', '`user_id`');
CALL CreateIndexIfNotExists('employees', 'idx_employees_employee_code', '`employee_code`');
CALL CreateIndexIfNotExists('employees', 'idx_employees_status', '`status`');
CALL CreateIndexIfNotExists('employees', 'idx_employees_scheme_id', '`scheme_id`');

-- ============================================================================
-- 4. CONTRACTS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS `contracts` (
    `id` CHAR(36) NOT NULL PRIMARY KEY DEFAULT (UUID()),
    `employee_id` CHAR(36) NOT NULL,
    `contract_type` ENUM('full_time', 'part_time', 'casual', 'probation') NULL,
    `start_date` DATE NULL,
    `end_date` DATE NULL,
    `base_salary` DECIMAL(12,2) NULL,
    `salary_scheme_id` CHAR(36) NULL,
    `probation_end_date` DATE NULL,
    `signed_doc_url` VARCHAR(512) NULL,
    `is_active` TINYINT(1) NULL DEFAULT 1,
    `notes` TEXT NULL,
    `created_at` DATETIME NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CALL AddColumnIfNotExists('contracts', 'salary_scheme_id', 'CHAR(36) NULL AFTER `base_salary`');
CALL AddColumnIfNotExists('contracts', 'probation_end_date', 'DATE NULL AFTER `salary_scheme_id`');
CALL AddColumnIfNotExists('contracts', 'signed_doc_url', 'VARCHAR(512) NULL AFTER `probation_end_date`');
CALL AddColumnIfNotExists('contracts', 'is_active', 'TINYINT(1) NULL DEFAULT 1 AFTER `signed_doc_url`');

CALL CreateIndexIfNotExists('contracts', 'idx_contracts_employee_id', '`employee_id`');
CALL CreateIndexIfNotExists('contracts', 'idx_contracts_salary_scheme_id', '`salary_scheme_id`');
CALL CreateIndexIfNotExists('contracts', 'idx_contracts_is_active', '`is_active`');

-- ============================================================================
-- 5. SHIFT_TYPES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS `shift_types` (
    `id` CHAR(36) NOT NULL PRIMARY KEY DEFAULT (UUID()),
    `name` VARCHAR(255) NOT NULL,
    `start_time` TIME NOT NULL,
    `end_time` TIME NOT NULL,
    `cross_midnight` TINYINT(1) NULL DEFAULT 0,
    `notes` TEXT NULL,
    `created_at` DATETIME NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CALL AddColumnIfNotExists('shift_types', 'cross_midnight', 'TINYINT(1) NULL DEFAULT 0 AFTER `end_time`');

CALL CreateIndexIfNotExists('shift_types', 'idx_shift_types_name', '`name`');

-- ============================================================================
-- 6. WEEKLY_SCHEDULE TABLE
-- Model: status = 'draft' | 'scheduled' | 'finalized' | 'cancelled'
-- ============================================================================
CREATE TABLE IF NOT EXISTS `weekly_schedule` (
    `id` CHAR(36) NOT NULL PRIMARY KEY DEFAULT (UUID()),
    `name` VARCHAR(255) NULL,
    `week_start` DATE NOT NULL,
    `week_end` DATE NOT NULL,
    `status` ENUM('draft', 'scheduled', 'finalized', 'cancelled', 'published', 'archived') NOT NULL DEFAULT 'draft',
    `created_by` CHAR(36) NULL,
    `notes` TEXT NULL,
    `created_at` DATETIME NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Update status column to support all values
ALTER TABLE `weekly_schedule`
MODIFY COLUMN `status` ENUM('draft', 'scheduled', 'finalized', 'cancelled', 'published', 'archived') NOT NULL DEFAULT 'draft';

CALL CreateIndexIfNotExists('weekly_schedule', 'idx_weekly_schedule_week_start', '`week_start`');
CALL CreateIndexIfNotExists('weekly_schedule', 'idx_weekly_schedule_status', '`status`');

-- ============================================================================
-- 7. SHIFTS TABLE
-- Model: start_at, end_at as DATETIME
-- ============================================================================
CREATE TABLE IF NOT EXISTS `shifts` (
    `id` CHAR(36) NOT NULL PRIMARY KEY DEFAULT (UUID()),
    `schedule_id` CHAR(36) NULL,
    `shift_type_id` CHAR(36) NOT NULL,
    `shift_date` DATE NOT NULL,
    `start_at` DATETIME NULL,
    `end_at` DATETIME NULL,
    `total_required` INT NULL,
    `notes` TEXT NULL,
    `metadata` JSON NULL,
    `created_by` CHAR(36) NULL,
    `created_at` DATETIME NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Change start_at/end_at to DATETIME if they are TIME
ALTER TABLE `shifts`
MODIFY COLUMN `start_at` DATETIME NULL,
MODIFY COLUMN `end_at` DATETIME NULL;

CALL AddColumnIfNotExists('shifts', 'schedule_id', 'CHAR(36) NULL AFTER `id`');
CALL AddColumnIfNotExists('shifts', 'total_required', 'INT NULL AFTER `end_at`');
CALL AddColumnIfNotExists('shifts', 'metadata', 'JSON NULL AFTER `notes`');
CALL AddColumnIfNotExists('shifts', 'created_by', 'CHAR(36) NULL AFTER `metadata`');

CALL CreateIndexIfNotExists('shifts', 'idx_shifts_schedule_id', '`schedule_id`');
CALL CreateIndexIfNotExists('shifts', 'idx_shifts_shift_type_id', '`shift_type_id`');
CALL CreateIndexIfNotExists('shifts', 'idx_shifts_shift_date', '`shift_date`');

-- ============================================================================
-- 8. SHIFT_POSITION_REQUIREMENTS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS `shift_position_requirements` (
    `id` CHAR(36) NOT NULL PRIMARY KEY DEFAULT (UUID()),
    `shift_id` CHAR(36) NOT NULL,
    `position_id` CHAR(36) NOT NULL,
    `required_count` INT NOT NULL DEFAULT 1,
    `notes` TEXT NULL,
    `created_at` DATETIME NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CALL CreateIndexIfNotExists('shift_position_requirements', 'idx_spr_shift_id', '`shift_id`');
CALL CreateIndexIfNotExists('shift_position_requirements', 'idx_spr_position_id', '`position_id`');

-- ============================================================================
-- 9. SCHEDULE_ASSIGNMENTS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS `schedule_assignments` (
    `id` CHAR(36) NOT NULL PRIMARY KEY DEFAULT (UUID()),
    `schedule_id` CHAR(36) NULL,
    `shift_id` CHAR(36) NOT NULL,
    `employee_id` CHAR(36) NOT NULL,
    `position_id` CHAR(36) NOT NULL,
    `assigned_by` CHAR(36) NULL,
    `assigned_at` DATETIME NULL,
    `status` ENUM('assigned', 'tentative', 'swapped', 'cancelled') NOT NULL DEFAULT 'assigned',
    `source` ENUM('auto', 'manual') NOT NULL DEFAULT 'manual',
    `note` TEXT NULL,
    `confirmed_by_employee` TINYINT(1) NULL DEFAULT 0,
    `created_at` DATETIME NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CALL AddColumnIfNotExists('schedule_assignments', 'schedule_id', 'CHAR(36) NULL AFTER `id`');
CALL AddColumnIfNotExists('schedule_assignments', 'assigned_by', 'CHAR(36) NULL AFTER `position_id`');
CALL AddColumnIfNotExists('schedule_assignments', 'assigned_at', 'DATETIME NULL AFTER `assigned_by`');
CALL AddColumnIfNotExists('schedule_assignments', 'source', "ENUM('auto', 'manual') NOT NULL DEFAULT 'manual' AFTER `status`");
CALL AddColumnIfNotExists('schedule_assignments', 'note', 'TEXT NULL AFTER `source`');
CALL AddColumnIfNotExists('schedule_assignments', 'confirmed_by_employee', 'TINYINT(1) NULL DEFAULT 0 AFTER `note`');

CALL CreateIndexIfNotExists('schedule_assignments', 'idx_sa_shift_id', '`shift_id`');
CALL CreateIndexIfNotExists('schedule_assignments', 'idx_sa_employee_id', '`employee_id`');
CALL CreateIndexIfNotExists('schedule_assignments', 'idx_sa_status', '`status`');

-- ============================================================================
-- 10. EMPLOYEE_AVAILABILITY TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS `employee_availability` (
    `id` CHAR(36) NOT NULL PRIMARY KEY DEFAULT (UUID()),
    `employee_id` CHAR(36) NOT NULL,
    `shift_id` CHAR(36) NULL,
    `day_of_week` ENUM('monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday') NULL,
    `start_time` TIME NULL,
    `end_time` TIME NULL,
    `status` ENUM('available', 'unavailable', 'preferred') NOT NULL DEFAULT 'available',
    `notes` TEXT NULL,
    `created_at` DATETIME NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CALL AddColumnIfNotExists('employee_availability', 'shift_id', 'CHAR(36) NULL AFTER `employee_id`');
CALL AddColumnIfNotExists('employee_availability', 'status', "ENUM('available', 'unavailable', 'preferred') NOT NULL DEFAULT 'available' AFTER `end_time`");

-- Make day/time columns nullable for shift-based availability
ALTER TABLE `employee_availability`
MODIFY COLUMN `day_of_week` ENUM('monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday') NULL,
MODIFY COLUMN `start_time` TIME NULL,
MODIFY COLUMN `end_time` TIME NULL;

CALL CreateIndexIfNotExists('employee_availability', 'idx_ea_employee_id', '`employee_id`');
CALL CreateIndexIfNotExists('employee_availability', 'idx_ea_shift_id', '`shift_id`');

-- ============================================================================
-- 11. DEVICES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS `devices` (
    `id` CHAR(36) NOT NULL PRIMARY KEY DEFAULT (UUID()),
    `name` VARCHAR(255) NOT NULL,
    `location` VARCHAR(255) NULL,
    `device_key` VARCHAR(255) NOT NULL,
    `ip_address` VARCHAR(45) NULL,
    `mac_address` VARCHAR(17) NULL,
    `firmware_version` VARCHAR(100) NULL,
    `last_seen_at` DATETIME NULL,
    `status` ENUM('online', 'offline', 'decommissioned', 'active', 'inactive', 'maintenance') NOT NULL DEFAULT 'active',
    `current_mode` ENUM('attendance', 'enroll') NOT NULL DEFAULT 'attendance',
    `employee_id_pending` CHAR(36) NULL,
    `metadata` JSON NULL,
    `created_at` DATETIME NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CALL AddColumnIfNotExists('devices', 'name', 'VARCHAR(255) NULL AFTER `id`');
CALL AddColumnIfNotExists('devices', 'device_key', 'VARCHAR(255) NULL AFTER `location`');
CALL AddColumnIfNotExists('devices', 'firmware_version', 'VARCHAR(100) NULL AFTER `mac_address`');
CALL AddColumnIfNotExists('devices', 'last_seen_at', 'DATETIME NULL AFTER `firmware_version`');
CALL AddColumnIfNotExists('devices', 'current_mode', "ENUM('attendance', 'enroll') NOT NULL DEFAULT 'attendance' AFTER `status`");
CALL AddColumnIfNotExists('devices', 'employee_id_pending', 'CHAR(36) NULL AFTER `current_mode`');
CALL AddColumnIfNotExists('devices', 'metadata', 'JSON NULL AFTER `employee_id_pending`');

-- Update status enum
ALTER TABLE `devices`
MODIFY COLUMN `status` ENUM('online', 'offline', 'decommissioned', 'active', 'inactive', 'maintenance') NOT NULL DEFAULT 'active';

CALL CreateIndexIfNotExists('devices', 'idx_devices_device_key', '`device_key`');
CALL CreateIndexIfNotExists('devices', 'idx_devices_status', '`status`');
CALL CreateIndexIfNotExists('devices', 'idx_devices_current_mode', '`current_mode`');

-- ============================================================================
-- 12. RFID_CARDS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS `rfid_cards` (
    `id` CHAR(36) NOT NULL PRIMARY KEY DEFAULT (UUID()),
    `employee_id` CHAR(36) NULL,
    `card_uid` VARCHAR(255) NOT NULL,
    `issued_at` DATETIME NULL,
    `revoked_at` DATETIME NULL,
    `status` ENUM('active', 'suspended', 'lost', 'revoked', 'inactive', 'damaged') NOT NULL DEFAULT 'active',
    `notes` TEXT NULL,
    `created_at` DATETIME NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CALL AddColumnIfNotExists('rfid_cards', 'revoked_at', 'DATETIME NULL AFTER `issued_at`');

-- Update status enum
ALTER TABLE `rfid_cards`
MODIFY COLUMN `status` ENUM('active', 'suspended', 'lost', 'revoked', 'inactive', 'damaged') NOT NULL DEFAULT 'active';

CALL CreateIndexIfNotExists('rfid_cards', 'idx_rfid_cards_card_uid', '`card_uid`');
CALL CreateIndexIfNotExists('rfid_cards', 'idx_rfid_cards_employee_id', '`employee_id`');
CALL CreateIndexIfNotExists('rfid_cards', 'idx_rfid_cards_status', '`status`');

-- ============================================================================
-- 13. ATTENDANCE_LOGS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS `attendance_logs` (
    `id` CHAR(36) NOT NULL PRIMARY KEY DEFAULT (UUID()),
    `card_uid` VARCHAR(255) NULL,
    `rfid_card_id` CHAR(36) NULL,
    `employee_id` CHAR(36) NULL,
    `device_id` CHAR(36) NULL,
    `event_type` ENUM('tap', 'clock_in', 'clock_out') NULL,
    `event_time` DATETIME NULL,
    `raw_payload` TEXT NULL,
    `processed` TINYINT(1) NULL DEFAULT 0,
    `match_attempted_at` DATETIME NULL,
    `created_at` DATETIME NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CALL AddColumnIfNotExists('attendance_logs', 'card_uid', 'VARCHAR(255) NULL AFTER `id`');
CALL AddColumnIfNotExists('attendance_logs', 'rfid_card_id', 'CHAR(36) NULL AFTER `card_uid`');
CALL AddColumnIfNotExists('attendance_logs', 'event_type', "ENUM('tap', 'clock_in', 'clock_out') NULL AFTER `device_id`");
CALL AddColumnIfNotExists('attendance_logs', 'event_time', 'DATETIME NULL AFTER `event_type`');
CALL AddColumnIfNotExists('attendance_logs', 'raw_payload', 'TEXT NULL AFTER `event_time`');
CALL AddColumnIfNotExists('attendance_logs', 'processed', 'TINYINT(1) NULL DEFAULT 0 AFTER `raw_payload`');
CALL AddColumnIfNotExists('attendance_logs', 'match_attempted_at', 'DATETIME NULL AFTER `processed`');

-- Make employee_id nullable
ALTER TABLE `attendance_logs`
MODIFY COLUMN `employee_id` CHAR(36) NULL;

CALL CreateIndexIfNotExists('attendance_logs', 'idx_al_card_uid', '`card_uid`');
CALL CreateIndexIfNotExists('attendance_logs', 'idx_al_employee_id', '`employee_id`');
CALL CreateIndexIfNotExists('attendance_logs', 'idx_al_event_type', '`event_type`');
CALL CreateIndexIfNotExists('attendance_logs', 'idx_al_processed', '`processed`');

-- ============================================================================
-- 14. ATTENDANCE_SHIFTS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS `attendance_shifts` (
    `id` CHAR(36) NOT NULL PRIMARY KEY DEFAULT (UUID()),
    `shift_id` CHAR(36) NULL,
    `schedule_assignment_id` CHAR(36) NULL,
    `employee_id` CHAR(36) NOT NULL,
    `clock_in` DATETIME NULL,
    `clock_out` DATETIME NULL,
    `worked_minutes` INT NULL,
    `late_minutes` INT NULL,
    `early_leave_minutes` INT NULL,
    `status` ENUM('present', 'absent', 'partial') NOT NULL DEFAULT 'present',
    `manual_adjusted` TINYINT(1) NULL DEFAULT 0,
    `notes` TEXT NULL,
    `created_at` DATETIME NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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

CALL CreateIndexIfNotExists('attendance_shifts', 'idx_as_shift_id', '`shift_id`');
CALL CreateIndexIfNotExists('attendance_shifts', 'idx_as_employee_id', '`employee_id`');
CALL CreateIndexIfNotExists('attendance_shifts', 'idx_as_status', '`status`');

-- ============================================================================
-- 15. MONTHLY_PAYROLLS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS `monthly_payrolls` (
    `id` CHAR(36) NOT NULL PRIMARY KEY DEFAULT (UUID()),
    `employee_id` CHAR(36) NOT NULL,
    `contract_id` CHAR(36) NULL,
    `month` VARCHAR(7) NOT NULL,
    `salary_scheme_id` CHAR(36) NULL,
    `base_salary` DECIMAL(12,2) NOT NULL DEFAULT 0,
    `pay_type` ENUM('hourly', 'fixed_shift', 'monthly') NULL DEFAULT 'monthly',
    `hourly_rate` DECIMAL(12,2) NULL,
    `allowances` DECIMAL(12,2) NOT NULL DEFAULT 0,
    `bonuses` DECIMAL(12,2) NOT NULL DEFAULT 0,
    `overtime_pay` DECIMAL(12,2) NOT NULL DEFAULT 0,
    `deductions` DECIMAL(12,2) NOT NULL DEFAULT 0,
    `penalties` DECIMAL(12,2) NOT NULL DEFAULT 0,
    `gross_salary` DECIMAL(12,2) NOT NULL DEFAULT 0,
    `net_salary` DECIMAL(12,2) NOT NULL DEFAULT 0,
    `total_work_days` INT NULL,
    `total_work_hours` DECIMAL(8,2) NULL,
    `total_late_minutes` INT NULL,
    `total_early_leave_minutes` INT NULL,
    `late_penalty` DECIMAL(12,2) NULL DEFAULT 0,
    `early_leave_penalty` DECIMAL(12,2) NULL DEFAULT 0,
    `overtime_hours` DECIMAL(8,2) NULL,
    `absent_days` INT NULL,
    `notes` TEXT NULL,
    `status` ENUM('draft', 'pending_approval', 'approved', 'paid') NOT NULL DEFAULT 'draft',
    `approved_by` VARCHAR(255) NULL,
    `approved_at` DATETIME NULL,
    `paid_at` DATETIME NULL,
    `created_at` DATETIME NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CALL AddColumnIfNotExists('monthly_payrolls', 'contract_id', 'CHAR(36) NULL AFTER `employee_id`');
CALL AddColumnIfNotExists('monthly_payrolls', 'salary_scheme_id', 'CHAR(36) NULL AFTER `month`');
CALL AddColumnIfNotExists('monthly_payrolls', 'pay_type', "ENUM('hourly', 'fixed_shift', 'monthly') NULL DEFAULT 'monthly' AFTER `base_salary`");
CALL AddColumnIfNotExists('monthly_payrolls', 'hourly_rate', 'DECIMAL(12,2) NULL AFTER `pay_type`');
CALL AddColumnIfNotExists('monthly_payrolls', 'penalties', 'DECIMAL(12,2) NOT NULL DEFAULT 0 AFTER `deductions`');
CALL AddColumnIfNotExists('monthly_payrolls', 'total_work_days', 'INT NULL AFTER `net_salary`');
CALL AddColumnIfNotExists('monthly_payrolls', 'total_work_hours', 'DECIMAL(8,2) NULL AFTER `total_work_days`');
CALL AddColumnIfNotExists('monthly_payrolls', 'total_late_minutes', 'INT NULL AFTER `total_work_hours`');
CALL AddColumnIfNotExists('monthly_payrolls', 'total_early_leave_minutes', 'INT NULL AFTER `total_late_minutes`');
CALL AddColumnIfNotExists('monthly_payrolls', 'late_penalty', 'DECIMAL(12,2) NULL DEFAULT 0 AFTER `total_early_leave_minutes`');
CALL AddColumnIfNotExists('monthly_payrolls', 'early_leave_penalty', 'DECIMAL(12,2) NULL DEFAULT 0 AFTER `late_penalty`');
CALL AddColumnIfNotExists('monthly_payrolls', 'overtime_hours', 'DECIMAL(8,2) NULL AFTER `early_leave_penalty`');
CALL AddColumnIfNotExists('monthly_payrolls', 'absent_days', 'INT NULL AFTER `overtime_hours`');
CALL AddColumnIfNotExists('monthly_payrolls', 'approved_by', 'VARCHAR(255) NULL AFTER `status`');
CALL AddColumnIfNotExists('monthly_payrolls', 'approved_at', 'DATETIME NULL AFTER `approved_by`');
CALL AddColumnIfNotExists('monthly_payrolls', 'paid_at', 'DATETIME NULL AFTER `approved_at`');

CALL CreateIndexIfNotExists('monthly_payrolls', 'idx_mp_employee_id', '`employee_id`');
CALL CreateIndexIfNotExists('monthly_payrolls', 'idx_mp_month', '`month`');
CALL CreateIndexIfNotExists('monthly_payrolls', 'idx_mp_status', '`status`');
CALL CreateIndexIfNotExists('monthly_payrolls', 'idx_mp_contract_id', '`contract_id`');

-- ============================================================================
-- 16. SALARY_REQUESTS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS `salary_requests` (
    `id` CHAR(36) NOT NULL PRIMARY KEY DEFAULT (UUID()),
    `employee_id` CHAR(36) NOT NULL,
    `type` ENUM('raise', 'adjustment') NOT NULL DEFAULT 'raise',
    `current_scheme_id` CHAR(36) NULL,
    `proposed_scheme_id` CHAR(36) NULL,
    `current_rate` DECIMAL(12,2) NULL,
    `proposed_rate` DECIMAL(12,2) NULL,
    `payroll_id` CHAR(36) NULL,
    `adjustment_amount` DECIMAL(12,2) NULL,
    `reason` TEXT NULL,
    `manager_note` TEXT NULL,
    `request_date` DATETIME NOT NULL,
    `status` ENUM('pending', 'approved', 'rejected') NOT NULL DEFAULT 'pending',
    `approved_by` VARCHAR(255) NULL,
    `approved_at` DATETIME NULL,
    `note` TEXT NULL,
    `created_at` DATETIME NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CALL AddColumnIfNotExists('salary_requests', 'current_scheme_id', 'CHAR(36) NULL AFTER `type`');
CALL AddColumnIfNotExists('salary_requests', 'proposed_scheme_id', 'CHAR(36) NULL AFTER `current_scheme_id`');
CALL AddColumnIfNotExists('salary_requests', 'current_rate', 'DECIMAL(12,2) NULL AFTER `proposed_scheme_id`');
CALL AddColumnIfNotExists('salary_requests', 'proposed_rate', 'DECIMAL(12,2) NULL AFTER `current_rate`');
CALL AddColumnIfNotExists('salary_requests', 'payroll_id', 'CHAR(36) NULL AFTER `proposed_rate`');
CALL AddColumnIfNotExists('salary_requests', 'adjustment_amount', 'DECIMAL(12,2) NULL AFTER `payroll_id`');
CALL AddColumnIfNotExists('salary_requests', 'manager_note', 'TEXT NULL AFTER `reason`');

CALL CreateIndexIfNotExists('salary_requests', 'idx_sr_employee_id', '`employee_id`');
CALL CreateIndexIfNotExists('salary_requests', 'idx_sr_type', '`type`');
CALL CreateIndexIfNotExists('salary_requests', 'idx_sr_status', '`status`');
CALL CreateIndexIfNotExists('salary_requests', 'idx_sr_payroll_id', '`payroll_id`');

-- ============================================================================
-- 17. DEDUCTIONS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS `deductions` (
    `id` CHAR(36) NOT NULL PRIMARY KEY DEFAULT (UUID()),
    `employee_id` CHAR(36) NULL,
    `payroll_id` CHAR(36) NULL,
    `type` VARCHAR(100) NOT NULL,
    `amount` DECIMAL(12,2) NOT NULL,
    `currency` VARCHAR(10) NULL DEFAULT 'VND',
    `related_shift_id` CHAR(36) NULL,
    `note` TEXT NULL,
    `status` ENUM('pending', 'applied', 'reimbursed') NOT NULL DEFAULT 'pending',
    `notes` TEXT NULL,
    `created_at` DATETIME NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CALL AddColumnIfNotExists('deductions', 'employee_id', 'CHAR(36) NULL AFTER `id`');
CALL AddColumnIfNotExists('deductions', 'currency', "VARCHAR(10) NULL DEFAULT 'VND' AFTER `amount`");
CALL AddColumnIfNotExists('deductions', 'related_shift_id', 'CHAR(36) NULL AFTER `currency`');
CALL AddColumnIfNotExists('deductions', 'note', 'TEXT NULL AFTER `related_shift_id`');
CALL AddColumnIfNotExists('deductions', 'status', "ENUM('pending', 'applied', 'reimbursed') NOT NULL DEFAULT 'pending'");

-- Make payroll_id nullable
ALTER TABLE `deductions`
MODIFY COLUMN `payroll_id` CHAR(36) NULL;

CALL CreateIndexIfNotExists('deductions', 'idx_deductions_employee_id', '`employee_id`');
CALL CreateIndexIfNotExists('deductions', 'idx_deductions_payroll_id', '`payroll_id`');
CALL CreateIndexIfNotExists('deductions', 'idx_deductions_status', '`status`');

-- ============================================================================
-- 18. NOTIFICATIONS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS `notifications` (
    `id` CHAR(36) NOT NULL PRIMARY KEY DEFAULT (UUID()),
    `title` VARCHAR(255) NOT NULL,
    `message` TEXT NULL,
    `action_url` VARCHAR(512) NULL,
    `recipient_type` ENUM('ALL', 'SPECIFIC') NOT NULL DEFAULT 'ALL',
    `status` ENUM('draft', 'scheduled', 'sent', 'failed') NOT NULL DEFAULT 'draft',
    `user_ids` TEXT NULL,
    `scheduled_at` DATETIME NULL,
    `sent_at` DATETIME NULL,
    `created_by` CHAR(36) NULL,
    `created_at` DATETIME NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CALL AddColumnIfNotExists('notifications', 'action_url', 'VARCHAR(512) NULL AFTER `message`');
CALL AddColumnIfNotExists('notifications', 'recipient_type', "ENUM('ALL', 'SPECIFIC') NOT NULL DEFAULT 'ALL' AFTER `action_url`");
CALL AddColumnIfNotExists('notifications', 'status', "ENUM('draft', 'scheduled', 'sent', 'failed') NOT NULL DEFAULT 'draft' AFTER `recipient_type`");
CALL AddColumnIfNotExists('notifications', 'user_ids', 'TEXT NULL AFTER `status`');
CALL AddColumnIfNotExists('notifications', 'scheduled_at', 'DATETIME NULL AFTER `user_ids`');
CALL AddColumnIfNotExists('notifications', 'sent_at', 'DATETIME NULL AFTER `scheduled_at`');
CALL AddColumnIfNotExists('notifications', 'created_by', 'CHAR(36) NULL AFTER `sent_at`');
CALL AddColumnIfNotExists('notifications', 'updated_at', 'DATETIME NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP');

CALL CreateIndexIfNotExists('notifications', 'idx_notifications_status', '`status`');
CALL CreateIndexIfNotExists('notifications', 'idx_notifications_recipient_type', '`recipient_type`');

-- ============================================================================
-- 19. SCHEDULE_CHANGE_REQUESTS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS `schedule_change_requests` (
    `id` CHAR(36) NOT NULL PRIMARY KEY DEFAULT (UUID()),
    `requested_by` CHAR(36) NOT NULL,
    `assignment_id` CHAR(36) NOT NULL,
    `request_type` ENUM('swap', 'pass', 'off') NOT NULL,
    `target_employee_id` CHAR(36) NULL,
    `reason` TEXT NULL,
    `status` ENUM('pending', 'approved', 'rejected') NOT NULL DEFAULT 'pending',
    `reviewed_by` CHAR(36) NULL,
    `reviewed_at` DATETIME NULL,
    `created_at` DATETIME NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CALL CreateIndexIfNotExists('schedule_change_requests', 'idx_scr_requested_by', '`requested_by`');
CALL CreateIndexIfNotExists('schedule_change_requests', 'idx_scr_status', '`status`');

-- ============================================================================
-- 20. MONTHLY_EMPLOYEE_STATS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS `monthly_employee_stats` (
    `id` CHAR(36) NOT NULL PRIMARY KEY DEFAULT (UUID()),
    `employee_id` CHAR(36) NOT NULL,
    `month` VARCHAR(7) NOT NULL,
    `total_shifts_assigned` INT NULL,
    `total_shifts_worked` INT NULL,
    `swaps_count` INT NULL,
    `pass_count` INT NULL,
    `off_count` INT NULL,
    `total_worked_minutes` INT NULL,
    `overtime_minutes` INT NULL,
    `late_minutes` INT NULL,
    `absent_count` INT NULL,
    `updated_at` DATETIME NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CALL CreateIndexIfNotExists('monthly_employee_stats', 'idx_mes_employee_id', '`employee_id`');
CALL CreateIndexIfNotExists('monthly_employee_stats', 'idx_mes_month', '`month`');

-- ============================================================================
-- DATA MIGRATION: FIX shifts TABLE
-- Convert existing shifts to use proper DATETIME
-- ============================================================================

-- Reconstruct start_at/end_at using shift_date and shift_type times
UPDATE `shifts` s
JOIN `shift_types` st ON s.`shift_type_id` = st.`id`
SET 
    s.`start_at` = CONCAT(DATE_FORMAT(s.`shift_date`, '%Y-%m-%d'), ' ', TIME_FORMAT(st.`start_time`, '%H:%i:%s')),
    s.`end_at` = CONCAT(DATE_FORMAT(s.`shift_date`, '%Y-%m-%d'), ' ', TIME_FORMAT(st.`end_time`, '%H:%i:%s'))
WHERE (s.`start_at` IS NULL OR s.`end_at` IS NULL OR DATE(s.`start_at`) = '0000-00-00')
AND st.`start_time` IS NOT NULL AND st.`end_time` IS NOT NULL;

-- Handle cross-midnight shifts
UPDATE `shifts` s
JOIN `shift_types` st ON s.`shift_type_id` = st.`id`
SET s.`end_at` = DATE_ADD(s.`end_at`, INTERVAL 1 DAY)
WHERE st.`cross_midnight` = 1 
AND s.`end_at` IS NOT NULL
AND TIME(s.`end_at`) < TIME(s.`start_at`);

-- ============================================================================
-- CLEANUP HELPER PROCEDURES
-- ============================================================================
DROP PROCEDURE IF EXISTS AddColumnIfNotExists;
DROP PROCEDURE IF EXISTS CreateIndexIfNotExists;
DROP PROCEDURE IF EXISTS DropFKIfExists;

-- ============================================================================
-- RESTORE SETTINGS
-- ============================================================================
SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS;
SET SQL_MODE=@OLD_SQL_MODE;

-- ============================================================================
-- VERIFICATION
-- ============================================================================
SELECT '========================================' AS '=';
SELECT '✅ FULL SCHEMA SYNC COMPLETED!' AS 'Status';
SELECT '========================================' AS '=';

SELECT 'Tables synced:' AS info;
SELECT TABLE_NAME, TABLE_ROWS 
FROM INFORMATION_SCHEMA.TABLES 
WHERE TABLE_SCHEMA = DATABASE() 
AND TABLE_TYPE = 'BASE TABLE'
ORDER BY TABLE_NAME;
