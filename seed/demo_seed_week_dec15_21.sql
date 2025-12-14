-- ============================================================================
-- COMPREHENSIVE DEMO SEED DATA FOR THESIS PRESENTATION
-- Generated: 2025-12-14
-- Demo Week: December 15-21, 2025 (Mon-Sun)
-- 
-- This script creates realistic data for ALL modules with proper FK relationships
-- ============================================================================

SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0;

-- ============================================================================
-- CLEAN EXISTING DATA (careful - this deletes all data!)
-- ============================================================================
DELETE FROM attendance_adjustments;
DELETE FROM monthly_employee_stats;
DELETE FROM schedule_change_requests;
DELETE FROM deductions;
DELETE FROM salary_requests;
DELETE FROM monthly_payrolls;
DELETE FROM attendance_shifts;
DELETE FROM attendance_logs;
DELETE FROM rfid_cards;
DELETE FROM devices;
DELETE FROM employee_availability_positions;
DELETE FROM employee_availability;
DELETE FROM schedule_assignments;
DELETE FROM shift_position_requirements;
DELETE FROM shifts;
DELETE FROM weekly_schedule;
DELETE FROM shift_types;
DELETE FROM contracts;
DELETE FROM employees;
DELETE FROM salary_schemes;
DELETE FROM positions;
DELETE FROM notifications;

-- ============================================================================
-- 1. POSITIONS (5 positions for F&B restaurant)
-- ============================================================================
INSERT INTO positions (id, name, description, is_priority) VALUES
('pos-001', 'Quản lý', 'Quản lý nhà hàng', 1),
('pos-002', 'Thu ngân', 'Nhân viên thu ngân', 1),
('pos-003', 'Phục vụ', 'Nhân viên phục vụ bàn', 0),
('pos-004', 'Pha chế', 'Nhân viên pha chế đồ uống', 1),
('pos-005', 'Bếp', 'Nhân viên bếp', 0);

-- ============================================================================
-- 2. SALARY_SCHEMES (linked to positions)
-- ============================================================================
INSERT INTO salary_schemes (id, name, position_id, pay_type, rate, min_hours, overtime_multiplier, is_active) VALUES
('scheme-001', 'Quản lý Full-time', 'pos-001', 'monthly', 15000000, 176, 1.5, 1),
('scheme-002', 'Thu ngân Part-time', 'pos-002', 'hourly', 35000, 80, 1.5, 1),
('scheme-003', 'Phục vụ Part-time', 'pos-003', 'hourly', 30000, 80, 1.5, 1),
('scheme-004', 'Pha chế Full-time', 'pos-004', 'monthly', 10000000, 176, 1.5, 1),
('scheme-005', 'Bếp Part-time', 'pos-005', 'hourly', 40000, 80, 1.5, 1),
('scheme-006', 'Phục vụ Full-time', 'pos-003', 'monthly', 8000000, 176, 1.5, 1);

-- ============================================================================
-- 3. EMPLOYEES (8 employees with different roles)
-- ============================================================================
INSERT INTO employees (id, employee_code, first_name, last_name, full_name, dob, gender, phone, email, hire_date, status, scheme_id, position_id, default_work_hours_per_week, max_hours_per_week) VALUES
('emp-001', 'NV001', 'Văn', 'Nguyễn', 'Nguyễn Văn An', '1990-05-15', 'male', '0901234567', 'an.nguyen@demo.com', '2023-01-15', 'active', 'scheme-001', 'pos-001', 40, 48),
('emp-002', 'NV002', 'Thị', 'Trần', 'Trần Thị Bình', '1995-08-20', 'female', '0912345678', 'binh.tran@demo.com', '2023-03-01', 'active', 'scheme-002', 'pos-002', 32, 40),
('emp-003', 'NV003', 'Minh', 'Lê', 'Lê Văn Minh', '1998-02-10', 'male', '0923456789', 'minh.le@demo.com', '2023-06-15', 'active', 'scheme-003', 'pos-003', 24, 32),
('emp-004', 'NV004', 'Hoa', 'Phạm', 'Phạm Thị Hoa', '1997-11-25', 'female', '0934567890', 'hoa.pham@demo.com', '2023-04-01', 'active', 'scheme-004', 'pos-004', 40, 48),
('emp-005', 'NV005', 'Đức', 'Hoàng', 'Hoàng Văn Đức', '1992-07-08', 'male', '0945678901', 'duc.hoang@demo.com', '2023-02-15', 'active', 'scheme-005', 'pos-005', 32, 40),
('emp-006', 'NV006', 'Lan', 'Vũ', 'Vũ Thị Lan', '1999-04-12', 'female', '0956789012', 'lan.vu@demo.com', '2024-01-10', 'active', 'scheme-006', 'pos-003', 40, 48),
('emp-007', 'NV007', 'Tuấn', 'Đỗ', 'Đỗ Văn Tuấn', '1996-09-30', 'male', '0967890123', 'tuan.do@demo.com', '2024-03-01', 'active', 'scheme-003', 'pos-003', 24, 32),
('emp-008', 'NV008', 'Mai', 'Ngô', 'Ngô Thị Mai', '2000-01-18', 'female', '0978901234', 'mai.ngo@demo.com', '2024-06-01', 'active', 'scheme-002', 'pos-002', 32, 40);

