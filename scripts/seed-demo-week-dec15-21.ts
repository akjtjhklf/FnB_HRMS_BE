/**
 * ============================================================================
 * DEMO SEED SCRIPT - WEEK DEC 15-21, 2025
 * ============================================================================
 * 
 * Script seed data cho demo luận văn tuần 15-21/12/2025
 * 
 * Shift Types:
 *   - Ca sáng: 07:00 - 12:00
 *   - Ca trưa: 12:00 - 18:00 
 *   - Ca chiều: 18:00 - 22:00
 *   - Ca khuya: 22:00 - 07:00 (cross midnight)
 * 
 * Author: Claude
 * Date: 2025-12-14
 * ============================================================================
 */

import 'dotenv/config';
import { directus, ensureAuth, getAuthToken } from '../src/utils/directusClient';
import { createItems, readMe, readItems, deleteItems, readRoles, updateItem } from '@directus/sdk';
import { randomUUID } from 'crypto';

// ============================================================================
// CONFIGURATION
// ============================================================================
const CONFIG = {
    // Tuần demo: 15-21/12/2025
    TARGET_WEEK_START: '2025-12-15', // Thứ 2
    TARGET_WEEK_END: '2025-12-21',   // Chủ nhật
    TARGET_MONTH: '2025-12',

    // Tỷ lệ
    AVAILABILITY_RATE: 0.7,
    ATTENDANCE_RATE: 0.95,
    LATE_RATE: 0.1,
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function formatDateTime(date: string, time: string): string {
    return `${date}T${time}`;
}

function parseLocalDateTime(dateTime: string): Date {
    const [datePart, timePart] = dateTime.split('T');
    const [year, month, day] = datePart.split('-').map(Number);
    const [hour, minute, second] = timePart.split(':').map(Number);
    return new Date(year, month - 1, day, hour, minute, second || 0);
}

function addMinutes(dateTime: string, minutes: number): string {
    const d = parseLocalDateTime(dateTime);
    d.setMinutes(d.getMinutes() + minutes);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const hour = String(d.getHours()).padStart(2, '0');
    const min = String(d.getMinutes()).padStart(2, '0');
    const sec = String(d.getSeconds()).padStart(2, '0');
    return `${year}-${month}-${day}T${hour}:${min}:${sec}`;
}

function getDatesInRange(startDate: string, endDate: string): string[] {
    const dates: string[] = [];
    const current = new Date(startDate);
    const end = new Date(endDate);

    while (current <= end) {
        dates.push(current.toISOString().split('T')[0]);
        current.setDate(current.getDate() + 1);
    }

    return dates;
}

function getNextDay(dateStr: string): string {
    const date = new Date(dateStr);
    date.setDate(date.getDate() + 1);
    return date.toISOString().split('T')[0];
}

// ============================================================================
// SEED DATA DEFINITIONS
// ============================================================================

const POSITIONS_DATA = [
    { name: 'Quản lý', description: 'Quản lý nhà hàng', is_priority: true },
    { name: 'Thu ngân', description: 'Nhân viên thu ngân', is_priority: true },
    { name: 'Phục vụ', description: 'Nhân viên phục vụ bàn', is_priority: false },
    { name: 'Pha chế', description: 'Nhân viên pha chế đồ uống', is_priority: true },
    { name: 'Bếp', description: 'Nhân viên bếp', is_priority: false },
];

// 4 shift types theo yêu cầu
const SHIFT_TYPES_DATA = [
    { name: 'Ca sáng', start_time: '07:00:00', end_time: '12:00:00', cross_midnight: false },
    { name: 'Ca trưa', start_time: '12:00:00', end_time: '18:00:00', cross_midnight: false },
    { name: 'Ca chiều', start_time: '18:00:00', end_time: '22:00:00', cross_midnight: false },
    { name: 'Ca khuya', start_time: '22:00:00', end_time: '07:00:00', cross_midnight: true },
];

const SALARY_SCHEMES_DATA = [
    { name: 'Lương tháng - Quản lý', pay_type: 'monthly', rate: 15000000, overtime_multiplier: 1.5, is_active: true },
    { name: 'Lương giờ - Thu ngân', pay_type: 'hourly', rate: 35000, overtime_multiplier: 1.5, is_active: true },
    { name: 'Lương giờ - Phục vụ', pay_type: 'hourly', rate: 30000, overtime_multiplier: 1.5, is_active: true },
    { name: 'Lương tháng - Pha chế', pay_type: 'monthly', rate: 10000000, overtime_multiplier: 1.5, is_active: true },
    { name: 'Lương giờ - Bếp', pay_type: 'hourly', rate: 40000, overtime_multiplier: 1.5, is_active: true },
];

const EMPLOYEES_DATA = [
    { employee_code: 'NV001', first_name: 'An', last_name: 'Nguyễn Văn', gender: 'male' },
    { employee_code: 'NV002', first_name: 'Bình', last_name: 'Trần Thị', gender: 'female' },
    { employee_code: 'NV003', first_name: 'Minh', last_name: 'Lê Văn', gender: 'male' },
    { employee_code: 'NV004', first_name: 'Hoa', last_name: 'Phạm Thị', gender: 'female' },
    { employee_code: 'NV005', first_name: 'Đức', last_name: 'Hoàng Văn', gender: 'male' },
    { employee_code: 'NV006', first_name: 'Lan', last_name: 'Vũ Thị', gender: 'female' },
    { employee_code: 'NV007', first_name: 'Tuấn', last_name: 'Đỗ Văn', gender: 'male' },
    { employee_code: 'NV008', first_name: 'Mai', last_name: 'Ngô Thị', gender: 'female' },
];

// Yêu cầu vị trí cho mỗi loại ca
const SHIFT_REQUIREMENTS: Record<string, Array<{ positionIndex: number; count: number }>> = {
    'Ca sáng': [
        { positionIndex: 0, count: 1 },  // 1 Quản lý
        { positionIndex: 1, count: 1 },  // 1 Thu ngân
        { positionIndex: 2, count: 1 },  // 1 Phục vụ
        { positionIndex: 3, count: 1 },  // 1 Pha chế
    ],
    'Ca trưa': [
        { positionIndex: 0, count: 1 },  // 1 Quản lý
        { positionIndex: 1, count: 1 },  // 1 Thu ngân
        { positionIndex: 2, count: 2 },  // 2 Phục vụ
        { positionIndex: 3, count: 1 },  // 1 Pha chế
        { positionIndex: 4, count: 1 },  // 1 Bếp
    ],
    'Ca chiều': [
        { positionIndex: 1, count: 1 },  // 1 Thu ngân
        { positionIndex: 2, count: 2 },  // 2 Phục vụ
        { positionIndex: 3, count: 1 },  // 1 Pha chế
        { positionIndex: 4, count: 1 },  // 1 Bếp
    ],
    'Ca khuya': [
        { positionIndex: 1, count: 1 },  // 1 Thu ngân
        { positionIndex: 2, count: 1 },  // 1 Phục vụ
        { positionIndex: 3, count: 1 },  // 1 Pha chế
    ],
};

// ============================================================================
// MAIN SEED FUNCTION
// ============================================================================

async function seedDemo() {
    console.log('🌱 ═══════════════════════════════════════════════════════════════');
    console.log('🌱 DEMO SEED SCRIPT - WEEK DEC 15-21, 2025');
    console.log('🌱 ═══════════════════════════════════════════════════════════════\n');

    console.log(`📅 Target Week: ${CONFIG.TARGET_WEEK_START} → ${CONFIG.TARGET_WEEK_END}`);
    console.log(`📅 Target Month: ${CONFIG.TARGET_MONTH}\n`);

    try {
        await ensureAuth();
        const me = await directus.request(readMe());
        console.log(`✅ Authenticated as: ${me.email}\n`);

        // PHASE 0: Clear old data
        console.log('🗑️  PHASE 0: Clearing old data...');
        await clearOldData();
        console.log('✅ Old data cleared\n');

        // PHASE 1: Master Data
        console.log('📦 PHASE 1: Seeding Master Data...\n');

        console.log('   📍 Creating Positions...');
        const positions = await directus.request(createItems('positions', POSITIONS_DATA));
        console.log(`   ✅ Created ${positions.length} positions`);

        console.log('   ⏰ Creating Shift Types...');
        const shiftTypes = await directus.request(createItems('shift_types', SHIFT_TYPES_DATA));
        console.log(`   ✅ Created ${shiftTypes.length} shift types`);

        console.log('   💰 Creating Salary Schemes...');
        const schemesWithPositions = SALARY_SCHEMES_DATA.map((scheme, idx) => ({
            ...scheme,
            position_id: positions[idx % positions.length].id,
        }));
        const salarySchemes = await directus.request(createItems('salary_schemes', schemesWithPositions));
        console.log(`   ✅ Created ${salarySchemes.length} salary schemes`);

        // PHASE 2: Employee Data
        console.log('\n👥 PHASE 2: Seeding Employee Data...\n');

        console.log('   👤 Getting/Creating Employees...');
        let employees: any[] = await directus.request(readItems('employees', {
            limit: -1,
            fields: ['id', 'employee_code', 'first_name', 'last_name', 'full_name', 'email', 'status'],
            filter: { status: { _eq: 'active' } }
        }));

        if (employees.length < 5) {
            console.log(`   ⚠️ Found only ${employees.length} employees, creating more...`);
            const employeesWithDetails = EMPLOYEES_DATA.map((emp, idx) => ({
                ...emp,
                full_name: `${emp.last_name} ${emp.first_name}`,
                email: `${emp.employee_code.toLowerCase()}@demo.com`,
                phone: `090${String(idx + 1).padStart(7, '0')}`,
                status: 'active',
                hire_date: '2024-01-01',
                position_id: positions[idx % positions.length].id,
                scheme_id: salarySchemes[idx % salarySchemes.length].id,
                default_work_hours_per_week: 40,
                max_hours_per_week: 48,
            }));

            const existingCodes = new Set(employees.map((e: any) => e.employee_code));
            const newEmployees = employeesWithDetails.filter(e => !existingCodes.has(e.employee_code));

            if (newEmployees.length > 0) {
                const created = await directus.request(createItems('employees', newEmployees));
                console.log(`   📊 Created ${created.length} new employees`);
                employees = await directus.request(readItems('employees', {
                    limit: -1,
                    fields: ['id', 'employee_code', 'first_name', 'last_name', 'full_name', 'email', 'status'],
                    filter: { status: { _eq: 'active' } }
                }));
            }
        }
        console.log(`   ✅ Using ${employees.length} employees`);

        // Contracts
        console.log('   📄 Getting/Creating Contracts...');
        const existingContracts: any[] = await directus.request(readItems('contracts', {
            limit: -1,
            fields: ['id', 'employee_id', 'salary_scheme_id', 'is_active'],
            filter: { is_active: { _eq: true } }
        }));

        const employeesWithContract = new Set(existingContracts.map((c: any) => c.employee_id));
        const employeesNeedContract = employees.filter((emp: any) => !employeesWithContract.has(emp.id));

        if (employeesNeedContract.length > 0) {
            const contractsData = employeesNeedContract.map((emp: any, idx: number) => {
                const scheme = salarySchemes[idx % salarySchemes.length];
                return {
                    employee_id: emp.id,
                    contract_type: idx < 5 ? 'full_time' : 'part_time',
                    start_date: '2024-01-01',
                    end_date: '2025-12-31',
                    base_salary: (scheme as any).pay_type === 'monthly' ? (scheme as any).rate : null,
                    salary_scheme_id: scheme.id,
                    is_active: true,
                };
            });
            const newContracts = await directus.request(createItems('contracts', contractsData));
            existingContracts.push(...newContracts);
        }
        const contracts = existingContracts;
        console.log(`   ✅ Using ${contracts.length} contracts`);

        // ========================================================================
        // PHASE 2.5: Create User Accounts for Employees
        // ========================================================================
        console.log('\n🔐 PHASE 2.5: Creating User Accounts for Employees...\n');

        const directusUrl = process.env.DIRECTUS_URL || 'http://localhost:8055';
        const token = await getAuthToken();

        // 2.5.1 Get/Create Employee Role
        console.log('   👔 Getting/Creating Employee Role...');
        let employeeRole: any = null;

        const existingRoles: any[] = await directus.request(readRoles());
        employeeRole = existingRoles.find((r: any) => r.name === 'Employee');

        if (!employeeRole) {
            const roleResponse = await fetch(`${directusUrl}/roles`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    name: 'Employee',
                    icon: 'badge',
                    description: 'Vai trò dành cho nhân viên',
                    app_access: true,
                    admin_access: false,
                }),
            });

            if (roleResponse.ok) {
                const roleData = await roleResponse.json();
                employeeRole = roleData.data;
                console.log(`   ✅ Created Employee role: ${employeeRole.id}`);
            } else {
                console.log(`   ⚠️ Could not create role: ${await roleResponse.text()}`);
            }
        } else {
            console.log(`   ✅ Found existing Employee role: ${employeeRole.id}`);
        }

        // 2.5.2 Create users for employees
        if (employeeRole) {
            console.log('   👥 Creating Directus users for employees...');

            let usersCreated = 0;
            let usersLinked = 0;

            for (const emp of employees) {
                if (!emp.email) continue;

                try {
                    // Check if user exists
                    const userCheckResponse = await fetch(`${directusUrl}/users?filter[email][_eq]=${encodeURIComponent(emp.email)}`, {
                        method: 'GET',
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json',
                        },
                    });

                    const userCheckData = await userCheckResponse.json();

                    if (userCheckData.data && userCheckData.data.length > 0) {
                        // User exists, link to employee if not linked
                        const existingUser = userCheckData.data[0];
                        if (!emp.user_id) {
                            await directus.request(updateItem('employees', emp.id, { user_id: existingUser.id }));
                            usersLinked++;
                        }
                    } else {
                        // Create new user
                        const createUserResponse = await fetch(`${directusUrl}/users`, {
                            method: 'POST',
                            headers: {
                                'Authorization': `Bearer ${token}`,
                                'Content-Type': 'application/json',
                            },
                            body: JSON.stringify({
                                email: emp.email,
                                password: 'Employee123!',
                                first_name: emp.first_name || emp.full_name?.split(' ').pop() || 'Employee',
                                last_name: emp.last_name || emp.full_name?.split(' ').slice(0, -1).join(' ') || '',
                                role: employeeRole.id,
                                status: 'active',
                            }),
                        });

                        if (createUserResponse.ok) {
                            const userData = await createUserResponse.json();
                            await directus.request(updateItem('employees', emp.id, { user_id: userData.data.id }));
                            usersCreated++;
                        }
                    }
                } catch (err: any) {
                    // Skip errors silently
                }
            }

            console.log(`   ✅ Users: ${usersCreated} created, ${usersLinked} linked`);
            console.log(`   🔑 Default password: Employee123!`);
        }

        // PHASE 3: Schedule Data
        console.log('\n📅 PHASE 3: Seeding Schedule Data...\n');

        console.log('   📆 Creating Weekly Schedule...');
        const weeklyScheduleData = [{
            name: `Lịch tuần Demo 15-21/12/2025`,
            week_start: CONFIG.TARGET_WEEK_START,
            week_end: CONFIG.TARGET_WEEK_END,
            status: 'scheduled',
        }];
        const weeklySchedules = await directus.request(createItems('weekly_schedule', weeklyScheduleData));
        const weeklySchedule = weeklySchedules[0];
        console.log(`   ✅ Created weekly schedule: ${weeklySchedule.id}`);

        // Shifts
        console.log('   🔄 Creating Shifts...');
        const dates = getDatesInRange(CONFIG.TARGET_WEEK_START, CONFIG.TARGET_WEEK_END);
        const shiftsData: any[] = [];

        dates.forEach((date) => {
            shiftTypes.forEach((shiftType: any) => {
                const isOvernight = shiftType.cross_midnight;
                const totalRequired = shiftType.name === 'Ca trưa' ? 6 :
                    shiftType.name === 'Ca sáng' ? 4 :
                        shiftType.name === 'Ca chiều' ? 5 : 3;
                shiftsData.push({
                    schedule_id: weeklySchedule.id,
                    shift_type_id: shiftType.id,
                    shift_date: date,
                    start_at: formatDateTime(date, shiftType.start_time),
                    end_at: isOvernight
                        ? formatDateTime(getNextDay(date), shiftType.end_time)
                        : formatDateTime(date, shiftType.end_time),
                    total_required: totalRequired,
                });
            });
        });

        const shifts = await directus.request(createItems('shifts', shiftsData));
        console.log(`   ✅ Created ${shifts.length} shifts`);

        // Shift Position Requirements
        console.log('   👔 Creating Shift Position Requirements...');
        const shiftPosReqData: any[] = [];

        shifts.forEach((shift: any) => {
            const shiftType = shiftTypes.find((st: any) => st.id === shift.shift_type_id);
            const requirements = SHIFT_REQUIREMENTS[(shiftType as any).name] || [];

            requirements.forEach((req) => {
                shiftPosReqData.push({
                    shift_id: shift.id,
                    position_id: positions[req.positionIndex].id,
                    required_count: req.count,
                });
            });
        });

        const shiftPosReqs = await directus.request(createItems('shift_position_requirements', shiftPosReqData));
        console.log(`   ✅ Created ${shiftPosReqs.length} shift position requirements`);

        // Employee Availability
        console.log('   📌 Creating Employee Availabilities...');
        const freshEmployees: any[] = await directus.request(readItems('employees', {
            limit: -1,
            fields: ['id', 'employee_code', 'status'],
            filter: { status: { _eq: 'active' } }
        }));

        const availabilityData: any[] = [];
        freshEmployees.forEach((emp: any, empIndex: number) => {
            shifts.forEach((shift: any, shiftIndex: number) => {
                const combinedIndex = empIndex * 100 + shiftIndex;
                const isAvailable = (combinedIndex % 10) < 7; // 70% available

                if (isAvailable) {
                    availabilityData.push({
                        employee_id: emp.id,
                        shift_id: shift.id,
                        status: 'available',
                    });
                }
            });
        });

        const validAvailabilityData = availabilityData.filter(a => a.employee_id && a.shift_id);

        const availabilities: any[] = [];
        for (const item of validAvailabilityData) {
            try {
                const created = await directus.request(createItems('employee_availability', [item]));
                availabilities.push(...created);
            } catch (err: any) {
                // Skip duplicates
            }
        }
        console.log(`   ✅ Created ${availabilities.length} employee availabilities`);

        // Employee Availability Positions
        console.log('   🎯 Creating Employee Availability Positions...');
        const availPosData: any[] = [];

        availabilities.forEach((avail: any, idx: number) => {
            const numPositions = (idx % 3 === 0) ? 2 : 1;
            for (let i = 0; i < numPositions; i++) {
                availPosData.push({
                    availability_id: avail.id,
                    position_id: positions[(idx + i) % positions.length].id,
                    preference_order: i + 1,
                });
            }
        });

        const availPositions = await directus.request(createItems('employee_availability_positions', availPosData));
        console.log(`   ✅ Created ${availPositions.length} employee availability positions`);

        // PHASE 4: Schedule Assignments
        console.log('\n🤖 PHASE 4: Creating Schedule Assignments...\n');

        const assignmentsData: any[] = [];
        const assignedEmployeeShifts = new Set<string>();

        shifts.forEach((shift: any) => {
            const requirements = shiftPosReqs.filter((req: any) => req.shift_id === shift.id);

            requirements.forEach((req: any) => {
                const eligibleAvailabilities = availabilities.filter((avail: any) => {
                    if (avail.shift_id !== shift.id) return false;
                    const key = `${avail.employee_id}-${shift.id}`;
                    if (assignedEmployeeShifts.has(key)) return false;

                    const hasPosition = availPositions.some(
                        (ap: any) => ap.availability_id === avail.id && ap.position_id === req.position_id
                    );
                    return hasPosition;
                });

                const toAssign = eligibleAvailabilities.slice(0, req.required_count);
                toAssign.forEach((avail: any) => {
                    const key = `${avail.employee_id}-${shift.id}`;
                    assignedEmployeeShifts.add(key);

                    assignmentsData.push({
                        schedule_id: weeklySchedule.id,
                        shift_id: shift.id,
                        employee_id: avail.employee_id,
                        position_id: req.position_id,
                        status: 'assigned',
                        source: 'auto',
                        assigned_at: new Date().toISOString(),
                        confirmed_by_employee: true,
                    });
                });
            });
        });

        const assignments = await directus.request(createItems('schedule_assignments', assignmentsData));
        console.log(`   ✅ Created ${assignments.length} schedule assignments`);

        // PHASE 5: Attendance Data (chỉ cho ngày 15/12 vì các ngày khác là tương lai)
        console.log('\n📝 PHASE 5: Seeding Attendance Data...\n');

        const attendanceLogsData: any[] = [];
        const attendanceShiftsData: any[] = [];
        const todayStr = '2025-12-14'; // Giả sử hôm nay là 14/12, chỉ có ngày 15 trở đi là demo

        // Tạo attendance cho ngày 15/12 (past data cho demo)
        assignments.forEach((assignment: any, assignmentIndex: number) => {
            const shift = shifts.find((s: any) => s.id === assignment.shift_id);
            if (!shift) return;

            const shiftDate = (shift as any).shift_date;
            if (shiftDate !== '2025-12-15') return; // Chỉ tạo cho ngày 15

            const shiftType = shiftTypes.find((st: any) => st.id === (shift as any).shift_type_id);
            if (!shiftType) return;

            const startTime = (shiftType as any).start_time;
            const [startHour] = startTime.split(':').map(Number);

            const isLate = (assignmentIndex % 10 === 0);
            const lateMinutes = isLate ? 5 + (assignmentIndex % 20) : ((assignmentIndex % 11) - 5);

            const checkInDateTime = formatDateTime(shiftDate, startTime);
            const actualCheckIn = addMinutes(checkInDateTime, lateMinutes);

            // Ca sáng 5h, ca trưa 6h, ca chiều 4h, ca khuya 9h
            const shiftDuration = (shiftType as any).name === 'Ca sáng' ? 5 :
                (shiftType as any).name === 'Ca trưa' ? 6 :
                    (shiftType as any).name === 'Ca chiều' ? 4 : 9;
            const checkoutVariation = (assignmentIndex % 15) - 5;
            const actualCheckOut = addMinutes(actualCheckIn, shiftDuration * 60 + checkoutVariation);

            attendanceLogsData.push({
                card_uid: `CARD-${assignment.employee_id.slice(0, 8)}`,
                employee_id: assignment.employee_id,
                event_type: 'clock_in',
                event_time: actualCheckIn,
                processed: true,
            });

            attendanceLogsData.push({
                card_uid: `CARD-${assignment.employee_id.slice(0, 8)}`,
                employee_id: assignment.employee_id,
                event_type: 'clock_out',
                event_time: actualCheckOut,
                processed: true,
            });

            const inTime = parseLocalDateTime(actualCheckIn);
            const outTime = parseLocalDateTime(actualCheckOut);
            const workedMinutes = Math.round((outTime.getTime() - inTime.getTime()) / (1000 * 60));

            attendanceShiftsData.push({
                employee_id: assignment.employee_id,
                shift_id: shift.id,
                schedule_assignment_id: assignment.id,
                clock_in: actualCheckIn,
                clock_out: actualCheckOut,
                worked_minutes: workedMinutes,
                late_minutes: Math.max(0, lateMinutes),
                early_leave_minutes: Math.max(0, -checkoutVariation),
                status: 'present',
                manual_adjusted: false,
            });
        });

        if (attendanceLogsData.length > 0) {
            const attendanceLogs = await directus.request(createItems('attendance_logs', attendanceLogsData));
            console.log(`   ✅ Created ${attendanceLogs.length} attendance logs`);

            const attendanceShifts = await directus.request(createItems('attendance_shifts', attendanceShiftsData));
            console.log(`   ✅ Created ${attendanceShifts.length} attendance shifts`);
        }

        // PHASE 6: Payroll Data
        console.log('\n💵 PHASE 6: Seeding Payroll Data...\n');

        const payrollsData: any[] = [];

        employees.forEach((emp: any, idx: number) => {
            const contract = contracts.find((c: any) => c.employee_id === emp.id);
            if (!contract) return;

            const scheme = salarySchemes.find((s: any) => s.id === (contract as any).salary_scheme_id);
            if (!scheme) return;

            const schemeRate = Number((scheme as any).rate);
            const workDays = 15 + (idx % 5); // 15-19 ngày làm
            const workHours = workDays * 8;
            const lateMinutes = (idx % 3) * 15; // 0, 15, 30 phút

            let baseSalary: number;
            if ((scheme as any).pay_type === 'monthly') {
                baseSalary = Math.round(schemeRate * (workDays / 22));
            } else {
                baseSalary = Math.round(schemeRate * workHours);
            }

            const allowances = 500000;
            const bonuses = workDays >= 17 ? 200000 : 0;
            const overtimePay = 0;
            const deductions = Math.round(baseSalary * 0.105);
            const penalties = Math.floor(lateMinutes / 10) * 10000;

            const grossSalary = baseSalary + allowances + bonuses + overtimePay;
            const netSalary = grossSalary - deductions - penalties;

            const statuses = ['draft', 'pending_approval', 'approved', 'pending_approval'];

            payrollsData.push({
                id: randomUUID(),
                employee_id: emp.id,
                contract_id: contract.id,
                month: CONFIG.TARGET_MONTH,
                salary_scheme_id: scheme.id,
                base_salary: baseSalary,
                pay_type: (scheme as any).pay_type,
                allowances,
                bonuses,
                overtime_pay: overtimePay,
                deductions,
                penalties,
                gross_salary: grossSalary,
                net_salary: netSalary,
                total_work_days: workDays,
                total_work_hours: workHours,
                total_late_minutes: lateMinutes,
                absent_days: 22 - workDays,
                status: statuses[idx % statuses.length],
            });
        });

        const payrolls = await directus.request(createItems('monthly_payrolls', payrollsData));
        console.log(`   ✅ Created ${payrolls.length} monthly payrolls`);

        // SUMMARY
        console.log('\n═══════════════════════════════════════════════════════════════');
        console.log('                      SEED COMPLETE!                           ');
        console.log('═══════════════════════════════════════════════════════════════');
        console.log(`
    📍 Positions:                        ${positions.length}
    ⏰ Shift Types:                      ${shiftTypes.length}
    💰 Salary Schemes:                   ${salarySchemes.length}
    👥 Employees:                        ${employees.length}
    📄 Contracts:                        ${contracts.length}
    📆 Weekly Schedules:                 ${weeklySchedules.length}
    🔄 Shifts:                           ${shifts.length}
    👔 Shift Position Requirements:      ${shiftPosReqs.length}
    📌 Employee Availabilities:          ${availabilities.length}
    📋 Schedule Assignments:             ${assignments.length}
    💵 Monthly Payrolls:                 ${payrolls.length}
    `);
        console.log('═══════════════════════════════════════════════════════════════\n');

    } catch (error) {
        console.error('❌ Seed failed:', error);
        throw error;
    }
}

// ============================================================================
// HELPER: Clear old data
// ============================================================================
async function clearOldData() {
    console.log('🧹 Clearing old seed data...\n');

    const collections = [
        'monthly_payrolls',
        'attendance_shifts',
        'attendance_logs',
        'schedule_assignments',
        'employee_availability_positions',
        'employee_availability',
        'shift_position_requirements',
        'shifts',
        'weekly_schedule',
        'salary_schemes',
        'shift_types',
        'positions',
    ];

    for (const collection of collections) {
        try {
            const items: any = await directus.request(readItems(collection, { limit: -1, fields: ['id'] }));
            if (items && items.length > 0) {
                const ids = items.map((item: any) => item.id);
                await directus.request(deleteItems(collection, ids));
                console.log(`   🗑️  Cleared ${ids.length} records from ${collection}`);
            }
        } catch (error: any) {
            console.log(`   ⚠️  Could not clear ${collection}: ${error.message?.slice(0, 50)}`);
        }
    }

    console.log('\n✅ Old data cleared!\n');
}

// ============================================================================
// RUN
// ============================================================================
seedDemo().catch((e) => {
    console.error('Fatal error:', e);
    process.exit(1);
});
