-- ============================================================================
-- HRMS Database Migration Script
-- Generated: 2025-12-03
-- Purpose: Synchronize database schema with application models
-- ============================================================================

-- Set safe mode
SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0;
SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='TRADITIONAL';

-- ============================================================================
-- 1. CONTRACTS TABLE
-- ============================================================================
-- Add salary_scheme_id field to contracts
ALTER TABLE `contracts` 
ADD COLUMN IF NOT EXISTS `salary_scheme_id` CHAR(36) NULL DEFAULT NULL 
COMMENT 'Reference to salary_schemes table' 
AFTER `base_salary`;

-- Add foreign key constraint
ALTER TABLE `contracts`
ADD CONSTRAINT `fk_contracts_salary_scheme`
FOREIGN KEY (`salary_scheme_id`)
REFERENCES `salary_schemes` (`id`)
ON DELETE SET NULL
ON UPDATE CASCADE;

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS `idx_contracts_salary_scheme_id` ON `contracts` (`salary_scheme_id`);

-- ============================================================================
-- 2. SALARY_REQUESTS TABLE
-- ============================================================================
-- Add type field to salary_requests (if not exists)
ALTER TABLE `salary_requests`
ADD COLUMN IF NOT EXISTS `type` ENUM('raise', 'adjustment') NULL DEFAULT 'raise'
COMMENT 'Type of salary request: raise or adjustment'
AFTER `employee_id`;

-- Add current_scheme_id field
ALTER TABLE `salary_requests`
ADD COLUMN IF NOT EXISTS `current_scheme_id` CHAR(36) NULL DEFAULT NULL
COMMENT 'Current salary scheme (for raise type)'
AFTER `type`;

-- Add proposed_scheme_id field
ALTER TABLE `salary_requests`
ADD COLUMN IF NOT EXISTS `proposed_scheme_id` CHAR(36) NULL DEFAULT NULL
COMMENT 'Proposed salary scheme (for raise type)'
AFTER `current_scheme_id`;

-- Add current_rate field
ALTER TABLE `salary_requests`
ADD COLUMN IF NOT EXISTS `current_rate` DECIMAL(12,2) NULL DEFAULT NULL
COMMENT 'Current salary rate'
AFTER `proposed_scheme_id`;

-- Add proposed_rate field
ALTER TABLE `salary_requests`
ADD COLUMN IF NOT EXISTS `proposed_rate` DECIMAL(12,2) NULL DEFAULT NULL
COMMENT 'Proposed salary rate'
AFTER `current_rate`;

-- Add payroll_id field
ALTER TABLE `salary_requests`
ADD COLUMN IF NOT EXISTS `payroll_id` CHAR(36) NULL DEFAULT NULL
COMMENT 'Reference to monthly_payrolls (for adjustment type)'
AFTER `proposed_rate`;

-- Add adjustment_amount field
ALTER TABLE `salary_requests`
ADD COLUMN IF NOT EXISTS `adjustment_amount` DECIMAL(12,2) NULL DEFAULT NULL
COMMENT 'Adjustment amount (positive or negative)'
AFTER `payroll_id`;

-- Add reason field
ALTER TABLE `salary_requests`
ADD COLUMN IF NOT EXISTS `reason` TEXT NULL DEFAULT NULL
COMMENT 'Requester reason for salary request'
AFTER `adjustment_amount`;

-- Add manager_note field
ALTER TABLE `salary_requests`
ADD COLUMN IF NOT EXISTS `manager_note` TEXT NULL DEFAULT NULL
COMMENT 'Manager note for approval/rejection'
AFTER `reason`;

-- Ensure status field has correct enum values
ALTER TABLE `salary_requests`
MODIFY COLUMN `status` ENUM('pending', 'approved', 'rejected') NOT NULL DEFAULT 'pending';

-- Add foreign key constraints for salary_requests
ALTER TABLE `salary_requests`
ADD CONSTRAINT `fk_salary_requests_current_scheme`
FOREIGN KEY (`current_scheme_id`)
REFERENCES `salary_schemes` (`id`)
ON DELETE SET NULL
ON UPDATE CASCADE;

ALTER TABLE `salary_requests`
ADD CONSTRAINT `fk_salary_requests_proposed_scheme`
FOREIGN KEY (`proposed_scheme_id`)
REFERENCES `salary_schemes` (`id`)
ON DELETE SET NULL
ON UPDATE CASCADE;

