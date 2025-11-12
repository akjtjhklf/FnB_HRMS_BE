# 🧪 Auto Scheduler Test Examples

## Test Cases cho Auto Scheduler

### Test 1: Basic Auto Scheduling
```bash
curl -X POST http://localhost:5000/api/schedule-assignments/auto-schedule \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your_api_key" \
  -d '{
    "scheduleId": "550e8400-e29b-41d4-a716-446655440000",
    "dryRun": true
  }'
```

**Expected Result:**
```json
{
  "success": true,
  "data": {
    "dryRun": true,
    "assignmentsCreated": 42,
    "validation": {
      "valid": true,
      "warnings": [],
      "errors": []
    },
    "stats": {
      "coverageRate": 95.5,
      "avgShiftsPerEmployee": 2.8
    }
  }
}
```

### Test 2: Overwrite Existing Assignments
```bash
curl -X POST http://localhost:5000/api/schedule-assignments/auto-schedule \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your_api_key" \
  -d '{
    "scheduleId": "550e8400-e29b-41d4-a716-446655440000",
    "overwriteExisting": true,
    "dryRun": false
  }'
```

### Test 3: Check Schedule Stats
```bash
curl -X GET http://localhost:5000/api/schedule-assignments/schedule/550e8400-e29b-41d4-a716-446655440000/stats \
  -H "X-API-Key: your_api_key"
```

## Complete Workflow Test

### Step 1: Create Weekly Schedule
```bash
curl -X POST http://localhost:5000/api/weekly-schedule \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your_api_key" \
  -d '{
    "week_start": "2025-11-11",
    "week_end": "2025-11-17",
    "status": "draft",
    "notes": "Test week"
  }'
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "schedule-uuid-here",
    "week_start": "2025-11-11",
    "week_end": "2025-11-17",
    "status": "draft"
  }
}
```

### Step 2: Create Shift Types
```bash
# Morning Shift
curl -X POST http://localhost:5000/api/shift-types \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your_api_key" \
  -d '{
    "name": "Morning Shift",
    "code": "MORNING",
    "start_time": "08:00",
    "end_time": "16:00",
    "color": "#FFA500"
  }'

# Afternoon Shift
curl -X POST http://localhost:5000/api/shift-types \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your_api_key" \
  -d '{
    "name": "Afternoon Shift",
    "code": "AFTERNOON",
    "start_time": "14:00",
    "end_time": "22:00",
    "color": "#4169E1"
  }'
```

### Step 3: Create Positions
```bash
# Barista
curl -X POST http://localhost:5000/api/positions \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your_api_key" \
  -d '{
    "name": "Barista",
    "description": "Pha chế đồ uống"
  }'

# Cashier
curl -X POST http://localhost:5000/api/positions \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your_api_key" \
  -d '{
    "name": "Cashier",
    "description": "Thu ngân"
  }'

# Server
curl -X POST http://localhost:5000/api/positions \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your_api_key" \
  -d '{
    "name": "Server",
    "description": "Phục vụ bàn"
  }'
```

### Step 4: Create Employees
```bash
# Employee 1 - Alice
curl -X POST http://localhost:5000/api/employees \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your_api_key" \
  -d '{
    "employee_code": "EMP001",
    "first_name": "Alice",
    "last_name": "Nguyen",
    "email": "alice@example.com",
    "phone": "0901234567",
    "hire_date": "2025-01-01",
    "status": "active",
    "max_hours_per_week": 40,
    "min_rest_hours_between_shifts": 12
  }'

# Employee 2 - Bob
curl -X POST http://localhost:5000/api/employees \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your_api_key" \
  -d '{
    "employee_code": "EMP002",
    "first_name": "Bob",
    "last_name": "Tran",
    "email": "bob@example.com",
    "phone": "0901234568",
    "hire_date": "2025-01-01",
    "status": "active",
    "max_hours_per_week": 40,
    "min_rest_hours_between_shifts": 12
  }'

# Employee 3 - Charlie
curl -X POST http://localhost:5000/api/employees \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your_api_key" \
  -d '{
    "employee_code": "EMP003",
    "first_name": "Charlie",
    "last_name": "Le",
    "email": "charlie@example.com",
    "phone": "0901234569",
    "hire_date": "2025-01-01",
    "status": "active",
    "max_hours_per_week": 32,
    "min_rest_hours_between_shifts": 12
  }'
```

