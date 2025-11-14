# 🔐 Quick Login & Test

## 1. Login để lấy token mới

```bash
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"admin@example.com\",\"password\":\"YOUR_PASSWORD\"}"
```

Hoặc dùng Postman/Thunder Client/REST Client:

```http
POST http://localhost:4000/api/auth/login
Content-Type: application/json

{
  "email": "admin@example.com",
  "password": "your_password_here"
}
```

## 2. Copy token từ response

Response sẽ có dạng:
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refresh_token": "..."
  }
}
```

## 3. Test với token mới

```bash
# Thay YOUR_NEW_TOKEN bằng token vừa lấy được
curl http://localhost:4000/api/employees?page=1&limit=10 \
  -H "Authorization: Bearer YOUR_NEW_TOKEN"
```

## 4. Kiểm tra các endpoint

### Employees
```bash
GET http://localhost:4000/api/employees?page=1&limit=10
Authorization: Bearer YOUR_TOKEN
```

### Contracts  
```bash
GET http://localhost:4000/api/contracts?page=1&limit=10
Authorization: Bearer YOUR_TOKEN
```

### Users
```bash
GET http://localhost:4000/api/users?page=1&limit=10
Authorization: Bearer YOUR_TOKEN
```

### Positions
```bash
GET http://localhost:4000/api/positions?page=1&limit=10
Authorization: Bearer YOUR_TOKEN
```

### Devices
```bash
GET http://localhost:4000/api/devices?page=1&limit=10
Authorization: Bearer YOUR_TOKEN
```

### Shifts
```bash
GET http://localhost:4000/api/shifts?page=1&limit=10
Authorization: Bearer YOUR_TOKEN
```

---

## Nếu vẫn lỗi 500, kiểm tra:

1. **Directus đang chạy?**
   ```bash
   curl http://localhost:8055/server/health
   ```

2. **Database connection OK?**
   - Kiểm tra Directus admin panel: http://localhost:8055/admin

3. **Collection có tồn tại?**
   - Vào Directus admin, kiểm tra collections: employees, contracts, users, etc.

4. **Check server logs**
   - Xem terminal output để biết lỗi cụ thể

---

## Troubleshooting Common Issues

### Error: "Token expired"
**Solution:** Login lại để lấy token mới

### Error: "Collection not found"
**Solution:** Tạo collection trong Directus hoặc check tên collection

### Error: "No token provided"
**Solution:** Thêm Authorization header

### Error: "Invalid credentials"
**Solution:** Kiểm tra email/password trong .env file
