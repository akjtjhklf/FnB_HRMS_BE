-- ============================================================================
-- COMPLETE DATABASE INITIALIZATION (V6)
-- Generated: 2025-12-06
-- Purpose: Complete database schema with all tables, indexes, and foreign keys
--          Includes missing tables: employee_availability_positions, attendance_adjustments
--          Includes new fields: positions.is_priority
-- 
-- ⚠️  This script will DROP ALL TABLES and recreate from scratch
-- ⚠️  USE ONLY FOR FRESH DATABASE INITIALIZATION
-- ⚠️  DO NOT RUN ON PRODUCTION DATABASE WITH EXISTING DATA!
-- ============================================================================

SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0;
SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='TRADITIONAL';

-- ============================================================================
-- DROP ALL EXISTING TABLES (in reverse dependency order)
-- ============================================================================
DROP TABLE IF EXISTS `attendance_adjustments`;
DROP TABLE IF EXISTS `monthly_employee_stats`;
DROP TABLE IF EXISTS `schedule_change_requests`;
DROP TABLE IF EXISTS `deductions`;
DROP TABLE IF EXISTS `salary_requests`;
DROP TABLE IF EXISTS `monthly_payrolls`;
DROP TABLE IF EXISTS `attendance_shifts`;
DROP TABLE IF EXISTS `attendance_logs`;
DROP TABLE IF EXISTS `rfid_cards`;
DROP TABLE IF EXISTS `devices`;
DROP TABLE IF EXISTS `employee_availability_positions`;
DROP TABLE IF EXISTS `employee_availability`;
DROP TABLE IF EXISTS `schedule_assignments`;
DROP TABLE IF EXISTS `shift_position_requirements`;
DROP TABLE IF EXISTS `shifts`;
DROP TABLE IF EXISTS `weekly_schedule`;
DROP TABLE IF EXISTS `shift_types`;
DROP TABLE IF EXISTS `contracts`;
DROP TABLE IF EXISTS `employees`;
DROP TABLE IF EXISTS `salary_schemes`;
DROP TABLE IF EXISTS `positions`;
DROP TABLE IF EXISTS `notifications`;

