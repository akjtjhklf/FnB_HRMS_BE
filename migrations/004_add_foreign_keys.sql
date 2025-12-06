-- ============================================================================
-- FOREIGN KEYS MIGRATION
-- Generated: 2025-12-05
-- Purpose: Add all foreign key constraints to existing tables
-- 
-- ⚠️  This script requires all tables from 003_full_schema_sync.sql to exist
-- ⚠️  Safe to run multiple times (idempotent)
-- ⚠️  Backup your database before running!
-- ============================================================================

SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0;
SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='TRADITIONAL';

-- ============================================================================
-- HELPER PROCEDURE: Add FK if not exists
-- ============================================================================

DELIMITER //

DROP PROCEDURE IF EXISTS AddFKIfNotExists//
CREATE PROCEDURE AddFKIfNotExists(
    IN p_table VARCHAR(64),
    IN p_fk_name VARCHAR(64),
    IN p_column VARCHAR(64),
    IN p_ref_table VARCHAR(64),
    IN p_ref_column VARCHAR(64),
    IN p_on_delete VARCHAR(20),
    IN p_on_update VARCHAR(20)
)
BEGIN
    DECLARE fk_exists INT DEFAULT 0;
    SELECT COUNT(*) INTO fk_exists
    FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS
    WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = p_table 
      AND CONSTRAINT_NAME = p_fk_name 
      AND CONSTRAINT_TYPE = 'FOREIGN KEY';
    
    IF fk_exists = 0 THEN
        SET @sql = CONCAT(
            'ALTER TABLE `', p_table, '` ',
            'ADD CONSTRAINT `', p_fk_name, '` ',
            'FOREIGN KEY (`', p_column, '`) ',
            'REFERENCES `', p_ref_table, '` (`', p_ref_column, '`) ',
            'ON DELETE ', p_on_delete, ' ',
            'ON UPDATE ', p_on_update
        );
        PREPARE stmt FROM @sql;
        EXECUTE stmt;
        DEALLOCATE PREPARE stmt;
        SELECT CONCAT('✅ Added FK: ', p_fk_name, ' on ', p_table) AS 'Status';
    ELSE
        SELECT CONCAT('⏭️ FK already exists: ', p_fk_name, ' on ', p_table) AS 'Status';
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
    WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = p_table 
      AND CONSTRAINT_NAME = p_fk 
      AND CONSTRAINT_TYPE = 'FOREIGN KEY';
    
    IF fk_exists > 0 THEN
        SET @sql = CONCAT('ALTER TABLE `', p_table, '` DROP FOREIGN KEY `', p_fk, '`');
        PREPARE stmt FROM @sql;
        EXECUTE stmt;
        DEALLOCATE PREPARE stmt;
    END IF;
END//

DELIMITER ;

-- ============================================================================
-- 1. POSITIONS TABLE - Foreign Keys
-- ============================================================================
-- positions.department_id -> departments.id (if departments table exists)
-- Note: No FK needed if departments table doesn't exist in this schema

-- ============================================================================
-- 2. SALARY_SCHEMES TABLE - Foreign Keys
-- ============================================================================
-- salary_schemes.position_id -> positions.id
CALL AddFKIfNotExists(
    'salary_schemes', 
    'fk_salary_schemes_position', 
    'position_id', 
    'positions', 
    'id', 
    'SET NULL', 
    'CASCADE'
);

-- ============================================================================
-- 3. EMPLOYEES TABLE - Foreign Keys
-- ============================================================================
-- employees.user_id -> directus_users.id (external reference, skip)
-- employees.scheme_id -> salary_schemes.id
CALL AddFKIfNotExists(
    'employees', 
    'fk_employees_scheme', 
    'scheme_id', 
    'salary_schemes', 
    'id', 
    'SET NULL', 
    'CASCADE'
);

-- Note: employees.position_id is TEXT type (can store multiple positions as JSON)
-- So we don't add FK for it

-- ============================================================================
-- 4. CONTRACTS TABLE - Foreign Keys
-- ============================================================================
-- contracts.employee_id -> employees.id
CALL AddFKIfNotExists(
    'contracts', 
    'fk_contracts_employee', 
    'employee_id', 
    'employees', 
    'id', 
    'CASCADE', 
    'CASCADE'
);

