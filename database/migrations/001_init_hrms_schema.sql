-- ============================================
-- HRMS Complete Database Schema Migration
-- ============================================
-- This file contains ALL custom tables for HRMS
-- Run this AFTER Directus core tables are created
-- ============================================

SET FOREIGN_KEY_CHECKS=0;

-- ============================================
-- 1. EMPLOYEES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS `employees` (
  `id` char(36) NOT NULL,
  `employee_code` varchar(50) DEFAULT NULL,
  `first_name` varchar(100) NOT NULL,
  `last_name` varchar(100) NOT NULL,
  `full_name` varchar(200) DEFAULT NULL,
  `email` varchar(255) DEFAULT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `photo_url` varchar(500) DEFAULT NULL,
  `date_of_birth` date DEFAULT NULL,
  `hire_date` date DEFAULT NULL,
  `status` varchar(20) DEFAULT 'active',
  `user_id` char(36) DEFAULT NULL COMMENT 'Link to directus_users for auth',
  `position_id` char(36) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `employee_code_unique` (`employee_code`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_status` (`status`),
  KEY `idx_position` (`position_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 2. POSITIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS `positions` (
  `id` char(36) NOT NULL,
  `name` varchar(100) NOT NULL,
  `description` text,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 3. CONTRACTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS `contracts` (
  `id` char(36) NOT NULL,
  `employee_id` char(36) NOT NULL,
  `contract_type` varchar(50) DEFAULT NULL,
  `start_date` date NOT NULL,
  `end_date` date DEFAULT NULL,
  `salary` decimal(15,2) DEFAULT NULL,
  `status` varchar(20) DEFAULT 'active',
  `notes` text,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_employee` (`employee_id`),
  KEY `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 4. SHIFT TYPES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS `shift_types` (
  `id` char(36) NOT NULL,
  `name` varchar(100) NOT NULL,
  `description` text,
  `color` varchar(20) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 5. SHIFTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS `shifts` (
  `id` char(36) NOT NULL,
  `shift_type_id` char(36) DEFAULT NULL,
  `shift_date` date NOT NULL,
  `start_at` time NOT NULL,
  `end_at` time NOT NULL,
  `break_duration` int DEFAULT 0 COMMENT 'Break duration in minutes',
  `notes` text,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_shift_date` (`shift_date`),
  KEY `idx_shift_type` (`shift_type_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 6. SHIFT POSITION REQUIREMENTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS `shift_position_requirements` (
  `id` char(36) NOT NULL,
  `shift_id` char(36) NOT NULL,
  `position_id` char(36) NOT NULL,
  `required_count` int NOT NULL DEFAULT 1,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_shift` (`shift_id`),
  KEY `idx_position` (`position_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 7. WEEKLY SCHEDULES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS `weekly_schedule` (
  `id` char(36) NOT NULL,
  `week_start_date` date NOT NULL,
  `week_end_date` date NOT NULL,
  `status` varchar(20) DEFAULT 'draft',
  `published_at` timestamp NULL DEFAULT NULL,
  `finalized_at` timestamp NULL DEFAULT NULL,
  `created_by` char(36) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_week_start` (`week_start_date`),
  KEY `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 8. SCHEDULE ASSIGNMENTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS `schedule_assignments` (
  `id` char(36) NOT NULL,
  `shift_id` char(36) NOT NULL,
  `employee_id` char(36) NOT NULL,
  `position_id` char(36) DEFAULT NULL,
  `weekly_schedule_id` char(36) DEFAULT NULL,
  `status` varchar(20) DEFAULT 'assigned',
  `notes` text,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_shift` (`shift_id`),
  KEY `idx_employee` (`employee_id`),
  KEY `idx_position` (`position_id`),
  KEY `idx_weekly_schedule` (`weekly_schedule_id`),
  KEY `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 9. EMPLOYEE AVAILABILITY TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS `employee_availability` (
  `id` char(36) NOT NULL,
  `employee_id` char(36) NOT NULL,
  `shift_type_id` char(36) DEFAULT NULL,
  `day_of_week` int NOT NULL COMMENT '0=Sunday, 6=Saturday',
  `is_available` tinyint(1) DEFAULT 1,
  `preference_level` int DEFAULT 1 COMMENT '1=Preferred, 2=Acceptable, 3=Not Preferred',
  `notes` text,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_employee` (`employee_id`),
  KEY `idx_shift_type` (`shift_type_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 10. SCHEDULE CHANGE REQUESTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS `schedule_change_requests` (
  `id` char(36) NOT NULL,
  `requester_id` char(36) NOT NULL,
  `type` varchar(20) NOT NULL COMMENT 'shift_swap, pass_shift, day_off',
  `from_shift_id` char(36) DEFAULT NULL,
  `to_shift_id` char(36) DEFAULT NULL,
  `from_assignment_id` char(36) DEFAULT NULL COMMENT 'Assignment to swap from',
  `to_assignment_id` char(36) DEFAULT NULL COMMENT 'Assignment to swap to',
  `target_employee_id` char(36) DEFAULT NULL,
  `replacement_employee_id` char(36) DEFAULT NULL,
  `reason` text,
  `status` varchar(20) DEFAULT 'pending',
  `approved_by` char(36) DEFAULT NULL,
  `approved_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_requester` (`requester_id`),
  KEY `idx_status` (`status`),
  KEY `idx_from_assignment` (`from_assignment_id`),
  KEY `idx_to_assignment` (`to_assignment_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 11. ATTENDANCE SHIFTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS `attendance_shifts` (
  `id` char(36) NOT NULL,
  `schedule_assignment_id` char(36) DEFAULT NULL,
  `shift_id` char(36) DEFAULT NULL,
  `employee_id` char(36) NOT NULL,
  `clock_in` timestamp NULL DEFAULT NULL,
  `clock_out` timestamp NULL DEFAULT NULL,
  `worked_minutes` int DEFAULT NULL,
  `late_minutes` int DEFAULT 0,
  `early_leave_minutes` int DEFAULT 0,
  `status` varchar(20) DEFAULT 'partial' COMMENT 'present, absent, partial',
  `notes` text,
  `manual_adjusted` tinyint(1) DEFAULT 0,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_employee` (`employee_id`),
  KEY `idx_assignment` (`schedule_assignment_id`),
  KEY `idx_shift` (`shift_id`),
  KEY `idx_status` (`status`),
  KEY `idx_clock_in` (`clock_in`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 12. ATTENDANCE LOGS TABLE (Legacy/Alternative)
-- ============================================
CREATE TABLE IF NOT EXISTS `attendance_logs` (
  `id` char(36) NOT NULL,
  `employee_id` char(36) NOT NULL,
  `device_id` char(36) DEFAULT NULL,
  `check_in_time` timestamp NULL DEFAULT NULL,
  `check_out_time` timestamp NULL DEFAULT NULL,
  `status` varchar(20) DEFAULT 'present',
  `date` date NOT NULL,
  `notes` text,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_employee` (`employee_id`),
  KEY `idx_date` (`date`),
  KEY `idx_device` (`device_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 13. ATTENDANCE ADJUSTMENTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS `attendance_adjustments` (
  `id` char(36) NOT NULL,
  `attendance_log_id` char(36) DEFAULT NULL,
  `employee_id` char(36) NOT NULL,
  `adjustment_type` varchar(20) NOT NULL COMMENT 'add, modify, delete',
  `original_check_in` timestamp NULL DEFAULT NULL,
  `original_check_out` timestamp NULL DEFAULT NULL,
  `adjusted_check_in` timestamp NULL DEFAULT NULL,
  `adjusted_check_out` timestamp NULL DEFAULT NULL,
  `reason` text,
  `status` varchar(20) DEFAULT 'pending',
  `requested_by` char(36) DEFAULT NULL,
  `approved_by` char(36) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_employee` (`employee_id`),
  KEY `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 14. DEVICES TABLE (RFID/Biometric)
-- ============================================
CREATE TABLE IF NOT EXISTS `devices` (
  `id` char(36) NOT NULL,
  `device_name` varchar(100) NOT NULL,
  `device_code` varchar(50) NOT NULL,
  `device_type` varchar(20) DEFAULT 'rfid' COMMENT 'rfid, biometric, mobile',
  `location` varchar(200) DEFAULT NULL,
  `ip_address` varchar(50) DEFAULT NULL,
  `status` varchar(20) DEFAULT 'active',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `device_code_unique` (`device_code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 15. RFID CARDS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS `rfid_cards` (
  `id` char(36) NOT NULL,
  `card_number` varchar(50) NOT NULL,
  `employee_id` char(36) DEFAULT NULL,
  `status` varchar(20) DEFAULT 'active',
  `issued_at` timestamp NULL DEFAULT NULL,
  `expires_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `card_number_unique` (`card_number`),
  KEY `idx_employee` (`employee_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 16. SALARY SCHEMES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS `salary_schemes` (
  `id` char(36) NOT NULL,
  `name` varchar(100) NOT NULL,
  `description` text,
  `base_salary` decimal(15,2) DEFAULT NULL,
  `hourly_rate` decimal(10,2) DEFAULT NULL,
  `overtime_multiplier` decimal(4,2) DEFAULT 1.5,
  `position_id` char(36) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_position` (`position_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 17. MONTHLY PAYROLLS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS `monthly_payrolls` (
  `id` char(36) NOT NULL,
  `employee_id` char(36) NOT NULL,
  `month` varchar(7) NOT NULL COMMENT 'YYYY-MM format',
  `total_work_hours` decimal(10,2) DEFAULT 0,
  `total_days` int DEFAULT 0,
  `absent_days` int DEFAULT 0,
  `late_days` int DEFAULT 0,
  `base_salary` decimal(15,2) DEFAULT 0,
  `overtime_pay` decimal(15,2) DEFAULT 0,
  `deductions` decimal(15,2) DEFAULT 0,
  `net_salary` decimal(15,2) DEFAULT 0,
  `is_locked` tinyint(1) DEFAULT 0,
  `locked_by` char(36) DEFAULT NULL,
  `locked_at` timestamp NULL DEFAULT NULL,
  `notes` text,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `employee_month_unique` (`employee_id`, `month`),
  KEY `idx_month` (`month`),
  KEY `idx_locked` (`is_locked`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 18. DEDUCTIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS `deductions` (
  `id` char(36) NOT NULL,
  `payroll_id` char(36) NOT NULL,
  `type` varchar(50) NOT NULL COMMENT 'tax, insurance, advance, penalty',
  `amount` decimal(15,2) NOT NULL,
  `description` text,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_payroll` (`payroll_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 19. SALARY REQUESTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS `salary_requests` (
  `id` char(36) NOT NULL,
  `employee_id` char(36) NOT NULL,
  `month` varchar(7) NOT NULL,
  `estimated_salary` decimal(15,2) DEFAULT NULL,
  `requested_amount` decimal(15,2) NOT NULL,
  `request_date` date NOT NULL,
  `status` varchar(20) DEFAULT 'pending',
  `approved_by` char(36) DEFAULT NULL,
  `approved_at` timestamp NULL DEFAULT NULL,
  `reason` text,
  `notes` text,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_employee` (`employee_id`),
  KEY `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 20. MONTHLY EMPLOYEE STATS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS `monthly_employee_stats` (
  `id` char(36) NOT NULL,
  `employee_id` char(36) NOT NULL,
  `month` int NOT NULL,
  `year` int NOT NULL,
  `total_working_days` int DEFAULT 0,
  `total_present_days` int DEFAULT 0,
  `total_absent_days` int DEFAULT 0,
  `total_late_days` int DEFAULT 0,
  `total_early_leave_days` int DEFAULT 0,
  `total_overtime_hours` decimal(10,2) DEFAULT 0,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `employee_month_year_unique` (`employee_id`, `month`, `year`),
  KEY `idx_month_year` (`month`, `year`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 21. NOTIFICATIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS `notifications` (
  `id` char(36) NOT NULL,
  `title` varchar(255) NOT NULL,
  `message` text NOT NULL,
  `action_url` varchar(500) DEFAULT NULL,
  `recipient_type` varchar(20) NOT NULL COMMENT 'ALL, DEPARTMENT, SPECIFIC',
  `status` varchar(20) DEFAULT 'draft' COMMENT 'draft, scheduled, sent, failed',
  `department_ids` text COMMENT 'JSON array of department IDs',
  `user_ids` text COMMENT 'JSON array of user IDs',
  `scheduled_at` timestamp NULL DEFAULT NULL,
  `sent_at` timestamp NULL DEFAULT NULL,
  `created_by` char(36) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_status` (`status`),
  KEY `idx_created_by` (`created_by`),
  KEY `idx_scheduled_at` (`scheduled_at`),
  CONSTRAINT `fk_notifications_created_by` FOREIGN KEY (`created_by`) REFERENCES `directus_users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 22. NOTIFICATION LOGS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS `notification_logs` (
  `id` char(36) NOT NULL,
  `trigger_id` varchar(255) NOT NULL COMMENT 'Novu transaction ID',
  `notification_id` char(36) DEFAULT NULL COMMENT 'Reference to notifications table',
  `title` varchar(255) NOT NULL,
  `content` text NOT NULL,
  `channel` varchar(20) DEFAULT 'in_app' COMMENT 'in_app, email, sms, push',
  `recipients` text NOT NULL COMMENT 'JSON array: ["user_id"] or ["topic:key"]',
  `workflow_id` varchar(255) DEFAULT NULL,
  `payload` text COMMENT 'JSON payload sent to Novu',
  `triggered_by` char(36) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_trigger_id` (`trigger_id`),
  KEY `idx_notification_id` (`notification_id`),
  KEY `idx_channel` (`channel`),
  KEY `idx_workflow_id` (`workflow_id`),
  KEY `idx_created_at` (`created_at`),
  CONSTRAINT `fk_notification_logs_notification` FOREIGN KEY (`notification_id`) REFERENCES `notifications` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_notification_logs_triggered_by` FOREIGN KEY (`triggered_by`) REFERENCES `directus_users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS=1;

-- ============================================
-- PERFORMANCE INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS `idx_employees_email` ON `employees` (`email`);
CREATE INDEX IF NOT EXISTS `idx_employees_phone` ON `employees` (`phone`);
CREATE INDEX IF NOT EXISTS `idx_shifts_date_type` ON `shifts` (`shift_date`, `shift_type_id`);
CREATE INDEX IF NOT EXISTS `idx_assignments_employee_shift` ON `schedule_assignments` (`employee_id`, `shift_id`);
CREATE INDEX IF NOT EXISTS `idx_attendance_employee_date` ON `attendance_shifts` (`employee_id`, `clock_in`);

-- ============================================
-- END OF MIGRATION - 20 TABLES CREATED
-- ============================================