-- ============================================================================
-- 4. CONTRACTS (1 active contract per employee)
-- ============================================================================
INSERT INTO contracts (id, employee_id, contract_type, start_date, end_date, base_salary, salary_scheme_id, is_active) VALUES
('con-001', 'emp-001', 'full_time', '2023-01-15', '2025-12-31', 15000000, 'scheme-001', 1),
('con-002', 'emp-002', 'part_time', '2023-03-01', '2025-12-31', NULL, 'scheme-002', 1),
('con-003', 'emp-003', 'part_time', '2023-06-15', '2025-12-31', NULL, 'scheme-003', 1),
('con-004', 'emp-004', 'full_time', '2023-04-01', '2025-12-31', 10000000, 'scheme-004', 1),
('con-005', 'emp-005', 'part_time', '2023-02-15', '2025-12-31', NULL, 'scheme-005', 1),
('con-006', 'emp-006', 'full_time', '2024-01-10', '2025-12-31', 8000000, 'scheme-006', 1),
('con-007', 'emp-007', 'part_time', '2024-03-01', '2025-12-31', NULL, 'scheme-003', 1),
('con-008', 'emp-008', 'part_time', '2024-06-01', '2025-12-31', NULL, 'scheme-002', 1);

-- ============================================================================
-- 5. SHIFT_TYPES (3 shift types: morning, afternoon, evening)
-- ============================================================================
INSERT INTO shift_types (id, name, start_time, end_time, cross_midnight, notes) VALUES
('st-001', 'Ca sáng', '07:00:00', '14:00:00', 0, 'Ca sáng 7h-14h'),
('st-002', 'Ca chiều', '14:00:00', '21:00:00', 0, 'Ca chiều 14h-21h'),
('st-003', 'Ca tối', '17:00:00', '23:00:00', 0, 'Ca tối 17h-23h');

-- ============================================================================
-- 6. WEEKLY_SCHEDULE (Week Dec 15-21, 2025)
-- ============================================================================
INSERT INTO weekly_schedule (id, name, week_start, week_end, status) VALUES
('ws-w51-2025', 'Tuần 51/2025 - Demo', '2025-12-15', '2025-12-21', 'scheduled');

