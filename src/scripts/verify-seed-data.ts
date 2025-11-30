import { ensureAuth } from "../utils/directusClient";
import { ShiftRepository } from "../modules/shifts/shift.repository";
import { EmployeeAvailabilityRepository } from "../modules/employee-availability/employee-availability.repository";
import { WeeklyScheduleRepository } from "../modules/weekly-schedule/weekly-schedule.repository";

async function verify() {
  try {
    console.log("🚀 Starting verification...");
    await ensureAuth();

    const shiftRepo = new ShiftRepository();
    const availabilityRepo = new EmployeeAvailabilityRepository();
    const weeklyScheduleRepo = new WeeklyScheduleRepository();

    const weekStart = "2025-12-01";
    const weekEnd = "2025-12-07";

    // 1. Check Weekly Schedule
    const schedules = await weeklyScheduleRepo.findAll({
      filter: { week_start: { _eq: weekStart } },
    });
    console.log(`📅 Weekly Schedules found for ${weekStart}: ${schedules.length}`);
    if (schedules.length > 0) {
        console.log(`   ID: ${schedules[0].id}, Status: ${schedules[0].status}`);
    }

    // 2. Check Shifts
    const shifts = await shiftRepo.findAll({
      filter: {
        shift_date: { _gte: weekStart, _lte: weekEnd }
      },
      limit: 100
    });
    console.log(`🕒 Shifts found between ${weekStart} and ${weekEnd}: ${shifts.length}`);
    if (shifts.length > 0) {
        console.log(`   Sample Shift: ID=${shifts[0].id}, Date=${shifts[0].shift_date}, Type=${shifts[0].shift_type_id}`);
    }

    // 3. Check Availabilities
    const availabilities = await availabilityRepo.findAll({
        limit: 100
    });
    // Filter manually if needed or trust the count if small
    // Let's count availabilities linked to these shifts
    const shiftIds = shifts.map(s => s.id);
    const relevantAvailabilities = await availabilityRepo.findAll({
        filter: {
            shift_id: { _in: shiftIds }
        },
        limit: -1
    });

    console.log(`✅ Availabilities found for these shifts: ${relevantAvailabilities.length}`);

    process.exit(0);
  } catch (error) {
    console.error("❌ Verification failed:", error);
    process.exit(1);
  }
}

verify();
