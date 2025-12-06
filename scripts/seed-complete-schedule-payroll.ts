/**
 * ============================================================================
 * COMPLETE SCHEDULE & PAYROLL SEED SCRIPT
 * ============================================================================
 * 
 * Script này seed data theo luồng logic:
 * 
 * 1. MASTER DATA (Không phụ thuộc):
 *    - Positions (Vị trí)
 *    - Shift Types (Loại ca)
 *    - Salary Schemes (Chế độ lương)
 * 
 * 2. EMPLOYEE DATA:
 *    - Employees (Nhân viên) → link với position_id, scheme_id
 *    - Contracts (Hợp đồng) → link với employee_id, salary_scheme_id
 * 
 * 3. SCHEDULE DATA (Theo thứ tự phụ thuộc):
 *    - Weekly Schedule (Lịch tuần)
 *    - Shifts (Ca làm) → link với schedule_id, shift_type_id
 *    - Shift Position Requirements (Yêu cầu vị trí) → link với shift_id, position_id
 *    - Employee Availability (Đăng ký ca) → link với employee_id, shift_id
 *    - Employee Availability Positions → link với availability_id, position_id
 * 
 * 4. AUTO SCHEDULE:
 *    - Gọi service xếp lịch tự động
 *    - Tạo Schedule Assignments
 * 
 * 5. ATTENDANCE DATA:
 *    - Attendance Logs (Chấm công) → dựa trên assignments
 * 
 * 6. PAYROLL DATA:
 *    - Monthly Payrolls (Bảng lương) → tính từ contracts + attendance
 * 
 * Author: Senior Backend Developer
 * Date: 2025-12-06
 * ============================================================================
 */

import 'dotenv/config';
import { directus, ensureAuth } from '../src/utils/directusClient';
import { createItems, readMe, readItems, deleteItems } from '@directus/sdk';
import { randomUUID } from 'crypto';