-- ============================================================================
-- 1. POSITIONS TABLE
-- ============================================================================
CREATE TABLE `positions` (
    `id` CHAR(36) NOT NULL PRIMARY KEY DEFAULT (UUID()),
    `name` VARCHAR(255) NOT NULL,
    `description` TEXT NULL,
    `department_id` CHAR(36) NULL,
    `is_priority` TINYINT(1) NULL DEFAULT 0,
    `created_at` DATETIME NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX `idx_positions_name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 2. SALARY_SCHEMES TABLE
-- ============================================================================
CREATE TABLE `salary_schemes` (
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
    `updated_at` DATETIME NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX `idx_salary_schemes_name` (`name`),
    INDEX `idx_salary_schemes_position_id` (`position_id`),
    INDEX `idx_salary_schemes_is_active` (`is_active`),
    INDEX `idx_salary_schemes_pay_type` (`pay_type`),
    
    CONSTRAINT `fk_salary_schemes_position` 
        FOREIGN KEY (`position_id`) REFERENCES `positions` (`id`) 
        ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 3. EMPLOYEES TABLE
-- ============================================================================
CREATE TABLE `employees` (
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
    `deleted_at` DATETIME NULL,
    
    INDEX `idx_employees_user_id` (`user_id`),
    INDEX `idx_employees_employee_code` (`employee_code`),
    INDEX `idx_employees_status` (`status`),
    INDEX `idx_employees_scheme_id` (`scheme_id`),
    
    CONSTRAINT `fk_employees_scheme` 
        FOREIGN KEY (`scheme_id`) REFERENCES `salary_schemes` (`id`) 
        ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 4. CONTRACTS TABLE
-- ============================================================================
CREATE TABLE `contracts` (
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
    
    INDEX `idx_contracts_employee_id` (`employee_id`),
    INDEX `idx_contracts_salary_scheme_id` (`salary_scheme_id`),
    INDEX `idx_contracts_is_active` (`is_active`),
    
    CONSTRAINT `fk_contracts_employee` 
        FOREIGN KEY (`employee_id`) REFERENCES `employees` (`id`) 
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT `fk_contracts_salary_scheme` 
        FOREIGN KEY (`salary_scheme_id`) REFERENCES `salary_schemes` (`id`) 
        ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 5. SHIFT_TYPES TABLE
-- ============================================================================
CREATE TABLE `shift_types` (
    `id` CHAR(36) NOT NULL PRIMARY KEY DEFAULT (UUID()),
    `name` VARCHAR(255) NOT NULL,
    `start_time` TIME NOT NULL,
    `end_time` TIME NOT NULL,
    `cross_midnight` TINYINT(1) NULL DEFAULT 0,
    `notes` TEXT NULL,
    `created_at` DATETIME NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX `idx_shift_types_name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 6. WEEKLY_SCHEDULE TABLE
-- ============================================================================
CREATE TABLE `weekly_schedule` (
    `id` CHAR(36) NOT NULL PRIMARY KEY DEFAULT (UUID()),
    `name` VARCHAR(255) NULL,
    `week_start` DATE NOT NULL,
    `week_end` DATE NOT NULL,
    `status` ENUM('draft', 'scheduled', 'finalized', 'cancelled', 'published', 'archived') NOT NULL DEFAULT 'draft',
    `created_by` CHAR(36) NULL,
    `notes` TEXT NULL,
    `created_at` DATETIME NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX `idx_weekly_schedule_week_start` (`week_start`),
    INDEX `idx_weekly_schedule_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 7. SHIFTS TABLE
-- ============================================================================
CREATE TABLE `shifts` (
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
    `updated_at` DATETIME NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX `idx_shifts_schedule_id` (`schedule_id`),
    INDEX `idx_shifts_shift_type_id` (`shift_type_id`),
    INDEX `idx_shifts_shift_date` (`shift_date`),
    
    CONSTRAINT `fk_shifts_schedule` 
        FOREIGN KEY (`schedule_id`) REFERENCES `weekly_schedule` (`id`) 
        ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT `fk_shifts_shift_type` 
        FOREIGN KEY (`shift_type_id`) REFERENCES `shift_types` (`id`) 
        ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 8. SHIFT_POSITION_REQUIREMENTS TABLE
-- ============================================================================
CREATE TABLE `shift_position_requirements` (
    `id` CHAR(36) NOT NULL PRIMARY KEY DEFAULT (UUID()),
    `shift_id` CHAR(36) NOT NULL,
    `position_id` CHAR(36) NOT NULL,
    `required_count` INT NOT NULL DEFAULT 1,
    `notes` TEXT NULL,
    `created_at` DATETIME NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX `idx_spr_shift_id` (`shift_id`),
    INDEX `idx_spr_position_id` (`position_id`),
    
    CONSTRAINT `fk_spr_shift` 
        FOREIGN KEY (`shift_id`) REFERENCES `shifts` (`id`) 
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT `fk_spr_position` 
        FOREIGN KEY (`position_id`) REFERENCES `positions` (`id`) 
        ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 9. SCHEDULE_ASSIGNMENTS TABLE
-- ============================================================================
CREATE TABLE `schedule_assignments` (
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
    
    INDEX `idx_sa_shift_id` (`shift_id`),
    INDEX `idx_sa_employee_id` (`employee_id`),
    INDEX `idx_sa_status` (`status`),
    INDEX `idx_sa_schedule_id` (`schedule_id`),
    INDEX `idx_sa_position_id` (`position_id`),
    
    CONSTRAINT `fk_sa_schedule` 
        FOREIGN KEY (`schedule_id`) REFERENCES `weekly_schedule` (`id`) 
        ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT `fk_sa_shift` 
        FOREIGN KEY (`shift_id`) REFERENCES `shifts` (`id`) 
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT `fk_sa_employee` 
        FOREIGN KEY (`employee_id`) REFERENCES `employees` (`id`) 
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT `fk_sa_position` 
        FOREIGN KEY (`position_id`) REFERENCES `positions` (`id`) 
        ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 10. EMPLOYEE_AVAILABILITY TABLE
-- ============================================================================
CREATE TABLE `employee_availability` (
    `id` CHAR(36) NOT NULL PRIMARY KEY DEFAULT (UUID()),
    `employee_id` CHAR(36) NOT NULL,
    `shift_id` CHAR(36) NULL,
    `day_of_week` ENUM('monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday') NULL,
    `start_time` TIME NULL,
    `end_time` TIME NULL,
    `status` ENUM('available', 'unavailable', 'preferred') NOT NULL DEFAULT 'available',
    `notes` TEXT NULL,
    `created_at` DATETIME NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX `idx_ea_employee_id` (`employee_id`),
    INDEX `idx_ea_shift_id` (`shift_id`),
    
    CONSTRAINT `fk_ea_employee` 
        FOREIGN KEY (`employee_id`) REFERENCES `employees` (`id`) 
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT `fk_ea_shift` 
        FOREIGN KEY (`shift_id`) REFERENCES `shifts` (`id`) 
        ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 10.1. EMPLOYEE_AVAILABILITY_POSITIONS TABLE (NEW)
-- ============================================================================
CREATE TABLE `employee_availability_positions` (
    `id` CHAR(36) NOT NULL PRIMARY KEY DEFAULT (UUID()),
    `availability_id` CHAR(36) NOT NULL,
    `position_id` CHAR(36) NOT NULL,
    `preference_order` INT NULL DEFAULT 1,
    `created_at` DATETIME NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX `idx_eap_availability_id` (`availability_id`),
    INDEX `idx_eap_position_id` (`position_id`),
    
    CONSTRAINT `fk_eap_availability` 
        FOREIGN KEY (`availability_id`) REFERENCES `employee_availability` (`id`) 
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT `fk_eap_position` 
        FOREIGN KEY (`position_id`) REFERENCES `positions` (`id`) 
        ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 11. DEVICES TABLE
-- ============================================================================
CREATE TABLE `devices` (
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
    `updated_at` DATETIME NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX `idx_devices_device_key` (`device_key`),
    INDEX `idx_devices_status` (`status`),
    INDEX `idx_devices_current_mode` (`current_mode`),
    
    CONSTRAINT `fk_devices_employee_pending` 
        FOREIGN KEY (`employee_id_pending`) REFERENCES `employees` (`id`) 
        ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 12. RFID_CARDS TABLE
-- ============================================================================
CREATE TABLE `rfid_cards` (
    `id` CHAR(36) NOT NULL PRIMARY KEY DEFAULT (UUID()),
    `employee_id` CHAR(36) NULL,
    `card_uid` VARCHAR(255) NOT NULL,
    `issued_at` DATETIME NULL,
    `revoked_at` DATETIME NULL,
    `status` ENUM('active', 'suspended', 'lost', 'revoked', 'inactive', 'damaged') NOT NULL DEFAULT 'active',
    `notes` TEXT NULL,
    `created_at` DATETIME NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX `idx_rfid_cards_card_uid` (`card_uid`),
    INDEX `idx_rfid_cards_employee_id` (`employee_id`),
    INDEX `idx_rfid_cards_status` (`status`),
    
    CONSTRAINT `fk_rfid_cards_employee` 
        FOREIGN KEY (`employee_id`) REFERENCES `employees` (`id`) 
        ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 13. ATTENDANCE_LOGS TABLE
-- ============================================================================
CREATE TABLE `attendance_logs` (
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
    `created_at` DATETIME NULL DEFAULT CURRENT_TIMESTAMP,
    
    INDEX `idx_al_card_uid` (`card_uid`),
    INDEX `idx_al_employee_id` (`employee_id`),
    INDEX `idx_al_event_type` (`event_type`),
    INDEX `idx_al_processed` (`processed`),
    INDEX `idx_al_rfid_card_id` (`rfid_card_id`),
    INDEX `idx_al_device_id` (`device_id`),
    
    CONSTRAINT `fk_al_rfid_card` 
        FOREIGN KEY (`rfid_card_id`) REFERENCES `rfid_cards` (`id`) 
        ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT `fk_al_employee` 
        FOREIGN KEY (`employee_id`) REFERENCES `employees` (`id`) 
        ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT `fk_al_device` 
        FOREIGN KEY (`device_id`) REFERENCES `devices` (`id`) 
        ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 14. ATTENDANCE_SHIFTS TABLE
-- ============================================================================
CREATE TABLE `attendance_shifts` (
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
    `updated_at` DATETIME NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX `idx_as_shift_id` (`shift_id`),
    INDEX `idx_as_employee_id` (`employee_id`),
    INDEX `idx_as_status` (`status`),
    INDEX `idx_as_schedule_assignment_id` (`schedule_assignment_id`),
    
    CONSTRAINT `fk_as_shift` 
        FOREIGN KEY (`shift_id`) REFERENCES `shifts` (`id`) 
        ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT `fk_as_schedule_assignment` 
        FOREIGN KEY (`schedule_assignment_id`) REFERENCES `schedule_assignments` (`id`) 
        ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT `fk_as_employee` 
        FOREIGN KEY (`employee_id`) REFERENCES `employees` (`id`) 
        ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 14.1. ATTENDANCE_ADJUSTMENTS TABLE (NEW)
-- ============================================================================
CREATE TABLE `attendance_adjustments` (
    `id` CHAR(36) NOT NULL PRIMARY KEY DEFAULT (UUID()),
    `attendance_shift_id` CHAR(36) NOT NULL,
    `requested_by` CHAR(36) NULL,
    `requested_at` DATETIME NULL,
    `old_value` JSON NULL,
    `proposed_value` JSON NULL,
    `approved_by` CHAR(36) NULL,
    `approved_at` DATETIME NULL,
    `status` ENUM('pending', 'approved', 'rejected') NOT NULL DEFAULT 'pending',
    `reason` TEXT NULL,
    `created_at` DATETIME NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX `idx_aa_attendance_shift_id` (`attendance_shift_id`),
    INDEX `idx_aa_requested_by` (`requested_by`),
    INDEX `idx_aa_status` (`status`),
    
    CONSTRAINT `fk_aa_attendance_shift` 
        FOREIGN KEY (`attendance_shift_id`) REFERENCES `attendance_shifts` (`id`) 
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT `fk_aa_requested_by` 
        FOREIGN KEY (`requested_by`) REFERENCES `employees` (`id`) 
        ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 15. MONTHLY_PAYROLLS TABLE
-- ============================================================================
CREATE TABLE `monthly_payrolls` (
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
    `updated_at` DATETIME NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX `idx_mp_employee_id` (`employee_id`),
    INDEX `idx_mp_month` (`month`),
    INDEX `idx_mp_status` (`status`),
    INDEX `idx_mp_contract_id` (`contract_id`),
    INDEX `idx_mp_salary_scheme_id` (`salary_scheme_id`),
    
    CONSTRAINT `fk_mp_employee` 
        FOREIGN KEY (`employee_id`) REFERENCES `employees` (`id`) 
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT `fk_mp_contract` 
        FOREIGN KEY (`contract_id`) REFERENCES `contracts` (`id`) 
        ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT `fk_mp_salary_scheme` 
        FOREIGN KEY (`salary_scheme_id`) REFERENCES `salary_schemes` (`id`) 
        ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 16. SALARY_REQUESTS TABLE
-- ============================================================================
CREATE TABLE `salary_requests` (
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
    
    INDEX `idx_sr_employee_id` (`employee_id`),
    INDEX `idx_sr_type` (`type`),
    INDEX `idx_sr_status` (`status`),
    INDEX `idx_sr_payroll_id` (`payroll_id`),
    INDEX `idx_sr_current_scheme_id` (`current_scheme_id`),
    INDEX `idx_sr_proposed_scheme_id` (`proposed_scheme_id`),
    
    CONSTRAINT `fk_sr_employee` 
        FOREIGN KEY (`employee_id`) REFERENCES `employees` (`id`) 
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT `fk_sr_current_scheme` 
        FOREIGN KEY (`current_scheme_id`) REFERENCES `salary_schemes` (`id`) 
        ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT `fk_sr_proposed_scheme` 
        FOREIGN KEY (`proposed_scheme_id`) REFERENCES `salary_schemes` (`id`) 
        ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT `fk_sr_payroll` 
        FOREIGN KEY (`payroll_id`) REFERENCES `monthly_payrolls` (`id`) 
        ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 17. DEDUCTIONS TABLE
-- ============================================================================
CREATE TABLE `deductions` (
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
    `updated_at` DATETIME NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX `idx_deductions_employee_id` (`employee_id`),
    INDEX `idx_deductions_payroll_id` (`payroll_id`),
    INDEX `idx_deductions_status` (`status`),
    INDEX `idx_deductions_related_shift_id` (`related_shift_id`),
    
    CONSTRAINT `fk_deductions_employee` 
        FOREIGN KEY (`employee_id`) REFERENCES `employees` (`id`) 
        ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT `fk_deductions_payroll` 
        FOREIGN KEY (`payroll_id`) REFERENCES `monthly_payrolls` (`id`) 
        ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT `fk_deductions_shift` 
        FOREIGN KEY (`related_shift_id`) REFERENCES `shifts` (`id`) 
        ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 18. NOTIFICATIONS TABLE
-- ============================================================================
CREATE TABLE `notifications` (
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
    `updated_at` DATETIME NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX `idx_notifications_status` (`status`),
    INDEX `idx_notifications_recipient_type` (`recipient_type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 19. SCHEDULE_CHANGE_REQUESTS TABLE
-- ============================================================================
CREATE TABLE `schedule_change_requests` (
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
    `updated_at` DATETIME NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX `idx_scr_requested_by` (`requested_by`),
    INDEX `idx_scr_status` (`status`),
    INDEX `idx_scr_assignment_id` (`assignment_id`),
    INDEX `idx_scr_target_employee_id` (`target_employee_id`),
    
    CONSTRAINT `fk_scr_requested_by` 
        FOREIGN KEY (`requested_by`) REFERENCES `employees` (`id`) 
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT `fk_scr_assignment` 
        FOREIGN KEY (`assignment_id`) REFERENCES `schedule_assignments` (`id`) 
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT `fk_scr_target_employee` 
        FOREIGN KEY (`target_employee_id`) REFERENCES `employees` (`id`) 
        ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 20. MONTHLY_EMPLOYEE_STATS TABLE
-- ============================================================================
CREATE TABLE `monthly_employee_stats` (
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
    `updated_at` DATETIME NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX `idx_mes_employee_id` (`employee_id`),
    INDEX `idx_mes_month` (`month`),
    
    CONSTRAINT `fk_mes_employee` 
        FOREIGN KEY (`employee_id`) REFERENCES `employees` (`id`) 
        ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- RESTORE SETTINGS
-- ============================================================================
SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS;
SET SQL_MODE=@OLD_SQL_MODE;

-- ============================================================================
-- VERIFICATION
-- ============================================================================
SELECT '========================================' AS '=';
SELECT '✅ COMPLETE DATABASE INIT (V6) SUCCESSFUL!' AS 'Status';
SELECT '========================================' AS '=';

-- Show all tables
SELECT 'Tables created:' AS info;
SELECT TABLE_NAME, ENGINE, TABLE_COLLATION
FROM INFORMATION_SCHEMA.TABLES 
WHERE TABLE_SCHEMA = DATABASE() 
AND TABLE_TYPE = 'BASE TABLE'
ORDER BY TABLE_NAME;

-- Show all Foreign Keys
SELECT '----------------------------------------' AS '-';
SELECT 'Foreign Keys created:' AS info;
SELECT 
    TABLE_NAME AS 'Table',
    CONSTRAINT_NAME AS 'FK Name',
    COLUMN_NAME AS 'Column',
    REFERENCED_TABLE_NAME AS 'Ref Table',
    REFERENCED_COLUMN_NAME AS 'Ref Column'
FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
WHERE TABLE_SCHEMA = DATABASE()
  AND REFERENCED_TABLE_NAME IS NOT NULL
ORDER BY TABLE_NAME, CONSTRAINT_NAME;

-- FK Summary
SELECT '----------------------------------------' AS '-';
SELECT 'FK Summary by Table:' AS info;
SELECT 
    TABLE_NAME AS 'Table',
    COUNT(*) AS 'FK Count'
FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS
WHERE TABLE_SCHEMA = DATABASE()
  AND CONSTRAINT_TYPE = 'FOREIGN KEY'
GROUP BY TABLE_NAME
ORDER BY TABLE_NAME;

SELECT '========================================' AS '=';
SELECT CONCAT('Total Tables: ', COUNT(*)) AS 'Summary'
FROM INFORMATION_SCHEMA.TABLES 
WHERE TABLE_SCHEMA = DATABASE() AND TABLE_TYPE = 'BASE TABLE';

SELECT CONCAT('Total Foreign Keys: ', COUNT(*)) AS 'Summary'
FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS
WHERE TABLE_SCHEMA = DATABASE() AND CONSTRAINT_TYPE = 'FOREIGN KEY';
SELECT '========================================' AS '=';