-- ============================================================================
-- 7. SHIFTS (21 shifts: 3 per day x 7 days)
-- ============================================================================
-- Monday 15/12
INSERT INTO shifts (id, schedule_id, shift_type_id, shift_date, start_at, end_at, total_required) VALUES
('shift-1215-am', 'ws-w51-2025', 'st-001', '2025-12-15', '2025-12-15 07:00:00', '2025-12-15 14:00:00', 4),
('shift-1215-pm', 'ws-w51-2025', 'st-002', '2025-12-15', '2025-12-15 14:00:00', '2025-12-15 21:00:00', 4),
('shift-1215-ev', 'ws-w51-2025', 'st-003', '2025-12-15', '2025-12-15 17:00:00', '2025-12-15 23:00:00', 3);
-- Tuesday 16/12
INSERT INTO shifts (id, schedule_id, shift_type_id, shift_date, start_at, end_at, total_required) VALUES
('shift-1216-am', 'ws-w51-2025', 'st-001', '2025-12-16', '2025-12-16 07:00:00', '2025-12-16 14:00:00', 4),
('shift-1216-pm', 'ws-w51-2025', 'st-002', '2025-12-16', '2025-12-16 14:00:00', '2025-12-16 21:00:00', 4),
('shift-1216-ev', 'ws-w51-2025', 'st-003', '2025-12-16', '2025-12-16 17:00:00', '2025-12-16 23:00:00', 3);
-- Wednesday 17/12
INSERT INTO shifts (id, schedule_id, shift_type_id, shift_date, start_at, end_at, total_required) VALUES
('shift-1217-am', 'ws-w51-2025', 'st-001', '2025-12-17', '2025-12-17 07:00:00', '2025-12-17 14:00:00', 4),
('shift-1217-pm', 'ws-w51-2025', 'st-002', '2025-12-17', '2025-12-17 14:00:00', '2025-12-17 21:00:00', 4),
('shift-1217-ev', 'ws-w51-2025', 'st-003', '2025-12-17', '2025-12-17 17:00:00', '2025-12-17 23:00:00', 3);
-- Thursday 18/12
INSERT INTO shifts (id, schedule_id, shift_type_id, shift_date, start_at, end_at, total_required) VALUES
('shift-1218-am', 'ws-w51-2025', 'st-001', '2025-12-18', '2025-12-18 07:00:00', '2025-12-18 14:00:00', 4),
('shift-1218-pm', 'ws-w51-2025', 'st-002', '2025-12-18', '2025-12-18 14:00:00', '2025-12-18 21:00:00', 4),
('shift-1218-ev', 'ws-w51-2025', 'st-003', '2025-12-18', '2025-12-18 17:00:00', '2025-12-18 23:00:00', 3);
-- Friday 19/12
INSERT INTO shifts (id, schedule_id, shift_type_id, shift_date, start_at, end_at, total_required) VALUES
('shift-1219-am', 'ws-w51-2025', 'st-001', '2025-12-19', '2025-12-19 07:00:00', '2025-12-19 14:00:00', 4),
('shift-1219-pm', 'ws-w51-2025', 'st-002', '2025-12-19', '2025-12-19 14:00:00', '2025-12-19 21:00:00', 5),
('shift-1219-ev', 'ws-w51-2025', 'st-003', '2025-12-19', '2025-12-19 17:00:00', '2025-12-19 23:00:00', 4);
-- Saturday 20/12
INSERT INTO shifts (id, schedule_id, shift_type_id, shift_date, start_at, end_at, total_required) VALUES
('shift-1220-am', 'ws-w51-2025', 'st-001', '2025-12-20', '2025-12-20 07:00:00', '2025-12-20 14:00:00', 5),
('shift-1220-pm', 'ws-w51-2025', 'st-002', '2025-12-20', '2025-12-20 14:00:00', '2025-12-20 21:00:00', 5),
('shift-1220-ev', 'ws-w51-2025', 'st-003', '2025-12-20', '2025-12-20 17:00:00', '2025-12-20 23:00:00', 4);
-- Sunday 21/12
INSERT INTO shifts (id, schedule_id, shift_type_id, shift_date, start_at, end_at, total_required) VALUES
('shift-1221-am', 'ws-w51-2025', 'st-001', '2025-12-21', '2025-12-21 07:00:00', '2025-12-21 14:00:00', 5),
('shift-1221-pm', 'ws-w51-2025', 'st-002', '2025-12-21', '2025-12-21 14:00:00', '2025-12-21 21:00:00', 5),
('shift-1221-ev', 'ws-w51-2025', 'st-003', '2025-12-21', '2025-12-21 17:00:00', '2025-12-21 23:00:00', 4);

-- ============================================================================
-- 8. SHIFT_POSITION_REQUIREMENTS (what positions needed per shift)
-- ============================================================================
-- Morning shifts need: 1 Manager, 1 Cashier, 1 Server, 1 Barista
INSERT INTO shift_position_requirements (id, shift_id, position_id, required_count) VALUES
('spr-1215-am-1', 'shift-1215-am', 'pos-001', 1), ('spr-1215-am-2', 'shift-1215-am', 'pos-002', 1),
('spr-1215-am-3', 'shift-1215-am', 'pos-003', 1), ('spr-1215-am-4', 'shift-1215-am', 'pos-004', 1),
('spr-1216-am-1', 'shift-1216-am', 'pos-001', 1), ('spr-1216-am-2', 'shift-1216-am', 'pos-002', 1),
('spr-1216-am-3', 'shift-1216-am', 'pos-003', 1), ('spr-1216-am-4', 'shift-1216-am', 'pos-004', 1),
('spr-1217-am-1', 'shift-1217-am', 'pos-001', 1), ('spr-1217-am-2', 'shift-1217-am', 'pos-002', 1),
('spr-1217-am-3', 'shift-1217-am', 'pos-003', 1), ('spr-1217-am-4', 'shift-1217-am', 'pos-004', 1),
('spr-1218-am-1', 'shift-1218-am', 'pos-001', 1), ('spr-1218-am-2', 'shift-1218-am', 'pos-002', 1),
('spr-1218-am-3', 'shift-1218-am', 'pos-003', 1), ('spr-1218-am-4', 'shift-1218-am', 'pos-004', 1),
('spr-1219-am-1', 'shift-1219-am', 'pos-001', 1), ('spr-1219-am-2', 'shift-1219-am', 'pos-002', 1),
('spr-1219-am-3', 'shift-1219-am', 'pos-003', 1), ('spr-1219-am-4', 'shift-1219-am', 'pos-004', 1),
('spr-1220-am-1', 'shift-1220-am', 'pos-001', 1), ('spr-1220-am-2', 'shift-1220-am', 'pos-002', 1),
('spr-1220-am-3', 'shift-1220-am', 'pos-003', 2), ('spr-1220-am-4', 'shift-1220-am', 'pos-004', 1),
('spr-1221-am-1', 'shift-1221-am', 'pos-001', 1), ('spr-1221-am-2', 'shift-1221-am', 'pos-002', 1),
('spr-1221-am-3', 'shift-1221-am', 'pos-003', 2), ('spr-1221-am-4', 'shift-1221-am', 'pos-004', 1);