### Step 5: Create Shifts for the Week
```bash
# Monday Morning
curl -X POST http://localhost:5000/api/shifts \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your_api_key" \
  -d '{
    "schedule_id": "schedule-uuid-here",
    "shift_type_id": "morning-shift-type-uuid",
    "shift_date": "2025-11-11",
    "start_at": "08:00",
    "end_at": "16:00"
  }'

# Monday Afternoon
curl -X POST http://localhost:5000/api/shifts \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your_api_key" \
  -d '{
    "schedule_id": "schedule-uuid-here",
    "shift_type_id": "afternoon-shift-type-uuid",
    "shift_date": "2025-11-11",
    "start_at": "14:00",
    "end_at": "22:00"
  }'

# Repeat for Tuesday, Wednesday, etc...
```

### Step 6: Add Position Requirements
```bash
# Monday Morning - Need 2 Baristas
curl -X POST http://localhost:5000/api/shift-position-requirements \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your_api_key" \
  -d '{
    "shift_id": "monday-morning-shift-uuid",
    "position_id": "barista-position-uuid",
    "required_count": 2,
    "notes": "Peak hours"
  }'

# Monday Morning - Need 1 Cashier
curl -X POST http://localhost:5000/api/shift-position-requirements \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your_api_key" \
  -d '{
    "shift_id": "monday-morning-shift-uuid",
    "position_id": "cashier-position-uuid",
    "required_count": 1
  }'
```

### Step 7: Employees Register Availability
```bash
# Alice registers for Monday Morning (Priority 9)
curl -X POST http://localhost:5000/api/employee-availability \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your_api_key" \
  -d '{
    "employee_id": "alice-uuid",
    "shift_id": "monday-morning-shift-uuid",
    "priority": 9,
    "note": "Really want this shift"
  }'

# Alice chooses Barista as first choice
curl -X POST http://localhost:5000/api/employee-availability-positions \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your_api_key" \
  -d '{
    "availability_id": "alice-availability-uuid",
    "position_id": "barista-position-uuid",
    "preference_order": 1
  }'

# Bob registers for Monday Morning (Priority 7)
curl -X POST http://localhost:5000/api/employee-availability \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your_api_key" \
  -d '{
    "employee_id": "bob-uuid",
    "shift_id": "monday-morning-shift-uuid",
    "priority": 7
  }'

# Bob chooses Barista
curl -X POST http://localhost:5000/api/employee-availability-positions \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your_api_key" \
  -d '{
    "availability_id": "bob-availability-uuid",
    "position_id": "barista-position-uuid",
    "preference_order": 1
  }'

# Bob also chooses Cashier as second choice
curl -X POST http://localhost:5000/api/employee-availability-positions \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your_api_key" \
  -d '{
    "availability_id": "bob-availability-uuid",
    "position_id": "cashier-position-uuid",
    "preference_order": 2
  }'
```

### Step 8: Run Auto Scheduler (Dry Run First)
```bash
curl -X POST http://localhost:5000/api/schedule-assignments/auto-schedule \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your_api_key" \
  -d '{
    "scheduleId": "schedule-uuid-here",
    "dryRun": true
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "dryRun": true,
    "assignmentsCreated": 14,
    "validation": {
      "valid": true,
      "warnings": ["Shift 2025-11-12 Position Server: Need 2, got 1"],
      "errors": []
    },
    "stats": {
      "totalAssignments": 14,
      "totalShifts": 10,
      "totalEmployees": 5,
      "employeesUsed": 5,
      "coverageRate": 87.5,
      "avgShiftsPerEmployee": 2.8,
      "minShifts": 1,
      "maxShifts": 4
    }
  }
}
```

