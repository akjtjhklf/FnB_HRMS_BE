# API Testing Examples

## Authentication

### 1. Login
```bash
POST http://localhost:3000/api/auth/login
Content-Type: application/json

{
  "email": "admin@example.com",
  "password": "your_password"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refresh_token": "..."
  }
}
```

### 2. Use token in subsequent requests
```bash
GET http://localhost:3000/api/employees
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## Employees API

### 1. Get all employees (with pagination)
```bash
GET http://localhost:3000/api/employees?page=1&limit=20
Authorization: Bearer YOUR_TOKEN
```

### 2. Search employees
```bash
GET http://localhost:3000/api/employees?search=John
Authorization: Bearer YOUR_TOKEN
```

### 3. Filter active employees
```bash
GET http://localhost:3000/api/employees?filter={"status":"active"}
Authorization: Bearer YOUR_TOKEN
```

### 4. Sort employees by name (ascending)
```bash
GET http://localhost:3000/api/employees?sort=full_name
Authorization: Bearer YOUR_TOKEN
```

### 5. Sort by hire date (descending)
```bash
GET http://localhost:3000/api/employees?sort=-hire_date
Authorization: Bearer YOUR_TOKEN
```

### 6. Complex query
```bash
GET http://localhost:3000/api/employees?page=1&limit=10&sort=-created_at&search=John&filter={"status":"active"}
Authorization: Bearer YOUR_TOKEN
```

### 7. Select specific fields only
```bash
GET http://localhost:3000/api/employees?fields=id,full_name,email,phone
Authorization: Bearer YOUR_TOKEN
```

### 8. Filter by hire date range
```bash
GET http://localhost:3000/api/employees?filter={"hire_date":{"_gte":"2024-01-01","_lte":"2024-12-31"}}
Authorization: Bearer YOUR_TOKEN
```

### 9. Get employee by ID
```bash
GET http://localhost:3000/api/employees/:id
Authorization: Bearer YOUR_TOKEN
```

### 10. Create new employee
```bash
POST http://localhost:3000/api/employees
Authorization: Bearer YOUR_TOKEN
Content-Type: application/json

{
  "employee_code": "EMP001",
  "first_name": "John",
  "last_name": "Doe",
  "full_name": "John Doe",
  "email": "john.doe@example.com",
  "phone": "0123456789",
  "status": "active"
}
```

### 11. Update employee
```bash
PATCH http://localhost:3000/api/employees/:id
Authorization: Bearer YOUR_TOKEN
Content-Type: application/json

