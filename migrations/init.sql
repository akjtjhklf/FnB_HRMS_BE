-- ============================================
-- HRMS Database Initialization Script
-- MySQL Database Schema for Food & Beverage HRMS
-- Generated: 2025-11-30
-- ============================================

SET FOREIGN_KEY_CHECKS = 0;
SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET time_zone = "+00:00";

-- ============================================
-- SECTION 1: DIRECTUS CORE TABLES
-- ============================================

-- Directus Roles
CREATE TABLE IF NOT EXISTS `directus_roles` (
  `id` CHAR(36) NOT NULL,
  `name` VARCHAR(100) NOT NULL,
  `icon` VARCHAR(64) DEFAULT 'supervised_user_circle',
  `description` TEXT,
  `parent` CHAR(36) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_parent` (`parent`),
  CONSTRAINT `fk_roles_parent` FOREIGN KEY (`parent`) REFERENCES `directus_roles` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Directus Policies
CREATE TABLE IF NOT EXISTS `directus_policies` (
  `id` CHAR(36) NOT NULL,
  `name` VARCHAR(100) NOT NULL,
  `icon` VARCHAR(64) DEFAULT 'badge',
  `description` TEXT,
  `ip_access` TEXT,
  `enforce_tfa` BOOLEAN DEFAULT FALSE,
  `admin_access` BOOLEAN DEFAULT FALSE,
  `app_access` BOOLEAN DEFAULT FALSE,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Directus Permissions
CREATE TABLE IF NOT EXISTS `directus_permissions` (
  `id` CHAR(36) NOT NULL,
  `collection` VARCHAR(64) NOT NULL,
  `action` VARCHAR(10) NOT NULL,
  `permissions` JSON,
  `validation` JSON,
  `presets` JSON,
  `fields` TEXT,
  `policy` CHAR(36) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_policy` (`policy`),
  CONSTRAINT `fk_permissions_policy` FOREIGN KEY (`policy`) REFERENCES `directus_policies` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Directus Users
CREATE TABLE IF NOT EXISTS `directus_users` (
  `id` CHAR(36) NOT NULL,
  `first_name` VARCHAR(50),
  `last_name` VARCHAR(50),
  `email` VARCHAR(128) NOT NULL UNIQUE,
  `password` VARCHAR(255),
  `location` VARCHAR(255),
  `title` VARCHAR(50),
  `description` TEXT,
  `tags` JSON,
  `avatar` CHAR(36),
  `language` VARCHAR(8) DEFAULT 'en-US',
  `tfa_secret` VARCHAR(255),
  `status` ENUM('active', 'invited', 'suspended') DEFAULT 'active',
  `role` CHAR(36),
  `token` VARCHAR(255),
  `last_access` TIMESTAMP NULL,
  `last_page` VARCHAR(255),
  `provider` VARCHAR(128) DEFAULT 'default',
  `external_identifier` VARCHAR(255),
  `auth_data` JSON,
  `email_notifications` BOOLEAN DEFAULT TRUE,
  `appearance` VARCHAR(255),
  `theme_dark` VARCHAR(255),
  `theme_light` VARCHAR(255),
  `theme_dark_overrides` JSON,
  `theme_light_overrides` JSON,
  `text_direction` VARCHAR(10),
  `employee_id` CHAR(36),
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_role` (`role`),
  KEY `idx_employee_id` (`employee_id`),
  CONSTRAINT `fk_users_role` FOREIGN KEY (`role`) REFERENCES `directus_roles` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Directus Files
CREATE TABLE IF NOT EXISTS `directus_files` (
  `id` CHAR(36) NOT NULL,
  `storage` VARCHAR(255) NOT NULL,
  `filename_disk` VARCHAR(255),
  `filename_download` VARCHAR(255) NOT NULL,
  `title` VARCHAR(255),
  `type` VARCHAR(255),
  `folder` CHAR(36),
  `uploaded_by` CHAR(36),
  `created_on` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `modified_by` CHAR(36),
  `modified_on` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `charset` VARCHAR(50),
  `filesize` BIGINT UNSIGNED,
  `width` INT UNSIGNED,
  `height` INT UNSIGNED,
  `duration` INT,
  `embed` VARCHAR(200),
  `description` TEXT,
  `location` TEXT,
  `tags` TEXT,
  `metadata` JSON,
  `focal_point_x` INT,
  `focal_point_y` INT,
  `tus_id` VARCHAR(64),
  `tus_data` JSON,
  `uploaded_on` TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_uploaded_by` (`uploaded_by`),
  CONSTRAINT `fk_files_uploaded_by` FOREIGN KEY (`uploaded_by`) REFERENCES `directus_users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- SECTION 2: HR CORE TABLES
-- ============================================

-- Positions
CREATE TABLE IF NOT EXISTS `positions` (
  `id` CHAR(36) NOT NULL,
  `name` VARCHAR(100) NOT NULL,
  `description` TEXT,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_position_name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Employees
CREATE TABLE IF NOT EXISTS `employees` (
  `id` CHAR(36) NOT NULL,
  `user_id` CHAR(36),
  `employee_code` VARCHAR(50) NOT NULL UNIQUE,
  `first_name` VARCHAR(50),
  `last_name` VARCHAR(50),
  `full_name` VARCHAR(101) GENERATED ALWAYS AS (CONCAT_WS(' ', `first_name`, `last_name`)) STORED,
  `dob` DATE,
  `gender` ENUM('male', 'female', 'other'),
  `personal_id` VARCHAR(20),
  `phone` VARCHAR(20),
  `email` VARCHAR(128),
  `address` TEXT,
  `hire_date` DATE,
  `termination_date` DATE,
  `status` ENUM('active', 'on_leave', 'suspended', 'terminated') DEFAULT 'active',
  `scheme_id` CHAR(36),
  `position_id` CHAR(36),
  `default_work_hours_per_week` DECIMAL(5,2) DEFAULT 40.00,
  `max_hours_per_week` DECIMAL(5,2) DEFAULT 60.00,
  `max_consecutive_days` INT DEFAULT 6,
  `min_rest_hours_between_shifts` DECIMAL(5,2) DEFAULT 11.00,
  `photo_url` VARCHAR(255),
  `emergency_contact_name` VARCHAR(100),
  `emergency_contact_phone` VARCHAR(20),
  `notes` TEXT,
  `metadata` JSON,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` TIMESTAMP NULL,
  PRIMARY KEY (`id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_position_id` (`position_id`),
  KEY `idx_status` (`status`),
  KEY `idx_deleted_at` (`deleted_at`),
  CONSTRAINT `fk_employees_user` FOREIGN KEY (`user_id`) REFERENCES `directus_users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_employees_position` FOREIGN KEY (`position_id`) REFERENCES `positions` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Add foreign key from directus_users to employees
ALTER TABLE `directus_users` 
  ADD CONSTRAINT `fk_users_employee` FOREIGN KEY (`employee_id`) REFERENCES `employees` (`id`) ON DELETE SET NULL;

-- ============================================
-- SECTION 3: SALARY & CONTRACT TABLES
-- ============================================

-- Salary Schemes
CREATE TABLE IF NOT EXISTS `salary_schemes` (
  `id` CHAR(36) NOT NULL,
  `name` VARCHAR(100) NOT NULL,
  `position_id` CHAR(36),
  `pay_type` ENUM('hourly', 'fixed_shift', 'monthly') NOT NULL,
  `rate` DECIMAL(15,2) NOT NULL,
  `min_hours` DECIMAL(5,2),
  `overtime_multiplier` DECIMAL(3,2) DEFAULT 1.50,
  `effective_from` DATE,
  `effective_to` DATE,
  `is_active` BOOLEAN DEFAULT TRUE,
  `notes` TEXT,
  `metadata` JSON,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_position_id` (`position_id`),
  KEY `idx_is_active` (`is_active`),
  CONSTRAINT `fk_salary_schemes_position` FOREIGN KEY (`position_id`) REFERENCES `positions` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Contracts
CREATE TABLE IF NOT EXISTS `contracts` (
  `id` CHAR(36) NOT NULL,
  `employee_id` CHAR(36) NOT NULL,
  `contract_type` ENUM('full_time', 'part_time', 'casual', 'probation'),
  `start_date` DATE,
  `end_date` DATE,
  `base_salary` DECIMAL(15,2),
  `salary_scheme_id` CHAR(36),
  `probation_end_date` DATE,
  `signed_doc_url` VARCHAR(255),
  `is_active` BOOLEAN DEFAULT TRUE,
  `notes` TEXT,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_employee_id` (`employee_id`),
  KEY `idx_salary_scheme_id` (`salary_scheme_id`),
  KEY `idx_is_active` (`is_active`),
  CONSTRAINT `fk_contracts_employee` FOREIGN KEY (`employee_id`) REFERENCES `employees` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_contracts_salary_scheme` FOREIGN KEY (`salary_scheme_id`) REFERENCES `salary_schemes` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Salary Requests
CREATE TABLE IF NOT EXISTS `salary_requests` (
  `id` CHAR(36) NOT NULL,
  `employee_id` CHAR(36) NOT NULL,
  `type` ENUM('raise', 'adjustment') NOT NULL,
  `current_scheme_id` CHAR(36),
  `proposed_scheme_id` CHAR(36),
  `current_rate` DECIMAL(15,2),
  `proposed_rate` DECIMAL(15,2),
  `payroll_id` CHAR(36),
  `adjustment_amount` DECIMAL(15,2),
  `reason` TEXT,
  `manager_note` TEXT,
  `request_date` TIMESTAMP NOT NULL,
  `status` ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
  `approved_by` CHAR(36),
  `approved_at` TIMESTAMP NULL,
  `note` TEXT,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_employee_id` (`employee_id`),
  KEY `idx_status` (`status`),
  CONSTRAINT `fk_salary_requests_employee` FOREIGN KEY (`employee_id`) REFERENCES `employees` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_salary_requests_current_scheme` FOREIGN KEY (`current_scheme_id`) REFERENCES `salary_schemes` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_salary_requests_proposed_scheme` FOREIGN KEY (`proposed_scheme_id`) REFERENCES `salary_schemes` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_salary_requests_approved_by` FOREIGN KEY (`approved_by`) REFERENCES `directus_users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- SECTION 4: SCHEDULE TABLES
-- ============================================

-- Shift Types
CREATE TABLE IF NOT EXISTS `shift_types` (
  `id` CHAR(36) NOT NULL,
  `name` VARCHAR(100) NOT NULL,
  `start_time` TIME NOT NULL,
  `end_time` TIME NOT NULL,
  `cross_midnight` BOOLEAN DEFAULT FALSE,
  `notes` TEXT,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_shift_type_name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Weekly Schedule
CREATE TABLE IF NOT EXISTS `weekly_schedule` (
  `id` CHAR(36) NOT NULL,
  `week_start` DATE NOT NULL,
  `week_end` DATE NOT NULL,
  `created_by` CHAR(36),
  `status` ENUM('draft', 'scheduled', 'finalized', 'cancelled') DEFAULT 'draft',
  `published_at` TIMESTAMP NULL,
  `notes` TEXT,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_week_start` (`week_start`),
  KEY `idx_status` (`status`),
  KEY `idx_created_by` (`created_by`),
  CONSTRAINT `fk_weekly_schedule_created_by` FOREIGN KEY (`created_by`) REFERENCES `directus_users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Shifts
CREATE TABLE IF NOT EXISTS `shifts` (
  `id` CHAR(36) NOT NULL,
  `schedule_id` CHAR(36),
  `shift_type_id` CHAR(36) NOT NULL,
  `shift_date` DATE NOT NULL,
  `start_at` TIME,
  `end_at` TIME,
  `total_required` INT DEFAULT 1,
  `notes` TEXT,
  `metadata` JSON,
  `created_by` CHAR(36),
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_schedule_id` (`schedule_id`),
  KEY `idx_shift_type_id` (`shift_type_id`),
  KEY `idx_shift_date` (`shift_date`),
  CONSTRAINT `fk_shifts_schedule` FOREIGN KEY (`schedule_id`) REFERENCES `weekly_schedule` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_shifts_shift_type` FOREIGN KEY (`shift_type_id`) REFERENCES `shift_types` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_shifts_created_by` FOREIGN KEY (`created_by`) REFERENCES `directus_users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Shift Position Requirements
CREATE TABLE IF NOT EXISTS `shift_position_requirements` (
  `id` CHAR(36) NOT NULL,
  `shift_id` CHAR(36) NOT NULL,
  `position_id` CHAR(36) NOT NULL,
  `required_count` INT NOT NULL DEFAULT 1,
  `notes` TEXT,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_shift_id` (`shift_id`),
  KEY `idx_position_id` (`position_id`),
  UNIQUE KEY `idx_shift_position` (`shift_id`, `position_id`),
  CONSTRAINT `fk_shift_pos_req_shift` FOREIGN KEY (`shift_id`) REFERENCES `shifts` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_shift_pos_req_position` FOREIGN KEY (`position_id`) REFERENCES `positions` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Schedule Assignments
CREATE TABLE IF NOT EXISTS `schedule_assignments` (
  `id` CHAR(36) NOT NULL,
  `schedule_id` CHAR(36),
  `shift_id` CHAR(36) NOT NULL,
  `employee_id` CHAR(36) NOT NULL,
  `position_id` CHAR(36) NOT NULL,
  `assigned_by` CHAR(36),
  `assigned_at` TIMESTAMP NULL,
  `status` ENUM('assigned', 'tentative', 'swapped', 'cancelled') DEFAULT 'assigned',
  `source` ENUM('auto', 'manual') DEFAULT 'manual',
  `note` TEXT,
  `confirmed_by_employee` BOOLEAN DEFAULT FALSE,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_schedule_id` (`schedule_id`),
  KEY `idx_shift_id` (`shift_id`),
  KEY `idx_employee_id` (`employee_id`),
  KEY `idx_position_id` (`position_id`),
  KEY `idx_status` (`status`),
  CONSTRAINT `fk_schedule_assignments_schedule` FOREIGN KEY (`schedule_id`) REFERENCES `weekly_schedule` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_schedule_assignments_shift` FOREIGN KEY (`shift_id`) REFERENCES `shifts` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_schedule_assignments_employee` FOREIGN KEY (`employee_id`) REFERENCES `employees` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_schedule_assignments_position` FOREIGN KEY (`position_id`) REFERENCES `positions` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_schedule_assignments_assigned_by` FOREIGN KEY (`assigned_by`) REFERENCES `directus_users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Employee Availability (Employee registration for shifts)
CREATE TABLE IF NOT EXISTS `employee_availability` (
  `id` CHAR(36) NOT NULL,
  `employee_id` CHAR(36) NOT NULL,
  `shift_id` CHAR(36) NOT NULL,
  `status` VARCHAR(20) DEFAULT 'pending',
  `priority` INT,
  `expires_at` TIMESTAMP NULL,
  `note` TEXT,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_employee_id` (`employee_id`),
  KEY `idx_shift_id` (`shift_id`),
  KEY `idx_status` (`status`),
  CONSTRAINT `fk_employee_availability_employee` FOREIGN KEY (`employee_id`) REFERENCES `employees` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_employee_availability_shift` FOREIGN KEY (`shift_id`) REFERENCES `shifts` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Employee Availability Positions
CREATE TABLE IF NOT EXISTS `employee_availability_positions` (
  `id` CHAR(36) NOT NULL,
  `availability_id` CHAR(36) NOT NULL,
  `position_id` CHAR(36) NOT NULL,
  `preference_order` INT,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_availability_id` (`availability_id`),
  KEY `idx_position_id` (`position_id`),
  CONSTRAINT `fk_emp_avail_pos_availability` FOREIGN KEY (`availability_id`) REFERENCES `employee_availability` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_emp_avail_pos_position` FOREIGN KEY (`position_id`) REFERENCES `positions` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Schedule Change Requests
CREATE TABLE IF NOT EXISTS `schedule_change_requests` (
  `id` CHAR(36) NOT NULL,
  `requester_id` CHAR(36) NOT NULL,
  `type` ENUM('shift_swap', 'pass_shift', 'day_off') NOT NULL,
  `from_shift_id` CHAR(36),
  `to_shift_id` CHAR(36),
  `from_assignment_id` CHAR(36),
  `to_assignment_id` CHAR(36),
  `target_employee_id` CHAR(36),
  `replacement_employee_id` CHAR(36),
  `reason` TEXT,
  `status` ENUM('pending', 'approved', 'rejected', 'cancelled') DEFAULT 'pending',
  `approved_by` CHAR(36),
  `approved_at` TIMESTAMP NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_requester_id` (`requester_id`),
  KEY `idx_status` (`status`),
  KEY `idx_from_assignment` (`from_assignment_id`),
  KEY `idx_to_assignment` (`to_assignment_id`),
  CONSTRAINT `fk_schedule_change_requester` FOREIGN KEY (`requester_id`) REFERENCES `employees` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_schedule_change_from_shift` FOREIGN KEY (`from_shift_id`) REFERENCES `shifts` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_schedule_change_to_shift` FOREIGN KEY (`to_shift_id`) REFERENCES `shifts` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_schedule_change_from_assignment` FOREIGN KEY (`from_assignment_id`) REFERENCES `schedule_assignments` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_schedule_change_to_assignment` FOREIGN KEY (`to_assignment_id`) REFERENCES `schedule_assignments` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_schedule_change_target_emp` FOREIGN KEY (`target_employee_id`) REFERENCES `employees` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_schedule_change_replacement_emp` FOREIGN KEY (`replacement_employee_id`) REFERENCES `employees` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_schedule_change_approved_by` FOREIGN KEY (`approved_by`) REFERENCES `directus_users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- SECTION 5: ATTENDANCE & RFID TABLES
-- ============================================

-- Devices
CREATE TABLE IF NOT EXISTS `devices` (
  `id` CHAR(36) NOT NULL,
  `name` VARCHAR(100) NOT NULL,
  `location` VARCHAR(255),
  `device_key` VARCHAR(255) NOT NULL UNIQUE,
  `ip_address` VARCHAR(45),
  `mac_address` VARCHAR(17),
  `firmware_version` VARCHAR(50),
  `last_seen_at` TIMESTAMP NULL,
  `status` ENUM('online', 'offline', 'decommissioned') DEFAULT 'offline',
  `current_mode` ENUM('attendance', 'enroll') DEFAULT 'attendance',
  `employee_id_pending` CHAR(36),
  `metadata` JSON,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_status` (`status`),
  KEY `idx_employee_id_pending` (`employee_id_pending`),
  CONSTRAINT `fk_devices_employee_pending` FOREIGN KEY (`employee_id_pending`) REFERENCES `employees` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- RFID Cards
CREATE TABLE IF NOT EXISTS `rfid_cards` (
  `id` CHAR(36) NOT NULL,
  `employee_id` CHAR(36),
  `card_uid` VARCHAR(255) NOT NULL UNIQUE,
  `issued_at` TIMESTAMP NULL,
  `revoked_at` TIMESTAMP NULL,
  `status` ENUM('active', 'suspended', 'lost', 'revoked') DEFAULT 'active',
  `notes` TEXT,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_employee_id` (`employee_id`),
  KEY `idx_card_uid` (`card_uid`),
  KEY `idx_status` (`status`),
  CONSTRAINT `fk_rfid_cards_employee` FOREIGN KEY (`employee_id`) REFERENCES `employees` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Attendance Logs (Raw RFID tap events)
CREATE TABLE IF NOT EXISTS `attendance_logs` (
  `id` CHAR(36) NOT NULL,
  `card_uid` VARCHAR(255) NOT NULL,
  `rfid_card_id` CHAR(36),
  `employee_id` CHAR(36),
  `device_id` CHAR(36),
  `event_type` ENUM('tap', 'clock_in', 'clock_out') DEFAULT 'tap',
  `event_time` TIMESTAMP NOT NULL,
  `raw_payload` TEXT,
  `processed` BOOLEAN DEFAULT FALSE,
  `match_attempted_at` TIMESTAMP NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_card_uid` (`card_uid`),
  KEY `idx_employee_id` (`employee_id`),
  KEY `idx_device_id` (`device_id`),
  KEY `idx_event_time` (`event_time`),
  KEY `idx_processed` (`processed`),
  CONSTRAINT `fk_attendance_logs_rfid_card` FOREIGN KEY (`rfid_card_id`) REFERENCES `rfid_cards` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_attendance_logs_employee` FOREIGN KEY (`employee_id`) REFERENCES `employees` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_attendance_logs_device` FOREIGN KEY (`device_id`) REFERENCES `devices` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Attendance Shifts (Processed attendance records per shift)
CREATE TABLE IF NOT EXISTS `attendance_shifts` (
  `id` CHAR(36) NOT NULL,
  `shift_id` CHAR(36),
  `schedule_assignment_id` CHAR(36),
  `employee_id` CHAR(36) NOT NULL,
  `clock_in` TIMESTAMP NULL,
  `clock_out` TIMESTAMP NULL,
  `worked_minutes` INT,
  `late_minutes` INT DEFAULT 0,
  `early_leave_minutes` INT DEFAULT 0,
  `status` ENUM('present', 'absent', 'partial') DEFAULT 'absent',
  `manual_adjusted` BOOLEAN DEFAULT FALSE,
  `notes` TEXT,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_shift_id` (`shift_id`),
  KEY `idx_schedule_assignment_id` (`schedule_assignment_id`),
  KEY `idx_employee_id` (`employee_id`),
  KEY `idx_status` (`status`),
  CONSTRAINT `fk_attendance_shifts_shift` FOREIGN KEY (`shift_id`) REFERENCES `shifts` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_attendance_shifts_assignment` FOREIGN KEY (`schedule_assignment_id`) REFERENCES `schedule_assignments` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_attendance_shifts_employee` FOREIGN KEY (`employee_id`) REFERENCES `employees` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Attendance Adjustments
CREATE TABLE IF NOT EXISTS `attendance_adjustments` (
  `id` CHAR(36) NOT NULL,
  `attendance_shift_id` CHAR(36) NOT NULL,
  `requested_by` CHAR(36),
  `requested_at` TIMESTAMP NULL,
  `old_value` JSON,
  `proposed_value` JSON,
  `approved_by` CHAR(36),
  `approved_at` TIMESTAMP NULL,
  `status` ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
  `reason` TEXT,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_attendance_shift_id` (`attendance_shift_id`),
  KEY `idx_status` (`status`),
  CONSTRAINT `fk_attendance_adj_shift` FOREIGN KEY (`attendance_shift_id`) REFERENCES `attendance_shifts` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_attendance_adj_requested_by` FOREIGN KEY (`requested_by`) REFERENCES `directus_users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_attendance_adj_approved_by` FOREIGN KEY (`approved_by`) REFERENCES `directus_users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- SECTION 6: PAYROLL & FINANCIAL TABLES
-- ============================================

-- Deductions
CREATE TABLE IF NOT EXISTS `deductions` (
  `id` CHAR(36) NOT NULL,
  `employee_id` CHAR(36) NOT NULL,
  `type` ENUM('advance', 'penalty', 'expense') NOT NULL,
  `amount` DECIMAL(15,2),
  `currency` VARCHAR(3) DEFAULT 'VND',
  `related_shift_id` CHAR(36),
  `note` TEXT,
  `status` ENUM('pending', 'applied', 'reimbursed') DEFAULT 'pending',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_employee_id` (`employee_id`),
  KEY `idx_status` (`status`),
  CONSTRAINT `fk_deductions_employee` FOREIGN KEY (`employee_id`) REFERENCES `employees` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_deductions_shift` FOREIGN KEY (`related_shift_id`) REFERENCES `shifts` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Monthly Payrolls
CREATE TABLE IF NOT EXISTS `monthly_payrolls` (
  `id` CHAR(36) NOT NULL,
  `employee_id` CHAR(36) NOT NULL,
  `month` VARCHAR(7) NOT NULL,
  `salary_scheme_id` CHAR(36),
  `base_salary` DECIMAL(15,2) NOT NULL DEFAULT 0,
  `allowances` DECIMAL(15,2) NOT NULL DEFAULT 0,
  `bonuses` DECIMAL(15,2) NOT NULL DEFAULT 0,
  `overtime_pay` DECIMAL(15,2) NOT NULL DEFAULT 0,
  `deductions` DECIMAL(15,2) NOT NULL DEFAULT 0,
  `penalties` DECIMAL(15,2) NOT NULL DEFAULT 0,
  `gross_salary` DECIMAL(15,2) GENERATED ALWAYS AS (`base_salary` + `allowances` + `bonuses` + `overtime_pay`) STORED,
  `net_salary` DECIMAL(15,2) GENERATED ALWAYS AS (`base_salary` + `allowances` + `bonuses` + `overtime_pay` - `deductions` - `penalties`) STORED,
  `total_work_hours` DECIMAL(8,2),
  `overtime_hours` DECIMAL(8,2),
  `late_minutes` INT,
  `absent_days` INT,
  `notes` TEXT,
  `status` ENUM('draft', 'pending_approval', 'approved', 'paid') DEFAULT 'draft',
  `approved_by` CHAR(36),
  `approved_at` TIMESTAMP NULL,
  `paid_at` TIMESTAMP NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_employee_id` (`employee_id`),
  KEY `idx_month` (`month`),
  KEY `idx_status` (`status`),
  UNIQUE KEY `idx_employee_month` (`employee_id`, `month`),
  CONSTRAINT `fk_monthly_payrolls_employee` FOREIGN KEY (`employee_id`) REFERENCES `employees` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_monthly_payrolls_salary_scheme` FOREIGN KEY (`salary_scheme_id`) REFERENCES `salary_schemes` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_monthly_payrolls_approved_by` FOREIGN KEY (`approved_by`) REFERENCES `directus_users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Add foreign key from salary_requests to monthly_payrolls
ALTER TABLE `salary_requests`
  ADD CONSTRAINT `fk_salary_requests_payroll` FOREIGN KEY (`payroll_id`) REFERENCES `monthly_payrolls` (`id`) ON DELETE CASCADE;

-- ============================================
-- SECTION 7: STATISTICS & ANALYTICS TABLES
-- ============================================

-- Monthly Employee Stats
CREATE TABLE IF NOT EXISTS `monthly_employee_stats` (
  `id` CHAR(36) NOT NULL,
  `employee_id` CHAR(36) NOT NULL,
  `month` VARCHAR(7) NOT NULL,
  `total_shifts_assigned` INT DEFAULT 0,
  `total_shifts_worked` INT DEFAULT 0,
  `swaps_count` INT DEFAULT 0,
  `pass_count` INT DEFAULT 0,
  `off_count` INT DEFAULT 0,
  `total_worked_minutes` INT DEFAULT 0,
  `overtime_minutes` INT DEFAULT 0,
  `late_minutes` INT DEFAULT 0,
  `absent_count` INT DEFAULT 0,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_employee_month` (`employee_id`, `month`),
  KEY `idx_month` (`month`),
  CONSTRAINT `fk_monthly_emp_stats_employee` FOREIGN KEY (`employee_id`) REFERENCES `employees` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- SECTION 8: NOTIFICATIONS TABLES
-- ============================================

-- Notifications
CREATE TABLE IF NOT EXISTS `notifications` (
  `id` CHAR(36) NOT NULL,
  `title` VARCHAR(255) NOT NULL,
  `message` TEXT NOT NULL,
  `action_url` VARCHAR(255),
  `recipient_type` ENUM('ALL', 'SPECIFIC') NOT NULL,
  `status` ENUM('draft', 'scheduled', 'sent', 'failed') DEFAULT 'draft',
  `user_ids` JSON,
  `scheduled_at` TIMESTAMP NULL,
  `sent_at` TIMESTAMP NULL,
  `created_by` CHAR(36),
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_status` (`status`),
  KEY `idx_created_by` (`created_by`),
  CONSTRAINT `fk_notifications_created_by` FOREIGN KEY (`created_by`) REFERENCES `directus_users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Notification Logs
CREATE TABLE IF NOT EXISTS `notification_logs` (
  `id` CHAR(36) NOT NULL,
  `trigger_id` VARCHAR(255) NOT NULL,
  `notification_id` CHAR(36),
  `title` VARCHAR(255) NOT NULL,
  `content` TEXT NOT NULL,
  `channel` ENUM('in_app', 'email', 'sms', 'push') NOT NULL,
  `recipients` JSON NOT NULL,
  `workflow_id` VARCHAR(255),
  `payload` JSON,
  `triggered_by` CHAR(36),
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_notification_id` (`notification_id`),
  KEY `idx_trigger_id` (`trigger_id`),
  CONSTRAINT `fk_notification_logs_notification` FOREIGN KEY (`notification_id`) REFERENCES `notifications` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_notification_logs_triggered_by` FOREIGN KEY (`triggered_by`) REFERENCES `directus_users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- SECTION 9: INDEXES FOR PERFORMANCE
-- ============================================

-- Additional composite indexes for common queries
CREATE INDEX `idx_shifts_date_type` ON `shifts` (`shift_date`, `shift_type_id`);
CREATE INDEX `idx_assignments_employee_shift` ON `schedule_assignments` (`employee_id`, `shift_id`);
CREATE INDEX `idx_attendance_shift_employee_date` ON `attendance_shifts` (`employee_id`, `clock_in`);
CREATE INDEX `idx_contracts_employee_active` ON `contracts` (`employee_id`, `is_active`);
CREATE INDEX `idx_payrolls_employee_month` ON `monthly_payrolls` (`employee_id`, `month`);

-- ============================================
-- SECTION 10: INITIAL DATA (Optional)
-- ============================================

-- Insert default admin role
INSERT IGNORE INTO `directus_roles` (`id`, `name`, `icon`, `description`) 
VALUES 
('00000000-0000-0000-0000-000000000001', 'Administrator', 'verified_user', 'System administrator with full access'),
('00000000-0000-0000-0000-000000000002', 'Manager', 'supervisor_account', 'Manager with scheduling and payroll access'),
('00000000-0000-0000-0000-000000000003', 'Employee', 'person', 'Regular employee with limited access');

-- Insert default positions
INSERT IGNORE INTO `positions` (`id`, `name`, `description`) 
VALUES 
('00000000-0000-0000-0000-000000000001', 'Server', 'Customer service and table service'),
('00000000-0000-0000-0000-000000000002', 'Bartender', 'Beverage preparation and bar service'),
('00000000-0000-0000-0000-000000000003', 'Chef', 'Food preparation'),
('00000000-0000-0000-0000-000000000004', 'Cashier', 'Payment processing and customer checkout'),
('00000000-0000-0000-0000-000000000005', 'Host', 'Guest reception and seating');

-- Insert default shift types
INSERT IGNORE INTO `shift_types` (`id`, `name`, `start_time`, `end_time`, `cross_midnight`) 
VALUES 
('00000000-0000-0000-0000-000000000001', 'Morning Shift', '06:00:00', '14:00:00', FALSE),
('00000000-0000-0000-0000-000000000002', 'Afternoon Shift', '14:00:00', '22:00:00', FALSE),
('00000000-0000-0000-0000-000000000003', 'Night Shift', '22:00:00', '06:00:00', TRUE),
('00000000-0000-0000-0000-000000000004', 'Full Day', '09:00:00', '17:00:00', FALSE);

-- ============================================
-- SECTION 11: VIEWS (Optional Performance Enhancement)
-- ============================================

-- View: Employee Full Details
CREATE OR REPLACE VIEW `v_employee_details` AS
SELECT 
  e.*,
  p.name AS position_name,
  u.email AS user_email,
  u.status AS user_status
FROM `employees` e
LEFT JOIN `positions` p ON e.position_id = p.id
LEFT JOIN `directus_users` u ON e.user_id = u.id
WHERE e.deleted_at IS NULL;

-- View: Active Contracts
CREATE OR REPLACE VIEW `v_active_contracts` AS
SELECT 
  c.*,
  e.employee_code,
  e.full_name AS employee_name,
  ss.name AS salary_scheme_name,
  ss.pay_type,
  ss.rate
FROM `contracts` c
JOIN `employees` e ON c.employee_id = e.id
LEFT JOIN `salary_schemes` ss ON c.salary_scheme_id = ss.id
WHERE c.is_active = TRUE
  AND e.deleted_at IS NULL;

-- View: Current Month Attendance Summary
CREATE OR REPLACE VIEW `v_current_month_attendance` AS
SELECT 
  e.id AS employee_id,
  e.employee_code,
  e.full_name AS employee_name,
  COUNT(DISTINCT ats.id) AS total_shifts,
  SUM(CASE WHEN ats.status = 'present' THEN 1 ELSE 0 END) AS present_count,
  SUM(CASE WHEN ats.status = 'absent' THEN 1 ELSE 0 END) AS absent_count,
  SUM(CASE WHEN ats.status = 'partial' THEN 1 ELSE 0 END) AS partial_count,
  SUM(ats.worked_minutes) AS total_worked_minutes,
  SUM(ats.late_minutes) AS total_late_minutes,
  SUM(ats.early_leave_minutes) AS total_early_leave_minutes
FROM `employees` e
LEFT JOIN `attendance_shifts` ats 
  ON e.id = ats.employee_id 
  AND DATE_FORMAT(ats.clock_in, '%Y-%m') = DATE_FORMAT(NOW(), '%Y-%m')
WHERE e.deleted_at IS NULL
GROUP BY e.id, e.employee_code, e.full_name;

-- ============================================
-- COMPLETION
-- ============================================

SET FOREIGN_KEY_CHECKS = 1;

-- Display completion message
SELECT 'HRMS Database Initialization Complete!' AS Status,
       'All tables, indexes, and initial data have been created successfully.' AS Message;
