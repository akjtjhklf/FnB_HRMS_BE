import { ensureAuth } from "../utils/directusClient";
import { ShiftPositionRequirementRepository } from "../modules/shift-position-requirements/shift-position-requirement.repository";
import { EmployeeAvailabilityRepository } from "../modules/employee-availability/employee-availability.repository";

async function debug() {
  try {
    console.log("🚀 Starting debug script...");
    await ensureAuth();

    const requirementRepo = new ShiftPositionRequirementRepository();
    const availabilityRepo = new EmployeeAvailabilityRepository();

    // 1. List ALL Requirements
    console.log("--- Checking Shift Position Requirements ---");
    const reqs = await requirementRepo.findAll({ limit: 10 });
    console.log(`Total Requirements found (limit 10): ${reqs.length}`);
    if (reqs.length > 0) {
        console.log("Sample Requirement:", JSON.stringify(reqs[0], null, 2));
    }

    // 2. List ALL Availabilities
    console.log("--- Checking Employee Availabilities ---");
    const avails = await availabilityRepo.findAll({ limit: 10 });
    console.log(`Total Availabilities found (limit 10): ${avails.length}`);
    if (avails.length > 0) {
        console.log("Sample Availability:", JSON.stringify(avails[0], null, 2));
    }

    // 3. Check specific shift from User's JSON
    const targetShiftId = "0a8b6aa1-ce15-11f0-9a6b-be8d80972d88"; // Morning Dec 1
    console.log(`--- Checking Target Shift: ${targetShiftId} ---`);
    
    const reqsForTarget = await requirementRepo.findAll({
        filter: { shift_id: { _eq: targetShiftId } }
    });
    console.log(`Requirements for target shift: ${reqsForTarget.length}`);

    const availsForTarget = await availabilityRepo.findAll({
        filter: { shift_id: { _eq: targetShiftId } }
    });
    console.log(`Availabilities for target shift: ${availsForTarget.length}`);

    // 4. Check for duplicate shifts on Dec 1
    const shiftRepo = new (require("../modules/shifts/shift.repository").ShiftRepository)();
    const duplicateShifts = await shiftRepo.findAll({
        filter: { 
            shift_date: { _eq: "2025-12-01" },
            // shift_type_id: { _eq: "db715ce3-ce0f-11f0-9a6b-be8d80972d88" } // Morning
        }
    });
    console.log(`Total shifts on 2025-12-01: ${duplicateShifts.length}`);
    duplicateShifts.forEach((s: any) => {
        console.log(` - Shift: ${s.id}, Type: ${s.shift_type_id}, Created: ${s.created_at}`);
    });
    process.exit(0);
  } catch (error) {
    console.error("❌ Debug failed:", error);
    process.exit(1);
  }
}

debug();
