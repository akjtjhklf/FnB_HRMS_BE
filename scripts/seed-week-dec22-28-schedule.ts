/**
 * SEED WEEK DEC 22-28 - SCHEDULE ONLY
 * Copy từ seed-demo-week-dec15-21.ts, chỉ thay đổi config và bỏ phases không cần
 */

import 'dotenv/config';
import { directus, ensureAuth, getAuthToken } from '../src/utils/directusClient';
import { createItems, readMe, readItems, deleteItems, readRoles, updateItem } from '@directus/sdk';

const CONFIG = {
    TARGET_WEEK_START: '2025-12-22',
    TARGET_WEEK_END: '2025-12-28',
};

function formatDateTime(date: string, time: string): string {
    return `${date}T${time}`;
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

const SHIFT_REQUIREMENTS: Record<string, Array<{ positionIndex: number; count: number }>> = {
    'Ca sáng': [
        { positionIndex: 0, count: 1 },
        { positionIndex: 1, count: 1 },
        { positionIndex: 2, count: 1 },
        { positionIndex: 3, count: 1 },
    ],
    'Ca trưa': [
        { positionIndex: 0, count: 1 },
        { positionIndex: 1, count: 1 },
        { positionIndex: 2, count: 2 },
        { positionIndex: 3, count: 1 },
        { positionIndex: 4, count: 1 },
    ],
    'Ca chiều': [
        { positionIndex: 1, count: 1 },
        { positionIndex: 2, count: 2 },
        { positionIndex: 3, count: 1 },
        { positionIndex: 4, count: 1 },
    ],
    'Ca khuya': [
        { positionIndex: 1, count: 1 },
        { positionIndex: 2, count: 1 },
        { positionIndex: 3, count: 1 },
    ],
};

async function seedWeek22_28() {
    console.log('SEED WEEK DEC 22-28 - SCHEDULE ONLY\n');
    console.log(`Target Week: ${CONFIG.TARGET_WEEK_START} -> ${CONFIG.TARGET_WEEK_END}\n`);

    try {
        await ensureAuth();
        const me = await directus.request(readMe());
        console.log(`Authenticated as: ${me.email}\n`);

        // Get existing master data
        const positions: any[] = await directus.request(readItems('positions', { limit: -1, fields: ['id', 'name'] }));
        console.log(`Found ${positions.length} positions`);

        const shiftTypes: any[] = await directus.request(readItems('shift_types', {
            limit: -1,
            fields: ['id', 'name', 'start_time', 'end_time', 'cross_midnight']
        }));
        console.log(`Found ${shiftTypes.length} shift types`);

        const employees: any[] = await directus.request(readItems('employees', {
            limit: -1,
            fields: ['id', 'employee_code', 'email', 'first_name', 'last_name', 'full_name', 'user_id', 'status'],
            filter: { status: { _eq: 'active' } }
        }));
        console.log(`Found ${employees.length} active employees`);

        if (positions.length === 0 || shiftTypes.length === 0 || employees.length === 0) {
            throw new Error('Missing required data! Run seed-demo-week-dec15-21.ts first.');
        }

        // =====================================================
        // Create User Accounts for Employees (if needed)
        // =====================================================
        console.log('\n[USER ACCOUNTS] Creating user accounts for employees...');

        const directusUrl = process.env.DIRECTUS_URL || 'http://localhost:8055';
        const token = await getAuthToken();

        // Get/Create Employee Role
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
                    description: 'Vai tro danh cho nhan vien',
                    app_access: true,
                    admin_access: false,
                }),
            });

            if (roleResponse.ok) {
                const roleData = await roleResponse.json();
                employeeRole = roleData.data;
                console.log(`   Created Employee role: ${employeeRole.id}`);
            }
        } else {
            console.log(`   Found Employee role: ${employeeRole.id}`);
        }

        // Create users for employees without user_id
        if (employeeRole) {
            let usersCreated = 0;
            for (const emp of employees) {
                if (!emp.email || emp.user_id) continue;

                try {
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
                            last_name: emp.last_name || '',
                            role: employeeRole.id,
                            status: 'active',
                        }),
                    });

                    if (createUserResponse.ok) {
                        const userData = await createUserResponse.json();
                        await directus.request(updateItem('employees', emp.id, { user_id: userData.data.id }));
                        usersCreated++;
                    }
                } catch (err: any) {
                    // Skip errors
                }
            }
            console.log(`   Users created: ${usersCreated}`);
            if (usersCreated > 0) console.log(`   Default password: Employee123!`);
        }

        // =====================================================
        // CLEANUP: Xoa data tuan 22-28 cu
        // =====================================================
        console.log('\n[CLEANUP] Xoa data tuan 22-28 cu...');
        const existingSchedules: any[] = await directus.request(readItems('weekly_schedule', {
            limit: -1, fields: ['id'], filter: { week_start: { _eq: CONFIG.TARGET_WEEK_START } }
        }));

        for (const schedule of existingSchedules) {
            const oldShifts: any[] = await directus.request(readItems('shifts', {
                limit: -1, fields: ['id'], filter: { schedule_id: { _eq: schedule.id } }
            }));

            if (oldShifts.length > 0) {
                const shiftIds = oldShifts.map(s => s.id);

                // Delete availabilities and positions
                const oldAvails: any[] = await directus.request(readItems('employee_availability', {
                    limit: -1, fields: ['id'], filter: { shift_id: { _in: shiftIds } }
                }));

                if (oldAvails.length > 0) {
                    const availIds = oldAvails.map(a => a.id);
                    const oldAvailPos: any[] = await directus.request(readItems('employee_availability_positions', {
                        limit: -1, fields: ['id'], filter: { availability_id: { _in: availIds } }
                    }));
                    if (oldAvailPos.length > 0) {
                        await directus.request(deleteItems('employee_availability_positions', oldAvailPos.map(p => p.id)));
                        console.log(`   Deleted ${oldAvailPos.length} availability positions`);
                    }
                    await directus.request(deleteItems('employee_availability', availIds));
                    console.log(`   Deleted ${oldAvails.length} availabilities`);
                }

                // Delete requirements
                const oldReqs: any[] = await directus.request(readItems('shift_position_requirements', {
                    limit: -1, fields: ['id'], filter: { shift_id: { _in: shiftIds } }
                }));
                if (oldReqs.length > 0) {
                    await directus.request(deleteItems('shift_position_requirements', oldReqs.map(r => r.id)));
                    console.log(`   Deleted ${oldReqs.length} shift requirements`);
                }

                // Delete shifts
                await directus.request(deleteItems('shifts', shiftIds));
                console.log(`   Deleted ${oldShifts.length} shifts`);
            }

            // Delete schedule
            await directus.request(deleteItems('weekly_schedule', [schedule.id]));
        }
        console.log(`[CLEANUP] Done - cleaned ${existingSchedules.length} schedule(s)\n`);

        // =====================================================
        // Create Weekly Schedule
        // =====================================================
        console.log('[1] Creating Weekly Schedule...');
        const weeklyScheduleData = [{
            name: `Lich tuan 22-28/12/2025 (Demo Auto Schedule)`,
            week_start: CONFIG.TARGET_WEEK_START,
            week_end: CONFIG.TARGET_WEEK_END,
            status: 'scheduled',
        }];
        const weeklySchedules = await directus.request(createItems('weekly_schedule', weeklyScheduleData));
        const weeklySchedule = weeklySchedules[0];
        console.log(`   Created weekly schedule: ${weeklySchedule.id}`);

        // =====================================================
        // Create Shifts
        // =====================================================
        console.log('\n[2] Creating Shifts...');
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

        await directus.request(createItems('shifts', shiftsData));

        // Refetch to get all shifts
        const allShifts: any[] = await directus.request(readItems('shifts', {
            limit: -1,
            fields: ['id', 'shift_type_id'],
            filter: { schedule_id: { _eq: weeklySchedule.id } }
        }));
        console.log(`   Created ${allShifts.length} shifts`);

        // =====================================================
        // Create Shift Position Requirements
        // =====================================================
        console.log('\n[3] Creating Shift Position Requirements...');
        const shiftPosReqData: any[] = [];

        allShifts.forEach((shift: any) => {
            const shiftType = shiftTypes.find((st: any) => st.id === shift.shift_type_id);
            if (!shiftType) return;
            const requirements = SHIFT_REQUIREMENTS[shiftType.name] || [];
            requirements.forEach((req) => {
                shiftPosReqData.push({
                    shift_id: shift.id,
                    position_id: positions[req.positionIndex].id,
                    required_count: req.count,
                });
            });
        });

        await directus.request(createItems('shift_position_requirements', shiftPosReqData));
        console.log(`   Created ${shiftPosReqData.length} shift requirements`);

        // =====================================================
        // Create Employee Availability (90% rate)
        // =====================================================
        console.log('\n[4] Creating Employee Availabilities (90% rate)...');
        const availabilityData: any[] = [];

        // Moi nhan vien dang ky 90% cac ca
        employees.forEach((emp: any, empIdx: number) => {
            allShifts.forEach((shift: any, shiftIdx: number) => {
                // 90% chance to be available
                const combinedIndex = empIdx * 100 + shiftIdx;
                const isAvailable = (combinedIndex % 10) < 9; // 90%

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

        // Insert one by one to avoid duplicates
        const availabilities: any[] = [];
        for (const item of validAvailabilityData) {
            try {
                const created = await directus.request(createItems('employee_availability', [item]));
                availabilities.push(...created);
            } catch (err: any) {
                // Skip duplicates
            }
        }
        console.log(`   Created ${availabilities.length} employee availabilities`);

        // =====================================================
        // Create Availability Positions (full positions)
        // =====================================================
        console.log('\n[5] Creating Availability Positions (full positions)...');
        const availPosData: any[] = [];

        // Moi availability dang ky TAT CA positions
        availabilities.forEach((avail: any) => {
            positions.forEach((pos: any, posIdx: number) => {
                availPosData.push({
                    availability_id: avail.id,
                    position_id: pos.id,
                    preference_order: posIdx + 1,
                });
            });
        });

        await directus.request(createItems('employee_availability_positions', availPosData));
        console.log(`   Created ${availPosData.length} availability positions`);

        // Summary
        console.log('\n===============================================');
        console.log('            SEED COMPLETE!');
        console.log('===============================================');
        console.log(`
    Weekly Schedule: 1 (status: scheduled)
    Shifts: ${allShifts.length}
    Requirements: ${shiftPosReqData.length}
    Availabilities: ${availabilities.length}
    Avail Positions: ${availPosData.length}
    
    Ready for Auto Schedule Demo!
    `);

    } catch (error) {
        console.error('Seed failed:', error);
        throw error;
    }
}

seedWeek22_28().catch((e) => {
    console.error('Fatal error:', e);
    process.exit(1);
});