-- Afternoon shifts need: 1 Manager, 1 Cashier, 1-2 Servers, 1 Barista
INSERT INTO shift_position_requirements (id, shift_id, position_id, required_count) VALUES
('spr-1215-pm-1', 'shift-1215-pm', 'pos-001', 1), ('spr-1215-pm-2', 'shift-1215-pm', 'pos-002', 1),
('spr-1215-pm-3', 'shift-1215-pm', 'pos-003', 1), ('spr-1215-pm-4', 'shift-1215-pm', 'pos-004', 1),
('spr-1216-pm-1', 'shift-1216-pm', 'pos-001', 1), ('spr-1216-pm-2', 'shift-1216-pm', 'pos-002', 1),
('spr-1216-pm-3', 'shift-1216-pm', 'pos-003', 1), ('spr-1216-pm-4', 'shift-1216-pm', 'pos-004', 1),
('spr-1217-pm-1', 'shift-1217-pm', 'pos-001', 1), ('spr-1217-pm-2', 'shift-1217-pm', 'pos-002', 1),
('spr-1217-pm-3', 'shift-1217-pm', 'pos-003', 1), ('spr-1217-pm-4', 'shift-1217-pm', 'pos-004', 1),
('spr-1218-pm-1', 'shift-1218-pm', 'pos-001', 1), ('spr-1218-pm-2', 'shift-1218-pm', 'pos-002', 1),
('spr-1218-pm-3', 'shift-1218-pm', 'pos-003', 1), ('spr-1218-pm-4', 'shift-1218-pm', 'pos-004', 1),
('spr-1219-pm-1', 'shift-1219-pm', 'pos-001', 1), ('spr-1219-pm-2', 'shift-1219-pm', 'pos-002', 1),
('spr-1219-pm-3', 'shift-1219-pm', 'pos-003', 2), ('spr-1219-pm-4', 'shift-1219-pm', 'pos-004', 1),
('spr-1220-pm-1', 'shift-1220-pm', 'pos-001', 1), ('spr-1220-pm-2', 'shift-1220-pm', 'pos-002', 1),
('spr-1220-pm-3', 'shift-1220-pm', 'pos-003', 2), ('spr-1220-pm-4', 'shift-1220-pm', 'pos-004', 1),
('spr-1221-pm-1', 'shift-1221-pm', 'pos-001', 1), ('spr-1221-pm-2', 'shift-1221-pm', 'pos-002', 1),
('spr-1221-pm-3', 'shift-1221-pm', 'pos-003', 2), ('spr-1221-pm-4', 'shift-1221-pm', 'pos-004', 1);

-- Evening shifts: Server, Barista, Kitchen
INSERT INTO shift_position_requirements (id, shift_id, position_id, required_count) VALUES
('spr-1215-ev-1', 'shift-1215-ev', 'pos-003', 1), ('spr-1215-ev-2', 'shift-1215-ev', 'pos-004', 1),
('spr-1215-ev-3', 'shift-1215-ev', 'pos-005', 1),
('spr-1216-ev-1', 'shift-1216-ev', 'pos-003', 1), ('spr-1216-ev-2', 'shift-1216-ev', 'pos-004', 1),
('spr-1216-ev-3', 'shift-1216-ev', 'pos-005', 1),
('spr-1217-ev-1', 'shift-1217-ev', 'pos-003', 1), ('spr-1217-ev-2', 'shift-1217-ev', 'pos-004', 1),
('spr-1217-ev-3', 'shift-1217-ev', 'pos-005', 1),
('spr-1218-ev-1', 'shift-1218-ev', 'pos-003', 1), ('spr-1218-ev-2', 'shift-1218-ev', 'pos-004', 1),
('spr-1218-ev-3', 'shift-1218-ev', 'pos-005', 1),
('spr-1219-ev-1', 'shift-1219-ev', 'pos-003', 2), ('spr-1219-ev-2', 'shift-1219-ev', 'pos-004', 1),
('spr-1219-ev-3', 'shift-1219-ev', 'pos-005', 1),
('spr-1220-ev-1', 'shift-1220-ev', 'pos-003', 2), ('spr-1220-ev-2', 'shift-1220-ev', 'pos-004', 1),
('spr-1220-ev-3', 'shift-1220-ev', 'pos-005', 1),
('spr-1221-ev-1', 'shift-1221-ev', 'pos-003', 2), ('spr-1221-ev-2', 'shift-1221-ev', 'pos-004', 1),
('spr-1221-ev-3', 'shift-1221-ev', 'pos-005', 1);

