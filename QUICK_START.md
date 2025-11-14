# 🚀 Quick Start Guide - HRMS Backend

## 📦 Installation

```bash
# 1. Clone repository
git clone <repo-url>
cd FnB_HRMS_BE

# 2. Install dependencies
npm install

# 3. Setup environment variables
cp .env.example .env
# Edit .env with your Directus credentials

# 4. Build TypeScript
npm run build

# 5. Start server
npm start
```

## 🔐 Environment Variables

```env
# Directus Configuration
DIRECTUS_URL=http://your-directus-instance.com
DIRECTUS_EMAIL=admin@example.com
DIRECTUS_PASSWORD=your_password

# Server Configuration
PORT=3000
NODE_ENV=development

# Optional API Key
API_KEY=your_optional_api_key
```

## 🎯 Quick API Usage

### 1. Authentication

```bash
# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"password"}'

# Response
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refresh_token": "..."
  }
}
```

### 2. Using Token

```bash
# All protected endpoints require Authorization header
curl http://localhost:3000/api/employees \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## 📊 Common Query Patterns

### Pagination
```bash
GET /api/employees?page=1&limit=20
```

### Search
```bash
GET /api/employees?search=John
```

### Filter
```bash
# Simple filter
GET /api/employees?filter={"status":"active"}

# Complex filter
GET /api/employees?filter={"hire_date":{"_gte":"2024-01-01"}}
```

### Sort
```bash
# Ascending
GET /api/employees?sort=full_name

# Descending
GET /api/employees?sort=-created_at

# Multiple fields
GET /api/employees?sort=status,-hire_date
```

### Combine All
```bash
GET /api/employees?page=1&limit=20&search=John&filter={"status":"active"}&sort=-hire_date
```

## 🔍 Filter Operators

| Operator | Description | Example |
|----------|-------------|---------|
| `_eq` | Equals | `{"status":"active"}` |
| `_neq` | Not equals | `{"status":{"_neq":"terminated"}}` |
| `_lt` | Less than | `{"age":{"_lt":30}}` |
| `_lte` | Less than or equal | `{"age":{"_lte":30}}` |
| `_gt` | Greater than | `{"age":{"_gt":18}}` |
| `_gte` | Greater than or equal | `{"hire_date":{"_gte":"2024-01-01"}}` |
| `_in` | In array | `{"status":{"_in":["active","on_leave"]}}` |
| `_nin` | Not in array | `{"status":{"_nin":["terminated"]}}` |
| `_contains` | Contains | `{"name":{"_contains":"John"}}` |
| `_null` | Is null | `{"termination_date":{"_null":true}}` |
| `_nnull` | Is not null | `{"email":{"_nnull":true}}` |

## 📚 API Endpoints

### Employees
```bash
GET    /api/employees          # List with pagination
GET    /api/employees/:id      # Get by ID
POST   /api/employees          # Create
PATCH  /api/employees/:id      # Update
DELETE /api/employees/:id      # Delete
```

### Devices
```bash
GET    /api/devices            # List with pagination
GET    /api/devices/:id        # Get by ID
POST   /api/devices            # Create
PATCH  /api/devices/:id        # Update
DELETE /api/devices/:id        # Delete
```

### Positions
```bash
GET    /api/positions          # List with pagination
GET    /api/positions/:id      # Get by ID
POST   /api/positions          # Create
PATCH  /api/positions/:id      # Update
DELETE /api/positions/:id      # Delete
```

### Users
```bash
GET    /api/users              # List with pagination
GET    /api/users/me           # Get current user
GET    /api/users/:id          # Get by ID
POST   /api/users              # Create
PATCH  /api/users/:id          # Update
DELETE /api/users/:id          # Delete
```

### Shifts
```bash
GET    /api/shifts             # List with pagination
GET    /api/shifts/:id         # Get by ID
POST   /api/shifts             # Create
PATCH  /api/shifts/:id         # Update
DELETE /api/shifts/:id         # Delete
```

### Contracts
```bash
GET    /api/contracts          # List with pagination
GET    /api/contracts/:id      # Get by ID
POST   /api/contracts          # Create
PATCH  /api/contracts/:id      # Update
DELETE /api/contracts/:id      # Delete
```

## 🎨 Response Format

### Success Response
```json
{
  "success": true,
  "data": {
    "items": [...],
    "page": 1,
    "limit": 20,
    "total": 150,
    "totalPages": 8
  },
  "message": "Success message"
}
```

### Error Response
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Error description"
  }
}
```

## 🐛 Common Issues & Solutions

### Issue: "No token provided"
**Solution:** Include Authorization header
```bash
-H "Authorization: Bearer YOUR_TOKEN"
```

### Issue: "Token expired"
**Solution:** Login again or use refresh token endpoint
```bash
POST /api/auth/refresh
Authorization: Bearer REFRESH_TOKEN
```

### Issue: "Authentication failed"
**Solution:** Check Directus credentials in .env file

### Issue: Build errors
**Solution:** Clean and rebuild
```bash
rm -rf dist
npm run build
```

## 🔧 Development Commands

```bash
# Development with hot reload
npm run dev

# Build TypeScript
npm run build

# Start production server
npm start

# Run linter
npm run lint

# Format code
npm run format
```

## 📖 Additional Documentation

- **[UPDATE_SUMMARY.md](UPDATE_SUMMARY.md)** - Latest updates and changes
- **[MIGRATION_GUIDE.md](MIGRATION_GUIDE.md)** - Guide for updating modules
- **[API_EXAMPLES.md](API_EXAMPLES.md)** - Comprehensive API examples
- **[README.md](README.md)** - Full project documentation

## 🚀 Production Deployment

```bash
# 1. Build for production
npm run build

# 2. Set environment to production
export NODE_ENV=production

# 3. Start with PM2 (recommended)
pm2 start dist/server.js --name hrms-backend

# 4. Monitor
pm2 logs hrms-backend
pm2 monit
```

## 📊 Health Check

```bash
# Check if server is running
curl http://localhost:3000/api/health

# Expected response
{
  "success": true,
  "data": {
    "status": "ok",
    "timestamp": "2024-11-14T10:00:00.000Z"
  }
}
```

## 🤝 Support

For issues or questions:
1. Check documentation files
2. Review error logs
3. Verify Directus connection
4. Test with API examples

## 🎉 Success Indicators

✅ Server starts without errors
✅ Authentication works
✅ Can fetch paginated data
✅ Filters and search work
✅ No TypeScript build errors

---

**Happy Coding! 🚀**