ALTER TABLE `salary_requests`
ADD CONSTRAINT `fk_salary_requests_payroll`
FOREIGN KEY (`payroll_id`)
REFERENCES `monthly_payrolls` (`id`)
ON DELETE SET NULL
ON UPDATE CASCADE;

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS `idx_salary_requests_type` ON `salary_requests` (`type`);
CREATE INDEX IF NOT EXISTS `idx_salary_requests_status` ON `salary_requests` (`status`);
CREATE INDEX IF NOT EXISTS `idx_salary_requests_current_scheme_id` ON `salary_requests` (`current_scheme_id`);
CREATE INDEX IF NOT EXISTS `idx_salary_requests_proposed_scheme_id` ON `salary_requests` (`proposed_scheme_id`);
CREATE INDEX IF NOT EXISTS `idx_salary_requests_payroll_id` ON `salary_requests` (`payroll_id`);

-- ============================================================================
-- 3. MONTHLY_PAYROLLS TABLE
-- ============================================================================
-- Ensure contract_id field exists
ALTER TABLE `monthly_payrolls`
ADD COLUMN IF NOT EXISTS `contract_id` CHAR(36) NULL DEFAULT NULL
COMMENT 'Reference to contracts table'
AFTER `employee_id`;

-- Ensure salary_scheme_id field exists
ALTER TABLE `monthly_payrolls`
ADD COLUMN IF NOT EXISTS `salary_scheme_id` CHAR(36) NULL DEFAULT NULL
COMMENT 'Reference to salary_schemes table'
AFTER `month`;

-- Ensure pay_type field exists
ALTER TABLE `monthly_payrolls`
ADD COLUMN IF NOT EXISTS `pay_type` ENUM('hourly', 'fixed_shift', 'monthly') NULL DEFAULT 'monthly'
COMMENT 'Payment type from salary scheme'
AFTER `base_salary`;

-- Ensure hourly_rate field exists
ALTER TABLE `monthly_payrolls`
ADD COLUMN IF NOT EXISTS `hourly_rate` DECIMAL(12,2) NULL DEFAULT NULL
COMMENT 'Hourly rate if applicable'
AFTER `pay_type`;

-- Add foreign key constraints for monthly_payrolls
ALTER TABLE `monthly_payrolls`
ADD CONSTRAINT `fk_monthly_payrolls_contract`
FOREIGN KEY (`contract_id`)
REFERENCES `contracts` (`id`)
ON DELETE SET NULL
ON UPDATE CASCADE;

ALTER TABLE `monthly_payrolls`
ADD CONSTRAINT `fk_monthly_payrolls_salary_scheme`
FOREIGN KEY (`salary_scheme_id`)
REFERENCES `salary_schemes` (`id`)
ON DELETE SET NULL
ON UPDATE CASCADE;

-- Add indexes
CREATE INDEX IF NOT EXISTS `idx_monthly_payrolls_contract_id` ON `monthly_payrolls` (`contract_id`);
CREATE INDEX IF NOT EXISTS `idx_monthly_payrolls_salary_scheme_id` ON `monthly_payrolls` (`salary_scheme_id`);
CREATE INDEX IF NOT EXISTS `idx_monthly_payrolls_month` ON `monthly_payrolls` (`month`);
CREATE INDEX IF NOT EXISTS `idx_monthly_payrolls_status` ON `monthly_payrolls` (`status`);

-- ============================================================================
-- 4. EMPLOYEES TABLE
-- ============================================================================
-- Ensure scheme_id field exists (for default salary scheme)
ALTER TABLE `employees`
ADD COLUMN IF NOT EXISTS `scheme_id` CHAR(36) NULL DEFAULT NULL
COMMENT 'Default salary scheme for employee'
AFTER `status`;

-- Ensure position_id field exists (using TEXT for M2M support in Directus)
ALTER TABLE `employees`
MODIFY COLUMN `position_id` TEXT NULL DEFAULT NULL
COMMENT 'Position IDs (can be M2M in Directus)';

-- Add foreign key for scheme_id
ALTER TABLE `employees`
ADD CONSTRAINT `fk_employees_salary_scheme`
FOREIGN KEY (`scheme_id`)
REFERENCES `salary_schemes` (`id`)
ON DELETE SET NULL
ON UPDATE CASCADE;

-- Add index
CREATE INDEX IF NOT EXISTS `idx_employees_scheme_id` ON `employees` (`scheme_id`);

-- ============================================================================
-- 5. CLEANUP & VALIDATION
-- ============================================================================

-- Verify all critical foreign keys are in place
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
    AND TABLE_NAME IN ('contracts', 'salary_requests', 'monthly_payrolls', 'employees')
    AND REFERENCED_TABLE_NAME IS NOT NULL
ORDER BY
    TABLE_NAME,
    CONSTRAINT_NAME;

-- Restore original settings
SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS;
SET SQL_MODE=@OLD_SQL_MODE;

-- ============================================================================
-- Migration completed successfully
-- ============================================================================
SELECT 'Migration completed successfully! Please verify the schema changes.' AS Status;
