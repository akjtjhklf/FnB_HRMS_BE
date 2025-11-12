# 📚 Swagger API Documentation Guide

## Overview
Your HRMS backend now has **complete interactive API documentation** powered by Swagger/OpenAPI 3.0.

## Access Swagger UI

### 1. Start the server
```powershell
yarn dev
```

### 2. Open Swagger UI in your browser
```
http://localhost:3000/api-docs
```

## Features

### ✅ What's Documented

#### 🔐 Authentication
- `POST /api/auth/login` - Login and get access token
- `POST /api/auth/logout` - Logout
- `POST /api/auth/refresh` - Refresh access token

#### 👨‍💼 Employee Management
- `GET /api/employees` - List all employees (with filters)
- `POST /api/employees` - Create new employee
- `GET /api/employees/{id}` - Get employee details
- `PUT /api/employees/{id}` - Update employee
- `DELETE /api/employees/{id}` - Delete employee

#### 🤖 **Auto-Scheduler** (PRIORITY FEATURE)
- `POST /api/schedule-assignments/auto-schedule` - **Automatically assign employees to shifts**
  - Supports **dry-run mode** (test without persisting)
  - Configurable weights (priority, workload balance, position preference, fairness)
  - Hard constraints (max shifts/week, min rest hours)
  - Returns detailed stats and validation
- `GET /api/schedule-assignments/schedule/{scheduleId}/stats` - Get schedule statistics

#### 📅 Schedule Management
- `GET /api/schedule-assignments` - List assignments
- `POST /api/schedule-assignments` - Create manual assignment
- `PUT /api/schedule-assignments/{id}` - Update assignment
- `DELETE /api/schedule-assignments/{id}` - Delete assignment

#### 📋 Employee Availability
- `GET /api/employee-availability` - List availability
- `POST /api/employee-availability` - Register availability

#### 🕒 Shifts
- `GET /api/shifts` - List shifts
- `POST /api/shifts` - Create shift

#### ⏱️ Attendance Tracking
- `GET /api/attendance-logs` - List attendance logs
- `POST /api/attendance-logs` - Create attendance log

#### ⚙️ Devices & RFID
- `GET /api/devices` - List devices
- `POST /api/devices` - Register new device
- `POST /api/device-events` - Webhook for RFID events

#### 👤 Users & Permissions
- User management
- Roles & permissions
- Positions

#### 💰 Salary Management
- Contracts
- Salary schemes
- Salary requests

## How to Use Swagger UI

### 1. **Explore Endpoints**
- Click on any endpoint to expand details
- See request/response schemas, examples, and parameters

### 2. **Try It Out** (Interactive Testing)
- Click "Try it out" button
- Fill in request parameters/body
- Click "Execute" to make a real API call
- See the response immediately

### 3. **Authentication**
For protected endpoints:
1. Login via `POST /api/auth/login`
2. Copy the `token` from response
3. Click "Authorize" button at top
4. Paste token as: `Bearer <your-token>`
5. Now you can call protected endpoints

### 4. **Example: Auto-Schedule Dry Run**
1. Expand `POST /api/schedule-assignments/auto-schedule`
2. Click "Try it out"
3. Use this example payload:
```json
{
  "scheduleId": "your-schedule-uuid",
  "options": {
    "dryRun": true,
    "overwriteExisting": false,
    "weights": {
      "priority": 1.0,
      "workloadBalance": 0.8,
      "positionPreference": 1.2,
      "fairness": 0.5
    },
    "maxShiftsPerWeek": 5,
    "minRestHours": 8
  }
}
```
4. Click "Execute"
5. Review the generated assignments and stats in the response

## Auto-Scheduler Algorithm

### How It Works
- **Type**: Greedy, score-based assignment
- **Strategy**: For each shift, score all eligible employees and assign the highest-scoring candidate
- **Complexity**: O(S × E × log E) — efficient for typical staff sizes

### Scoring Factors (Configurable Weights)
1. **Priority** (1.0): Employee/shift priority (1-10 scale)
2. **Workload Balance** (0.8): Prefer employees with fewer assigned hours
3. **Position Preference** (1.2): Match employee's preferred positions
4. **Fairness** (0.5): Spread work evenly across all employees

### Hard Constraints (Always Enforced)
- Max shifts per week per employee
- Max hours per week per employee
- Min rest hours between shifts (e.g., 8 hours)
- Employee must be available for the shift time
- Employee must be qualified for the required position

### Options
- `dryRun`: Test assignments without saving to database
- `overwriteExisting`: Whether to replace existing auto-assignments (keeps manual ones)
- Custom weights to tune behavior
- Custom max shifts/hours and rest constraints

### Response
```json
{
  "success": true,
  "data": {
    "assignments": [...],  // List of generated assignments
    "stats": {
      "totalShifts": 50,
      "assignedShifts": 48,
      "unfilledShifts": 2,
      "assignmentsPerEmployee": { "emp-1": 5, "emp-2": 4 },
      "totalHoursAssigned": 384
    },
    "validation": {
      "valid": true,
      "errors": [],
      "warnings": []
    }
  }
}
```

## Swagger File Location
- **OpenAPI Spec**: `swagger.json` (root directory)
- **Config**: `src/config/swagger.config.ts`

## Customization

### Update API Documentation
1. Edit `swagger.json` directly
2. Restart server: `yarn dev`
3. Refresh browser at `/api-docs`

### Add New Endpoints
Add them to `swagger.json` under `paths` section following the existing pattern.

### Modify Schemas
Update `components.schemas` in `swagger.json` to match your data models.

## Tips

### Testing Auto-Scheduler
1. Always start with `dryRun: true` to preview assignments
2. Check `stats.unfilledShifts` — if high, review employee availability
3. Adjust weights to tune behavior (e.g., increase `positionPreference` to prioritize exact matches)
4. Review `validation.warnings` for soft constraint violations

### Common Issues
- **401 Unauthorized**: You need to login and use the "Authorize" button with your token
- **Validation errors**: Check the error details in response for specific field issues
- **Empty results**: Verify query parameters and ensure data exists in Directus

## Production Deployment
- Update `servers` URLs in `swagger.json` to your production domain
- Consider adding API key authentication for Swagger UI in production
- Enable CORS for your frontend domain

## Support
For issues or questions about the API or auto-scheduler:
- Check examples in this guide
- Review validation errors in API responses
- Inspect auto-scheduler logs in server console

---

**Tip**: Use the "Schemas" section in Swagger UI to explore all available data models and their properties!