{
  "status": "on_leave",
  "notes": "On medical leave"
}
```

### 12. Delete employee
```bash
DELETE http://localhost:3000/api/employees/:id
Authorization: Bearer YOUR_TOKEN
```

---

## Devices API

### 1. Get all devices with pagination
```bash
GET http://localhost:3000/api/devices?page=1&limit=20
Authorization: Bearer YOUR_TOKEN
```

### 2. Search devices by name or key
```bash
GET http://localhost:3000/api/devices?search=entrance
Authorization: Bearer YOUR_TOKEN
```

### 3. Filter by device type
```bash
GET http://localhost:3000/api/devices?filter={"device_type":"fingerprint"}
Authorization: Bearer YOUR_TOKEN
```

### 4. Filter by location
```bash
GET http://localhost:3000/api/devices?filter={"location":"Main Office"}
Authorization: Bearer YOUR_TOKEN
```

---

## Positions API

### 1. Get all positions
```bash
GET http://localhost:3000/api/positions?page=1&limit=20
Authorization: Bearer YOUR_TOKEN
```

### 2. Search positions
```bash
GET http://localhost:3000/api/positions?search=manager
Authorization: Bearer YOUR_TOKEN
```

### 3. Sort positions by name
```bash
GET http://localhost:3000/api/positions?sort=name
Authorization: Bearer YOUR_TOKEN
```

---

## Users API

### 1. Get all users
```bash
GET http://localhost:3000/api/users?page=1&limit=20
Authorization: Bearer YOUR_TOKEN
```

### 2. Search users by email
```bash
GET http://localhost:3000/api/users?search=admin
Authorization: Bearer YOUR_TOKEN
```

### 3. Get current user info
```bash
GET http://localhost:3000/api/users/me
Authorization: Bearer YOUR_TOKEN
```

---

## Shifts API

### 1. Get all shifts
```bash
GET http://localhost:3000/api/shifts?page=1&limit=20
Authorization: Bearer YOUR_TOKEN
```

### 2. Filter shifts by date
```bash
GET http://localhost:3000/api/shifts?filter={"shift_date":"2024-11-14"}
Authorization: Bearer YOUR_TOKEN
```

### 3. Filter shifts by date range
```bash
GET http://localhost:3000/api/shifts?filter={"shift_date":{"_gte":"2024-11-01","_lte":"2024-11-30"}}
Authorization: Bearer YOUR_TOKEN
```

### 4. Search shifts by name
```bash
GET http://localhost:3000/api/shifts?search=morning
Authorization: Bearer YOUR_TOKEN
```

---

## Contracts API

### 1. Get all contracts
```bash
GET http://localhost:3000/api/contracts?page=1&limit=20
Authorization: Bearer YOUR_TOKEN
```

### 2. Filter by contract type
```bash
GET http://localhost:3000/api/contracts?filter={"contract_type":"full_time"}
Authorization: Bearer YOUR_TOKEN
```

### 3. Search contracts
```bash
GET http://localhost:3000/api/contracts?search=C001
Authorization: Bearer YOUR_TOKEN
```

### 4. Filter active contracts
```bash
GET http://localhost:3000/api/contracts?filter={"status":"active"}
Authorization: Bearer YOUR_TOKEN
```

---

## Advanced Filter Examples

### 1. Multiple conditions (AND)
```bash
GET http://localhost:3000/api/employees?filter={"_and":[{"status":"active"},{"hire_date":{"_gte":"2024-01-01"}}]}
Authorization: Bearer YOUR_TOKEN
```

### 2. Multiple conditions (OR)
```bash
GET http://localhost:3000/api/employees?filter={"_or":[{"status":"active"},{"status":"on_leave"}]}
Authorization: Bearer YOUR_TOKEN
```

### 3. IN operator
```bash
GET http://localhost:3000/api/employees?filter={"status":{"_in":["active","on_leave"]}}
Authorization: Bearer YOUR_TOKEN
```

### 4. NOT IN operator
```bash
GET http://localhost:3000/api/employees?filter={"status":{"_nin":["terminated","suspended"]}}
Authorization: Bearer YOUR_TOKEN
```

### 5. NULL check
```bash
GET http://localhost:3000/api/employees?filter={"termination_date":{"_null":true}}
Authorization: Bearer YOUR_TOKEN
```

### 6. NOT NULL check
```bash
GET http://localhost:3000/api/employees?filter={"email":{"_nnull":true}}
Authorization: Bearer YOUR_TOKEN
```

### 7. Contains (case-insensitive)
```bash
GET http://localhost:3000/api/employees?filter={"full_name":{"_contains":"john"}}
Authorization: Bearer YOUR_TOKEN
```

---

## Common Response Format

### Success Response
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "1",
        "name": "John Doe",
        "email": "john@example.com"
      }
    ],
    "page": 1,
    "limit": 20,
    "total": 150,
    "totalPages": 8
  },
  "message": "Lấy danh sách thành công"
}
```

### Error Response
```json
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "No token provided"
  }
}
```

---

## Testing with cURL

### Login
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"your_password"}'
```

### Get employees with token
```bash
curl -X GET "http://localhost:3000/api/employees?page=1&limit=10" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### Search and filter
```bash
curl -X GET "http://localhost:3000/api/employees?search=John&filter=%7B%22status%22%3A%22active%22%7D" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

---

## Testing with JavaScript/Fetch

```javascript
// Login
const login = async () => {
  const response = await fetch('http://localhost:3000/api/auth/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email: 'admin@example.com',
      password: 'your_password'
    })
  });
  
  const data = await response.json();
  return data.data.token;
};

// Get employees
const getEmployees = async (token) => {
  const params = new URLSearchParams({
    page: '1',
    limit: '20',
    sort: '-created_at',
    search: 'John'
  });
  
  const response = await fetch(`http://localhost:3000/api/employees?${params}`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  return await response.json();
};

// Usage
(async () => {
  const token = await login();
  const employees = await getEmployees(token);
  console.log(employees);
})();
```

---

## Environment Variables Required

```env
DIRECTUS_URL=http://your-directus-instance.com
DIRECTUS_EMAIL=admin@example.com
DIRECTUS_PASSWORD=your_admin_password
API_KEY=your_optional_api_key
PORT=3000
```

---

## Notes

1. **Always include Authorization header** for protected routes
2. **URL encode filter parameters** when using special characters
3. **Page numbering starts from 1** (not 0)
4. **Maximum limit per page is 100**
5. **Sort prefix with `-` for descending order**
6. **Search is case-insensitive**