-- ============================================================================
-- 9. SCHEDULE_ASSIGNMENTS (Which employee works which shift)
-- ============================================================================
-- Manager emp-001 works morning shifts Mon-Fri
INSERT INTO schedule_assignments (id, schedule_id, shift_id, employee_id, position_id, status, source) VALUES
('sa-001', 'ws-w51-2025', 'shift-1215-am', 'emp-001', 'pos-001', 'assigned', 'manual'),
('sa-002', 'ws-w51-2025', 'shift-1216-am', 'emp-001', 'pos-001', 'assigned', 'manual'),
('sa-003', 'ws-w51-2025', 'shift-1217-am', 'emp-001', 'pos-001', 'assigned', 'manual'),
('sa-004', 'ws-w51-2025', 'shift-1218-am', 'emp-001', 'pos-001', 'assigned', 'manual'),
('sa-005', 'ws-w51-2025', 'shift-1219-am', 'emp-001', 'pos-001', 'assigned', 'manual');
-- Cashier emp-002 works various shifts
INSERT INTO schedule_assignments (id, schedule_id, shift_id, employee_id, position_id, status, source) VALUES
('sa-006', 'ws-w51-2025', 'shift-1215-am', 'emp-002', 'pos-002', 'assigned', 'manual'),
('sa-007', 'ws-w51-2025', 'shift-1216-pm', 'emp-002', 'pos-002', 'assigned', 'manual'),
('sa-008', 'ws-w51-2025', 'shift-1217-am', 'emp-002', 'pos-002', 'assigned', 'manual'),
('sa-009', 'ws-w51-2025', 'shift-1218-pm', 'emp-002', 'pos-002', 'assigned', 'manual'),
('sa-010', 'ws-w51-2025', 'shift-1220-am', 'emp-002', 'pos-002', 'assigned', 'manual'),
('sa-011', 'ws-w51-2025', 'shift-1221-pm', 'emp-002', 'pos-002', 'assigned', 'manual');
-- Server emp-003 part-time
INSERT INTO schedule_assignments (id, schedule_id, shift_id, employee_id, position_id, status, source) VALUES
('sa-012', 'ws-w51-2025', 'shift-1215-pm', 'emp-003', 'pos-003', 'assigned', 'auto'),
('sa-013', 'ws-w51-2025', 'shift-1217-pm', 'emp-003', 'pos-003', 'assigned', 'auto'),
('sa-014', 'ws-w51-2025', 'shift-1219-ev', 'emp-003', 'pos-003', 'assigned', 'auto'),
('sa-015', 'ws-w51-2025', 'shift-1220-pm', 'emp-003', 'pos-003', 'assigned', 'auto');
-- Barista emp-004 full-time
INSERT INTO schedule_assignments (id, schedule_id, shift_id, employee_id, position_id, status, source) VALUES
('sa-016', 'ws-w51-2025', 'shift-1215-am', 'emp-004', 'pos-004', 'assigned', 'manual'),
('sa-017', 'ws-w51-2025', 'shift-1216-am', 'emp-004', 'pos-004', 'assigned', 'manual'),
('sa-018', 'ws-w51-2025', 'shift-1217-pm', 'emp-004', 'pos-004', 'assigned', 'manual'),
('sa-019', 'ws-w51-2025', 'shift-1218-pm', 'emp-004', 'pos-004', 'assigned', 'manual'),
('sa-020', 'ws-w51-2025', 'shift-1219-am', 'emp-004', 'pos-004', 'assigned', 'manual'),
('sa-021', 'ws-w51-2025', 'shift-1220-pm', 'emp-004', 'pos-004', 'assigned', 'manual'),
('sa-022', 'ws-w51-2025', 'shift-1221-am', 'emp-004', 'pos-004', 'assigned', 'manual');
-- Kitchen emp-005 part-time evening
INSERT INTO schedule_assignments (id, schedule_id, shift_id, employee_id, position_id, status, source) VALUES
('sa-023', 'ws-w51-2025', 'shift-1215-ev', 'emp-005', 'pos-005', 'assigned', 'manual'),
('sa-024', 'ws-w51-2025', 'shift-1217-ev', 'emp-005', 'pos-005', 'assigned', 'manual'),
('sa-025', 'ws-w51-2025', 'shift-1219-ev', 'emp-005', 'pos-005', 'assigned', 'manual'),
('sa-026', 'ws-w51-2025', 'shift-1220-ev', 'emp-005', 'pos-005', 'assigned', 'manual');
-- Server emp-006 full-time
INSERT INTO schedule_assignments (id, schedule_id, shift_id, employee_id, position_id, status, source) VALUES
('sa-027', 'ws-w51-2025', 'shift-1215-am', 'emp-006', 'pos-003', 'assigned', 'auto'),
('sa-028', 'ws-w51-2025', 'shift-1216-pm', 'emp-006', 'pos-003', 'assigned', 'auto'),
('sa-029', 'ws-w51-2025', 'shift-1217-am', 'emp-006', 'pos-003', 'assigned', 'auto'),
('sa-030', 'ws-w51-2025', 'shift-1218-ev', 'emp-006', 'pos-003', 'assigned', 'auto'),
('sa-031', 'ws-w51-2025', 'shift-1219-pm', 'emp-006', 'pos-003', 'assigned', 'auto'),
('sa-032', 'ws-w51-2025', 'shift-1220-am', 'emp-006', 'pos-003', 'assigned', 'auto'),
('sa-033', 'ws-w51-2025', 'shift-1221-pm', 'emp-006', 'pos-003', 'assigned', 'auto');
-- More assignments for emp-007, emp-008
INSERT INTO schedule_assignments (id, schedule_id, shift_id, employee_id, position_id, status, source) VALUES
('sa-034', 'ws-w51-2025', 'shift-1216-ev', 'emp-007', 'pos-003', 'assigned', 'auto'),
('sa-035', 'ws-w51-2025', 'shift-1218-am', 'emp-007', 'pos-003', 'assigned', 'auto'),
('sa-036', 'ws-w51-2025', 'shift-1221-ev', 'emp-007', 'pos-003', 'assigned', 'auto'),
('sa-037', 'ws-w51-2025', 'shift-1216-am', 'emp-008', 'pos-002', 'assigned', 'manual'),
('sa-038', 'ws-w51-2025', 'shift-1219-pm', 'emp-008', 'pos-002', 'assigned', 'manual'),
('sa-039', 'ws-w51-2025', 'shift-1221-am', 'emp-008', 'pos-002', 'assigned', 'manual');

