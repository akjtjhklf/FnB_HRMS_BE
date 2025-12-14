# ⚡ Quick Reference - Auto Scheduler

## 🚀 One-Click Auto Scheduling

### Minimum Setup Required

```bash
# 1. Create Schedule
scheduleId = POST /api/weekly-schedule
{
  "week_start": "2025-11-11",
  "week_end": "2025-11-17",
  "status": "draft"
}

# 2. Create Shifts
POST /api/shifts (for each shift)
{
  "schedule_id": scheduleId,
  "shift_type_id": "...",
  "shift_date": "2025-11-12",
  "start_at": "08:00",
  "end_at": "16:00"
}

# 3. Add Requirements
POST /api/shift-position-requirements
{
  "shift_id": "...",
  "position_id": "...",
  "required_count": 3
}

# 4. Employees Register
POST /api/employee-availability
{
  "employee_id": "...",
  "shift_id": "...",
  "priority": 8
}

POST /api/employee-availability-positions
{
  "availability_id": "...",
  "position_id": "...",
  "preference_order": 1
}

# 5. 🤖 RUN AUTO SCHEDULER
POST /api/schedule-assignments/auto-schedule
{
  "scheduleId": scheduleId,
  "dryRun": false
}
```

---

## 📊 API Quick Reference

### Auto Scheduler
```http
POST /api/schedule-assignments/auto-schedule
Body: { scheduleId, overwriteExisting?, dryRun? }
```

### Get Stats
```http
GET /api/schedule-assignments/schedule/:scheduleId/stats
```

### Manual Assignment
```http
POST /api/schedule-assignments
Body: { schedule_id, shift_id, employee_id, position_id, source: "manual" }
```

---

## 🎯 Scoring Cheat Sheet

| Factor | Weight | Description |
|--------|--------|-------------|
| Priority | 0-100 | Employee priority (1-10) × 10 |
| Workload | 0-50 | Less shifts = Higher score |
| Preference | 0-30 | Position order (1st=30, 2nd=20, 3rd=10) |
| Fairness | 0-20 | Below average shifts = +20 |

**Total:** 0-200 points

---

## ⚙️ Key Parameters

### Employee
- `max_hours_per_week` → Max shifts
- `min_rest_hours_between_shifts` → Rest constraint
- `status` → Must be "active"

### Availability
- `priority` → 1-10 (10 = highest)
- `expires_at` → null = no expiry

### Position
- `preference_order` → 1, 2, 3... (1 = most preferred)

---

## 🔍 Troubleshooting Quick Fixes

### Low Coverage Rate
```bash
# Check availability
GET /api/employee-availability?shift_id=xxx

# Solution: More employees register
```

### Employee Overloaded
```bash
# Check employee settings
GET /api/employees/:id

# Solution: Increase max_hours_per_week
```

### Position Not Filled
```bash
# Check who registered for this position
GET /api/employee-availability-positions?position_id=xxx

# Solution: Employees register for this position
```

---

## ⚡ Common Commands

### Test Auto Scheduler
```bash
curl -X POST http://localhost:5000/api/schedule-assignments/auto-schedule \
  -H "Content-Type: application/json" \
  -H "X-API-Key: $API_KEY" \
  -d '{"scheduleId":"'$SCHEDULE_ID'","dryRun":true}'
```

### Check Stats
```bash
curl http://localhost:5000/api/schedule-assignments/schedule/$SCHEDULE_ID/stats \
  -H "X-API-Key: $API_KEY"
```

### List Assignments
```bash
curl "http://localhost:5000/api/schedule-assignments?filter[schedule_id]=$SCHEDULE_ID" \
  -H "X-API-Key: $API_KEY"
```

---

## 📝 Response Codes

| Code | Meaning |
|------|---------|
| 200 | Success |
| 400 | Bad request (invalid input) |
| 404 | Schedule not found |
| 500 | Server error |

---

## 🎨 Status Flow

```
draft → scheduled → finalized
  ↑        ↑          ↑
  │        │          └─ Cannot auto-schedule
  │        └─ Can auto-schedule
  └─ Can auto-schedule
```

---

## 💡 Pro Tips

1. **Always dry run first**
   ```json
   { "dryRun": true }
   ```

2. **Check coverage rate**
   ```javascript
   if (stats.coverageRate > 90) → Good!
   ```

3. **Review warnings**
   ```javascript
   validation.warnings → Unfilled positions
   ```

4. **Manual adjust if needed**
   ```http
   PUT /api/schedule-assignments/:id
   ```

5. **Then finalize**
   ```http
   PUT /api/weekly-schedule/:id
   { "status": "finalized" }
   ```

---

## 📚 Full Documentation

- 📖 [AUTO_SCHEDULER_GUIDE.md](./AUTO_SCHEDULER_GUIDE.md)
- 📖 [API_DOCUMENTATION.md](./API_DOCUMENTATION.md)
- 🧪 [TEST_EXAMPLES.md](./TEST_EXAMPLES.md)
- 🚀 [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)

---

**Quick Start? → See README.md**

**Questions? → Check documentation**

**Issues? → GitHub Issues**
