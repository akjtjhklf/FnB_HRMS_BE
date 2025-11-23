-- Insert sample payroll data for November 2025
-- This will be executed after employees and salary_schemes are seeded

INSERT INTO monthly_payrolls (id, employee_id, month, salary_scheme_id, base_salary, allowances, bonuses, overtime_pay, deductions, penalties, gross_salary, net_salary, total_work_hours, overtime_hours, late_minutes, absent_days, notes, status) 
SELECT 
    UUID() as id,
    e.id as employee_id,
    '2025-11' as month,
    e.scheme_id as salary_scheme_id,
    CASE 
        WHEN ss.pay_type = 'monthly' THEN ss.rate
        ELSE ss.rate * 160 
    END as base_salary,
    FLOOR(500000 + RAND() * 1000000) as allowances,
    CASE WHEN RAND() > 0.5 THEN FLOOR(RAND() * 2000000) ELSE 0 END as bonuses,
    FLOOR(RAND() * 500000) as overtime_pay,
    FLOOR(RAND() * 300000) as deductions,
    CASE WHEN RAND() > 0.7 THEN FLOOR(RAND() * 200000) ELSE 0 END as penalties,
    0 as gross_salary, -- Will be calculated
    0 as net_salary,   -- Will be calculated
    160 + FLOOR(RAND() * 20) as total_work_hours,
    FLOOR(RAND() * 10) as overtime_hours,
    FLOOR(RAND() * 120) as late_minutes,
    FLOOR(RAND() * 3) as absent_days,
    CASE WHEN (ROW_NUMBER() OVER (ORDER BY e.id)) % 3 = 0 THEN 'Nhân viên xuất sắc tháng này' ELSE NULL END as notes,
    CASE (ROW_NUMBER() OVER (ORDER BY e.id)) % 4
        WHEN 0 THEN 'draft'
        WHEN 1 THEN 'pending_approval'
        WHEN 2 THEN 'approved'
        ELSE 'paid'
    END as status
FROM employees e
JOIN salary_schemes ss ON e.scheme_id = ss.id
LIMIT 15;

-- Update gross_salary and net_salary with calculated values
UPDATE monthly_payrolls 
SET 
    gross_salary = base_salary + allowances + bonuses + overtime_pay,
    net_salary = base_salary + allowances + bonuses + overtime_pay - deductions - penalties
WHERE month = '2025-11';