-- ============================================================================
-- 10. EMPLOYEE_AVAILABILITY (Registration for shifts)
-- ============================================================================
INSERT INTO employee_availability (id, employee_id, shift_id, status) VALUES
('ea-001', 'emp-002', 'shift-1215-am', 'available'),
('ea-002', 'emp-002', 'shift-1216-pm', 'available'),
('ea-003', 'emp-003', 'shift-1215-pm', 'preferred'),
('ea-004', 'emp-003', 'shift-1217-pm', 'preferred'),
('ea-005', 'emp-003', 'shift-1219-ev', 'available'),
('ea-006', 'emp-004', 'shift-1215-am', 'preferred'),
('ea-007', 'emp-004', 'shift-1216-am', 'preferred'),
('ea-008', 'emp-005', 'shift-1215-ev', 'available'),
('ea-009', 'emp-005', 'shift-1217-ev', 'available'),
('ea-010', 'emp-006', 'shift-1215-am', 'preferred'),
('ea-011', 'emp-006', 'shift-1216-pm', 'preferred'),
('ea-012', 'emp-007', 'shift-1216-ev', 'available'),
('ea-013', 'emp-008', 'shift-1216-am', 'preferred');

-- ============================================================================
-- 11. EMPLOYEE_AVAILABILITY_POSITIONS
-- ============================================================================
INSERT INTO employee_availability_positions (id, availability_id, position_id, preference_order) VALUES
('eap-001', 'ea-001', 'pos-002', 1),
('eap-002', 'ea-002', 'pos-002', 1),
('eap-003', 'ea-003', 'pos-003', 1),
('eap-004', 'ea-004', 'pos-003', 1),
('eap-005', 'ea-005', 'pos-003', 1),
('eap-006', 'ea-006', 'pos-004', 1),
('eap-007', 'ea-007', 'pos-004', 1),
('eap-008', 'ea-008', 'pos-005', 1),
('eap-009', 'ea-009', 'pos-005', 1),
('eap-010', 'ea-010', 'pos-003', 1),
('eap-011', 'ea-011', 'pos-003', 1),
('eap-012', 'ea-012', 'pos-003', 1),
('eap-013', 'ea-013', 'pos-002', 1);