// ============================================================================
// CONFIGURATION
// ============================================================================
const CONFIG = {
  // Tuần cần seed (dùng ngày bắt đầu tuần - Thứ 2)
  TARGET_WEEK_START: '2025-12-02', // Thứ 2
  TARGET_WEEK_END: '2025-12-08',   // Chủ nhật
  TARGET_MONTH: '2025-12',
  
  // Số lượng records
  NUM_POSITIONS: 6,
  NUM_SHIFT_TYPES: 4,
  NUM_EMPLOYEES: 12,
  SHIFTS_PER_DAY: 3, // Sáng, chiều, tối
  
  // Tỷ lệ
  AVAILABILITY_RATE: 0.7, // 70% nhân viên đăng ký mỗi ca
  ATTENDANCE_RATE: 0.95,  // 95% có chấm công
  LATE_RATE: 0.1,         // 10% đi trễ
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function getRandomElement<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function getRandomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function formatTime(hours: number, minutes: number = 0): string {
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:00`;
}

function formatDateTime(date: string, time: string): string {
  return `${date}T${time}`;
}

function addMinutes(dateTime: string, minutes: number): string {
  const d = new Date(dateTime);
  d.setMinutes(d.getMinutes() + minutes);
  return d.toISOString().replace('Z', '').split('.')[0];
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

// ============================================================================
// SEED DATA DEFINITIONS
// ============================================================================

const POSITIONS_DATA = [
  { name: 'Barista', description: 'Pha chế đồ uống', is_priority: true },
  { name: 'Thu ngân', description: 'Quản lý thanh toán', is_priority: false },
  { name: 'Phục vụ', description: 'Phục vụ bàn', is_priority: false },
  { name: 'Bếp trưởng', description: 'Quản lý bếp', is_priority: true },
  { name: 'Phụ bếp', description: 'Hỗ trợ nấu nướng', is_priority: false },
  { name: 'Quản lý ca', description: 'Giám sát ca làm việc', is_priority: true },
];

const SHIFT_TYPES_DATA = [
  { name: 'Ca sáng', start_time: '07:00:00', end_time: '12:00:00', cross_midnight: false },
  { name: 'Ca trưa', start_time: '12:00:00', end_time: '18:00:00', cross_midnight: false },
  { name: 'Ca chiều', start_time: '18:00:00', end_time: '22:00:00', cross_midnight: false },
  { name: 'Ca tối', start_time: '22:00:00', end_time: '07:00:00', cross_midnight: true },
];

const SALARY_SCHEMES_DATA = [
  // Hourly schemes
  { name: 'Lương giờ - Barista', pay_type: 'hourly', rate: 50000, overtime_multiplier: 1.5, is_active: true },
  { name: 'Lương giờ - Thu ngân', pay_type: 'hourly', rate: 45000, overtime_multiplier: 1.5, is_active: true },
  { name: 'Lương giờ - Phục vụ', pay_type: 'hourly', rate: 40000, overtime_multiplier: 1.5, is_active: true },
  { name: 'Lương giờ - Phụ bếp', pay_type: 'hourly', rate: 48000, overtime_multiplier: 1.5, is_active: true },
  // Monthly schemes  
  { name: 'Lương tháng - Bếp trưởng', pay_type: 'monthly', rate: 15000000, is_active: true },
  { name: 'Lương tháng - Quản lý ca', pay_type: 'monthly', rate: 12000000, is_active: true },
];

const EMPLOYEES_DATA = [
  { employee_code: 'NV001', first_name: 'Nguyễn', last_name: 'Văn An', gender: 'male' },
  { employee_code: 'NV002', first_name: 'Trần', last_name: 'Thị Bình', gender: 'female' },
  { employee_code: 'NV003', first_name: 'Lê', last_name: 'Văn Cường', gender: 'male' },
  { employee_code: 'NV004', first_name: 'Phạm', last_name: 'Thị Dung', gender: 'female' },
  { employee_code: 'NV005', first_name: 'Hoàng', last_name: 'Văn Em', gender: 'male' },
  { employee_code: 'NV006', first_name: 'Vũ', last_name: 'Thị Phương', gender: 'female' },
  { employee_code: 'NV007', first_name: 'Đặng', last_name: 'Văn Giang', gender: 'male' },
  { employee_code: 'NV008', first_name: 'Bùi', last_name: 'Thị Hoa', gender: 'female' },
  { employee_code: 'NV009', first_name: 'Đỗ', last_name: 'Văn Khôi', gender: 'male' },
  { employee_code: 'NV010', first_name: 'Ngô', last_name: 'Thị Lan', gender: 'female' },
  { employee_code: 'NV011', first_name: 'Dương', last_name: 'Văn Minh', gender: 'male' },
  { employee_code: 'NV012', first_name: 'Lý', last_name: 'Thị Ngọc', gender: 'female' },
];

// Yêu cầu vị trí cho mỗi ca (position index -> số lượng cần)
const SHIFT_REQUIREMENTS = {
  'Ca sáng': [
    { positionIndex: 0, count: 2 },  // 2 Barista
    { positionIndex: 1, count: 1 },  // 1 Thu ngân
    { positionIndex: 2, count: 2 },  // 2 Phục vụ
    { positionIndex: 4, count: 1 },  // 1 Phụ bếp
  ],
  'Ca trưa': [
    { positionIndex: 0, count: 2 },  // 2 Barista
    { positionIndex: 1, count: 1 },  // 1 Thu ngân
    { positionIndex: 2, count: 3 },  // 3 Phục vụ
    { positionIndex: 3, count: 1 },  // 1 Bếp trưởng
    { positionIndex: 4, count: 2 },  // 2 Phụ bếp
  ],
  'Ca chiều': [
    { positionIndex: 0, count: 2 },  // 2 Barista
    { positionIndex: 1, count: 1 },  // 1 Thu ngân
    { positionIndex: 2, count: 2 },  // 2 Phục vụ
    { positionIndex: 4, count: 1 },  // 1 Phụ bếp
  ],
  'Ca tối': [
    { positionIndex: 0, count: 1 },  // 1 Barista
    { positionIndex: 1, count: 1 },  // 1 Thu ngân
    { positionIndex: 2, count: 1 },  // 1 Phục vụ
    { positionIndex: 5, count: 1 },  // 1 Quản lý ca
  ],
};

// ============================================================================
// MAIN SEED FUNCTION
// ============================================================================

async function seedComplete() {
  console.log('🌱 ═══════════════════════════════════════════════════════════════');
  console.log('🌱 COMPLETE SCHEDULE & PAYROLL SEED SCRIPT');
  console.log('🌱 ═══════════════════════════════════════════════════════════════\n');
  
  console.log(`📅 Target Week: ${CONFIG.TARGET_WEEK_START} → ${CONFIG.TARGET_WEEK_END}`);
  console.log(`📅 Target Month: ${CONFIG.TARGET_MONTH}\n`);

  try {
    // Login
    await ensureAuth();
    const me = await directus.request(readMe());
    console.log(`✅ Authenticated as: ${me.email}\n`);

    // ========================================================================
    // PHASE 0: CLEAR OLD DATA (Optional - comment out if not needed)
    // ========================================================================
    console.log('🗑️  PHASE 0: Clearing old data...');
    await clearOldData();
    console.log('✅ Old data cleared\n');

    // ========================================================================
    // PHASE 1: SEED MASTER DATA
    // ========================================================================
    console.log('📦 PHASE 1: Seeding Master Data...\n');
    
    // 1.1 Positions
    console.log('   📍 Creating Positions...');
    const positions = await directus.request(createItems('positions', POSITIONS_DATA));
    console.log(`   ✅ Created ${positions.length} positions`);
    
    // 1.2 Shift Types
    console.log('   ⏰ Creating Shift Types...');
    const shiftTypes = await directus.request(createItems('shift_types', SHIFT_TYPES_DATA));
    console.log(`   ✅ Created ${shiftTypes.length} shift types`);
    
    // 1.3 Salary Schemes (link to positions)
    console.log('   💰 Creating Salary Schemes...');
    const schemesWithPositions = SALARY_SCHEMES_DATA.map((scheme, idx) => ({
      ...scheme,
      position_id: positions[idx % positions.length].id,
    }));
    const salarySchemes = await directus.request(createItems('salary_schemes', schemesWithPositions));
    console.log(`   ✅ Created ${salarySchemes.length} salary schemes`);

    // ========================================================================
    // PHASE 2: SEED EMPLOYEE DATA
    // ========================================================================
    console.log('\n👥 PHASE 2: Seeding Employee Data...\n');
    
    // 2.1 Employees - Lấy employees có sẵn hoặc tạo mới
    console.log('   👤 Getting/Creating Employees...');
    
    // Lấy employees hiện có
    let employees: any[] = await directus.request(readItems('employees', { 
      limit: -1, 
      fields: ['id', 'employee_code', 'first_name', 'last_name', 'full_name', 'email', 'status'],
      filter: { status: { _eq: 'active' } }
    }));
    
    if (employees.length < 5) {
      // Nếu ít hơn 5 employees, tạo thêm
      console.log(`   ⚠️ Found only ${employees.length} employees, creating more...`);
      const employeesWithDetails = EMPLOYEES_DATA.map((emp, idx) => ({
        ...emp,
        full_name: `${emp.first_name} ${emp.last_name}`,
        email: `${emp.employee_code.toLowerCase()}@company.com`,
        phone: `090${String(idx + 1).padStart(7, '0')}`,
        status: 'active',
        hire_date: '2024-01-01',
        position_id: positions[idx % positions.length].id,
        scheme_id: salarySchemes[idx % salarySchemes.length].id,
        default_work_hours_per_week: 40,
        max_hours_per_week: 48,
      }));
      
      // Chỉ tạo những employee chưa tồn tại (theo employee_code)
      const existingCodes = new Set(employees.map((e: any) => e.employee_code));
      const newEmployees = employeesWithDetails.filter(e => !existingCodes.has(e.employee_code));
      
      if (newEmployees.length > 0) {
        const created = await directus.request(createItems('employees', newEmployees));
        employees = [...employees, ...created];
      }
    }
    
    console.log(`   ✅ Using ${employees.length} employees`);
    
    // 2.2 Contracts - Kiểm tra và tạo contracts cho employees chưa có
    console.log('   📄 Getting/Creating Contracts...');
    
    // Lấy contracts hiện có
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
          contract_type: idx < 8 ? 'full_time' : 'part_time',
          start_date: '2024-01-01',
          end_date: '2025-12-31',
          base_salary: (scheme as any).pay_type === 'monthly' ? (scheme as any).rate : null,
          salary_scheme_id: scheme.id,
          is_active: true,
          notes: `Hợp đồng ${idx < 8 ? 'toàn thời gian' : 'bán thời gian'}`,
        };
      });
      const newContracts = await directus.request(createItems('contracts', contractsData));
      existingContracts.push(...newContracts);
    }
    
    const contracts = existingContracts;
    console.log(`   ✅ Using ${contracts.length} contracts`);

    // ========================================================================
    // PHASE 3: SEED SCHEDULE DATA
    // ========================================================================
    console.log('\n📅 PHASE 3: Seeding Schedule Data...\n');
    
    // 3.1 Weekly Schedule
    console.log('   📆 Creating Weekly Schedule...');
    const weeklyScheduleData = [{
      week_start: CONFIG.TARGET_WEEK_START,
      week_end: CONFIG.TARGET_WEEK_END,
      status: 'scheduled',
      notes: `Lịch tuần ${CONFIG.TARGET_WEEK_START} - ${CONFIG.TARGET_WEEK_END}`,
    }];
    const weeklySchedules = await directus.request(createItems('weekly_schedule', weeklyScheduleData));
    const weeklySchedule = weeklySchedules[0];
    console.log(`   ✅ Created weekly schedule: ${weeklySchedule.id}`);
    
    // 3.2 Shifts (mỗi ngày 4 ca cố định: sáng, trưa, chiều, tối)
    console.log('   🔄 Creating Shifts...');
    const dates = getDatesInRange(CONFIG.TARGET_WEEK_START, CONFIG.TARGET_WEEK_END);
    const shiftsData: any[] = [];
    
    dates.forEach((date) => {
      // Tạo đủ 4 ca cho mỗi ngày
      shiftTypes.forEach((shiftType: any) => {
        const isOvernight = shiftType.cross_midnight;
        shiftsData.push({
          schedule_id: weeklySchedule.id,
          shift_type_id: shiftType.id,
          shift_date: date,
          start_at: formatDateTime(date, shiftType.start_time),
          end_at: isOvernight 
            ? formatDateTime(getNextDay(date), shiftType.end_time)
            : formatDateTime(date, shiftType.end_time),
          total_required: 6,
          notes: `${shiftType.name} - ${date}`,
        });
      });
    });
    
    const shifts = await directus.request(createItems('shifts', shiftsData));
    console.log(`   ✅ Created ${shifts.length} shifts`);
    
    // 3.3 Shift Position Requirements
    console.log('   👔 Creating Shift Position Requirements...');
    const shiftPosReqData: any[] = [];
    
    shifts.forEach((shift: any) => {
      // Tìm shift type name
      const shiftType = shiftTypes.find((st: any) => st.id === shift.shift_type_id);
      const requirements = SHIFT_REQUIREMENTS[(shiftType as any).name as keyof typeof SHIFT_REQUIREMENTS] || [];
      
      requirements.forEach((req) => {
        shiftPosReqData.push({
          shift_id: shift.id,
          position_id: positions[req.positionIndex].id,
          required_count: req.count,
          notes: `Cần ${req.count} ${(positions[req.positionIndex] as any).name}`,
        });
      });
    });
    
    const shiftPosReqs = await directus.request(createItems('shift_position_requirements', shiftPosReqData));
    console.log(`   ✅ Created ${shiftPosReqs.length} shift position requirements`);
    
    // 3.4 Employee Availability (Đăng ký ca)
    console.log('   📌 Creating Employee Availabilities...');
    const availabilityData: any[] = [];
    
    employees.forEach((emp: any) => {
      // Mỗi nhân viên đăng ký ngẫu nhiên ~70% số ca
      shifts.forEach((shift: any) => {
        if (Math.random() < CONFIG.AVAILABILITY_RATE) {
          availabilityData.push({
            employee_id: emp.id,
            shift_id: shift.id,
            status: 'approved', // Đã duyệt để auto-schedule hoạt động
            priority: getRandomInt(1, 5),
            note: 'Đăng ký làm ca này',
          });
        }
      });
    });
    
    const availabilities = await directus.request(createItems('employee_availability', availabilityData));
    console.log(`   ✅ Created ${availabilities.length} employee availabilities`);
    
    // 3.5 Employee Availability Positions
    console.log('   🎯 Creating Employee Availability Positions...');
    const availPosData: any[] = [];
    
    availabilities.forEach((avail: any, idx: number) => {
      // Mỗi availability link với 1-2 positions
      const numPositions = getRandomInt(1, 2);
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

    // ========================================================================
    // PHASE 4: AUTO SCHEDULE (Manual assignment vì không gọi được service)
    // ========================================================================
    console.log('\n🤖 PHASE 4: Creating Schedule Assignments...\n');
    
    // Tạo assignments dựa trên availability
    console.log('   📋 Creating Schedule Assignments...');
    const assignmentsData: any[] = [];
    const assignedEmployeeShifts = new Set<string>(); // Track employee-shift pairs
    
    shifts.forEach((shift: any) => {
      // Lấy requirements cho shift này
      const requirements = shiftPosReqs.filter((req: any) => req.shift_id === shift.id);
      
      requirements.forEach((req: any) => {
        // Lấy employees có availability cho shift này và có thể làm position này
        const eligibleAvailabilities = availabilities.filter((avail: any) => {
          if (avail.shift_id !== shift.id) return false;
          
          // Check if employee already assigned to this shift
          const key = `${avail.employee_id}-${shift.id}`;
          if (assignedEmployeeShifts.has(key)) return false;
          
          // Check if employee can do this position
          const hasPosition = availPositions.some(
            (ap: any) => ap.availability_id === avail.id && ap.position_id === req.position_id
          );
          return hasPosition;
        });
        
        // Assign employees based on required count
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
            note: 'Phân công tự động',
          });
        });
      });
    });
    
    const assignments = await directus.request(createItems('schedule_assignments', assignmentsData));
    console.log(`   ✅ Created ${assignments.length} schedule assignments`);

    // ========================================================================
    // PHASE 5: SEED ATTENDANCE DATA
    // ========================================================================
    console.log('\n📝 PHASE 5: Seeding Attendance Data...\n');
    
    console.log('   ⏰ Creating Attendance Logs...');
    const attendanceLogsData: any[] = [];
    
    // Chỉ tạo attendance cho các ngày đã qua (giả sử hôm nay là cuối tuần)
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    
    assignments.forEach((assignment: any) => {
      const shift = shifts.find((s: any) => s.id === assignment.shift_id);
      if (!shift) return;
      
      const shiftDate = (shift as any).shift_date;
      
      // Chỉ tạo attendance cho ngày đã qua hoặc hôm nay
      if (shiftDate > todayStr) return;
      
      // 95% có chấm công
      if (Math.random() > CONFIG.ATTENDANCE_RATE) return;
      
      const shiftType = shiftTypes.find((st: any) => st.id === (shift as any).shift_type_id);
      const startTime = (shiftType as any).start_time;
      
      // Parse start time
      const [startHour, startMin] = startTime.split(':').map(Number);
      
      // Random check-in time (có thể đi trễ 10%)
      const isLate = Math.random() < CONFIG.LATE_RATE;
      const lateMinutes = isLate ? getRandomInt(5, 30) : getRandomInt(-10, 5);
      
      const checkInDateTime = formatDateTime(shiftDate, startTime);
      const actualCheckIn = addMinutes(checkInDateTime, lateMinutes);
      
      // Check-out sau 8 giờ
      const checkOutDateTime = addMinutes(checkInDateTime, 8 * 60);
      const actualCheckOut = addMinutes(checkOutDateTime, getRandomInt(-10, 30));
      
      // Clock in log
      attendanceLogsData.push({
        card_uid: `CARD-${assignment.employee_id.slice(0, 8)}`,
        employee_id: assignment.employee_id,
        event_type: 'clock_in',
        event_time: actualCheckIn,
        processed: true,
      });
      
      // Clock out log
      attendanceLogsData.push({
        card_uid: `CARD-${assignment.employee_id.slice(0, 8)}`,
        employee_id: assignment.employee_id,
        event_type: 'clock_out',
        event_time: actualCheckOut,
        processed: true,
      });
    });
    
    const attendanceLogs = await directus.request(createItems('attendance_logs', attendanceLogsData));
    console.log(`   ✅ Created ${attendanceLogs.length} attendance logs`);

    // ========================================================================
    // PHASE 6: SEED PAYROLL DATA
    // ========================================================================
    console.log('\n💵 PHASE 6: Seeding Payroll Data...\n');
    
    console.log('   💰 Creating Monthly Payrolls...');
    const payrollsData: any[] = [];
    
    employees.forEach((emp: any, idx: number) => {
      const contract = contracts.find((c: any) => c.employee_id === emp.id);
      if (!contract) return;
      
      const scheme = salarySchemes.find((s: any) => s.id === (contract as any).salary_scheme_id);
      if (!scheme) return;
      
      // Tính work hours từ attendance
      const empAttendance = attendanceLogsData.filter(
        (log) => log.employee_id === emp.id && log.event_type === 'clock_in'
      );
      const totalWorkHours = empAttendance.length * 8; // Giả sử mỗi ca 8 giờ
      const overtimeHours = Math.max(0, totalWorkHours - 160); // Overtime nếu > 160h/tháng
      
      // Tính lương
      let baseSalary: number;
      let hourlyRate: number = 0;
      
      if ((scheme as any).pay_type === 'monthly') {
        baseSalary = (scheme as any).rate;
      } else {
        // Hourly: rate * hours worked
        hourlyRate = (scheme as any).rate;
        baseSalary = hourlyRate * totalWorkHours;
      }
      
      const allowances = getRandomInt(500000, 1500000);
      const bonuses = Math.random() > 0.7 ? getRandomInt(500000, 2000000) : 0;
      const overtimePay = overtimeHours * (hourlyRate || 50000) * ((scheme as any).overtime_multiplier || 1.5);
      const deductions = getRandomInt(100000, 500000);
      const penalties = Math.random() > 0.8 ? getRandomInt(50000, 200000) : 0;
      
      const grossSalary = baseSalary + allowances + bonuses + overtimePay;
      const netSalary = grossSalary - deductions - penalties;
      
      payrollsData.push({
        id: randomUUID(), // Directus yêu cầu id
        employee_id: emp.id,
        contract_id: contract.id,
        month: CONFIG.TARGET_MONTH,
        salary_scheme_id: scheme.id,
        base_salary: baseSalary,
        pay_type: (scheme as any).pay_type,
        hourly_rate: hourlyRate || null,
        allowances,
        bonuses,
        overtime_pay: overtimePay,
        deductions,
        penalties,
        gross_salary: grossSalary,
        net_salary: netSalary,
        total_work_days: Math.ceil(totalWorkHours / 8),
        total_work_hours: totalWorkHours,
        overtime_hours: overtimeHours,
        total_late_minutes: Math.random() > 0.7 ? getRandomInt(15, 60) : 0,
        absent_days: Math.random() > 0.8 ? getRandomInt(1, 2) : 0,
        status: 'draft',
        notes: `Bảng lương tháng ${CONFIG.TARGET_MONTH}`,
      });
    });
    
    const payrolls = await directus.request(createItems('monthly_payrolls', payrollsData));
    console.log(`   ✅ Created ${payrolls.length} monthly payrolls`);

    // ========================================================================
    // SUMMARY
    // ========================================================================
    console.log('\n');
    console.log('═══════════════════════════════════════════════════════════════');
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
    🎯 Availability Positions:           ${availPositions.length}
    📋 Schedule Assignments:             ${assignments.length}
    📝 Attendance Logs:                  ${attendanceLogs.length}
    💵 Monthly Payrolls:                 ${payrolls.length}
    ─────────────────────────────────────────────────────────────────
    TOTAL RECORDS:                       ${
      positions.length + shiftTypes.length + salarySchemes.length + 
      employees.length + contracts.length + weeklySchedules.length +
      shifts.length + shiftPosReqs.length + availabilities.length +
      availPositions.length + assignments.length + attendanceLogs.length +
      payrolls.length
    }
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
  
  // NOTE: Skip contracts & employees - they have FK with users
  const collections = [
    'monthly_payrolls',
    'attendance_logs',
    'schedule_assignments',
    'employee_availability_positions',
    'employee_availability',
    'shift_position_requirements',
    'shifts',
    'weekly_schedule',
    // 'contracts',   // Skip - FK to users
    // 'employees',   // Skip - FK to users
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
// HELPER: Get next day
// ============================================================================
function getNextDay(dateStr: string): string {
  const date = new Date(dateStr);
  date.setDate(date.getDate() + 1);
  return date.toISOString().split('T')[0];
}

// ============================================================================
// RUN
// ============================================================================
seedComplete().catch((e) => {
  console.error('Fatal error:', e);
  process.exit(1);
});
