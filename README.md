# HRMS_BE — TypeScript + Express + Directus (Clean Architecture)

Backend API for HRMS built with TypeScript, Express, and Directus SDK, following Clean Architecture (Controller → Service → Repository → Model/DTO).

## Tech Stack
- TypeScript, Node.js
- Express.js
- Directus SDK (@directus/sdk) for data access
- Validation: class-validator + class-transformer
- Security: helmet, cors
- Logging: morgan
- Config: dotenv

## Getting Started

### 1) Install
```bash
npm install
```

### 2) Environment variables
Copy `.env.example` to `.env` and fill values:
```ini
DIRECTUS_URL=https://your-directus-instance-url
DIRECTUS_EMAIL=admin@example.com
DIRECTUS_PASSWORD=yourpassword
PORT=4000
```
Notes:
- The service authenticates to Directus on boot if `DIRECTUS_EMAIL` and `DIRECTUS_PASSWORD` are provided (see `src/utils/directusClient.ts`).
- Ensure the Directus role has permissions for the collections used by this API.

### 3) Run in development
```bash
npm run dev
```
Server: http://localhost:4000

### 4) Build and run
```bash
npm run build
npm start
```

## Project Structure
```
src/
  app.ts                 # Express app, middlewares, route wiring
  server.ts              # Bootstrap, loads env, ensures Directus auth
  core/                  # Base types and Directus repository
  middlewares/           # error, validate, auth
  utils/directusClient.ts
  modules/
    <domain>/            # model, dto, repository, service, controller, routes
```

## API Routes
Base URL: `/api`

- Users: `/api/users`
- Roles: `/api/roles`
- User Roles: `/api/user-roles`
- Employees: `/api/employees`
- Positions: `/api/positions`
- Salary Schemes: `/api/salary-schemes`
- Salary Requests: `/api/salary-requests`
- Contracts: `/api/contracts`
- Deductions: `/api/deductions`
- RFID Cards: `/api/rfid-cards`
- Devices: `/api/devices`
- Attendance Logs: `/api/attendance-logs`
- Attendance Shifts: `/api/attendance-shifts`
- Attendance Adjustments: `/api/attendance-adjustments`
- Shift Types: `/api/shift-types`
- Weekly Schedule: `/api/weekly-schedule`
- Shifts: `/api/shifts`
- Shift Position Requirements: `/api/shift-position-requirements`
- Employee Availability: `/api/employee-availability`
- Employee Availability Positions: `/api/employee-availability-positions`
- Schedule Assignments: `/api/schedule-assignments`
- Schedule Change Requests: `/api/schedule-change-requests`
- Monthly Employee Stats: `/api/monthly-employee-stats`
- Device Events Webhook: `/api/device-events` (POST)

Health check: GET `/health`

All resource routers expose CRUD: GET `/`, GET `/:id`, POST `/`, PUT `/:id`, DELETE `/:id`.

## Notes
- Collections must exist in Directus matching the schema.
- Adjust Directus permissions for the configured account.