-- contracts.salary_scheme_id -> salary_schemes.id
CALL AddFKIfNotExists(
    'contracts', 
    'fk_contracts_salary_scheme', 
    'salary_scheme_id', 
    'salary_schemes', 
    'id', 
    'SET NULL', 
    'CASCADE'
);

-- ============================================================================
-- 5. SHIFT_TYPES TABLE - Foreign Keys
-- ============================================================================
-- No foreign keys needed for shift_types

-- ============================================================================
-- 6. WEEKLY_SCHEDULE TABLE - Foreign Keys
-- ============================================================================
-- weekly_schedule.created_by -> directus_users.id (external reference, skip)

-- ============================================================================
-- 7. SHIFTS TABLE - Foreign Keys
-- ============================================================================
-- shifts.schedule_id -> weekly_schedule.id
CALL AddFKIfNotExists(
    'shifts', 
    'fk_shifts_schedule', 
    'schedule_id', 
    'weekly_schedule', 
    'id', 
    'SET NULL', 
    'CASCADE'
);

-- shifts.shift_type_id -> shift_types.id
CALL AddFKIfNotExists(
    'shifts', 
    'fk_shifts_shift_type', 
    'shift_type_id', 
    'shift_types', 
    'id', 
    'CASCADE', 
    'CASCADE'
);

-- shifts.created_by -> directus_users.id (external reference, skip)

-- ============================================================================
-- 8. SHIFT_POSITION_REQUIREMENTS TABLE - Foreign Keys
-- ============================================================================
-- shift_position_requirements.shift_id -> shifts.id
CALL AddFKIfNotExists(
    'shift_position_requirements', 
    'fk_spr_shift', 
    'shift_id', 
    'shifts', 
    'id', 
    'CASCADE', 
    'CASCADE'
);

-- shift_position_requirements.position_id -> positions.id
CALL AddFKIfNotExists(
    'shift_position_requirements', 
    'fk_spr_position', 
    'position_id', 
    'positions', 
    'id', 
    'CASCADE', 
    'CASCADE'
);

-- ============================================================================
-- 9. SCHEDULE_ASSIGNMENTS TABLE - Foreign Keys
-- ============================================================================
-- schedule_assignments.schedule_id -> weekly_schedule.id
CALL AddFKIfNotExists(
    'schedule_assignments', 
    'fk_sa_schedule', 
    'schedule_id', 
    'weekly_schedule', 
    'id', 
    'SET NULL', 
    'CASCADE'
);

-- schedule_assignments.shift_id -> shifts.id
CALL AddFKIfNotExists(
    'schedule_assignments', 
    'fk_sa_shift', 
    'shift_id', 
    'shifts', 
    'id', 
    'CASCADE', 
    'CASCADE'
);

-- schedule_assignments.employee_id -> employees.id
CALL AddFKIfNotExists(
    'schedule_assignments', 
    'fk_sa_employee', 
    'employee_id', 
    'employees', 
    'id', 
    'CASCADE', 
    'CASCADE'
);

-- schedule_assignments.position_id -> positions.id
CALL AddFKIfNotExists(
    'schedule_assignments', 
    'fk_sa_position', 
    'position_id', 
    'positions', 
    'id', 
    'CASCADE', 
    'CASCADE'
);

-- schedule_assignments.assigned_by -> directus_users.id (external reference, skip)

-- ============================================================================
-- 10. EMPLOYEE_AVAILABILITY TABLE - Foreign Keys
-- ============================================================================
-- employee_availability.employee_id -> employees.id
CALL AddFKIfNotExists(
    'employee_availability', 
    'fk_ea_employee', 
    'employee_id', 
    'employees', 
    'id', 
    'CASCADE', 
    'CASCADE'
);

-- employee_availability.shift_id -> shifts.id
CALL AddFKIfNotExists(
    'employee_availability', 
    'fk_ea_shift', 
    'shift_id', 
    'shifts', 
    'id', 
    'CASCADE', 
    'CASCADE'
);

