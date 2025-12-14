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
import { directus, ensureAuth, getAuthToken } from '../src/utils/directusClient';
import { createItems, readMe, readItems, deleteItems, createRole, readRoles, createUser, updateUser, updateItem } from '@directus/sdk';
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

// Parse datetime string without timezone conversion
function parseLocalDateTime(dateTime: string): Date {
  // Format: "2025-12-02T06:00:00"
  const [datePart, timePart] = dateTime.split('T');
  const [year, month, day] = datePart.split('-').map(Number);
  const [hour, minute, second] = timePart.split(':').map(Number);
  return new Date(year, month - 1, day, hour, minute, second || 0);
}

function addMinutes(dateTime: string, minutes: number): string {
  const d = parseLocalDateTime(dateTime);
  d.setMinutes(d.getMinutes() + minutes);
  // Format back to local datetime string
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
        console.log(`   📊 Created ${created.length} new employees`);
        // Reload all employees to get complete data
        employees = await directus.request(readItems('employees', { 
          limit: -1, 
          fields: ['id', 'employee_code', 'first_name', 'last_name', 'full_name', 'email', 'status'],
          filter: { status: { _eq: 'active' } }
        }));
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
    // PHASE 2.5: SEED ROLE & POLICY FOR EMPLOYEES
    // ========================================================================
    console.log('\n🔐 PHASE 2.5: Seeding Role & Policy for Employees...\n');
    
    const directusUrl = process.env.DIRECTUS_URL || 'http://localhost:8055';
    const token = await getAuthToken();
    
    // 2.5.1 Check/Create Role "Employee"
    console.log('   👔 Getting/Creating Employee Role...');
    let employeeRole: any = null;
    
    // Check existing roles
    const existingRoles: any[] = await directus.request(readRoles());
    employeeRole = existingRoles.find((r: any) => r.name === 'Employee');
    
    if (!employeeRole) {
      // Create Employee role via API
      const roleResponse = await fetch(`${directusUrl}/roles`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: 'Employee',
          icon: 'badge',
          description: 'Vai trò dành cho nhân viên - có quyền xem và chỉnh sửa thông tin cá nhân, đăng ký ca làm việc',
          app_access: true,
          admin_access: false,
        }),
      });
      
      if (!roleResponse.ok) {
        throw new Error(`Failed to create role: ${await roleResponse.text()}`);
      }
      
      const roleData = await roleResponse.json();
      employeeRole = roleData.data;
      console.log(`   ✅ Created Employee role: ${employeeRole.id}`);
    } else {
      console.log(`   ✅ Found existing Employee role: ${employeeRole.id}`);
    }
    
    // 2.5.2 Check/Create Policy "Employee"
    console.log('   📜 Getting/Creating Employee Policy...');
    let employeePolicy: any = null;
    
    // Check existing policies
    const policiesResponse = await fetch(`${directusUrl}/policies`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    
    if (policiesResponse.ok) {
      const policiesData = await policiesResponse.json();
      employeePolicy = policiesData.data?.find((p: any) => p.name === 'Employee');
    }
    
    if (!employeePolicy) {
      // Create Employee policy
      const policyResponse = await fetch(`${directusUrl}/policies`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: 'Employee',
          icon: 'verified_user',
          description: 'Chính sách dành cho nhân viên - quyền hạn cơ bản để làm việc trong hệ thống',
          app_access: true,
          admin_access: false,
        }),
      });
      
      if (!policyResponse.ok) {
        throw new Error(`Failed to create policy: ${await policyResponse.text()}`);
      }
      
      const policyData = await policyResponse.json();
      employeePolicy = policyData.data;
      console.log(`   ✅ Created Employee policy: ${employeePolicy.id}`);
    } else {
      console.log(`   ✅ Found existing Employee policy: ${employeePolicy.id}`);
    }
    
    // 2.5.3 Link Policy to Role via directus_access
    console.log('   🔗 Linking Policy to Role...');
    
    // Check if already linked
    const accessCheckResponse = await fetch(`${directusUrl}/access?filter[role][_eq]=${employeeRole.id}&filter[policy][_eq]=${employeePolicy.id}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    
    const accessCheckData = await accessCheckResponse.json();
    if (!accessCheckData.data || accessCheckData.data.length === 0) {
      // Create access link
      const accessResponse = await fetch(`${directusUrl}/access`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          role: employeeRole.id,
          policy: employeePolicy.id,
          sort: 1,
        }),
      });
      
      if (!accessResponse.ok) {
        console.log(`   ⚠️ Warning: Could not link policy to role: ${await accessResponse.text()}`);
      } else {
        console.log(`   ✅ Linked Employee policy to Employee role`);
      }
    } else {
      console.log(`   ✅ Policy already linked to role`);
    }
    
    // 2.5.4 Create directus_users for employees and assign role
    console.log('   👥 Creating/Updating Directus users for employees...');
    
    let usersCreated = 0;
    let usersUpdated = 0;
    
    for (const emp of employees) {
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
          // User exists, update role AND link to employee
          const existingUser = userCheckData.data[0];
          const userId = existingUser.id;
          
          console.log(`   🔗 User exists for ${emp.email}, linking user ${userId} to employee ${emp.id}`);
          
          const updateResponse = await fetch(`${directusUrl}/users/${userId}`, {
            method: 'PATCH',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              role: employeeRole.id,
            }),
          });
          
          if (updateResponse.ok) {
            usersUpdated++;
            
            // Link user to employee
            try {
              await directus.request(
                updateItem('employees', emp.id, { user_id: userId })
              );
              console.log(`   ✅ Successfully linked existing user to employee`);
            } catch (linkErr: any) {
              console.log(`   ❌ Failed to link user to employee: ${linkErr.message}`);
            }
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
              password: 'Employee123!', // Default password
              first_name: emp.first_name,
              last_name: emp.last_name,
              role: employeeRole.id,
              status: 'active',
            }),
          });
          
          if (createUserResponse.ok) {
            usersCreated++;
            
            // Link user to employee
            const createdUserData = await createUserResponse.json();
            const userId = createdUserData.data.id;
            console.log(`   🔗 Linking user ${userId} to employee ${emp.id} (${emp.email})`);
            
            // Update employee with user_id
            try {
              await directus.request(
                updateItem('employees', emp.id, { user_id: userId })
              );
              console.log(`   ✅ Successfully linked user to employee`);
            } catch (linkErr: any) {
              console.log(`   ❌ Failed to link user to employee: ${linkErr.message}`);
            }
          } else {
            const errorText = await createUserResponse.text();
            // Ignore duplicate email errors
            if (!errorText.includes('unique')) {
              console.log(`   ⚠️ Could not create user for ${emp.email}: ${errorText}`);
            } else {
              console.log(`   ℹ️ User already exists for ${emp.email}, skipping...`);
            }
          }
        }
      } catch (err: any) {
        console.log(`   ⚠️ Error processing user ${emp.email}: ${err.message}`);
        console.log(`   📊 Stack trace: ${err.stack}`);
      }
    }
    
    console.log(`   ✅ Users: ${usersCreated} created, ${usersUpdated} updated with Employee role`);

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
    
    // Re-fetch employees to ensure we have fresh data with valid IDs
    const freshEmployees: any[] = await directus.request(readItems('employees', { 
      limit: -1, 
      fields: ['id', 'employee_code', 'status'],
      filter: { status: { _eq: 'active' } }
    }));
    console.log(`   📊 Fresh employees from DB: ${freshEmployees.length}`);
    if (freshEmployees.length === 0) {
      throw new Error('No employees found in database!');
    }
    
    const availabilityData: any[] = [];
    
    freshEmployees.forEach((emp: any, empIndex: number) => {
      // Deterministic: Mỗi nhân viên đăng ký ~70% số ca dựa trên pattern
      // Employee index + shift index mod 10 < 7 => available (70%)
      shifts.forEach((shift: any, shiftIndex: number) => {
        const combinedIndex = empIndex * 100 + shiftIndex;
        const isAvailable = (combinedIndex % 10) < 7; // 70% available
        
        if (isAvailable) {
          // Priority dựa trên (empIndex + shiftIndex) % 5 + 1 = 1-5
          const priority = ((empIndex + shiftIndex) % 5) + 1;
          availabilityData.push({
            employee_id: emp.id,
            shift_id: shift.id,
            status: 'available', // Đổi thành enum value đúng: available, unavailable, preferred
            priority: priority,
            note: 'Đăng ký làm ca này',
          });
        }
      });
    });
    
    // Debug: check for null employee_id
    const nullEmployeeIds = availabilityData.filter(a => !a.employee_id);
    if (nullEmployeeIds.length > 0) {
      console.log(`   ⚠️ Found ${nullEmployeeIds.length} availability records with null employee_id`);
    }
    
    // Filter out records with null employee_id or shift_id
    const validAvailabilityData = availabilityData.filter(a => a.employee_id && a.shift_id);
    console.log(`   📊 Valid availability records: ${validAvailabilityData.length} / ${availabilityData.length}`);
    
    // Debug: log first record
    if (validAvailabilityData.length > 0) {
      console.log(`   📊 Sample record:`, JSON.stringify(validAvailabilityData[0]));
    }
    
    // Create in smaller batches to identify issues
    const batchSize = 50;
    const availabilities: any[] = [];
    
    for (let i = 0; i < validAvailabilityData.length; i += batchSize) {
      const batch = validAvailabilityData.slice(i, i + batchSize);
      console.log(`   📊 Creating batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(validAvailabilityData.length/batchSize)}...`);
      try {
        // Try creating one by one if batch fails
        for (const item of batch) {
          const created = await directus.request(createItems('employee_availability', [item]));
          availabilities.push(...created);
        }
      } catch (err: any) {
        console.log(`   ❌ Batch failed. First item in batch:`, JSON.stringify(batch[0]));
        throw err;
      }
    }
    console.log(`   ✅ Created ${availabilities.length} employee availabilities`);
    
    // 3.5 Employee Availability Positions
    console.log('   🎯 Creating Employee Availability Positions...');
    const availPosData: any[] = [];
    
    availabilities.forEach((avail: any, idx: number) => {
      // Deterministic: Mỗi availability link với 1-2 positions
      // idx % 3 == 0 => 2 positions, còn lại 1 position (33% có 2 positions)
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
    const attendanceShiftsData: any[] = []; // For processed attendance records
    
    // Chỉ tạo attendance cho các ngày đã qua (giả sử hôm nay là cuối tuần)
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    
    assignments.forEach((assignment: any, assignmentIndex: number) => {
      const shift = shifts.find((s: any) => s.id === assignment.shift_id);
      if (!shift) return;
      
      const shiftDate = (shift as any).shift_date;
      
      // Chỉ tạo attendance cho ngày đã qua hoặc hôm nay
      if (shiftDate > todayStr) return;
      
      // Deterministic: Dựa trên index của assignment để quyết định có đi làm không
      // 95% đi làm = bỏ 1 trong 20 ca (mỗi employee thứ 20 skip 1 ca)
      const skipAttendance = (assignmentIndex % 20 === 0) && (assignmentIndex > 0);
      if (skipAttendance) return;
      
      const shiftType = shiftTypes.find((st: any) => st.id === (shift as any).shift_type_id);
      const startTime = (shiftType as any).start_time;
      
      // Parse start time
      const [startHour, startMin] = startTime.split(':').map(Number);
      
      // Deterministic late pattern:
      // - Mỗi người thứ 10 sẽ đi trễ (10% late rate)
      // - Số phút trễ dựa trên index: 5 + (index % 25) = 5-29 phút
      // - Người không trễ sẽ đến đúng giờ hoặc sớm: -5 đến +5 phút dựa trên index
      const isLate = (assignmentIndex % 10 === 0);
      const lateMinutes = isLate 
        ? 5 + (assignmentIndex % 25)  // 5-29 phút trễ
        : ((assignmentIndex % 11) - 5); // -5 đến +5 phút
      
      const checkInDateTime = formatDateTime(shiftDate, startTime);
      const actualCheckIn = addMinutes(checkInDateTime, lateMinutes);
      
      // Check-out sau 8 giờ, với variation nhỏ dựa trên index
      // -10 đến +20 phút dựa trên (index % 31 - 10)
      const checkoutVariation = (assignmentIndex % 31) - 10;
      const checkOutDateTime = addMinutes(checkInDateTime, 8 * 60);
      const actualCheckOut = addMinutes(checkOutDateTime, checkoutVariation);
      
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
      
      // Store attendance shift data for later creation
      // Calculate worked minutes and late minutes
      const inTime = parseLocalDateTime(actualCheckIn);
      const outTime = parseLocalDateTime(actualCheckOut);
      const workedMinutes = Math.round((outTime.getTime() - inTime.getTime()) / (1000 * 60));
      const actualLateMinutes = Math.max(0, lateMinutes); // Only positive = late
      
      attendanceShiftsData.push({
        employee_id: assignment.employee_id,
        shift_id: shift.id,
        schedule_assignment_id: assignment.id,
        clock_in: actualCheckIn,
        clock_out: actualCheckOut,
        worked_minutes: workedMinutes,
        late_minutes: actualLateMinutes,
        early_leave_minutes: Math.max(0, -checkoutVariation), // Negative checkout = early leave
        status: 'present',
        manual_adjusted: false,
        notes: null,
      });
    });
    
    const attendanceLogs = await directus.request(createItems('attendance_logs', attendanceLogsData));
    console.log(`   ✅ Created ${attendanceLogs.length} attendance logs`);
    
    // Create attendance_shifts records (processed attendance data)
    console.log('   📊 Creating Attendance Shifts...');
    const attendanceShifts = await directus.request(createItems('attendance_shifts', attendanceShiftsData));
    console.log(`   ✅ Created ${attendanceShifts.length} attendance shifts`);

    // ========================================================================
    // PHASE 6: SEED PAYROLL DATA
    // ========================================================================
    console.log('\n💵 PHASE 6: Seeding Payroll Data...\n');
    
    console.log('   💰 Creating Monthly Payrolls...');
    const payrollsData: any[] = [];
    
    // Helper: Tính số giờ làm thực tế từ attendance logs
    // Attendance logs được tạo theo cặp clock_in, clock_out liên tiếp cho mỗi assignment
    const calculateActualWorkHours = (employeeId: string): { totalHours: number; lateMinutes: number; sessions: number } => {
      // Lấy tất cả logs của employee, sort theo thời gian
      const empLogs = attendanceLogsData
        .filter((log) => log.employee_id === employeeId)
        .sort((a, b) => parseLocalDateTime(a.event_time).getTime() - parseLocalDateTime(b.event_time).getTime());
      
      let totalHours = 0;
      let totalLateMinutes = 0;
      let sessions = 0;
      
      // Ghép cặp clock_in và clock_out
      for (let i = 0; i < empLogs.length; i += 2) {
        const clockIn = empLogs[i];
        const clockOut = empLogs[i + 1];
        
        if (clockIn?.event_type === 'clock_in' && clockOut?.event_type === 'clock_out') {
          const inTime = parseLocalDateTime(clockIn.event_time);
          const outTime = parseLocalDateTime(clockOut.event_time);
          const hoursWorked = (outTime.getTime() - inTime.getTime()) / (1000 * 60 * 60);
          
          totalHours += hoursWorked;
          sessions++;
          
          // Tính late minutes - dựa trên giờ bắt đầu ca (round to nearest hour for simplicity)
          // Vì attendance được tạo với lateMinutes random, nên chỉ tính những ai đi trễ > 5 phút
          const minutes = inTime.getMinutes();
          if (minutes > 5) {
            totalLateMinutes += minutes;
          }
        }
      }
      
      return { 
        totalHours: Math.round(totalHours * 100) / 100, 
        lateMinutes: totalLateMinutes,
        sessions 
      };
    };
    
    employees.forEach((emp: any, idx: number) => {
      const contract = contracts.find((c: any) => c.employee_id === emp.id);
      if (!contract) return;
      
      const scheme = salarySchemes.find((s: any) => s.id === (contract as any).salary_scheme_id);
      if (!scheme) return;
      
      // Tính work hours THỰC TẾ từ attendance logs
      const workStats = calculateActualWorkHours(emp.id);
      const totalWorkHours = workStats.totalHours;
      const totalLateMinutes = workStats.lateMinutes;
      const workDays = workStats.sessions;
      const overtimeHours = Math.max(0, totalWorkHours - 160); // Overtime nếu > 160h/tháng
      
      console.log(`   📊 ${emp.full_name}: ${workDays} ngày, ${totalWorkHours.toFixed(1)}h, late: ${totalLateMinutes}m`);
      
      // =====================================================================
      // TÍNH LƯƠNG ĐÚNG LOGIC
      // =====================================================================
      let baseSalary: number;
      let hourlyRate: number = 0;
      const schemeRate = Number((scheme as any).rate);
      const expectedWorkDaysPerMonth = 22; // Số ngày làm việc chuẩn/tháng
      const expectedHoursPerDay = 8;       // Số giờ làm chuẩn/ngày
      
      if ((scheme as any).pay_type === 'monthly') {
        // LƯƠNG THÁNG: Tính theo tỉ lệ ngày làm thực tế
        // Nếu làm đủ 22 ngày → full lương, nếu ít hơn → tính tỉ lệ
        const workRatio = Math.min(workDays / expectedWorkDaysPerMonth, 1);
        baseSalary = Math.round(schemeRate * workRatio);
        // Tính hourly rate ước tính cho monthly (dùng khi tính OT)
        hourlyRate = schemeRate / (expectedWorkDaysPerMonth * expectedHoursPerDay);
      } else {
        // LƯƠNG GIỜ: rate × số giờ làm thực tế
        hourlyRate = schemeRate;
        baseSalary = Math.round(hourlyRate * totalWorkHours);
      }
      
      // ALLOWANCES: Phụ cấp cố định theo vị trí (không random)
      // Giả sử: 500k/tháng cho tất cả, tính theo tỉ lệ ngày làm
      const baseAllowance = 500000;
      const allowanceRatio = Math.min(workDays / expectedWorkDaysPerMonth, 1);
      const allowances = Math.round(baseAllowance * allowanceRatio);
      
      // BONUSES: Chỉ có nếu làm đủ ngày (> 80% expected days trong tuần seed)
      // Trong tuần seed có 6 ngày làm, nếu làm >= 5 ngày → có bonus
      const expectedWorkDaysInSeed = 6;
      const bonusEligible = workDays >= Math.ceil(expectedWorkDaysInSeed * 0.8);
      const bonuses = bonusEligible ? 200000 : 0; // Bonus cố định 200k nếu đủ điều kiện
      
      // OVERTIME PAY: Chỉ tính nếu làm > 8h/ngày trung bình
      const avgHoursPerDay = workDays > 0 ? totalWorkHours / workDays : 0;
      const overtimeHoursCalc = workDays > 0 ? Math.max(0, (avgHoursPerDay - expectedHoursPerDay) * workDays) : 0;
      const overtimePay = Math.round(overtimeHoursCalc * hourlyRate * ((scheme as any).overtime_multiplier || 1.5));
      
      // DEDUCTIONS: Bảo hiểm xã hội, thuế (khoảng 10.5% của base + allowances)
      const deductionRate = 0.105;
      const deductions = Math.round((baseSalary + allowances) * deductionRate);
      
      // PENALTIES: Dựa trên late minutes thực tế
      // 10k cho mỗi 10 phút trễ
      const latePenalty = totalLateMinutes > 0 ? Math.floor(totalLateMinutes / 10) * 10000 : 0;
      const penalties = latePenalty;
      
      // GROSS & NET SALARY
      const grossSalary = baseSalary + allowances + bonuses + overtimePay;
      const netSalary = grossSalary - deductions - penalties;
      
      // Tính số ngày vắng trong tuần seed
      const absentDays = Math.max(0, expectedWorkDaysInSeed - workDays);
      
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
        total_work_days: workDays,           // SỐ NGÀY LÀM THỰC TẾ từ attendance
        total_work_hours: totalWorkHours,    // SỐ GIỜ LÀM THỰC TẾ từ attendance  
        overtime_hours: overtimeHoursCalc,
        total_late_minutes: totalLateMinutes, // SỐ PHÚT TRỄ THỰC TẾ từ attendance
        absent_days: absentDays,              // SỐ NGÀY VẮNG từ attendance
        status: 'draft',
        notes: `Bảng lương tháng ${CONFIG.TARGET_MONTH} - Sync từ ${workDays} ngày chấm công`,
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
    📊 Attendance Shifts:                ${attendanceShifts.length}
    💵 Monthly Payrolls:                 ${payrolls.length}
    ─────────────────────────────────────────────────────────────────
    TOTAL RECORDS:                       ${
      positions.length + shiftTypes.length + salarySchemes.length + 
      employees.length + contracts.length + weeklySchedules.length +
      shifts.length + shiftPosReqs.length + availabilities.length +
      availPositions.length + assignments.length + attendanceLogs.length +
      attendanceShifts.length + payrolls.length
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
    'attendance_shifts',  // Clear processed attendance data
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
