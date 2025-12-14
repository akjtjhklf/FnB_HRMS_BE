-- Database Initialization Script for FnB HRMS
-- Compatible with MySQL 8.0+

-- ==========================================
-- 1. CORE DIRECTUS TABLES (Simplified)
-- ==========================================

CREATE TABLE IF NOT EXISTS directus_users (
    id CHAR(36) PRIMARY KEY,
    first_name VARCHAR(50),
    last_name VARCHAR(50),
    email VARCHAR(128) UNIQUE,
    password VARCHAR(255),
    location VARCHAR(255),
    title VARCHAR(50),
    description TEXT,
    tags JSON,
    avatar CHAR(36), -- FK to directus_files
    language VARCHAR(8) DEFAULT 'en-US',
    tfa_secret VARCHAR(64),
    status VARCHAR(16) DEFAULT 'active',
    role CHAR(36), -- FK to directus_roles
    token VARCHAR(255),
    last_access TIMESTAMP NULL,
    last_page VARCHAR(255),
    provider VARCHAR(128) DEFAULT 'default',
    external_identifier VARCHAR(255),
    auth_data JSON,
    email_notifications BOOLEAN DEFAULT TRUE,
    appearance VARCHAR(32),
    theme_dark VARCHAR(32),
    theme_light VARCHAR(32),
    theme_dark_overrides JSON,
    theme_light_overrides JSON,
    text_direction VARCHAR(8) DEFAULT 'ltr',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    employee_id CHAR(36), -- Custom link to employees table
    CONSTRAINT chk_user_status CHECK (status IN ('active', 'invited', 'suspended', 'archived'))
);

CREATE TABLE IF NOT EXISTS directus_roles (
    id CHAR(36) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    icon VARCHAR(30) DEFAULT 'supervised_user_circle',
    description TEXT,
    parent CHAR(36),
    admin_access BOOLEAN DEFAULT FALSE,
    app_access BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (parent) REFERENCES directus_roles(id)
);

CREATE TABLE IF NOT EXISTS directus_files (
    id CHAR(36) PRIMARY KEY,
    storage VARCHAR(255) NOT NULL,
    filename_disk VARCHAR(255),
    filename_download VARCHAR(255) NOT NULL,
    title VARCHAR(255),
    type VARCHAR(255),
    folder CHAR(36),
    uploaded_by CHAR(36),
    created_on TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    modified_by CHAR(36),
    modified_on TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    charset VARCHAR(50),
    filesize BIGINT,
    width INTEGER,
    height INTEGER,
    duration INTEGER,
    embed VARCHAR(200),
    description TEXT,
    location VARCHAR(200),
    tags JSON,
    metadata JSON,
    FOREIGN KEY (uploaded_by) REFERENCES directus_users(id),
    FOREIGN KEY (modified_by) REFERENCES directus_users(id)
);

-- ==========================================
-- 2. HRMS CORE TABLES
-- ==========================================