-- ============================================================================
-- 11. DEVICES TABLE - Foreign Keys
-- ============================================================================
-- devices.employee_id_pending -> employees.id
CALL AddFKIfNotExists(
    'devices', 
    'fk_devices_employee_pending', 
    'employee_id_pending', 
    'employees', 
    'id', 
    'SET NULL', 
    'CASCADE'
);

-- ============================================================================
-- 12. RFID_CARDS TABLE - Foreign Keys
-- ============================================================================
-- rfid_cards.employee_id -> employees.id
CALL AddFKIfNotExists(
    'rfid_cards', 
    'fk_rfid_cards_employee', 
    'employee_id', 
    'employees', 
    'id', 
    'SET NULL', 
    'CASCADE'
);

-- ============================================================================
-- 13. ATTENDANCE_LOGS TABLE - Foreign Keys
-- ============================================================================
-- attendance_logs.rfid_card_id -> rfid_cards.id
CALL AddFKIfNotExists(
    'attendance_logs', 
    'fk_al_rfid_card', 
    'rfid_card_id', 
    'rfid_cards', 
    'id', 
    'SET NULL', 
    'CASCADE'
);

-- attendance_logs.employee_id -> employees.id
CALL AddFKIfNotExists(
    'attendance_logs', 
    'fk_al_employee', 
    'employee_id', 
    'employees', 
    'id', 
    'SET NULL', 
    'CASCADE'
);

-- attendance_logs.device_id -> devices.id
CALL AddFKIfNotExists(
    'attendance_logs', 
    'fk_al_device', 
    'device_id', 
    'devices', 
    'id', 
    'SET NULL', 
    'CASCADE'
);

-- ============================================================================
-- 14. ATTENDANCE_SHIFTS TABLE - Foreign Keys
-- ============================================================================
-- attendance_shifts.shift_id -> shifts.id
CALL AddFKIfNotExists(
    'attendance_shifts', 
    'fk_as_shift', 
    'shift_id', 
    'shifts', 
    'id', 
    'SET NULL', 
    'CASCADE'
);

-- attendance_shifts.schedule_assignment_id -> schedule_assignments.id
CALL AddFKIfNotExists(
    'attendance_shifts', 
    'fk_as_schedule_assignment', 
    'schedule_assignment_id', 
    'schedule_assignments', 
    'id', 
    'SET NULL', 
    'CASCADE'
);

-- attendance_shifts.employee_id -> employees.id
CALL AddFKIfNotExists(
    'attendance_shifts', 
    'fk_as_employee', 
    'employee_id', 
    'employees', 
    'id', 
    'CASCADE', 
    'CASCADE'
);

-- ============================================================================
-- 15. MONTHLY_PAYROLLS TABLE - Foreign Keys
-- ============================================================================
-- monthly_payrolls.employee_id -> employees.id
CALL AddFKIfNotExists(
    'monthly_payrolls', 
    'fk_mp_employee', 
    'employee_id', 
    'employees', 
    'id', 
    'CASCADE', 
    'CASCADE'
);

-- monthly_payrolls.contract_id -> contracts.id
CALL AddFKIfNotExists(
    'monthly_payrolls', 
    'fk_mp_contract', 
    'contract_id', 
    'contracts', 
    'id', 
    'SET NULL', 
    'CASCADE'
);

-- monthly_payrolls.salary_scheme_id -> salary_schemes.id
CALL AddFKIfNotExists(
    'monthly_payrolls', 
    'fk_mp_salary_scheme', 
    'salary_scheme_id', 
    'salary_schemes', 
    'id', 
    'SET NULL', 
    'CASCADE'
);

-- ============================================================================
-- 16. SALARY_REQUESTS TABLE - Foreign Keys
-- ============================================================================
-- salary_requests.employee_id -> employees.id
CALL AddFKIfNotExists(
    'salary_requests', 
    'fk_sr_employee', 
    'employee_id', 
    'employees', 
    'id', 
    'CASCADE', 
    'CASCADE'
);

-- salary_requests.current_scheme_id -> salary_schemes.id
CALL AddFKIfNotExists(
    'salary_requests', 
    'fk_sr_current_scheme', 
    'current_scheme_id', 
    'salary_schemes', 
    'id', 
    'SET NULL', 
    'CASCADE'
);

