/**
 * Seed Attendance Data for November 2025
 * Creates realistic attendance records matching attendance_shifts schema
 */

const axios = require('axios');
const crypto = require('crypto');

const DIRECTUS_URL = 'http://localhost:8055';
const EMAIL = 'admin@example.com';
const PASSWORD = 'Admin123!';

const EMPLOYEE_ID = 'f7d4b1d1-bfe3-11f0-aee9-d69d6c8e6d79';
const MONTH = '2025-11';

// Generate working days for November 2025 (skip weekends)
function getWorkingDays() {
    const days = [];
    const year = 2025;
    const month = 11; // November

    for (let day = 1; day <= 30; day++) {
        const date = new Date(year, month - 1, day);
        const dayOfWeek = date.getDay();

        // Skip weekends (0 = Sunday, 6 = Saturday)
        if (dayOfWeek !== 0 && dayOfWeek !== 6) {
            days.push(day);
        }
    }

    return days;
}

// Generate attendance record
function createAttendanceRecord(day, hasIssue = false) {
    const dateStr = `${MONTH}-${day.toString().padStart(2, '0')}`;

    // Standard work hours: 8:00 - 17:00 (9 hours with 1h lunch = 8h work)
    let clockIn = `${dateStr}T08:00:00`;
    let clockOut = `${dateStr}T17:00:00`;
    let lateMinutes = 0;
    let earlyLeaveMinutes = 0;

    if (hasIssue) {
        // Random issue: late or early leave
        if (Math.random() > 0.5) {
            // Late 15-45 minutes
            lateMinutes = Math.floor(Math.random() * 30) + 15;
            const lateHour = 8;
            const lateMin = lateMinutes;
            clockIn = `${dateStr}T${lateHour.toString().padStart(2, '0')}:${lateMin.toString().padStart(2, '0')}:00`;
        } else {
            // Early leave 10-30 minutes
            earlyLeaveMinutes = Math.floor(Math.random() * 20) + 10;
            const leaveHour = 16;
            const leaveMin = 60 - earlyLeaveMinutes;
            clockOut = `${dateStr}T${leaveHour.toString().padStart(2, '0')}:${leaveMin.toString().padStart(2, '0')}:00`;
        }
    }

    // Calculate work minutes (total time - 60 min lunch)
    const startTime = new Date(clockIn);
    const endTime = new Date(clockOut);
    const totalMinutes = (endTime - startTime) / (1000 * 60);
    const workedMinutes = totalMinutes - 60; // subtract lunch

    return {
        id: crypto.randomUUID(),
        employee_id: EMPLOYEE_ID,
        shift_id: null,
        schedule_assignment_id: null,
        clock_in: clockIn,
        clock_out: clockOut,
        worked_minutes: Math.round(workedMinutes),
        late_minutes: lateMinutes,
        early_leave_minutes: earlyLeaveMinutes,
        status: 'present',
        manual_adjusted: false,
        notes: hasIssue ?
            (lateMinutes > 0 ? `Đi muộn ${lateMinutes} phút` : `Về sớm ${earlyLeaveMinutes} phút`)
            : null,
        created_at: new Date().toISOString()
    };
}

async function seedAttendanceData() {
    try {
        // 1. Login
        console.log('🔐 Logging in to Directus...');
        const loginRes = await axios.post(`${DIRECTUS_URL}/auth/login`, {
            email: EMAIL,
            password: PASSWORD
        });

        const token = loginRes.data.data.access_token;
        console.log('✅ Logged in!\n');

        const headers = { Authorization: `Bearer ${token}` };

        // 2. Get working days
        const workingDays = getWorkingDays();
        console.log(`📅 November 2025 has ${workingDays.length} working days\n`);

        // 3. Create attendance records
        console.log('📝 Creating attendance records...\n');

        let created = 0;
        let withIssues = 0;

        for (const day of workingDays) {
            // 20% chance of having late/early issue
            const hasIssue = Math.random() < 0.2;
            const record = createAttendanceRecord(day, hasIssue);

            try {
                await axios.post(
                    `${DIRECTUS_URL}/items/attendance_shifts`,
                    record,
                    { headers }
                );

                created++;
                if (hasIssue) {
                    withIssues++;
                    console.log(`  ⚠️  Day ${day}: ${record.late_minutes}min late / ${record.early_leave_minutes}min early (${(record.worked_minutes / 60).toFixed(1)}h)`);
                } else {
                    console.log(`  ✅ Day ${day}: Normal (${(record.worked_minutes / 60).toFixed(1)}h)`);
                }
            } catch (err) {
                console.log(`  ❌ Failed day ${day}:`, err.response?.data?.errors?.[0]?.message || err.message);
            }
        }

        console.log('\n🎉 Seeding completed!');
        console.log(`\n📊 Summary:`);
        console.log(`   Total created: ${created}/${workingDays.length} records`);
        console.log(`   With issues: ${withIssues} records (late/early)`);
        console.log(`   Perfect days: ${created - withIssues} records`);

        // Expected salary calculation
        const totalWorkDays = created;
        const baseSalary = 1400000;
        const dailyRate = baseSalary / 26;
        const expectedGross = dailyRate * totalWorkDays;

        console.log(`\n💰 Expected Payroll:`);
        console.log(`   Base salary: ${baseSalary.toLocaleString()} VNĐ`);
        console.log(`   Work days: ${totalWorkDays}/26 days`);
        console.log(`   Expected gross: ~${Math.round(expectedGross).toLocaleString()} VNĐ`);
        console.log(`   Penalties: Will be calculated (10,000 VNĐ/hour late/early)`);

        console.log('\n🚀 Next steps:');
        console.log('1. Delete old payroll: http://localhost:3000/salary');
        console.log('2. Generate new payroll for November 2025');
        console.log('3. See real salary with penalties!');

    } catch (error) {
        console.error('\n❌ Seed error:', error.response?.data || error.message);
        process.exit(1);
    }
}

seedAttendanceData();