-- ============================================================================
-- 12. DEVICES (2 devices for check-in/out)
-- ============================================================================
INSERT INTO devices (id, name, location, device_key, status, current_mode) VALUES
('dev-001', 'Máy chấm công cửa chính', 'Sảnh chính', 'DEV-MAIN-001', 'active', 'attendance'),
('dev-002', 'Máy chấm công nhà bếp', 'Khu vực bếp', 'DEV-KITCHEN-002', 'active', 'attendance');

-- ============================================================================
-- 13. RFID_CARDS (1 card per employee)
-- ============================================================================
INSERT INTO rfid_cards (id, employee_id, card_uid, issued_at, status) VALUES
('rfid-001', 'emp-001', 'CARD-MGR-001', '2023-01-15 09:00:00', 'active'),
('rfid-002', 'emp-002', 'CARD-CSH-002', '2023-03-01 09:00:00', 'active'),
('rfid-003', 'emp-003', 'CARD-SRV-003', '2023-06-15 09:00:00', 'active'),
('rfid-004', 'emp-004', 'CARD-BAR-004', '2023-04-01 09:00:00', 'active'),
('rfid-005', 'emp-005', 'CARD-KIT-005', '2023-02-15 09:00:00', 'active'),
('rfid-006', 'emp-006', 'CARD-SRV-006', '2024-01-10 09:00:00', 'active'),
('rfid-007', 'emp-007', 'CARD-SRV-007', '2024-03-01 09:00:00', 'active'),
('rfid-008', 'emp-008', 'CARD-CSH-008', '2024-06-01 09:00:00', 'active');

-- ============================================================================
-- 14. ATTENDANCE_SHIFTS (Past attendance - Dec 15 only for demo)
-- Note: Only 15th has attendance since other days are in the future
-- ============================================================================
INSERT INTO attendance_shifts (id, shift_id, schedule_assignment_id, employee_id, clock_in, clock_out, worked_minutes, late_minutes, early_leave_minutes, status) VALUES
-- Dec 15 Morning shift (7:00-14:00)
('as-001', 'shift-1215-am', 'sa-001', 'emp-001', '2025-12-15 06:55:00', '2025-12-15 14:05:00', 430, 0, 0, 'present'),
('as-002', 'shift-1215-am', 'sa-006', 'emp-002', '2025-12-15 07:08:00', '2025-12-15 14:00:00', 412, 8, 0, 'present'),
('as-003', 'shift-1215-am', 'sa-027', 'emp-006', '2025-12-15 06:58:00', '2025-12-15 14:02:00', 424, 0, 0, 'present'),
('as-004', 'shift-1215-am', 'sa-016', 'emp-004', '2025-12-15 07:00:00', '2025-12-15 14:00:00', 420, 0, 0, 'present'),
-- Dec 15 Afternoon shift (14:00-21:00)
('as-005', 'shift-1215-pm', 'sa-012', 'emp-003', '2025-12-15 13:55:00', '2025-12-15 21:10:00', 435, 0, 0, 'present'),
-- Dec 15 Evening shift (17:00-23:00)
('as-006', 'shift-1215-ev', 'sa-023', 'emp-005', '2025-12-15 17:05:00', '2025-12-15 23:00:00', 355, 5, 0, 'present');

-- ============================================================================
-- 15. MONTHLY_PAYROLLS (December 2025 payrolls)
-- ============================================================================
INSERT INTO monthly_payrolls (id, employee_id, contract_id, month, salary_scheme_id, base_salary, pay_type, allowances, bonuses, overtime_pay, deductions, penalties, gross_salary, net_salary, total_work_days, total_work_hours, status) VALUES
('pay-dec-001', 'emp-001', 'con-001', '2025-12', 'scheme-001', 15000000, 'monthly', 1000000, 500000, 0, 500000, 0, 16500000, 16000000, 20, 160, 'pending_approval'),
('pay-dec-002', 'emp-002', 'con-002', '2025-12', 'scheme-002', 4200000, 'hourly', 200000, 0, 350000, 100000, 50000, 4750000, 4600000, 15, 120, 'pending_approval'),
('pay-dec-003', 'emp-003', 'con-003', '2025-12', 'scheme-003', 2400000, 'hourly', 100000, 0, 0, 50000, 0, 2500000, 2450000, 10, 80, 'draft'),
('pay-dec-004', 'emp-004', 'con-004', '2025-12', 'scheme-004', 10000000, 'monthly', 500000, 300000, 500000, 300000, 0, 11300000, 11000000, 22, 176, 'pending_approval'),
('pay-dec-005', 'emp-005', 'con-005', '2025-12', 'scheme-005', 3200000, 'hourly', 200000, 0, 0, 100000, 100000, 3400000, 3200000, 10, 80, 'draft'),
('pay-dec-006', 'emp-006', 'con-006', '2025-12', 'scheme-006', 8000000, 'monthly', 400000, 200000, 0, 200000, 0, 8600000, 8400000, 20, 160, 'approved'),
('pay-dec-007', 'emp-007', 'con-007', '2025-12', 'scheme-003', 1800000, 'hourly', 100000, 0, 0, 50000, 0, 1900000, 1850000, 8, 60, 'draft'),
('pay-dec-008', 'emp-008', 'con-008', '2025-12', 'scheme-002', 2800000, 'hourly', 150000, 0, 175000, 75000, 0, 3125000, 3050000, 10, 80, 'pending_approval');