-- salary_requests.proposed_scheme_id -> salary_schemes.id
CALL AddFKIfNotExists(
    'salary_requests', 
    'fk_sr_proposed_scheme', 
    'proposed_scheme_id', 
    'salary_schemes', 
    'id', 
    'SET NULL', 
    'CASCADE'
);

-- salary_requests.payroll_id -> monthly_payrolls.id
CALL AddFKIfNotExists(
    'salary_requests', 
    'fk_sr_payroll', 
    'payroll_id', 
    'monthly_payrolls', 
    'id', 
    'SET NULL', 
    'CASCADE'
);

-- ============================================================================
-- 17. DEDUCTIONS TABLE - Foreign Keys
-- ============================================================================
-- deductions.employee_id -> employees.id
CALL AddFKIfNotExists(
    'deductions', 
    'fk_deductions_employee', 
    'employee_id', 
    'employees', 
    'id', 
    'SET NULL', 
    'CASCADE'
);

-- deductions.payroll_id -> monthly_payrolls.id
CALL AddFKIfNotExists(
    'deductions', 
    'fk_deductions_payroll', 
    'payroll_id', 
    'monthly_payrolls', 
    'id', 
    'SET NULL', 
    'CASCADE'
);

-- deductions.related_shift_id -> shifts.id
CALL AddFKIfNotExists(
    'deductions', 
    'fk_deductions_shift', 
    'related_shift_id', 
    'shifts', 
    'id', 
    'SET NULL', 
    'CASCADE'
);

-- ============================================================================
-- 18. NOTIFICATIONS TABLE - Foreign Keys
-- ============================================================================
-- notifications.created_by -> directus_users.id (external reference, skip)

-- ============================================================================
-- 19. SCHEDULE_CHANGE_REQUESTS TABLE - Foreign Keys
-- ============================================================================
-- schedule_change_requests.requested_by -> employees.id
CALL AddFKIfNotExists(
    'schedule_change_requests', 
    'fk_scr_requested_by', 
    'requested_by', 
    'employees', 
    'id', 
    'CASCADE', 
    'CASCADE'
);

-- schedule_change_requests.assignment_id -> schedule_assignments.id
CALL AddFKIfNotExists(
    'schedule_change_requests', 
    'fk_scr_assignment', 
    'assignment_id', 
    'schedule_assignments', 
    'id', 
    'CASCADE', 
    'CASCADE'
);

-- schedule_change_requests.target_employee_id -> employees.id
CALL AddFKIfNotExists(
    'schedule_change_requests', 
    'fk_scr_target_employee', 
    'target_employee_id', 
    'employees', 
    'id', 
    'SET NULL', 
    'CASCADE'
);

-- schedule_change_requests.reviewed_by -> directus_users.id (external reference, skip)

-- ============================================================================
-- 20. MONTHLY_EMPLOYEE_STATS TABLE - Foreign Keys
-- ============================================================================
-- monthly_employee_stats.employee_id -> employees.id
CALL AddFKIfNotExists(
    'monthly_employee_stats', 
    'fk_mes_employee', 
    'employee_id', 
    'employees', 
    'id', 
    'CASCADE', 
    'CASCADE'
);

-- ============================================================================
-- CLEANUP HELPER PROCEDURES
-- ============================================================================
DROP PROCEDURE IF EXISTS AddFKIfNotExists;
DROP PROCEDURE IF EXISTS DropFKIfExists;

-- ============================================================================
-- RESTORE SETTINGS
-- ============================================================================
SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS;
SET SQL_MODE=@OLD_SQL_MODE;

-- ============================================================================
-- VERIFICATION: Show all Foreign Keys
-- ============================================================================
SELECT '========================================' AS '=';
SELECT '✅ FOREIGN KEYS MIGRATION COMPLETED!' AS 'Status';
SELECT '========================================' AS '=';

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

-- ============================================================================
-- FK SUMMARY BY TABLE
-- ============================================================================
SELECT 
    TABLE_NAME AS 'Table',
    COUNT(*) AS 'FK Count'
FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS
WHERE TABLE_SCHEMA = DATABASE()
  AND CONSTRAINT_TYPE = 'FOREIGN KEY'
GROUP BY TABLE_NAME
ORDER BY TABLE_NAME;
