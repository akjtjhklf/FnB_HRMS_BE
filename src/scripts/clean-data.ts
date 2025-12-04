import { ensureAuth } from "../utils/directusClient";
import { ShiftRepository } from "../modules/shifts/shift.repository";
import { ShiftPositionRequirementRepository } from "../modules/shift-position-requirements/shift-position-requirement.repository";
import { EmployeeAvailabilityRepository } from "../modules/employee-availability/employee-availability.repository";
import { WeeklyScheduleRepository } from "../modules/weekly-schedule/weekly-schedule.repository";

async function clean() {
  try {
    console.log("🚀 Starting cleanup script...");
    await ensureAuth();

    const shiftRepo = new ShiftRepository();
    const requirementRepo = new ShiftPositionRequirementRepository();
    const availabilityRepo = new EmployeeAvailabilityRepository();
    const weeklyScheduleRepo = new WeeklyScheduleRepository();

    const weekStart = "2025-12-01";
    const weekEnd = "2025-12-07";

    // 1. Find Shifts for the week
    const shifts = await shiftRepo.findAll({
      filter: {
        shift_date: { _gte: weekStart, _lte: weekEnd }
      },
      limit: -1
    });
    console.log(`Found ${shifts.length} shifts to delete.`);

    if (shifts.length > 0) {
        const shiftIds = shifts.map(s => s.id);

        // 2. Delete Requirements
        const reqs = await requirementRepo.findAll({
            filter: { shift_id: { _in: shiftIds } },
            limit: -1
        });
        if (reqs.length > 0) {
            console.log(`Deleting ${reqs.length} requirements...`);
            await requirementRepo.deleteMany(reqs.map(r => r.id));
        }

        // 3. Delete Availabilities
        const avails = await availabilityRepo.findAll({
            filter: { shift_id: { _in: shiftIds } },
            limit: -1
        });
        if (avails.length > 0) {
            console.log(`Deleting ${avails.length} availabilities...`);
            await availabilityRepo.deleteMany(avails.map(a => a.id));
        }

        // 4. Delete Shifts
        console.log(`Deleting ${shifts.length} shifts...`);
        await shiftRepo.deleteMany(shiftIds);
    }

    // 5. Delete Weekly Schedule
    const schedules = await weeklyScheduleRepo.findAll({
        filter: { week_start: { _eq: weekStart } }
    });
    if (schedules.length > 0) {
        console.log(`Deleting ${schedules.length} weekly schedules...`);
        await weeklyScheduleRepo.deleteMany(schedules.map(s => s.id));
    }

    console.log("✅ Cleanup completed successfully!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Cleanup failed:", error);
    process.exit(1);
  }
}

clean();