-- ============================================================================
-- 16. SALARY_REQUESTS (Sample requests)
-- ============================================================================
INSERT INTO salary_requests (id, employee_id, type, current_scheme_id, proposed_scheme_id, current_rate, proposed_rate, payroll_id, adjustment_amount, reason, request_date, status) VALUES
('sr-001', 'emp-003', 'raise', 'scheme-003', 'scheme-006', 30000, 8000000, NULL, NULL, 'Đã làm việc 1.5 năm, xin xét tăng lương', '2025-12-10 10:00:00', 'pending'),
('sr-002', 'emp-002', 'adjustment', 'scheme-002', NULL, 35000, NULL, 'pay-dec-002', 200000, 'Thiếu tiền thưởng cuối tháng', '2025-12-12 14:30:00', 'approved');

-- ============================================================================
-- 17. NOTIFICATIONS (Sample notifications)
-- ============================================================================
INSERT INTO notifications (id, title, message, action_url, recipient_type, status, sent_at) VALUES
('notif-001', 'Lịch làm việc tuần 51 đã được công bố', 'Lịch làm việc tuần 15-21/12/2025 đã sẵn sàng xem', '/my-schedule?week=2025-12-15', 'ALL', 'sent', '2025-12-14 08:00:00'),
('notif-002', 'Bảng lương tháng 12/2025 cần xem xét', 'Bảng lương của bạn đang chờ duyệt. Vui lòng kiểm tra và yêu cầu điều chỉnh nếu cần.', '/salary', 'ALL', 'sent', '2025-12-14 09:00:00');

-- ============================================================================
-- 18. MONTHLY_EMPLOYEE_STATS (December stats)
-- ============================================================================
INSERT INTO monthly_employee_stats (id, employee_id, month, total_shifts_assigned, total_shifts_worked, total_worked_minutes, overtime_minutes, late_minutes, absent_count) VALUES
('mes-dec-001', 'emp-001', '2025-12', 20, 18, 8640, 0, 0, 0),
('mes-dec-002', 'emp-002', '2025-12', 15, 14, 7200, 120, 15, 1),
('mes-dec-003', 'emp-003', '2025-12', 10, 10, 4800, 0, 0, 0),
('mes-dec-004', 'emp-004', '2025-12', 22, 21, 10560, 240, 0, 1),
('mes-dec-005', 'emp-005', '2025-12', 10, 9, 4800, 0, 10, 1),
('mes-dec-006', 'emp-006', '2025-12', 20, 20, 9600, 0, 5, 0),
('mes-dec-007', 'emp-007', '2025-12', 8, 8, 3600, 0, 0, 0),
('mes-dec-008', 'emp-008', '2025-12', 10, 10, 4800, 60, 0, 0);

-- ============================================================================
-- RESTORE SETTINGS
-- ============================================================================
SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS;

-- ============================================================================
-- VERIFICATION
-- ============================================================================
SELECT '========================================' AS '=';
SELECT '✅ DEMO SEED DATA IMPORT SUCCESSFUL!' AS 'Status';
SELECT '========================================' AS '=';
SELECT 'Demo Week: December 15-21, 2025' AS 'Info';
SELECT CONCAT('Employees: ', (SELECT COUNT(*) FROM employees)) AS 'Count';
SELECT CONCAT('Positions: ', (SELECT COUNT(*) FROM positions)) AS 'Count';
SELECT CONCAT('Shifts: ', (SELECT COUNT(*) FROM shifts)) AS 'Count';
SELECT CONCAT('Assignments: ', (SELECT COUNT(*) FROM schedule_assignments)) AS 'Count';
SELECT CONCAT('Payrolls: ', (SELECT COUNT(*) FROM monthly_payrolls)) AS 'Count';
SELECT '========================================' AS '=';
