-- EMPLOYEES
CREATE TABLE employees (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    user_id CHAR(36) UNIQUE,
    employee_code VARCHAR(30) NOT NULL UNIQUE,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    full_name VARCHAR(255),
    dob DATE,
    gender ENUM('male','female','other'),
    personal_id VARCHAR(50),
    phone VARCHAR(20),
    email VARCHAR(255),
    address TEXT,
    hire_date DATE,
    termination_date DATE,
    status ENUM('active','on_leave','suspended','terminated') DEFAULT 'active',
    scheme_id CHAR(36),
    default_work_hours_per_week DECIMAL(5,2),
    max_hours_per_week DECIMAL(5,2),
    max_consecutive_days INT,
    min_rest_hours_between_shifts INT,
    photo_url VARCHAR(512),
    emergency_contact_name VARCHAR(100),
    emergency_contact_phone VARCHAR(20),
    notes TEXT,
    metadata JSON,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at DATETIME,
    FOREIGN KEY (user_id) REFERENCES directus_users(id),
    FOREIGN KEY (scheme_id) REFERENCES salary_schemes(id)
);

-- POSITIONS
CREATE TABLE positions (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- SALARY SCHEMES
CREATE TABLE salary_schemes (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    name VARCHAR(100) NOT NULL,
    position_id CHAR(36),
    pay_type ENUM('hourly','fixed_shift','monthly') DEFAULT 'hourly',
    rate DECIMAL(10,2) NOT NULL,
    min_hours DECIMAL(5,2),
    overtime_multiplier DECIMAL(4,2) DEFAULT 1.5,
    effective_from DATE,
    effective_to DATE,
    is_active TINYINT(1) DEFAULT 1,
    notes TEXT,
    metadata JSON,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (position_id) REFERENCES positions(id)
);

-- SALARY REQUESTS
CREATE TABLE salary_requests (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    employee_id CHAR(36) NOT NULL,
    current_scheme_id CHAR(36),
    proposed_scheme_id CHAR(36),
    current_rate DECIMAL(10,2),
    proposed_rate DECIMAL(10,2),
    request_date DATETIME NOT NULL,
    status ENUM('pending','approved','rejected') DEFAULT 'pending',
    approved_by CHAR(36),
    approved_at DATETIME,
    note TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (employee_id) REFERENCES employees(id)
);

-- CONTRACTS
CREATE TABLE contracts (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    employee_id CHAR(36) NOT NULL,
    contract_type ENUM('full_time','part_time','casual','probation'),
    start_date DATE,
    end_date DATE,
    base_salary DECIMAL(12,2),
    probation_end_date DATE,
    signed_doc_url VARCHAR(512),
    is_active TINYINT(1) DEFAULT 1,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (employee_id) REFERENCES employees(id)
);

-- DEDUCTIONS
CREATE TABLE deductions (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    employee_id CHAR(36) NOT NULL,
    type ENUM('advance','penalty','expense'),
    amount DECIMAL(10,2),
    currency VARCHAR(10) DEFAULT 'VND',
    related_shift_id CHAR(36),
    note TEXT,
    status ENUM('pending','applied','reimbursed') DEFAULT 'pending',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (employee_id) REFERENCES employees(id)
);

-- RFID CARDS
CREATE TABLE rfid_cards (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    employee_id CHAR(36),
    card_uid VARCHAR(128) NOT NULL UNIQUE,
    issued_at DATETIME,
    revoked_at DATETIME,
    status ENUM('active','suspended','lost','revoked') DEFAULT 'active',
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (employee_id) REFERENCES employees(id)
);

-- DEVICES
CREATE TABLE devices (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    name VARCHAR(255) NOT NULL,
    location VARCHAR(255),
    device_key VARCHAR(255) UNIQUE NOT NULL,
    ip_address VARCHAR(45),
    mac_address VARCHAR(50),
    firmware_version VARCHAR(50),
    last_seen_at DATETIME,
    status ENUM('online','offline','decommissioned') DEFAULT 'online',
    current_mode ENUM('attendance','enroll') DEFAULT 'attendance',
    employee_id_pending CHAR(36) NULL,
    metadata JSON,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (employee_id_pending) REFERENCES employees(id)
);

-- ATTENDANCE LOGS
CREATE TABLE attendance_logs (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    card_uid VARCHAR(128) NOT NULL,
    rfid_card_id CHAR(36),
    employee_id CHAR(36),
    device_id CHAR(36),
    event_type ENUM('tap','clock_in','clock_out') DEFAULT 'tap',
    event_time DATETIME NOT NULL,
    raw_payload TEXT,
    processed TINYINT(1) DEFAULT 0,
    match_attempted_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (rfid_card_id) REFERENCES rfid_cards(id),
    FOREIGN KEY (employee_id) REFERENCES employees(id),
    FOREIGN KEY (device_id) REFERENCES devices(id)
);

-- ATTENDANCE SHIFTS
CREATE TABLE attendance_shifts (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    shift_id CHAR(36),
    schedule_assignment_id CHAR(36),
    employee_id CHAR(36) NOT NULL,
    clock_in DATETIME,
    clock_out DATETIME,
    worked_minutes INT,
    late_minutes INT DEFAULT 0,
    early_leave_minutes INT DEFAULT 0,
    status ENUM('present','absent','partial') DEFAULT 'present',
    manual_adjusted TINYINT(1) DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (employee_id) REFERENCES employees(id)
);

-- ATTENDANCE ADJUSTMENTS
CREATE TABLE attendance_adjustments (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    attendance_shift_id CHAR(36) NOT NULL,
    requested_by CHAR(36),
    requested_at DATETIME,
    old_value JSON,
    proposed_value JSON,
    approved_by CHAR(36),
    approved_at DATETIME,
    status ENUM('pending','approved','rejected') DEFAULT 'pending',
    reason TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (attendance_shift_id) REFERENCES attendance_shifts(id)
);

-- SHIFT TYPES
CREATE TABLE shift_types (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    name VARCHAR(100) NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    cross_midnight TINYINT(1) DEFAULT 0,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- WEEKLY SCHEDULE
CREATE TABLE weekly_schedule (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    week_start DATE NOT NULL,
    week_end DATE NOT NULL,
    created_by CHAR(36),
    status ENUM('draft','scheduled','finalized','cancelled') DEFAULT 'draft',
    published_at DATETIME,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uq_week_start (week_start)
);

-- SHIFTS
CREATE TABLE shifts (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    schedule_id CHAR(36),
    shift_type_id CHAR(36) NOT NULL,
    shift_date DATE NOT NULL,
    start_at DATETIME,
    end_at DATETIME,
    total_required INT DEFAULT 0,
    notes TEXT,
    metadata JSON,
    created_by CHAR(36),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (shift_type_id) REFERENCES shift_types(id),
    FOREIGN KEY (schedule_id) REFERENCES weekly_schedule(id)
);

-- SHIFT POSITION REQUIREMENTS
CREATE TABLE shift_position_requirements (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    shift_id CHAR(36) NOT NULL,
    position_id CHAR(36) NOT NULL,
    required_count INT NOT NULL,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (shift_id) REFERENCES shifts(id),
    FOREIGN KEY (position_id) REFERENCES positions(id)
);

-- EMPLOYEE AVAILABILITY
CREATE TABLE employee_availability (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    employee_id CHAR(36) NOT NULL,
    shift_id CHAR(36) NOT NULL,
    priority INT DEFAULT 5,
    expires_at DATETIME,
    note TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uq_emp_shift (employee_id, shift_id),
    FOREIGN KEY (employee_id) REFERENCES employees(id),
    FOREIGN KEY (shift_id) REFERENCES shifts(id)
);

-- EMPLOYEE AVAILABILITY POSITIONS
CREATE TABLE employee_availability_positions (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    availability_id CHAR(36) NOT NULL,
    position_id CHAR(36) NOT NULL,
    preference_order INT,
    FOREIGN KEY (availability_id) REFERENCES employee_availability(id),
    FOREIGN KEY (position_id) REFERENCES positions(id)
);

-- SCHEDULE ASSIGNMENTS
CREATE TABLE schedule_assignments (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    schedule_id CHAR(36),
    shift_id CHAR(36) NOT NULL,
    employee_id CHAR(36) NOT NULL,
    position_id CHAR(36) NOT NULL,
    assigned_by CHAR(36),
    assigned_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    status ENUM('assigned','tentative','swapped','cancelled') DEFAULT 'assigned',
    source ENUM('auto','manual') DEFAULT 'auto',
    note TEXT,
    confirmed_by_employee TINYINT(1) DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uq_shift_employee (shift_id, employee_id),
    FOREIGN KEY (shift_id) REFERENCES shifts(id),
    FOREIGN KEY (employee_id) REFERENCES employees(id),
    FOREIGN KEY (position_id) REFERENCES positions(id)
);

-- SCHEDULE CHANGE REQUESTS
CREATE TABLE schedule_change_requests (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    requester_id CHAR(36) NOT NULL,
    type ENUM('shift_swap','pass_shift','day_off') NOT NULL,
    from_shift_id CHAR(36),
    to_shift_id CHAR(36),
    target_employee_id CHAR(36),
    replacement_employee_id CHAR(36),
    reason TEXT,
    status ENUM('pending','approved','rejected','cancelled') DEFAULT 'pending',
    approved_by CHAR(36),
    approved_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (requester_id) REFERENCES employees(id)
);

-- MONTHLY EMPLOYEE STATS
CREATE TABLE monthly_employee_stats (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    employee_id CHAR(36) NOT NULL,
    month CHAR(7) NOT NULL,
    total_shifts_assigned INT DEFAULT 0,
    total_shifts_worked INT DEFAULT 0,
    swaps_count INT DEFAULT 0,
    pass_count INT DEFAULT 0,
    off_count INT DEFAULT 0,
    total_worked_minutes INT DEFAULT 0,
    overtime_minutes INT DEFAULT 0,
    late_minutes INT DEFAULT 0,
    absent_count INT DEFAULT 0,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (employee_id) REFERENCES employees(id),
    UNIQUE KEY uq_emp_month (employee_id, month)
);