### Step 9: If OK, Run Real Auto Scheduler
```bash
curl -X POST http://localhost:5000/api/schedule-assignments/auto-schedule \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your_api_key" \
  -d '{
    "scheduleId": "schedule-uuid-here",
    "dryRun": false
  }'
```

### Step 10: Check Results
```bash
# Get all assignments for this schedule
curl -X GET "http://localhost:5000/api/schedule-assignments?filter[schedule_id]=schedule-uuid-here" \
  -H "X-API-Key: your_api_key"

# Get stats
curl -X GET http://localhost:5000/api/schedule-assignments/schedule/schedule-uuid-here/stats \
  -H "X-API-Key: your_api_key"
```

### Step 11: Manual Adjustment (if needed)
```bash
# Update an assignment
curl -X PUT http://localhost:5000/api/schedule-assignments/assignment-uuid \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your_api_key" \
  -d '{
    "position_id": "new-position-uuid",
    "source": "manual",
    "note": "Changed by manager"
  }'
```

### Step 12: Finalize Schedule
```bash
curl -X PUT http://localhost:5000/api/weekly-schedule/schedule-uuid-here \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your_api_key" \
  -d '{
    "status": "finalized",
    "published_at": "2025-11-10T10:00:00Z"
  }'
```

## Edge Cases Testing

### Test Case: No Availability
```bash
# Try to auto-schedule when no one registered
# Expected: warnings about unfilled positions
```

### Test Case: Overloaded Employee
```bash
# Employee with max_hours_per_week = 16 (2 shifts)
# Register for 5 shifts
# Expected: Only assigned to 2 shifts
```

### Test Case: Position Mismatch
```bash
# Shift requires "Chef"
# All employees only registered for "Barista"
# Expected: Warning about unfilled position
```

### Test Case: Priority Testing
```bash
# Alice: Priority 10
# Bob: Priority 5
# 1 position available
# Expected: Alice gets the shift
```

## Performance Testing

### Load Test: 100 Shifts, 50 Employees
```bash
# Create 100 shifts for a month
# 50 employees register for multiple shifts
# Run auto-scheduler
# Measure execution time
```

**Expected:**
- Execution time: < 10 seconds
- Coverage rate: > 85%
- No errors

## Integration Tests

### Test: Full Week Workflow
```javascript
describe('Auto Scheduler Integration', () => {
  it('should schedule a full week successfully', async () => {
    // 1. Create schedule
    // 2. Create shifts (7 days × 2 shifts = 14 shifts)
    // 3. 10 employees register
    // 4. Run auto-scheduler
    // 5. Verify all shifts have assignments
    // 6. Verify no constraint violations
  });
});
```

## Validation Tests

### Test: Constraint Validation
```bash
# Test max_hours_per_week constraint
# Test min_rest_hours_between_shifts constraint
# Test position matching
# Test employee status (only active)
```

## Expected Results Summary

✅ **Success Cases:**
- Coverage rate > 90%
- Avg shifts per employee balanced
- No constraint violations
- Fair distribution

⚠️ **Warning Cases:**
- Coverage rate 70-90%
- Some unfilled positions
- Unbalanced distribution

❌ **Error Cases:**
- No availability at all
- All employees overloaded
- Invalid schedule status
- Directus connection issues

## Debugging Tips

### Enable Verbose Logging
```typescript
// In auto-scheduler.service.ts
console.log('Calculating scores for shift:', shift.id);
console.log('Employee scores:', scores);
console.log('Selected:', selectedEmployee);
```

### Check Intermediate Results
```bash
# Check availability
GET /api/employee-availability?shift_id=xxx

# Check requirements
GET /api/shift-position-requirements?shift_id=xxx

# Check employee constraints
GET /api/employees/:id
```

---

**Happy Testing! 🧪**
