import { ensureAuth } from "../utils/directusClient";
import { EmployeeRepository } from "../modules/employees/employee.repository";
import { ShiftTypeRepository } from "../modules/shift-types/shift-type.repository";
import { ShiftRepository } from "../modules/shifts/shift.repository";
import { EmployeeAvailabilityRepository } from "../modules/employee-availability/employee-availability.repository";
import { PositionRepository } from "../modules/positions/position.repository";
import { WeeklyScheduleRepository } from "../modules/weekly-schedule/weekly-schedule.repository";
import { ShiftPositionRequirementRepository } from "../modules/shift-position-requirements/shift-position-requirement.repository";
import { EmployeeAvailabilityPositionsRepository } from "../modules/employee-availability-positions/employee-availability-position.repository";

import { ShiftType } from "../modules/shift-types/shift-type.model";
import { Employee } from "../modules/employees/employee.model";
import { Position } from "../modules/positions/position.model";

async function seed() {
  try {
    console.log("🚀 Starting refined seed script...");
    await ensureAuth();

    const employeeRepo = new EmployeeRepository();
    const shiftTypeRepo = new ShiftTypeRepository();
    const shiftRepo = new ShiftRepository();
    const availabilityRepo = new EmployeeAvailabilityRepository();
    const positionRepo = new PositionRepository();
    const weeklyScheduleRepo = new WeeklyScheduleRepository();
    const requirementRepo = new ShiftPositionRequirementRepository();
    const availabilityPositionRepo = new EmployeeAvailabilityPositionsRepository();

    // 1. Create Positions
    console.log("Creating Positions...");
    const positionsData = [
      { name: "Server", description: "Waitstaff" },
      { name: "Bartender", description: "Bar staff" },
      { name: "Chef", description: "Kitchen staff" },
    ];

    const positions: Position[] = [];
    for (const data of positionsData) {
      // Check if exists by name (manual filter since findByName might not exist)
      const existing = await positionRepo.findAll({
        filter: { name: { _eq: data.name } },
        limit: 1,
      });
      
      let pos;
      if (existing.length > 0) {
        pos = existing[0];
        console.log(`Position ${pos.name} already exists.`);
      } else {
        pos = await positionRepo.create(data);
        console.log(`Created Position: ${pos.name}`);
      }
      positions.push(pos);
    }

    // 2. Create Employees and Assign In-Memory Positions
    console.log("Creating Employees...");
    const employeesData = [
      { first_name: "Nguyen", last_name: "Van A", employee_code: "EMP001" }, // Server
      { first_name: "Tran", last_name: "Thi B", employee_code: "EMP002" }, // Bartender
      { first_name: "Le", last_name: "Van C", employee_code: "EMP003" }, // Chef
      { first_name: "Pham", last_name: "Thi D", employee_code: "EMP004" }, // Server
      { first_name: "Hoang", last_name: "Van E", employee_code: "EMP005" }, // Bartender
      { first_name: "Do", last_name: "Thi F", employee_code: "EMP006" }, // Chef
      { first_name: "Vu", last_name: "Van G", employee_code: "EMP007" }, // Server
      { first_name: "Dang", last_name: "Thi H", employee_code: "EMP008" }, // Server
      { first_name: "Bui", last_name: "Van I", employee_code: "EMP009" }, // Bartender
      { first_name: "Ngo", last_name: "Thi K", employee_code: "EMP010" }, // Chef
    ];

    const employees: { emp: Employee; position: Position }[] = [];
    
    // Round-robin assignment
    let posIndex = 0;
    for (const data of employeesData) {
      let emp = await employeeRepo.findByEmployeeCode(data.employee_code);
      if (!emp) {
        emp = await employeeRepo.create({
          ...data,
          full_name: `${data.first_name} ${data.last_name}`,
          email: `${data.employee_code.toLowerCase()}@example.com`,
          status: "active",
        });
        console.log(`Created Employee: ${emp.full_name}`);
      } else {
        console.log(`Employee ${emp.employee_code} already exists.`);
      }
      
      // Assign position in memory
      const assignedPos = positions[posIndex % positions.length];
      employees.push({ emp, position: assignedPos });
      posIndex++;
    }

    // 3. Create Shift Types
    console.log("Creating Shift Types...");
    const shiftTypesData = [
      { name: "Morning", start_time: "06:00:00", end_time: "12:00:00" },
      { name: "Afternoon", start_time: "12:00:00", end_time: "18:00:00" },
      { name: "Evening", start_time: "18:00:00", end_time: "22:00:00" },
      { name: "Night", start_time: "22:00:00", end_time: "06:00:00", cross_midnight: true },
    ];

    const shiftTypes: ShiftType[] = [];
    for (const data of shiftTypesData) {
      let st = await shiftTypeRepo.findByName(data.name);
      if (!st) {
        st = await shiftTypeRepo.create(data);
        console.log(`Created Shift Type: ${st.name}`);
      } else {
        console.log(`Shift Type ${st.name} already exists.`);
      }
      shiftTypes.push(st);
    }

    // 4. Create Weekly Schedule (Dec 1 - Dec 7, 2025)
    console.log("Creating Weekly Schedule...");
    const weekStart = "2025-12-01";
    const weekEnd = "2025-12-07";
    
    let weeklySchedule = (await weeklyScheduleRepo.findAll({
      filter: { week_start: { _eq: weekStart } },
      limit: 1,
    }))[0];

    if (!weeklySchedule) {
      weeklySchedule = await weeklyScheduleRepo.create({
        week_start: weekStart,
        week_end: weekEnd,
        status: "draft",
        notes: "Seed Data Schedule",
      });
      console.log(`Created Weekly Schedule: ${weekStart} - ${weekEnd}`);
    } else {
      console.log(`Weekly Schedule for ${weekStart} already exists.`);
    }

    // 5. Create Shifts, Requirements, and Availability
    console.log("Creating Shifts, Requirements, and Availability...");
    const startDate = new Date(weekStart);
    const endDate = new Date(weekEnd);

    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split("T")[0];
      console.log(`Processing date: ${dateStr}`);

      for (const st of shiftTypes) {
        // A. Create Shift
        let shift;
        const existingShifts = await shiftRepo.findAll({
          filter: {
            shift_date: { _eq: dateStr },
            shift_type_id: { _eq: st.id },
          },
        });

        if (existingShifts.length > 0) {
          shift = existingShifts[0];
          // Update schedule_id if missing
          if (!shift.schedule_id) {
             await shiftRepo.update(shift.id, { schedule_id: weeklySchedule.id });
          }
        } else {
          shift = await shiftRepo.create({
            shift_date: dateStr,
            shift_type_id: st.id,
            schedule_id: weeklySchedule.id,
            start_at: `${dateStr}T${st.start_time}`,
            end_at: st.cross_midnight
              ? `${new Date(d.getTime() + 86400000).toISOString().split("T")[0]}T${st.end_time}`
              : `${dateStr}T${st.end_time}`,
            total_required: 3, // 1 Server + 1 Bartender + 1 Chef
          });
        }

        // B. Create Shift Position Requirements (1 for each position)
        for (const pos of positions) {
          const existingReq = await requirementRepo.findAll({
            filter: {
              shift_id: { _eq: shift.id },
              position_id: { _eq: pos.id },
            },
          });

          if (existingReq.length === 0) {
            await requirementRepo.create({
              shift_id: shift.id,
              position_id: pos.id,
              required_count: 1, // Require 1 person per position
            });
          }
        }

        // C. Register Employees (Availability)
        // Each employee registers for the shift if they match the position
        for (const { emp, position } of employees) {
          // Removed random skip to ensure data generation
          // if (Math.random() > 0.8) continue; 

          const existingAvail = await availabilityRepo.findAll({
            filter: {
              employee_id: { _eq: emp.id },
              shift_id: { _eq: shift.id },
            },
          });

          let availId;
          if (existingAvail.length === 0) {
            const avail = await availabilityRepo.create({
              employee_id: emp.id,
              shift_id: shift.id,
              status: "approved",
            });
            availId = avail.id;
            console.log(`   -> Created Availability for ${emp.employee_code}`);
          } else {
            availId = existingAvail[0].id;
            // console.log(`   -> Availability exists for ${emp.employee_code}`);
          }

          // D. Create Employee Availability Position
          const existingAvailPos = await availabilityPositionRepo.findAll({
            filter: {
              availability_id: { _eq: availId },
              position_id: { _eq: position.id },
            },
          });

          if (existingAvailPos.length === 0) {
            await availabilityPositionRepo.create({
              availability_id: availId,
              position_id: position.id,
            });
          }
        }
      }
    }

    console.log("✅ Refined seed completed successfully!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Seed failed:", error);
    process.exit(1);
  }
}

seed();
