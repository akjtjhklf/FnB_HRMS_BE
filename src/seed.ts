import 'dotenv/config';
import { directus, ensureAuth } from './utils/directusClient';
import { createItems, readMe, readItems, deleteItems } from '@directus/sdk';

async function run() {
  console.log('🌱 Starting seed process...');
  console.log(`📡 Directus URL: ${process.env.DIRECTUS_URL}\n`);

  try {
    // Login first
    await ensureAuth();
    
    // Verify authentication
    console.log('🔐 Verifying authentication...');
    const me = await directus.request(readMe());
    console.log(`✅ Authenticated as: ${me.email}\n`);

    // ========== CLEAR OLD DATA ==========
    console.log('🗑️  Clearing old data (in reverse order to respect foreign keys)...');
    const collections = [
      'monthly_payrolls',
      'monthly_employee_stats',
      'salary_requests',
      'deductions',
      'schedule_change_requests',
      'attendance_adjustments',
      'attendance_shifts',
      'employee_availability_positions',
      'employee_availability',
      'schedule_assignments',
      'shift_position_requirements',
      'shifts',
      'weekly_schedule',
      'attendance_logs',
      'rfid_cards',
      'devices',
      'contracts',
      'employees',
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
          console.log(`   ✓ Cleared ${ids.length} records from ${collection}`);
        }
      } catch (error: any) {
        // Silently skip non-existent collections
      }
    }
    console.log('✅ Old data cleared\n');

    // ========== 1. POSITIONS (15 records) ==========
    console.log('📍 Seeding Positions...');
    const positionsData = [
      { name: 'Barista', description: 'Coffee preparation specialist' },
      { name: 'Server', description: 'Front of house service staff' },
      { name: 'Shift Manager', description: 'Manages shift operations' },
      { name: 'Kitchen Staff', description: 'Food preparation' },
      { name: 'Cashier', description: 'Handles payments and orders' },
      { name: 'Delivery Driver', description: 'Food delivery personnel' },
      { name: 'Store Manager', description: 'Overall store operations manager' },
      { name: 'Assistant Manager', description: 'Assists store manager' },
      { name: 'Cleaner', description: 'Maintains cleanliness' },
      { name: 'Host/Hostess', description: 'Greets and seats customers' },
      { name: 'Line Cook', description: 'Prepares food items' },
      { name: 'Dishwasher', description: 'Cleans dishes and kitchen equipment' },
      { name: 'Prep Cook', description: 'Prepares ingredients' },
      { name: 'Bartender', description: 'Prepares beverages' },
      { name: 'Food Runner', description: 'Delivers food to tables' },
    ];
    const positions = await directus.request(createItems('positions', positionsData));
    console.log(`✅ Created ${positions.length} positions`);

    // ========== 2. SALARY SCHEMES (15 records) ==========
    console.log('💰 Seeding Salary Schemes...');
    const schemesData = [
      { name: 'Barista Hourly', position_id: positions[0].id, pay_type: 'hourly', rate: 50000, overtime_multiplier: 1.5, is_active: true },
      { name: 'Server Hourly', position_id: positions[1].id, pay_type: 'hourly', rate: 45000, overtime_multiplier: 1.5, is_active: true },
      { name: 'Shift Manager Fixed', position_id: positions[2].id, pay_type: 'fixed_shift', rate: 500000, is_active: true },
      { name: 'Kitchen Staff Hourly', position_id: positions[3].id, pay_type: 'hourly', rate: 48000, overtime_multiplier: 1.5, is_active: true },
      { name: 'Cashier Hourly', position_id: positions[4].id, pay_type: 'hourly', rate: 46000, overtime_multiplier: 1.5, is_active: true },
      { name: 'Delivery Driver Hourly', position_id: positions[5].id, pay_type: 'hourly', rate: 40000, overtime_multiplier: 1.5, is_active: true },
      { name: 'Store Manager Monthly', position_id: positions[6].id, pay_type: 'monthly', rate: 15000000, is_active: true },
      { name: 'Assistant Manager Monthly', position_id: positions[7].id, pay_type: 'monthly', rate: 10000000, is_active: true },
      { name: 'Cleaner Hourly', position_id: positions[8].id, pay_type: 'hourly', rate: 35000, overtime_multiplier: 1.5, is_active: true },
      { name: 'Host Hourly', position_id: positions[9].id, pay_type: 'hourly', rate: 44000, overtime_multiplier: 1.5, is_active: true },
      { name: 'Line Cook Hourly', position_id: positions[10].id, pay_type: 'hourly', rate: 52000, overtime_multiplier: 1.5, is_active: true },
      { name: 'Dishwasher Hourly', position_id: positions[11].id, pay_type: 'hourly', rate: 38000, overtime_multiplier: 1.5, is_active: true },
      { name: 'Prep Cook Hourly', position_id: positions[12].id, pay_type: 'hourly', rate: 47000, overtime_multiplier: 1.5, is_active: true },
      { name: 'Bartender Hourly', position_id: positions[13].id, pay_type: 'hourly', rate: 55000, overtime_multiplier: 1.5, is_active: true },
      { name: 'Food Runner Hourly', position_id: positions[14].id, pay_type: 'hourly', rate: 42000, overtime_multiplier: 1.5, is_active: true },
    ];
    const schemes = await directus.request(createItems('salary_schemes', schemesData));
    console.log(`✅ Created ${schemes.length} salary schemes`);

    // ========== 3. EMPLOYEES (15 records) ==========
    console.log('👥 Seeding Employees...');
    const employeesData = [
      { employee_code: 'EMP001', first_name: 'Nguyen', last_name: 'Van A', full_name: 'Nguyen Van A', email: 'nva@example.com', phone: '0901234567', gender: 'male', status: 'active', hire_date: '2024-01-15', scheme_id: schemes[0].id, default_work_hours_per_week: 40 },
      { employee_code: 'EMP002', first_name: 'Tran', last_name: 'Thi B', full_name: 'Tran Thi B', email: 'ttb@example.com', phone: '0902234567', gender: 'female', status: 'active', hire_date: '2024-02-01', scheme_id: schemes[1].id, default_work_hours_per_week: 40 },
      { employee_code: 'EMP003', first_name: 'Le', last_name: 'Van C', full_name: 'Le Van C', email: 'lvc@example.com', phone: '0903234567', gender: 'male', status: 'active', hire_date: '2024-01-20', scheme_id: schemes[2].id, default_work_hours_per_week: 48 },
      { employee_code: 'EMP004', first_name: 'Pham', last_name: 'Thi D', full_name: 'Pham Thi D', email: 'ptd@example.com', phone: '0904234567', gender: 'female', status: 'active', hire_date: '2024-03-10', scheme_id: schemes[3].id, default_work_hours_per_week: 40 },
      { employee_code: 'EMP005', first_name: 'Hoang', last_name: 'Van E', full_name: 'Hoang Van E', email: 'hve@example.com', phone: '0905234567', gender: 'male', status: 'active', hire_date: '2024-02-15', scheme_id: schemes[4].id, default_work_hours_per_week: 40 },
      { employee_code: 'EMP006', first_name: 'Vu', last_name: 'Thi F', full_name: 'Vu Thi F', email: 'vtf@example.com', phone: '0906234567', gender: 'female', status: 'active', hire_date: '2024-04-01', scheme_id: schemes[5].id, default_work_hours_per_week: 35 },
      { employee_code: 'EMP007', first_name: 'Dang', last_name: 'Van G', full_name: 'Dang Van G', email: 'dvg@example.com', phone: '0907234567', gender: 'male', status: 'active', hire_date: '2023-12-01', scheme_id: schemes[6].id, default_work_hours_per_week: 48 },
      { employee_code: 'EMP008', first_name: 'Bui', last_name: 'Thi H', full_name: 'Bui Thi H', email: 'bth@example.com', phone: '0908234567', gender: 'female', status: 'active', hire_date: '2024-01-05', scheme_id: schemes[7].id, default_work_hours_per_week: 48 },
      { employee_code: 'EMP009', first_name: 'Do', last_name: 'Van I', full_name: 'Do Van I', email: 'dvi@example.com', phone: '0909234567', gender: 'male', status: 'active', hire_date: '2024-03-20', scheme_id: schemes[8].id, default_work_hours_per_week: 40 },
      { employee_code: 'EMP010', first_name: 'Ngo', last_name: 'Thi J', full_name: 'Ngo Thi J', email: 'ntj@example.com', phone: '0910234567', gender: 'female', status: 'active', hire_date: '2024-02-25', scheme_id: schemes[9].id, default_work_hours_per_week: 40 },
      { employee_code: 'EMP011', first_name: 'Duong', last_name: 'Van K', full_name: 'Duong Van K', email: 'dvk@example.com', phone: '0911234567', gender: 'male', status: 'active', hire_date: '2024-04-10', scheme_id: schemes[10].id, default_work_hours_per_week: 40 },
      { employee_code: 'EMP012', first_name: 'Ly', last_name: 'Thi L', full_name: 'Ly Thi L', email: 'ltl@example.com', phone: '0912234567', gender: 'female', status: 'active', hire_date: '2024-03-05', scheme_id: schemes[11].id, default_work_hours_per_week: 40 },
      { employee_code: 'EMP013', first_name: 'Truong', last_name: 'Van M', full_name: 'Truong Van M', email: 'tvm@example.com', phone: '0913234567', gender: 'male', status: 'active', hire_date: '2024-01-25', scheme_id: schemes[12].id, default_work_hours_per_week: 40 },
      { employee_code: 'EMP014', first_name: 'Phan', last_name: 'Thi N', full_name: 'Phan Thi N', email: 'ptn@example.com', phone: '0914234567', gender: 'female', status: 'active', hire_date: '2024-02-10', scheme_id: schemes[13].id, default_work_hours_per_week: 40 },
      { employee_code: 'EMP015', first_name: 'Mai', last_name: 'Van O', full_name: 'Mai Van O', email: 'mvo@example.com', phone: '0915234567', gender: 'male', status: 'active', hire_date: '2024-04-15', scheme_id: schemes[14].id, default_work_hours_per_week: 40 },
    ];
    const employees = await directus.request(createItems('employees', employeesData));
    console.log(`✅ Created ${employees.length} employees`);

    // ========== 4. CONTRACTS (15 records) ==========
    console.log('📄 Seeding Contracts...');
    const contractsData = employees.map((emp, i) => ({
      employee_id: emp.id,
      contract_type: i < 10 ? 'full_time' : 'part_time',
      start_date: emp.hire_date,
      base_salary: i < 2 ? 8000000 : (i < 7 ? 6000000 : 5000000),
      is_active: true,
    }));
    const contracts = await directus.request(createItems('contracts', contractsData));
    console.log(`✅ Created ${contracts.length} contracts`);

    // ========== 5. SHIFT TYPES (15 records) ==========
    console.log('⏰ Seeding Shift Types...');
    const shiftTypesData = [
      { name: 'Morning Shift', start_time: '06:00:00', end_time: '14:00:00', cross_midnight: false },
      { name: 'Day Shift', start_time: '08:00:00', end_time: '16:00:00', cross_midnight: false },
      { name: 'Afternoon Shift', start_time: '14:00:00', end_time: '22:00:00', cross_midnight: false },
      { name: 'Evening Shift', start_time: '16:00:00', end_time: '00:00:00', cross_midnight: true },
      { name: 'Night Shift', start_time: '22:00:00', end_time: '06:00:00', cross_midnight: true },
      { name: 'Split Shift AM', start_time: '07:00:00', end_time: '11:00:00', cross_midnight: false },
      { name: 'Split Shift PM', start_time: '17:00:00', end_time: '21:00:00', cross_midnight: false },
      { name: 'Full Day', start_time: '09:00:00', end_time: '18:00:00', cross_midnight: false },
      { name: 'Early Morning', start_time: '05:00:00', end_time: '13:00:00', cross_midnight: false },
      { name: 'Late Night', start_time: '23:00:00', end_time: '07:00:00', cross_midnight: true },
      { name: 'Breakfast Shift', start_time: '06:30:00', end_time: '11:30:00', cross_midnight: false },
      { name: 'Lunch Shift', start_time: '11:00:00', end_time: '15:00:00', cross_midnight: false },
      { name: 'Dinner Shift', start_time: '17:00:00', end_time: '22:00:00', cross_midnight: false },
      { name: 'Closing Shift', start_time: '20:00:00', end_time: '02:00:00', cross_midnight: true },
      { name: 'Opening Shift', start_time: '05:30:00', end_time: '09:30:00', cross_midnight: false },
    ];
    const shiftTypes = await directus.request(createItems('shift_types', shiftTypesData));
    console.log(`✅ Created ${shiftTypes.length} shift types`);

    // ========== 6. DEVICES (15 records) ==========
    console.log('📱 Seeding Devices...');
    const devicesData = [
      { name: 'Main Entrance RFID', location: 'Front Door', device_key: 'DEV-MAIN-001', status: 'online', current_mode: 'attendance', ip_address: '192.168.1.101' },
      { name: 'Back Door RFID', location: 'Back Entrance', device_key: 'DEV-BACK-001', status: 'online', current_mode: 'attendance', ip_address: '192.168.1.102' },
      { name: 'Staff Room RFID', location: 'Staff Area', device_key: 'DEV-STAFF-001', status: 'online', current_mode: 'attendance', ip_address: '192.168.1.103' },
      { name: 'Kitchen Entrance', location: 'Kitchen Door', device_key: 'DEV-KITCH-001', status: 'online', current_mode: 'attendance', ip_address: '192.168.1.104' },
      { name: 'Manager Office', location: 'Office', device_key: 'DEV-OFFICE-001', status: 'online', current_mode: 'enroll', ip_address: '192.168.1.105' },
      { name: 'Storage Room', location: 'Storage', device_key: 'DEV-STORE-001', status: 'offline', current_mode: 'attendance', ip_address: '192.168.1.106' },
      { name: 'Parking Gate', location: 'Parking', device_key: 'DEV-PARK-001', status: 'online', current_mode: 'attendance', ip_address: '192.168.1.107' },
      { name: 'VIP Entrance', location: 'VIP Section', device_key: 'DEV-VIP-001', status: 'online', current_mode: 'attendance', ip_address: '192.168.1.108' },
      { name: 'Delivery Area', location: 'Loading Bay', device_key: 'DEV-DELIV-001', status: 'online', current_mode: 'attendance', ip_address: '192.168.1.109' },
      { name: 'Bar Section', location: 'Bar', device_key: 'DEV-BAR-001', status: 'online', current_mode: 'attendance', ip_address: '192.168.1.110' },
      { name: 'Dining Area 1', location: 'Dining Floor 1', device_key: 'DEV-DINE1-001', status: 'online', current_mode: 'attendance', ip_address: '192.168.1.111' },
      { name: 'Dining Area 2', location: 'Dining Floor 2', device_key: 'DEV-DINE2-001', status: 'online', current_mode: 'attendance', ip_address: '192.168.1.112' },
      { name: 'Emergency Exit', location: 'Emergency Door', device_key: 'DEV-EMERG-001', status: 'online', current_mode: 'attendance', ip_address: '192.168.1.113' },
      { name: 'Side Entrance', location: 'Side Door', device_key: 'DEV-SIDE-001', status: 'offline', current_mode: 'attendance', ip_address: '192.168.1.114' },
      { name: 'Locker Room', location: 'Locker Area', device_key: 'DEV-LOCK-001', status: 'online', current_mode: 'enroll', ip_address: '192.168.1.115' },
    ];
    const devices = await directus.request(createItems('devices', devicesData));
    console.log(`✅ Created ${devices.length} devices`);

    // ========== 7. RFID CARDS (15 records) ==========
    console.log('💳 Seeding RFID Cards...');
    const rfidCardsData = employees.map((emp, i) => ({
      card_uid: `CARD-${String(i + 1).padStart(6, '0')}`,
      employee_id: emp.id,
      status: 'active',
      issued_at: emp.hire_date,
    }));
    const rfidCards = await directus.request(createItems('rfid_cards', rfidCardsData));
    console.log(`✅ Created ${rfidCards.length} RFID cards`);

    // ========== 8. ATTENDANCE LOGS (Multiple days: 08-17 Nov) ==========
    console.log('📝 Seeding Attendance Logs...');
    const attendanceLogsData: any[] = [];
    
    // Generate logs from Nov 8 to Nov 17 (10 days)
    for (let dayOffset = 0; dayOffset < 10; dayOffset++) {
      const date = new Date('2025-11-08');
      date.setDate(date.getDate() + dayOffset);
      const dateStr = date.toISOString().split('T')[0];
      
      // Each employee has check-in and check-out for each day
      rfidCards.forEach((card, empIndex) => {
        // Skip some random days (simulate absences - 15% absence rate)
        if (Math.random() > 0.85) return;
        
        // Morning check-in (7:30 - 9:00 AM)
        const checkInHour = 7 + Math.floor(Math.random() * 2);
        const checkInMin = Math.floor(Math.random() * 60);
        const checkInTime = `${dateStr}T${String(checkInHour).padStart(2, '0')}:${String(checkInMin).padStart(2, '0')}:00`;
        
        // Evening check-out (17:00 - 19:00) - some days no checkout (5%)
        const hasCheckOut = Math.random() > 0.05;
        const checkOutHour = 17 + Math.floor(Math.random() * 3);
        const checkOutMin = Math.floor(Math.random() * 60);
        const checkOutTime = hasCheckOut 
          ? `${dateStr}T${String(checkOutHour).padStart(2, '0')}:${String(checkOutMin).padStart(2, '0')}:00`
          : null;
        
        // Create a combined log with both check_in and check_out
        attendanceLogsData.push({
          card_uid: card.card_uid,
          rfid_card_id: card.id,
          employee_id: card.employee_id,
          device_id: devices[empIndex % devices.length].id,
          event_type: 'clock_in',
          event_time: checkInTime,
          date: dateStr,
          check_in_time: checkInTime,
          check_out_time: checkOutTime,
          status: hasCheckOut ? 'present' : 'late',
          notes: empIndex % 5 === 0 ? 'Regular shift' : null,
          processed: true,
        });
      });
    }
    
    const attendanceLogs = await directus.request(createItems('attendance_logs', attendanceLogsData));
    console.log(`✅ Created ${attendanceLogs.length} attendance logs (from Nov 8-17)`);

    // ========== 9. WEEKLY SCHEDULES (15 records) ==========
    console.log('📅 Seeding Weekly Schedules...');
    const getWeekDates = (weekOffset: number) => {
      const now = new Date();
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - now.getDay() + weekOffset * 7);
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);
      return {
        start: startOfWeek.toISOString().split('T')[0],
        end: endOfWeek.toISOString().split('T')[0],
      };
    };
    
    const weeklySchedulesData = Array.from({ length: 15 }, (_, i) => {
      const offset = i - 7;
      const dates = getWeekDates(offset);
      const statuses = ['draft', 'scheduled', 'finalized'];
      return {
        week_start: dates.start,
        week_end: dates.end,
        status: statuses[i % 3],
        published_at: i % 3 === 2 ? new Date().toISOString() : null,
        notes: `Schedule for week ${i + 1}`,
      };
    });
    const weeklySchedules = await directus.request(createItems('weekly_schedule', weeklySchedulesData));
    console.log(`✅ Created ${weeklySchedules.length} weekly schedules`);

    // ========== 10. SHIFTS (15 records) ==========
    console.log('🔄 Seeding Shifts...');
    const shiftsData = weeklySchedules.slice(0, 15).map((schedule, i) => {
      const scheduleDate = new Date(schedule.week_start);
      scheduleDate.setDate(scheduleDate.getDate() + (i % 7));
      return {
        schedule_id: schedule.id,
        shift_type_id: shiftTypes[i % shiftTypes.length].id,
        shift_date: scheduleDate.toISOString().split('T')[0],
        start_at: `${scheduleDate.toISOString().split('T')[0]}T${shiftTypes[i % shiftTypes.length].start_time}`,
        end_at: `${scheduleDate.toISOString().split('T')[0]}T${shiftTypes[i % shiftTypes.length].end_time}`,
        total_required: 3 + (i % 5),
        notes: `Shift ${i + 1}`,
      };
    });
    const shifts = await directus.request(createItems('shifts', shiftsData));
    console.log(`✅ Created ${shifts.length} shifts`);

    // ========== 11. SHIFT POSITION REQUIREMENTS (15 records) ==========
    console.log('👔 Seeding Shift Position Requirements...');
    const shiftPosReqData = shifts.map((shift, i) => ({
      shift_id: shift.id,
      position_id: positions[i % positions.length].id,
      required_count: 1 + (i % 3),
      notes: `Need ${1 + (i % 3)} ${positions[i % positions.length].name}`,
    }));
    const shiftPosReqs = await directus.request(createItems('shift_position_requirements', shiftPosReqData));
    console.log(`✅ Created ${shiftPosReqs.length} shift position requirements`);

    // ========== 12. SCHEDULE ASSIGNMENTS (15 records) ==========
    console.log('📋 Seeding Schedule Assignments...');
    const scheduleAssignmentsData = shifts.map((shift, i) => ({
      schedule_id: weeklySchedules[i % weeklySchedules.length].id,
      shift_id: shift.id,
      employee_id: employees[i % employees.length].id,
      position_id: positions[i % positions.length].id,
      status: ['assigned', 'tentative', 'cancelled'][i % 3],
      source: i % 2 === 0 ? 'auto' : 'manual',
      confirmed_by_employee: i % 3 === 0,
      note: `Assignment ${i + 1}`,
    }));
    const scheduleAssignments = await directus.request(createItems('schedule_assignments', scheduleAssignmentsData));
    console.log(`✅ Created ${scheduleAssignments.length} schedule assignments`);

    // ========== 13. EMPLOYEE AVAILABILITY (15 records) ==========
    console.log('📌 Seeding Employee Availability...');
    const employeeAvailabilityData = employees.slice(0, 15).map((emp, i) => ({
      employee_id: emp.id,
      shift_id: shifts[i % shifts.length].id,
      priority: 1 + (i % 5),
      note: `Available for shift ${i + 1}`,
    }));
    const employeeAvailability = await directus.request(createItems('employee_availability', employeeAvailabilityData));
    console.log(`✅ Created ${employeeAvailability.length} employee availability records`);

    // ========== 14. EMPLOYEE AVAILABILITY POSITIONS (15 records) ==========
    console.log('🎯 Seeding Employee Availability Positions...');
    const empAvailPosData = employeeAvailability.map((avail, i) => ({
      availability_id: avail.id,
      position_id: positions[i % positions.length].id,
      preference_order: 1 + (i % 3),
    }));
    const empAvailPos = await directus.request(createItems('employee_availability_positions', empAvailPosData));
    console.log(`✅ Created ${empAvailPos.length} employee availability positions`);

    // ========== 15. ATTENDANCE SHIFTS (15 records) ==========
    console.log('⏱️ Seeding Attendance Shifts...');
    const attendanceShiftsData = scheduleAssignments.slice(0, 15).map((assignment, i) => {
      const shiftData = shifts.find(s => s.id === assignment.shift_id);
      const today = new Date().toISOString().split('T')[0];
      const clockIn = shiftData?.start_at || `${today}T08:00:00`;
      const clockOut = shiftData?.end_at || `${today}T16:00:00`;
      return {
        shift_id: assignment.shift_id,
        schedule_assignment_id: assignment.id,
        employee_id: assignment.employee_id,
        clock_in: clockIn,
        clock_out: i % 2 === 0 ? clockOut : null,
        worked_minutes: i % 2 === 0 ? 480 : null,
        late_minutes: i % 5 === 0 ? 15 : 0,
        early_leave_minutes: 0,
        status: i % 2 === 0 ? 'present' : 'partial',
        manual_adjusted: false,
      };
    });
    const attendanceShifts = await directus.request(createItems('attendance_shifts', attendanceShiftsData));
    console.log(`✅ Created ${attendanceShifts.length} attendance shifts`);

    // ========== 16. ATTENDANCE ADJUSTMENTS (15 records) ==========
    console.log('🔧 Seeding Attendance Adjustments...');
    const attendanceAdjustmentsData = attendanceShifts.slice(0, 15).map((attShift, i) => ({
      attendance_shift_id: attShift.id,
      old_value: { worked_minutes: attShift.worked_minutes },
      proposed_value: { worked_minutes: (attShift.worked_minutes || 0) + 30 },
      status: ['pending', 'approved', 'rejected'][i % 3],
      reason: `Adjustment request ${i + 1}`,
    }));
    const attendanceAdjustments = await directus.request(createItems('attendance_adjustments', attendanceAdjustmentsData));
    console.log(`✅ Created ${attendanceAdjustments.length} attendance adjustments`);

    // ========== 17. SCHEDULE CHANGE REQUESTS (15 records) ==========
    console.log('🔄 Seeding Schedule Change Requests...');
    const scheduleChangeRequestsData = employees.slice(0, 15).map((emp, i) => ({
      requester_id: emp.id,
      type: ['shift_swap', 'pass_shift', 'day_off'][i % 3],
      from_shift_id: shifts[i % shifts.length].id,
      to_shift_id: i % 3 === 0 ? shifts[(i + 1) % shifts.length].id : null,
      target_employee_id: i % 3 === 0 ? employees[(i + 1) % employees.length].id : null,
      reason: `Change request ${i + 1}`,
      status: ['pending', 'approved', 'rejected'][i % 3],
    }));
    const scheduleChangeRequests = await directus.request(createItems('schedule_change_requests', scheduleChangeRequestsData));
    console.log(`✅ Created ${scheduleChangeRequests.length} schedule change requests`);

    // ========== 18. DEDUCTIONS (15 records) ==========
    console.log('💸 Seeding Deductions...');
    const deductionsData = employees.slice(0, 15).map((emp, i) => ({
      employee_id: emp.id,
      type: ['advance', 'penalty', 'expense'][i % 3],
      amount: 100000 + (i * 50000),
      currency: 'VND',
      related_shift_id: i % 2 === 0 ? shifts[i % shifts.length].id : null,
      note: `Deduction ${i + 1}`,
      status: ['pending', 'applied', 'reimbursed'][i % 3],
    }));
    const deductions = await directus.request(createItems('deductions', deductionsData));
    console.log(`✅ Created ${deductions.length} deductions`);

    // ========== 19. SALARY REQUESTS (15 records) ==========
    console.log('💰 Seeding Salary Requests...');
    const salaryRequestsData = employees.slice(0, 15).map((emp, i) => ({
      employee_id: emp.id,
      current_scheme_id: emp.scheme_id,
      proposed_scheme_id: schemes[(i + 1) % schemes.length].id,
      current_rate: schemes[i % schemes.length].rate,
      proposed_rate: schemes[i % schemes.length].rate + 5000,
      request_date: new Date().toISOString(),
      status: ['pending', 'approved', 'rejected'][i % 3],
      note: `Salary increase request ${i + 1}`,
    }));
    const salaryRequests = await directus.request(createItems('salary_requests', salaryRequestsData));
    console.log(`✅ Created ${salaryRequests.length} salary requests`);

    // ========== 20. MONTHLY EMPLOYEE STATS (15 records) ==========
    console.log('📊 Seeding Monthly Employee Stats...');
    const monthlyStatsData = employees.slice(0, 15).map((emp, i) => {
      const month = new Date();
      month.setMonth(month.getMonth() - (i % 12));
      return {
        employee_id: emp.id,
        month: `${month.getFullYear()}-${String(month.getMonth() + 1).padStart(2, '0')}`,
        total_shifts_assigned: 20 + (i % 10),
        total_shifts_worked: 18 + (i % 8),
        swaps_count: i % 3,
        pass_count: i % 2,
        off_count: i % 4,
        total_worked_minutes: (18 + (i % 8)) * 480,
        overtime_minutes: i * 30,
        late_minutes: i * 15,
        absent_count: i % 2,
      };
    });
    const monthlyStats = await directus.request(createItems('monthly_employee_stats', monthlyStatsData));
    console.log(`✅ Created ${monthlyStats.length} monthly employee stats`);

    console.log('\n🎉 Seed completed successfully!');
    console.log(`
    ═══════════════════════════════════════════════════════════════
                          SEED SUMMARY
    ═══════════════════════════════════════════════════════════════
    📍 Positions:                        ${positions.length}
    💰 Salary Schemes:                   ${schemes.length}
    👥 Employees:                        ${employees.length}
    📄 Contracts:                        ${contracts.length}
    ⏰ Shift Types:                      ${shiftTypes.length}
    📱 Devices:                          ${devices.length}
    💳 RFID Cards:                       ${rfidCards.length}
    📝 Attendance Logs:                  ${attendanceLogs.length}
    📅 Weekly Schedules:                 ${weeklySchedules.length}
    🔄 Shifts:                           ${shifts.length}
    👔 Shift Position Requirements:      ${shiftPosReqs.length}
    📋 Schedule Assignments:             ${scheduleAssignments.length}
    📌 Employee Availability:            ${employeeAvailability.length}
    🎯 Employee Availability Positions:  ${empAvailPos.length}
    ⏱️  Attendance Shifts:                ${attendanceShifts.length}
    🔧 Attendance Adjustments:           ${attendanceAdjustments.length}
    🔄 Schedule Change Requests:         ${scheduleChangeRequests.length}
    💸 Deductions:                       ${deductions.length}
    💰 Salary Requests:                  ${salaryRequests.length}
    📊 Monthly Employee Stats:           ${monthlyStats.length}
    ───────────────────────────────────────────────────────────────
    TOTAL RECORDS:                       ${positions.length + schemes.length + employees.length + contracts.length + shiftTypes.length + devices.length + rfidCards.length + attendanceLogs.length + weeklySchedules.length + shifts.length + shiftPosReqs.length + scheduleAssignments.length + employeeAvailability.length + empAvailPos.length + attendanceShifts.length + attendanceAdjustments.length + scheduleChangeRequests.length + deductions.length + salaryRequests.length + monthlyStats.length}
    ═══════════════════════════════════════════════════════════════
    `);

    // ========== MONTHLY PAYROLLS ==========
    console.log('💵 Seeding Monthly Payrolls...');
    const currentMonth = '2025-11';
    const payrollsData = employees.map((emp: any, idx: number) => {
      const scheme = schemes[idx];
      const baseSalary = scheme.pay_type === 'monthly' ? scheme.rate : scheme.rate * 160; // 160 hours/month
      const allowances = Math.floor(Math.random() * 1000000) + 500000; // 500K-1.5M
      const bonuses = Math.random() > 0.5 ? Math.floor(Math.random() * 2000000) : 0; // 0-2M random bonus
      const overtimePay = Math.floor(Math.random() * 500000); // 0-500K
      const deductions = Math.floor(Math.random() * 300000); // 0-300K
      const penalties = Math.random() > 0.7 ? Math.floor(Math.random() * 200000) : 0; // 30% chance of penalty
      
      const grossSalary = baseSalary + allowances + bonuses + overtimePay;
      const netSalary = grossSalary - deductions - penalties;

      return {
        employee_id: emp.id,
        month: currentMonth,
        salary_scheme_id: scheme.id,
        base_salary: baseSalary,
        allowances,
        bonuses,
        overtime_pay: overtimePay,
        deductions,
        penalties,
        gross_salary: grossSalary,
        net_salary: netSalary,
        total_work_hours: 160 + Math.floor(Math.random() * 20),
        overtime_hours: Math.floor(Math.random() * 10),
        late_minutes: Math.floor(Math.random() * 120),
        absent_days: Math.floor(Math.random() * 3),
        notes: idx % 3 === 0 ? 'Nhân viên xuất sắc tháng này' : null,
        status: ['draft', 'pending_approval', 'approved', 'paid'][Math.floor(Math.random() * 4)],
      };
    });
    const payrolls = await directus.request(createItems('monthly_payrolls', payrollsData));
    console.log(`✅ Created ${payrolls.length} monthly payrolls for ${currentMonth}`);

    console.log(`
    ═══════════════════════════════════════════════════════════════
    ✨ Seed Complete! Summary:
    ═══════════════════════════════════════════════════════════════
       📍 Positions: ${positions.length}
       💰 Salary Schemes: ${schemes.length}
       👤 Employees: ${employees.length}
       🏢 Devices: ${devices.length}
       💳 RFID Cards: ${rfidCards.length}
       🕐 Shift Types: ${shiftTypes.length}
       📅 Weekly Schedule: ${weeklySchedules.length}
       🔄 Shifts: ${shifts.length}
       ⏰ Attendance Logs: ${attendanceLogs.length}
       💵 Monthly Payrolls: ${payrolls.length}
    ═══════════════════════════════════════════════════════════════
    `);

  } catch (error) {
    console.error('❌ Seed failed:', error);
    throw error;
  }
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});

