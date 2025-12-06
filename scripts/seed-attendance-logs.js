/**
 * Seed Attendance Logs for Testing Dashboard Recent Activities
 */

const axios = require('axios');
const crypto = require('crypto');

const DIRECTUS_URL = 'http://localhost:8055';
const EMAIL = 'admin@example.com';
const PASSWORD = 'Admin123!';

async function getAuthToken() {
    try {
        const res = await axios.post(`${DIRECTUS_URL}/auth/login`, {
            email: EMAIL,
            password: PASSWORD
        });
        return res.data.data.access_token;
    } catch (err) {
        console.error('Auth failed:', err.message);
        process.exit(1);
    }
}

async function getEmployees(token) {
    const res = await axios.get(`${DIRECTUS_URL}/items/employees`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { limit: 10, fields: ['id', 'first_name', 'last_name'] }
    });
    return res.data.data;
}

async function seedAttendanceLogs(token, employees) {
    const logs = [];
    const now = new Date();
    
    // Create logs for today and yesterday for each employee
    for (const emp of employees) {
        // Today check-in (some late, some on-time)
        const isLate = Math.random() > 0.7;
        const checkInHour = isLate ? 8 + Math.floor(Math.random() * 2) : 7 + Math.floor(Math.random() * 1);
        const checkInMin = Math.floor(Math.random() * 60);
        
        const todayCheckIn = new Date(now);
        todayCheckIn.setHours(checkInHour, checkInMin, 0, 0);
        
        logs.push({
            id: crypto.randomUUID(),
            employee_id: emp.id,
            card_uid: `CARD_${emp.id.substring(0, 8)}`,
            event_type: 'clock_in',
            event_time: todayCheckIn.toISOString(),
            is_late: isLate,
            notes: isLate ? 'Đi muộn' : null
        });

        // Today check-out (if past 5pm)
        if (now.getHours() >= 17) {
            const checkOutHour = 17 + Math.floor(Math.random() * 2);
            const checkOutMin = Math.floor(Math.random() * 60);
            
            const todayCheckOut = new Date(now);
            todayCheckOut.setHours(checkOutHour, checkOutMin, 0, 0);
            
            logs.push({
                id: crypto.randomUUID(),
                employee_id: emp.id,
                card_uid: `CARD_${emp.id.substring(0, 8)}`,
                event_type: 'clock_out',
                event_time: todayCheckOut.toISOString(),
                is_late: false,
                notes: null
            });
        }

        // Yesterday logs
        const yesterday = new Date(now);
        yesterday.setDate(yesterday.getDate() - 1);
        
        const yestCheckIn = new Date(yesterday);
        yestCheckIn.setHours(8, Math.floor(Math.random() * 30), 0, 0);
        
        logs.push({
            id: crypto.randomUUID(),
            employee_id: emp.id,
            card_uid: `CARD_${emp.id.substring(0, 8)}`,
            event_type: 'clock_in',
            event_time: yestCheckIn.toISOString(),
            is_late: false,
            notes: null
        });

        const yestCheckOut = new Date(yesterday);
        yestCheckOut.setHours(17 + Math.floor(Math.random() * 2), Math.floor(Math.random() * 60), 0, 0);
        
        logs.push({
            id: crypto.randomUUID(),
            employee_id: emp.id,
            card_uid: `CARD_${emp.id.substring(0, 8)}`,
            event_type: 'clock_out',
            event_time: yestCheckOut.toISOString(),
            is_late: false,
            notes: null
        });
    }

    console.log(`Creating ${logs.length} attendance logs...`);

    // Insert logs in batches
    for (const log of logs) {
        try {
            await axios.post(`${DIRECTUS_URL}/items/attendance_logs`, log, {
                headers: { Authorization: `Bearer ${token}` }
            });
            console.log(`✓ Created log for ${log.event_type} at ${log.event_time}`);
        } catch (err) {
            console.error(`✗ Failed to create log:`, err.response?.data?.errors || err.message);
        }
    }

    console.log('\n✅ Seeding complete!');
}

async function main() {
    console.log('🌱 Seeding Attendance Logs...\n');

    const token = await getAuthToken();
    console.log('✓ Authenticated\n');

    const employees = await getEmployees(token);
    console.log(`Found ${employees.length} employees\n`);

    if (employees.length === 0) {
        console.log('No employees found. Please create employees first.');
        return;
    }

    await seedAttendanceLogs(token, employees);
}

main().catch(console.error);
