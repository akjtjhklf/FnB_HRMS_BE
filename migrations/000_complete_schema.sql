-- ============================================================================
-- COMPLETE HRMS DATABASE SCHEMA
-- Generated: 2025-12-03
-- Purpose: Full database schema definition for HRMS system
-- Tables: 30 total (removed unused 'analysis' table)
-- ============================================================================

-- Set safe mode
SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0;
SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='TRADITIONAL';

-- ============================================================================
-- CORE TABLES (Directus System + Base)
-- ============================================================================

-- ============================================================================
-- 1. DIRECTUS_ROLES (Directus System Table)
-- ============================================================================
CREATE TABLE IF NOT EXISTS `directus_roles` (
  `id` CHAR(36) NOT NULL PRIMARY KEY DEFAULT (UUID()),
  `name` VARCHAR(100) NOT NULL,
  `icon` VARCHAR(64) NULL DEFAULT 'supervised_user_circle',
  `description` TEXT NULL,
  `ip_access` TEXT NULL,
  `enforce_tfa` TINYINT(1) NOT NULL DEFAULT 0,
  `admin_access` TINYINT(1) NOT NULL DEFAULT 0,
  `app_access` TINYINT(1) NOT NULL DEFAULT 1,
  `parent` CHAR(36) NULL,
  UNIQUE KEY `idx_directus_roles_name` (`name`),
  CONSTRAINT `fk_directus_roles_parent` FOREIGN KEY (`parent`) REFERENCES `directus_roles`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='Directus roles table';

-- ============================================================================
-- 2. DIRECTUS_POLICIES (Directus System Table)
-- ============================================================================
CREATE TABLE IF NOT EXISTS `directus_policies` (
  `id` CHAR(36) NOT NULL PRIMARY KEY DEFAULT (UUID()),
  `name` VARCHAR(100) NOT NULL,
  `icon` VARCHAR(64) NULL DEFAULT 'badge',
  `description` TEXT NULL,
  `ip_access` TEXT NULL,
  `enforce_tfa` TINYINT(1) NOT NULL DEFAULT 0,
  `admin_access` TINYINT(1) NOT NULL DEFAULT 0,
  `app_access` TINYINT(1) NOT NULL DEFAULT 1,
  UNIQUE KEY `idx_directus_policies_name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='Directus policies table';

-- ============================================================================
-- 3. DIRECTUS_PERMISSIONS (Directus System Table)
-- ============================================================================
CREATE TABLE IF NOT EXISTS `directus_permissions` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `collection` VARCHAR(64) NOT NULL,
  `action` VARCHAR(10) NOT NULL,
  `permissions` JSON NULL,
  `validation` JSON NULL,
  `presets` JSON NULL,
  `fields` TEXT NULL,
  `policy` CHAR(36) NOT NULL,
  CONSTRAINT `fk_directus_permissions_policy` FOREIGN KEY (`policy`) REFERENCES `directus_policies`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='Directus permissions table';

CREATE INDEX `idx_directus_permissions_collection` ON `directus_permissions` (`collection`);

-- ============================================================================
-- 4. DIRECTUS_USERS (Directus System Table)
-- ============================================================================
CREATE TABLE IF NOT EXISTS `directus_users` (
  `id` CHAR(36) NOT NULL PRIMARY KEY DEFAULT (UUID()),
  `first_name` VARCHAR(50) NULL,
  `last_name` VARCHAR(50) NULL,
  `email` VARCHAR(128) NOT NULL UNIQUE,
  `password` VARCHAR(255) NULL,
  `location` VARCHAR(255) NULL,
  `title` VARCHAR(50) NULL,
  `description` TEXT NULL,
  `tags` JSON NULL,
  `avatar` CHAR(36) NULL,
  `language` VARCHAR(255) NULL DEFAULT 'en-US',
  `tfa_secret` VARCHAR(255) NULL,
  `status` ENUM('active', 'invited', 'draft', 'suspended', 'deleted') NOT NULL DEFAULT 'active',
  `role` CHAR(36) NULL,
  `token` VARCHAR(255) NULL UNIQUE,
  `last_access` DATETIME NULL,
  `last_page` VARCHAR(255) NULL,
  `provider` VARCHAR(128) NULL DEFAULT 'default',
  `external_identifier` VARCHAR(255) NULL,
  `auth_data` JSON NULL,
  `email_notifications` TINYINT(1) NULL DEFAULT 1,
  `appearance` VARCHAR(255) NULL,
  `theme_dark` VARCHAR(255) NULL,
  `theme_light` VARCHAR(255) NULL,
  `theme_dark_overrides` JSON NULL,
  `theme_light_overrides` JSON NULL,
  `text_direction` VARCHAR(3) NULL DEFAULT 'ltr',
  `created_at` DATETIME NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `employee_id` CHAR(36) NULL COMMENT 'Link to employees table',
  CONSTRAINT `fk_directus_users_role` FOREIGN KEY (`role`) REFERENCES `directus_roles`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='Directus users table';

CREATE INDEX `idx_directus_users_email` ON `directus_users` (`email`);
CREATE INDEX `idx_directus_users_status` ON `directus_users` (`status`);
CREATE INDEX `idx_directus_users_employee_id` ON `directus_users` (`employee_id`);

-- ============================================================================
-- 5. DIRECTUS_FILES (Directus System Table)
-- ============================================================================
CREATE TABLE IF NOT EXISTS `directus_files` (
  `id` CHAR(36) NOT NULL PRIMARY KEY DEFAULT (UUID()),
  `storage` VARCHAR(255) NOT NULL,
  `filename_disk` VARCHAR(255) NULL,
  `filename_download` VARCHAR(255) NOT NULL,
  `title` VARCHAR(255) NULL,
  `type` VARCHAR(255) NULL,
  `folder` CHAR(36) NULL,
  `uploaded_by` CHAR(36) NULL,
  `created_on` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `modified_by` CHAR(36) NULL,
  `modified_on` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `charset` VARCHAR(50) NULL,
  `filesize` BIGINT UNSIGNED NULL,
  `width` INT UNSIGNED NULL,
  `height` INT UNSIGNED NULL,
  `duration` INT UNSIGNED NULL,
  `embed` VARCHAR(200) NULL,
  `description` TEXT NULL,
  `location` TEXT NULL,
  `tags` JSON NULL,
  `metadata` JSON NULL,
  `focal_point_x` INT NULL,
  `focal_point_y` INT NULL,
  `tus_id` VARCHAR(64) NULL,
  `tus_data` JSON NULL,
  `uploaded_on` DATETIME NULL,
  CONSTRAINT `fk_directus_files_uploaded_by` FOREIGN KEY (`uploaded_by`) REFERENCES `directus_users`(`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_directus_files_modified_by` FOREIGN KEY (`modified_by`) REFERENCES `directus_users`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='Directus files table';

-- ============================================================================
-- HR CORE TABLES
-- ============================================================================

-- ============================================================================
-- 6. POSITIONS
-- ============================================================================
CREATE TABLE IF NOT EXISTS `positions` (
  `id` CHAR(36) NOT NULL PRIMARY KEY DEFAULT (UUID()),
  `name` VARCHAR(255) NOT NULL,
  `description` TEXT NULL,
  `department_id` CHAR(36) NULL COMMENT 'Can link to departments if exists',
  `created_at` DATETIME NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='Job positions';

CREATE INDEX `idx_positions_name` ON `positions` (`name`);

-- ============================================================================
-- 7. SALARY_SCHEMES
-- ============================================================================
CREATE TABLE IF NOT EXISTS `salary_schemes` (
  `id` CHAR(36) NOT NULL PRIMARY KEY DEFAULT (UUID()),
  `name` VARCHAR(255) NOT NULL,
  `position_id` CHAR(36) NULL,
  `pay_type` ENUM('hourly', 'fixed_shift', 'monthly') NOT NULL DEFAULT 'monthly',
  `rate` DECIMAL(12,2) NOT NULL COMMENT 'Hourly rate, shift rate, or monthly salary',
  `min_hours` INT NULL COMMENT 'Minimum hours for hourly schemes',
  `overtime_multiplier` DECIMAL(4,2) NULL DEFAULT 1.5 COMMENT 'OT multiplier (e.g., 1.5x)',
  `effective_from` DATE NULL,
  `effective_to` DATE NULL,
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `notes` TEXT NULL,
  `metadata` JSON NULL,
  `created_at` DATETIME NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `fk_salary_schemes_position` FOREIGN KEY (`position_id`) REFERENCES `positions`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='Salary schemes and pay rates';

CREATE INDEX `idx_salary_schemes_name` ON `salary_schemes` (`name`);
CREATE INDEX `idx_salary_schemes_position_id` ON `salary_schemes` (`position_id`);
CREATE INDEX `idx_salary_schemes_is_active` ON `salary_schemes` (`is_active`);
CREATE INDEX `idx_salary_schemes_pay_type` ON `salary_schemes` (`pay_type`);

-- ============================================================================
-- 8. EMPLOYEES
-- ============================================================================
CREATE TABLE IF NOT EXISTS `employees` (
  `id` CHAR(36) NOT NULL PRIMARY KEY DEFAULT (UUID()),
  `user_id` CHAR(36) NULL,
  `employee_code` VARCHAR(50) NOT NULL UNIQUE,
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
  `scheme_id` CHAR(36) NULL COMMENT 'Default salary scheme',
  `position_id` TEXT NULL COMMENT 'Position IDs (M2M support)',
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
  `deleted_at` DATETIME NULL,
  CONSTRAINT `fk_employees_user` FOREIGN KEY (`user_id`) REFERENCES `directus_users`(`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_employees_scheme` FOREIGN KEY (`scheme_id`) REFERENCES `salary_schemes`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='Employees table';

CREATE INDEX `idx_employees_user_id` ON `employees` (`user_id`);
CREATE INDEX `idx_employees_employee_code` ON `employees` (`employee_code`);
CREATE INDEX `idx_employees_status` ON `employees` (`status`);
CREATE INDEX `idx_employees_scheme_id` ON `employees` (`scheme_id`);

-- Add FK back from directus_users to employees
ALTER TABLE `directus_users`
ADD CONSTRAINT `fk_directus_users_employee` 
FOREIGN KEY (`employee_id`) REFERENCES `employees`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- ============================================================================
-- 9. CONTRACTS
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
  `updated_at` DATETIME NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `fk_contracts_employee` FOREIGN KEY (`employee_id`) REFERENCES `employees`(`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_contracts_salary_scheme` FOREIGN KEY (`salary_scheme_id`) REFERENCES `salary_schemes`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='Employment contracts';

CREATE INDEX `idx_contracts_employee_id` ON `contracts` (`employee_id`);
CREATE INDEX `idx_contracts_salary_scheme_id` ON `contracts` (`salary_scheme_id`);
CREATE INDEX `idx_contracts_is_active` ON `contracts` (`is_active`);

-- ============================================================================
-- 10. RFID_CARDS
-- ============================================================================
CREATE TABLE IF NOT EXISTS `rfid_cards` (
  `id` CHAR(36) NOT NULL PRIMARY KEY DEFAULT (UUID()),
  `card_uid` VARCHAR(255) NOT NULL UNIQUE COMMENT 'RFID card UID',
  `employee_id` CHAR(36) NULL,
  `status` ENUM('active', 'inactive', 'lost', 'damaged') NOT NULL DEFAULT 'active',
  `issued_at` DATETIME NULL,
  `expired_at` DATETIME NULL,
  `notes` TEXT NULL,
  `created_at` DATETIME NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `fk_rfid_cards_employee` FOREIGN KEY (`employee_id`) REFERENCES `employees`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='RFID cards for employees';

CREATE INDEX `idx_rfid_cards_card_uid` ON `rfid_cards` (`card_uid`);
CREATE INDEX `idx_rfid_cards_employee_id` ON `rfid_cards` (`employee_id`);
CREATE INDEX `idx_rfid_cards_status` ON `rfid_cards` (`status`);

-- ============================================================================
-- PAYROLL TABLES
-- ============================================================================

-- ============================================================================
-- 11. MONTHLY_PAYROLLS
-- ============================================================================
CREATE TABLE IF NOT EXISTS `monthly_payrolls` (
  `id` CHAR(36) NOT NULL PRIMARY KEY DEFAULT (UUID()),
  `employee_id` CHAR(36) NOT NULL,
  `contract_id` CHAR(36) NULL,
  `month` VARCHAR(7) NOT NULL COMMENT 'Format: YYYY-MM',
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
  `late_penalty` DECIMAL(12,2) NULL,
  `early_leave_penalty` DECIMAL(12,2) NULL,
  `overtime_hours` DECIMAL(8,2) NULL,
  `absent_days` INT NULL,
  `notes` TEXT NULL,
  `status` ENUM('draft', 'pending_approval', 'approved', 'paid') NOT NULL DEFAULT 'draft',
  `approved_by` VARCHAR(255) NULL,
  `approved_at` DATETIME NULL,
  `paid_at` DATETIME NULL,
  `created_at` DATETIME NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `fk_monthly_payrolls_employee` FOREIGN KEY (`employee_id`) REFERENCES `employees`(`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_monthly_payrolls_contract` FOREIGN KEY (`contract_id`) REFERENCES `contracts`(`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_monthly_payrolls_salary_scheme` FOREIGN KEY (`salary_scheme_id`) REFERENCES `salary_schemes`(`id`) ON DELETE SET NULL,
  UNIQUE KEY `uk_monthly_payrolls_employee_month` (`employee_id`, `month`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='Monthly payroll records';

CREATE INDEX `idx_monthly_payrolls_employee_id` ON `monthly_payrolls` (`employee_id`);
CREATE INDEX `idx_monthly_payrolls_month` ON `monthly_payrolls` (`month`);
CREATE INDEX `idx_monthly_payrolls_status` ON `monthly_payrolls` (`status`);
CREATE INDEX `idx_monthly_payrolls_contract_id` ON `monthly_payrolls` (`contract_id`);
CREATE INDEX `idx_monthly_payrolls_salary_scheme_id` ON `monthly_payrolls` (`salary_scheme_id`);

-- ============================================================================
-- 12. SALARY_REQUESTS
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
  `updated_at` DATETIME NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `fk_salary_requests_employee` FOREIGN KEY (`employee_id`) REFERENCES `employees`(`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_salary_requests_current_scheme` FOREIGN KEY (`current_scheme_id`) REFERENCES `salary_schemes`(`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_salary_requests_proposed_scheme` FOREIGN KEY (`proposed_scheme_id`) REFERENCES `salary_schemes`(`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_salary_requests_payroll` FOREIGN KEY (`payroll_id`) REFERENCES `monthly_payrolls`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='Salary raise and adjustment requests';

CREATE INDEX `idx_salary_requests_employee_id` ON `salary_requests` (`employee_id`);
CREATE INDEX `idx_salary_requests_type` ON `salary_requests` (`type`);
CREATE INDEX `idx_salary_requests_status` ON `salary_requests` (`status`);
CREATE INDEX `idx_salary_requests_payroll_id` ON `salary_requests` (`payroll_id`);

-- ============================================================================
-- 13. DEDUCTIONS
-- ============================================================================
CREATE TABLE IF NOT EXISTS `deductions` (
  `id` CHAR(36) NOT NULL PRIMARY KEY DEFAULT (UUID()),
  `payroll_id` CHAR(36) NOT NULL,
  `type` VARCHAR(100) NOT NULL COMMENT 'Type of deduction (tax, insurance, etc)',
  `amount` DECIMAL(12,2) NOT NULL,
  `notes` TEXT NULL,
  `created_at` DATETIME NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `fk_deductions_payroll` FOREIGN KEY (`payroll_id`) REFERENCES `monthly_payrolls`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='Payroll deductions';

CREATE INDEX `idx_deductions_payroll_id` ON `deductions` (`payroll_id`);
CREATE INDEX `idx_deductions_type` ON `deductions` (`type`);

-- ============================================================================
-- 14. MONTHLY_EMPLOYEE_STATS
-- ============================================================================
CREATE TABLE IF NOT EXISTS `monthly_employee_stats` (
  `id` CHAR(36) NOT NULL PRIMARY KEY DEFAULT (UUID()),
  `employee_id` CHAR(36) NOT NULL,
  `month` VARCHAR(7) NOT NULL COMMENT 'Format: YYYY-MM',
  `total_shifts_assigned` INT NULL,
  `total_shifts_worked` INT NULL,
  `swaps_count` INT NULL,
  `pass_count` INT NULL,
  `off_count` INT NULL,
  `total_worked_minutes` INT NULL,
  `overtime_minutes` INT NULL,
  `late_minutes` INT NULL,
  `absent_count` INT NULL,
  `updated_at` DATETIME NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `fk_monthly_employee_stats_employee` FOREIGN KEY (`employee_id`) REFERENCES `employees`(`id`) ON DELETE CASCADE,
  UNIQUE KEY `uk_monthly_employee_stats_employee_month` (`employee_id`, `month`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='Monthly employee statistics';

CREATE INDEX `idx_monthly_employee_stats_employee_id` ON `monthly_employee_stats` (`employee_id`);
CREATE INDEX `idx_monthly_employee_stats_month` ON `monthly_employee_stats` (`month`);

-- ============================================================================
-- ATTENDANCE TABLES
-- ============================================================================

-- ============================================================================
-- 15. DEVICES
-- ============================================================================
CREATE TABLE IF NOT EXISTS `devices` (
  `id` CHAR(36) NOT NULL PRIMARY KEY DEFAULT (UUID()),
  `device_name` VARCHAR(255) NOT NULL,
  `device_type` ENUM('rfid_reader', 'fingerprint', 'face_recognition', 'mobile') NOT NULL,
  `mac_address` VARCHAR(17) NULL UNIQUE,
  `ip_address` VARCHAR(45) NULL,
  `location` VARCHAR(255) NULL,
  `status` ENUM('active', 'inactive', 'maintenance') NOT NULL DEFAULT 'active',
  `last_sync` DATETIME NULL,
  `notes` TEXT NULL,
  `created_at` DATETIME NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='Attendance devices';

CREATE INDEX `idx_devices_device_type` ON `devices` (`device_type`);
CREATE INDEX `idx_devices_status` ON `devices` (`status`);

-- ============================================================================
-- 16. ATTENDANCE_LOGS
-- ============================================================================
CREATE TABLE IF NOT EXISTS `attendance_logs` (
  `id` CHAR(36) NOT NULL PRIMARY KEY DEFAULT (UUID()),
  `employee_id` CHAR(36) NOT NULL,
  `check_in` DATETIME NULL,
  `check_out` DATETIME NULL,
  `work_date` DATE NOT NULL,
  `shift_id` CHAR(36) NULL,
  `device_id` CHAR(36) NULL,
  `status` ENUM('present', 'late', 'early_leave', 'absent', 'on_leave') NOT NULL DEFAULT 'present',
  `late_minutes` INT NULL DEFAULT 0,
  `early_leave_minutes` INT NULL DEFAULT 0,
  `total_work_minutes` INT NULL,
  `notes` TEXT NULL,
  `created_at` DATETIME NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `fk_attendance_logs_employee` FOREIGN KEY (`employee_id`) REFERENCES `employees`(`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_attendance_logs_device` FOREIGN KEY (`device_id`) REFERENCES `devices`(`id`) ON DELETE SET NULL,
  UNIQUE KEY `uk_attendance_logs_employee_date` (`employee_id`, `work_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='Attendance logs';

CREATE INDEX `idx_attendance_logs_employee_id` ON `attendance_logs` (`employee_id`);
CREATE INDEX `idx_attendance_logs_work_date` ON `attendance_logs` (`work_date`);
CREATE INDEX `idx_attendance_logs_status` ON `attendance_logs` (`status`);

-- ============================================================================
-- 17. ATTENDANCE_ADJUSTMENTS
-- ============================================================================
CREATE TABLE IF NOT EXISTS `attendance_adjustments` (
  `id` CHAR(36) NOT NULL PRIMARY KEY DEFAULT (UUID()),
  `employee_id` CHAR(36) NOT NULL,
  `work_date` DATE NOT NULL,
  `original_check_in` DATETIME NULL,
  `adjusted_check_in` DATETIME NULL,
  `original_check_out` DATETIME NULL,
  `adjusted_check_out` DATETIME NULL,
  `reason` TEXT NULL,
  `approved_by` CHAR(36) NULL,
  `created_at` DATETIME NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `fk_attendance_adjustments_employee` FOREIGN KEY (`employee_id`) REFERENCES `employees`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='Attendance adjustments';

CREATE INDEX `idx_attendance_adjustments_employee_id` ON `attendance_adjustments` (`employee_id`);
CREATE INDEX `idx_attendance_adjustments_work_date` ON `attendance_adjustments` (`work_date`);

-- ============================================================================
-- SCHEDULING TABLES
-- ============================================================================

-- ============================================================================
-- 18. SHIFT_TYPES
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='Shift types (Morning, Afternoon, Night, etc.)';

CREATE INDEX `idx_shift_types_name` ON `shift_types` (`name`);

-- ============================================================================
-- 19. WEEKLY_SCHEDULE
-- ============================================================================
CREATE TABLE IF NOT EXISTS `weekly_schedule` (
  `id` CHAR(36) NOT NULL PRIMARY KEY DEFAULT (UUID()),
  `name` VARCHAR(255) NOT NULL,
  `week_start` DATE NOT NULL,
  `week_end` DATE NOT NULL,
  `status` ENUM('draft', 'published', 'archived') NOT NULL DEFAULT 'draft',
  `created_by` CHAR(36) NULL,
  `notes` TEXT NULL,
  `created_at` DATETIME NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='Weekly schedules';

CREATE INDEX `idx_weekly_schedule_week_start` ON `weekly_schedule` (`week_start`);
CREATE INDEX `idx_weekly_schedule_status` ON `weekly_schedule` (`status`);

-- ============================================================================
-- 20. SHIFTS
-- ============================================================================
CREATE TABLE IF NOT EXISTS `shifts` (
  `id` CHAR(36) NOT NULL PRIMARY KEY DEFAULT (UUID()),
  `schedule_id` CHAR(36) NULL,
  `shift_type_id` CHAR(36) NOT NULL,
  `shift_date` DATE NOT NULL,
  `start_at` TIME NULL,
  `end_at` TIME NULL,
  `total_required` INT NULL,
  `notes` TEXT NULL,
  `metadata` JSON NULL,
  `created_by` CHAR(36) NULL,
  `created_at` DATETIME NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `fk_shifts_schedule` FOREIGN KEY (`schedule_id`) REFERENCES `weekly_schedule`(`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_shifts_shift_type` FOREIGN KEY (`shift_type_id`) REFERENCES `shift_types`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='Individual shifts';

CREATE INDEX `idx_shifts_schedule_id` ON `shifts` (`schedule_id`);
CREATE INDEX `idx_shifts_shift_type_id` ON `shifts` (`shift_type_id`);
CREATE INDEX `idx_shifts_shift_date` ON `shifts` (`shift_date`);

-- ============================================================================
-- 21. SHIFT_POSITION_REQUIREMENTS
-- ============================================================================
CREATE TABLE IF NOT EXISTS `shift_position_requirements` (
  `id` CHAR(36) NOT NULL PRIMARY KEY DEFAULT (UUID()),
  `shift_id` CHAR(36) NOT NULL,
  `position_id` CHAR(36) NOT NULL,
  `required_count` INT NOT NULL DEFAULT 1,
  `notes` TEXT NULL,
  `created_at` DATETIME NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `fk_shift_position_requirements_shift` FOREIGN KEY (`shift_id`) REFERENCES `shifts`(`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_shift_position_requirements_position` FOREIGN KEY (`position_id`) REFERENCES `positions`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='Position requirements per shift';

CREATE INDEX `idx_shift_position_requirements_shift_id` ON `shift_position_requirements` (`shift_id`);
CREATE INDEX `idx_shift_position_requirements_position_id` ON `shift_position_requirements` (`position_id`);

-- ============================================================================
-- 22. SCHEDULE_ASSIGNMENTS
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
  `updated_at` DATETIME NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `fk_schedule_assignments_schedule` FOREIGN KEY (`schedule_id`) REFERENCES `weekly_schedule`(`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_schedule_assignments_shift` FOREIGN KEY (`shift_id`) REFERENCES `shifts`(`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_schedule_assignments_employee` FOREIGN KEY (`employee_id`) REFERENCES `employees`(`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_schedule_assignments_position` FOREIGN KEY (`position_id`) REFERENCES `positions`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='Shift assignments';

CREATE INDEX `idx_schedule_assignments_shift_id` ON `schedule_assignments` (`shift_id`);
CREATE INDEX `idx_schedule_assignments_employee_id` ON `schedule_assignments` (`employee_id`);
CREATE INDEX `idx_schedule_assignments_status` ON `schedule_assignments` (`status`);

-- ============================================================================
-- 23. SCHEDULE_CHANGE_REQUESTS
-- ============================================================================
CREATE TABLE IF NOT EXISTS `schedule_change_requests` (
  `id` CHAR(36) NOT NULL PRIMARY KEY DEFAULT (UUID()),
  `requested_by` CHAR(36) NOT NULL,
  `assignment_id` CHAR(36) NOT NULL,
  `request_type` ENUM('swap', 'pass', 'off') NOT NULL,
  `target_employee_id` CHAR(36) NULL COMMENT 'For swap requests',
  `reason` TEXT NULL,
  `status` ENUM('pending', 'approved', 'rejected') NOT NULL DEFAULT 'pending',
  `reviewed_by` CHAR(36) NULL,
  `reviewed_at` DATETIME NULL,
  `created_at` DATETIME NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `fk_schedule_change_requests_requested_by` FOREIGN KEY (`requested_by`) REFERENCES `employees`(`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_schedule_change_requests_assignment` FOREIGN KEY (`assignment_id`) REFERENCES `schedule_assignments`(`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_schedule_change_requests_target_employee` FOREIGN KEY (`target_employee_id`) REFERENCES `employees`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='Schedule change requests (swap/pass/off)';

CREATE INDEX `idx_schedule_change_requests_requested_by` ON `schedule_change_requests` (`requested_by`);
CREATE INDEX `idx_schedule_change_requests_status` ON `schedule_change_requests` (`status`);

-- ============================================================================
-- 24. EMPLOYEE_AVAILABILITY
-- ============================================================================
CREATE TABLE IF NOT EXISTS `employee_availability` (
  `id` CHAR(36) NOT NULL PRIMARY KEY DEFAULT (UUID()),
  `employee_id` CHAR(36) NOT NULL,
  `day_of_week` ENUM('monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday') NOT NULL,
  `start_time` TIME NOT NULL,
  `end_time` TIME NOT NULL,
  `notes` TEXT NULL,
  `created_at` DATETIME NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `fk_employee_availability_employee` FOREIGN KEY (`employee_id`) REFERENCES `employees`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='Employee availability preferences';

CREATE INDEX `idx_employee_availability_employee_id` ON `employee_availability` (`employee_id`);
CREATE INDEX `idx_employee_availability_day_of_week` ON `employee_availability` (`day_of_week`);

-- ============================================================================
-- 25. EMPLOYEE_AVAILABILITY_POSITIONS
-- ============================================================================
CREATE TABLE IF NOT EXISTS `employee_availability_positions` (
  `id` CHAR(36) NOT NULL PRIMARY KEY DEFAULT (UUID()),
  `availability_id` CHAR(36) NOT NULL,
  `position_id` CHAR(36) NOT NULL,
  CONSTRAINT `fk_employee_availability_positions_availability` FOREIGN KEY (`availability_id`) REFERENCES `employee_availability`(`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_employee_availability_positions_position` FOREIGN KEY (`position_id`) REFERENCES `positions`(`id`) ON DELETE CASCADE,
  UNIQUE KEY `uk_employee_availability_positions` (`availability_id`, `position_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='M2M: Employee availability to positions';

-- ============================================================================
-- 26. ATTENDANCE_SHIFTS
-- ============================================================================
CREATE TABLE IF NOT EXISTS `attendance_shifts` (
  `id` CHAR(36) NOT NULL PRIMARY KEY DEFAULT (UUID()),
  `attendance_log_id` CHAR(36) NOT NULL,
  `shift_id` CHAR(36) NOT NULL,
  `created_at` DATETIME NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `fk_attendance_shifts_attendance_log` FOREIGN KEY (`attendance_log_id`) REFERENCES `attendance_logs`(`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_attendance_shifts_shift` FOREIGN KEY (`shift_id`) REFERENCES `shifts`(`id`) ON DELETE CASCADE,
  UNIQUE KEY `uk_attendance_shifts` (`attendance_log_id`, `shift_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='M2M: Attendance logs to shifts';

-- ============================================================================
-- NOTIFICATION TABLES
-- ============================================================================

-- ============================================================================
-- 27. NOTIFICATIONS
-- ============================================================================
CREATE TABLE IF NOT EXISTS `notifications` (
  `id` CHAR(36) NOT NULL PRIMARY KEY DEFAULT (UUID()),
  `type` VARCHAR(100) NOT NULL,
  `title` VARCHAR(255) NOT NULL,
  `message` TEXT NULL,
  `data` JSON NULL,
  `created_at` DATETIME NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='Notification templates';

CREATE INDEX `idx_notifications_type` ON `notifications` (`type`);

-- ============================================================================
-- 28. NOTIFICATION_LOGS
-- ============================================================================
CREATE TABLE IF NOT EXISTS `notification_logs` (
  `id` CHAR(36) NOT NULL PRIMARY KEY DEFAULT (UUID()),
  `notification_id` CHAR(36) NOT NULL,
  `user_id` CHAR(36) NOT NULL,
  `read` TINYINT(1) NOT NULL DEFAULT 0,
  `read_at` DATETIME NULL,
  `sent_at` DATETIME NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `fk_notification_logs_notification` FOREIGN KEY (`notification_id`) REFERENCES `notifications`(`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_notification_logs_user` FOREIGN KEY (`user_id`) REFERENCES `directus_users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='Notification delivery logs';

CREATE INDEX `idx_notification_logs_user_id` ON `notification_logs` (`user_id`);
CREATE INDEX `idx_notification_logs_read` ON `notification_logs` (`read`);

-- ============================================================================
-- ANALYTICS TABLE
-- ============================================================================

-- ============================================================================
-- 29. ANALYTICS
-- ============================================================================
CREATE TABLE IF NOT EXISTS `analytics` (
  `id` CHAR(36) NOT NULL PRIMARY KEY DEFAULT (UUID()),
  `metric_name` VARCHAR(255) NOT NULL,
  `metric_value` DECIMAL(15,2) NULL,
  `metric_data` JSON NULL,
  `period` VARCHAR(50) NOT NULL COMMENT 'e.g., daily, weekly, monthly',
  `recorded_at` DATETIME NOT NULL,
  `created_at` DATETIME NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='Analytics metrics';

CREATE INDEX `idx_analytics_metric_name` ON `analytics` (`metric_name`);
CREATE INDEX `idx_analytics_period` ON `analytics` (`period`);
CREATE INDEX `idx_analytics_recorded_at` ON `analytics` (`recorded_at`);

-- ============================================================================
-- 30. COLLECTIONS (Directus Collections Metadata)
-- ============================================================================
CREATE TABLE IF NOT EXISTS `directus_collections` (
  `collection` VARCHAR(64) NOT NULL PRIMARY KEY,
  `icon` VARCHAR(64) NULL,
  `note` TEXT NULL,
  `display_template` VARCHAR(255) NULL,
  `hidden` TINYINT(1) NOT NULL DEFAULT 0,
  `singleton` TINYINT(1) NOT NULL DEFAULT 0,
  `translations` JSON NULL,
  `archive_field` VARCHAR(64) NULL,
  `archive_app_filter` TINYINT(1) NOT NULL DEFAULT 1,
  `archive_value` VARCHAR(255) NULL,
  `unarchive_value` VARCHAR(255) NULL,
  `sort_field` VARCHAR(64) NULL,
  `accountability` VARCHAR(255) NULL DEFAULT 'all',
  `color` VARCHAR(255) NULL,
  `item_duplication_fields` JSON NULL,
  `sort` INT NULL,
  `group` VARCHAR(64) NULL,
  `collapse` VARCHAR(255) NOT NULL DEFAULT 'open',
  `preview_url` VARCHAR(255) NULL,
  `versioning` TINYINT(1) NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='Directus collections metadata';

-- ============================================================================
-- RESTORE SETTINGS
-- ============================================================================
SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS;
SET SQL_MODE=@OLD_SQL_MODE;

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Show all tables created
SELECT TABLE_NAME, TABLE_ROWS, CREATE_TIME
FROM INFORMATION_SCHEMA.TABLES
WHERE TABLE_SCHEMA = DATABASE()
ORDER BY TABLE_NAME;

-- Show all foreign keys
SELECT 
    TABLE_NAME,
    CONSTRAINT_NAME,
    COLUMN_NAME,
    REFERENCED_TABLE_NAME,
    REFERENCED_COLUMN_NAME
FROM
    INFORMATION_SCHEMA.KEY_COLUMN_USAGE
WHERE
    TABLE_SCHEMA = DATABASE()
    AND REFERENCED_TABLE_NAME IS NOT NULL
ORDER BY
    TABLE_NAME,
    CONSTRAINT_NAME;

SELECT '✅ Complete database schema migration finished successfully!' AS Status;