-- Positions
CREATE TABLE IF NOT EXISTS positions (
    id CHAR(36) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Salary Schemes
CREATE TABLE IF NOT EXISTS salary_schemes (
    id CHAR(36) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    position_id CHAR(36),
    pay_type VARCHAR(50) NOT NULL,
    rate DECIMAL(15, 2) NOT NULL,
    min_hours DECIMAL(5, 2),
    overtime_multiplier DECIMAL(3, 2) DEFAULT 1.5,
    effective_from DATE,
    effective_to DATE,
    is_active BOOLEAN DEFAULT TRUE,
    notes TEXT,
    metadata JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (position_id) REFERENCES positions(id) ON DELETE SET NULL,
    CONSTRAINT chk_pay_type CHECK (pay_type IN ('hourly', 'fixed_shift', 'monthly'))
);

-- Employees
CREATE TABLE IF NOT EXISTS employees (
    id CHAR(36) PRIMARY KEY,
    user_id CHAR(36),
    employee_code VARCHAR(50) UNIQUE NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    full_name VARCHAR(255),
    dob DATE,
    gender VARCHAR(20),
    personal_id VARCHAR(50),
    phone VARCHAR(20),
    email VARCHAR(255),
    address TEXT,
    hire_date DATE,
    termination_date DATE,
    status VARCHAR(50) DEFAULT 'active',
    scheme_id CHAR(36),
    position_id CHAR(36),
    default_work_hours_per_week DECIMAL(5, 2),
    max_hours_per_week DECIMAL(5, 2),
    max_consecutive_days INTEGER,
    min_rest_hours_between_shifts DECIMAL(5, 2),
    photo_url TEXT,
    emergency_contact_name VARCHAR(255),
    emergency_contact_phone VARCHAR(20),
    notes TEXT,
    metadata JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL,
    FOREIGN KEY (user_id) REFERENCES directus_users(id) ON DELETE SET NULL,
    FOREIGN KEY (scheme_id) REFERENCES salary_schemes(id) ON DELETE SET NULL,
    FOREIGN KEY (position_id) REFERENCES positions(id) ON DELETE SET NULL,
    CONSTRAINT chk_gender CHECK (gender IN ('male', 'female', 'other')),
    CONSTRAINT chk_emp_status CHECK (status IN ('active', 'on_leave', 'suspended', 'terminated'))
);

-- Contracts
CREATE TABLE IF NOT EXISTS contracts (
    id CHAR(36) PRIMARY KEY,
    employee_id CHAR(36) NOT NULL,
    contract_type VARCHAR(50),
    start_date DATE,
    end_date DATE,
    base_salary DECIMAL(15, 2),
    salary_scheme_id CHAR(36), -- New field
    probation_end_date DATE,
    signed_doc_url TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
    FOREIGN KEY (salary_scheme_id) REFERENCES salary_schemes(id) ON DELETE SET NULL,
    CONSTRAINT chk_contract_type CHECK (contract_type IN ('full_time', 'part_time', 'casual', 'probation'))
);

-- ==========================================
-- 3. ATTENDANCE & SHIFTS TABLES
-- ==========================================

-- Shift Types
CREATE TABLE IF NOT EXISTS shift_types (
    id CHAR(36) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    cross_midnight BOOLEAN DEFAULT FALSE,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Weekly Schedule
CREATE TABLE IF NOT EXISTS weekly_schedule (
    id CHAR(36) PRIMARY KEY,
    week_start DATE NOT NULL,
    week_end DATE NOT NULL,
    created_by CHAR(36),
    status VARCHAR(50) DEFAULT 'draft',
    published_at TIMESTAMP NULL,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES directus_users(id),
    CONSTRAINT chk_schedule_status CHECK (status IN ('draft', 'scheduled', 'finalized', 'cancelled'))
);

-- Shifts (Daily instances in a schedule)
CREATE TABLE IF NOT EXISTS shifts (
    id CHAR(36) PRIMARY KEY,
    schedule_id CHAR(36),
    shift_type_id CHAR(36),
    shift_date DATE NOT NULL,
    start_at TIMESTAMP NULL,
    end_at TIMESTAMP NULL,
    total_required INTEGER,
    notes TEXT,
    metadata JSON,
    created_by CHAR(36),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (schedule_id) REFERENCES weekly_schedule(id) ON DELETE CASCADE,
    FOREIGN KEY (shift_type_id) REFERENCES shift_types(id),
    FOREIGN KEY (created_by) REFERENCES directus_users(id)
);

-- Shift Position Requirements
CREATE TABLE IF NOT EXISTS shift_position_requirements (
    id CHAR(36) PRIMARY KEY,
    shift_id CHAR(36),
    position_id CHAR(36),
    required_count INTEGER DEFAULT 1,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (shift_id) REFERENCES shifts(id) ON DELETE CASCADE,
    FOREIGN KEY (position_id) REFERENCES positions(id) ON DELETE CASCADE
);

-- Schedule Assignments
CREATE TABLE IF NOT EXISTS schedule_assignments (
    id CHAR(36) PRIMARY KEY,
    schedule_id CHAR(36),
    shift_id CHAR(36),
    employee_id CHAR(36),
    position_id CHAR(36),
    assigned_by CHAR(36),
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(50) DEFAULT 'assigned',
    source VARCHAR(20) DEFAULT 'manual',
    note TEXT,
    confirmed_by_employee BOOLEAN,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (schedule_id) REFERENCES weekly_schedule(id) ON DELETE CASCADE,
    FOREIGN KEY (shift_id) REFERENCES shifts(id) ON DELETE CASCADE,
    FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
    FOREIGN KEY (position_id) REFERENCES positions(id),
    FOREIGN KEY (assigned_by) REFERENCES directus_users(id),
    CONSTRAINT chk_assign_status CHECK (status IN ('assigned', 'tentative', 'swapped', 'cancelled')),
    CONSTRAINT chk_assign_source CHECK (source IN ('auto', 'manual'))
);

-- Schedule Change Requests
CREATE TABLE IF NOT EXISTS schedule_change_requests (
    id CHAR(36) PRIMARY KEY,
    requester_id CHAR(36),
    type VARCHAR(50),
    from_assignment_id CHAR(36),
    to_assignment_id CHAR(36),
    target_employee_id CHAR(36),
    replacement_employee_id CHAR(36),
    reason TEXT,
    status VARCHAR(50) DEFAULT 'pending',
    approved_by CHAR(36),
    approved_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (requester_id) REFERENCES employees(id) ON DELETE CASCADE,
    FOREIGN KEY (from_assignment_id) REFERENCES schedule_assignments(id),
    FOREIGN KEY (to_assignment_id) REFERENCES schedule_assignments(id),
    FOREIGN KEY (target_employee_id) REFERENCES employees(id),
    FOREIGN KEY (replacement_employee_id) REFERENCES employees(id),
    FOREIGN KEY (approved_by) REFERENCES directus_users(id),
    CONSTRAINT chk_req_type CHECK (type IN ('shift_swap', 'pass_shift', 'day_off')),
    CONSTRAINT chk_req_status CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled'))
);

-- Employee Availability
CREATE TABLE IF NOT EXISTS employee_availability (
    id CHAR(36) PRIMARY KEY,
    employee_id CHAR(36),
    shift_id CHAR(36),
    status VARCHAR(50) DEFAULT 'pending',
    priority INTEGER,
    expires_at TIMESTAMP NULL,
    note TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
    FOREIGN KEY (shift_id) REFERENCES shifts(id)
);

CREATE TABLE IF NOT EXISTS employee_availability_positions (
    id CHAR(36) PRIMARY KEY,
    availability_id CHAR(36),
    position_id CHAR(36),
    preference_order INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (availability_id) REFERENCES employee_availability(id) ON DELETE CASCADE,
    FOREIGN KEY (position_id) REFERENCES positions(id) ON DELETE CASCADE
);

-- ==========================================
-- 4. PAYROLL & ATTENDANCE LOGS
-- ==========================================

-- Monthly Payrolls
CREATE TABLE IF NOT EXISTS monthly_payrolls (
    id CHAR(36) PRIMARY KEY,
    employee_id CHAR(36) NOT NULL,
    month VARCHAR(7) NOT NULL, -- Format: YYYY-MM
    salary_scheme_id CHAR(36),
    base_salary DECIMAL(15, 2) DEFAULT 0,
    allowances DECIMAL(15, 2) DEFAULT 0,
    bonuses DECIMAL(15, 2) DEFAULT 0,
    overtime_pay DECIMAL(15, 2) DEFAULT 0,
    deductions DECIMAL(15, 2) DEFAULT 0,
    penalties DECIMAL(15, 2) DEFAULT 0,
    gross_salary DECIMAL(15, 2) DEFAULT 0,
    net_salary DECIMAL(15, 2) DEFAULT 0,
    total_work_hours DECIMAL(6, 2),
    overtime_hours DECIMAL(6, 2),
    late_minutes INTEGER,
    absent_days DECIMAL(4, 1),
    notes TEXT,
    status VARCHAR(50) DEFAULT 'draft',
    approved_by CHAR(36),
    approved_at TIMESTAMP NULL,
    paid_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uniq_emp_month (employee_id, month),
    FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
    FOREIGN KEY (salary_scheme_id) REFERENCES salary_schemes(id) ON DELETE SET NULL,
    FOREIGN KEY (approved_by) REFERENCES directus_users(id),
    CONSTRAINT chk_payroll_status CHECK (status IN ('draft', 'pending_approval', 'approved', 'paid'))
);

-- Deductions
CREATE TABLE IF NOT EXISTS deductions (
    id CHAR(36) PRIMARY KEY,
    employee_id CHAR(36),
    type VARCHAR(50),
    amount DECIMAL(15, 2),
    currency VARCHAR(10) DEFAULT 'VND',
    related_shift_id CHAR(36),
    note TEXT,
    status VARCHAR(50) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
    FOREIGN KEY (related_shift_id) REFERENCES shifts(id),
    CONSTRAINT chk_deduction_type CHECK (type IN ('advance', 'penalty', 'expense')),
    CONSTRAINT chk_deduction_status CHECK (status IN ('pending', 'applied', 'reimbursed'))
);

-- Salary Requests
CREATE TABLE IF NOT EXISTS salary_requests (
    id CHAR(36) PRIMARY KEY,
    employee_id CHAR(36),
    type VARCHAR(50),
    current_scheme_id CHAR(36),
    proposed_scheme_id CHAR(36),
    current_rate DECIMAL(15, 2),
    proposed_rate DECIMAL(15, 2),
    payroll_id CHAR(36),
    adjustment_amount DECIMAL(15, 2),
    reason TEXT,
    manager_note TEXT,
    request_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(50) DEFAULT 'pending',
    approved_by CHAR(36),
    approved_at TIMESTAMP NULL,
    note TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
    FOREIGN KEY (current_scheme_id) REFERENCES salary_schemes(id),
    FOREIGN KEY (proposed_scheme_id) REFERENCES salary_schemes(id),
    FOREIGN KEY (payroll_id) REFERENCES monthly_payrolls(id),
    FOREIGN KEY (approved_by) REFERENCES directus_users(id),
    CONSTRAINT chk_salreq_type CHECK (type IN ('raise', 'adjustment')),
    CONSTRAINT chk_salreq_status CHECK (status IN ('pending', 'approved', 'rejected'))
);

-- Monthly Employee Stats
CREATE TABLE IF NOT EXISTS monthly_employee_stats (
    id CHAR(36) PRIMARY KEY,
    employee_id CHAR(36),
    month VARCHAR(7) NOT NULL,
    total_shifts_assigned INTEGER DEFAULT 0,
    total_shifts_worked INTEGER DEFAULT 0,
    swaps_count INTEGER DEFAULT 0,
    pass_count INTEGER DEFAULT 0,
    off_count INTEGER DEFAULT 0,
    total_worked_minutes INTEGER DEFAULT 0,
    overtime_minutes INTEGER DEFAULT 0,
    late_minutes INTEGER DEFAULT 0,
    absent_count INTEGER DEFAULT 0,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uniq_stat_emp_month (employee_id, month),
    FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE
);

-- ==========================================
-- 5. DEVICES & RFID
-- ==========================================

-- Devices
CREATE TABLE IF NOT EXISTS devices (
    id CHAR(36) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    location VARCHAR(255),
    device_key VARCHAR(255) UNIQUE NOT NULL,
    ip_address VARCHAR(50),
    mac_address VARCHAR(50),
    firmware_version VARCHAR(50),
    last_seen_at TIMESTAMP NULL,
    status VARCHAR(50) DEFAULT 'offline',
    current_mode VARCHAR(50) DEFAULT 'attendance',
    employee_id_pending CHAR(36),
    metadata JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (employee_id_pending) REFERENCES employees(id),
    CONSTRAINT chk_dev_status CHECK (status IN ('online', 'offline', 'decommissioned')),
    CONSTRAINT chk_dev_mode CHECK (current_mode IN ('attendance', 'enroll'))
);

-- RFID Cards
CREATE TABLE IF NOT EXISTS rfid_cards (
    id CHAR(36) PRIMARY KEY,
    employee_id CHAR(36),
    card_uid VARCHAR(100) UNIQUE NOT NULL,
    issued_at TIMESTAMP NULL,
    revoked_at TIMESTAMP NULL,
    status VARCHAR(50) DEFAULT 'active',
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE SET NULL,
    CONSTRAINT chk_card_status CHECK (status IN ('active', 'suspended', 'lost', 'revoked'))
);

-- Attendance Logs
CREATE TABLE IF NOT EXISTS attendance_logs (
    id CHAR(36) PRIMARY KEY,
    card_uid VARCHAR(100) NOT NULL,
    rfid_card_id CHAR(36),
    employee_id CHAR(36),
    device_id CHAR(36),
    event_type VARCHAR(50),
    event_time TIMESTAMP NOT NULL,
    raw_payload TEXT,
    processed BOOLEAN DEFAULT FALSE,
    match_attempted_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (rfid_card_id) REFERENCES rfid_cards(id),
    FOREIGN KEY (employee_id) REFERENCES employees(id),
    FOREIGN KEY (device_id) REFERENCES devices(id),
    CONSTRAINT chk_log_type CHECK (event_type IN ('tap', 'clock_in', 'clock_out'))
);

-- Attendance Shifts (Processed logs)
CREATE TABLE IF NOT EXISTS attendance_shifts (
    id CHAR(36) PRIMARY KEY,
    shift_id CHAR(36),
    schedule_assignment_id CHAR(36),
    employee_id CHAR(36),
    clock_in TIMESTAMP NULL,
    clock_out TIMESTAMP NULL,
    worked_minutes INTEGER,
    late_minutes INTEGER,
    early_leave_minutes INTEGER,
    status VARCHAR(50) DEFAULT 'absent',
    manual_adjusted BOOLEAN DEFAULT FALSE,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (shift_id) REFERENCES shifts(id),
    FOREIGN KEY (schedule_assignment_id) REFERENCES schedule_assignments(id),
    FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
    CONSTRAINT chk_att_status CHECK (status IN ('present', 'absent', 'partial'))
);

-- Attendance Adjustments
CREATE TABLE IF NOT EXISTS attendance_adjustments (
    id CHAR(36) PRIMARY KEY,
    attendance_shift_id CHAR(36),
    requested_by CHAR(36),
    requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    old_value JSON,
    proposed_value JSON,
    approved_by CHAR(36),
    approved_at TIMESTAMP NULL,
    status VARCHAR(50) DEFAULT 'pending',
    reason TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (attendance_shift_id) REFERENCES attendance_shifts(id) ON DELETE CASCADE,
    FOREIGN KEY (requested_by) REFERENCES employees(id),
    FOREIGN KEY (approved_by) REFERENCES directus_users(id),
    CONSTRAINT chk_adj_status CHECK (status IN ('pending', 'approved', 'rejected'))
);

-- Notifications
CREATE TABLE IF NOT EXISTS notifications (
    id CHAR(36) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    action_url TEXT,
    recipient_type VARCHAR(50),
    status VARCHAR(50) DEFAULT 'draft',
    user_ids JSON, -- Array of employee IDs
    scheduled_at TIMESTAMP NULL,
    sent_at TIMESTAMP NULL,
    created_by CHAR(36),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES directus_users(id),
    CONSTRAINT chk_notif_type CHECK (recipient_type IN ('ALL', 'SPECIFIC')),
    CONSTRAINT chk_notif_status CHECK (status IN ('draft', 'scheduled', 'sent', 'failed'))
);

-- Notification Logs
CREATE TABLE IF NOT EXISTS notification_logs (
    id CHAR(36) PRIMARY KEY,
    notification_id CHAR(36),
    user_id CHAR(36),
    status VARCHAR(50) DEFAULT 'pending',
    sent_at TIMESTAMP NULL,
    error_message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (notification_id) REFERENCES notifications(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES employees(id)
);

-- ==========================================
-- 6. INDEXES
-- ==========================================

CREATE INDEX idx_employees_position ON employees(position_id);
CREATE INDEX idx_contracts_employee ON contracts(employee_id);
CREATE INDEX idx_monthly_payrolls_employee_month ON monthly_payrolls(employee_id, month);
CREATE INDEX idx_salary_schemes_position ON salary_schemes(position_id);
CREATE INDEX idx_schedule_assignments_employee ON schedule_assignments(employee_id);
CREATE INDEX idx_schedule_assignments_shift ON schedule_assignments(shift_id);
CREATE INDEX idx_shifts_date ON shifts(shift_date);
CREATE INDEX idx_attendance_logs_card ON attendance_logs(card_uid);
CREATE INDEX idx_attendance_logs_time ON attendance_logs(event_time);
