import express from "express";
import helmet from "helmet";
import cors from "cors";
import morgan from "morgan";
import { errorMiddleware } from "./middlewares/error.middleware";

// ========== AUTH & USER ==========
import authRouter from "./modules/auth/auth.routes";
import usersRouter from "./modules/users/user.routes";
import pemissionsRouter from "./modules/permissions/permission.routes";
import policiesRouter from "./modules/policies/policy.routes";

// ========== HR CORE ==========
import employeesRouter from "./modules/employees/employee.routes";
import positionsRouter from "./modules/positions/position.routes";
import rolesRouter from "./modules/roles/role.routes";
import contractsRouter from "./modules/contracts/contract.routes";
import deductionsRouter from "./modules/deductions/deduction.routes";
import salarySchemesRouter from "./modules/salary-schemes/salary-scheme.routes";
import salaryRequestsRouter from "./modules/salary-requests/salary-request.routes";
import monthlyEmployeeStatsRouter from "./modules/monthly-employee-stats/monthly-employee-stat.routes";

// ========== ATTENDANCE & SHIFT ==========
import shiftsRouter from "./modules/shifts/shift.routes";
import shiftTypesRouter from "./modules/shift-types/shift-type.routes";
import weeklyScheduleRouter from "./modules/weekly-schedule/weekly-schedule.routes";
import attendanceShiftsRouter from "./modules/attendance-shifts/attendance-shift.routes";
import attendanceLogsRouter from "./modules/attendance-logs/attendance-log.routes";
import attendanceAdjustmentsRouter from "./modules/attendance-adjustments/attendance-adjustment.routes";
import shiftPositionRequirementsRouter from "./modules/shift-position-requirements/shift-position-requirement.routes";

// ========== SCHEDULE MANAGEMENT ==========
import employeeAvailabilityRouter from "./modules/employee-availability/employee-availability.routes";
import employeeAvailabilityPositionsRouter from "./modules/employee-availability-positions/employee-availability-position.routes";
import scheduleAssignmentsRouter from "./modules/schedule-assignments/schedule-assignment.routes";
import scheduleChangeRequestsRouter from "./modules/schedule-change-requests/schedule-change-request.routes";

// ========== DEVICES & RFID ==========
import devicesRouter from "./modules/devices/device.routes";
import deviceEventsRouter from "./modules/device-events/device-events.routes";
import rfidCardsRouter from "./modules/rfid-cards/rfid-card.routes";

// ========== FILE UPLOAD ==========
import filesRouter from "./modules/files/file.routes";
import { setupSwagger } from "./config/swagger.config";
import { apiKeyAuth } from "./middlewares/auth.middleware";

const app = express();
// bắt buộc API key cho tất cả

// ========== GLOBAL MIDDLEWARE ==========
app.use(helmet());
app.use(cors());
app.use(morgan("dev"));
app.use(express.json());

// ========== HEALTH CHECK ==========
app.get("/health", (_req, res) =>
  res.json({ success: true, data: { status: "ok" } })
);

// ========== ROUTES MAPPING ==========

// 🔐 Auth & User
app.use("/api/auth", authRouter);
app.use("/api/users", usersRouter);
app.use("/api/permissions", pemissionsRouter);
app.use("/api/policies", policiesRouter);

// 👨‍💼 HR Core
app.use("/api/employees", employeesRouter);
app.use("/api/positions", positionsRouter);
app.use("/api/roles", rolesRouter);
app.use("/api/contracts", contractsRouter);
app.use("/api/deductions", deductionsRouter);
app.use("/api/salary-schemes", salarySchemesRouter);
app.use("/api/salary-requests", salaryRequestsRouter);
app.use("/api/monthly-employee-stats", monthlyEmployeeStatsRouter);

// 🕒 Attendance & Shift
app.use("/api/shifts", shiftsRouter);
app.use("/api/shift-types", shiftTypesRouter);
app.use("/api/weekly-schedule", weeklyScheduleRouter);
app.use("/api/attendance-shifts", attendanceShiftsRouter);
app.use("/api/attendance-logs", attendanceLogsRouter);
app.use("/api/attendance-adjustments", attendanceAdjustmentsRouter);
app.use("/api/shift-position-requirements", shiftPositionRequirementsRouter);

// 📅 Schedule Management
app.use("/api/employee-availability", employeeAvailabilityRouter);
app.use(
  "/api/employee-availability-positions",
  employeeAvailabilityPositionsRouter
);
app.use("/api/schedule-assignments", scheduleAssignmentsRouter);
app.use("/api/schedule-change-requests", scheduleChangeRequestsRouter);

// ⚙️ Devices & RFID
app.use("/api/devices", devicesRouter);
app.use("/api/device-events", deviceEventsRouter);
app.use("/api/rfid-cards", rfidCardsRouter);

// 🗂️ File Upload (Cloudinary + Directus)
app.use("/api/files", filesRouter);

setupSwagger(app);
app.use(apiKeyAuth(false)); 
// ========== ERROR HANDLER ==========
app.use(errorMiddleware);

export default app;
