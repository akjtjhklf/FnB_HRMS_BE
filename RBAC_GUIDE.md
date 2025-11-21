# Hướng dẫn sử dụng hệ thống RBAC (Role-Based Access Control)

## Tổng quan

Hệ thống RBAC đã được tối ưu để hoạt động với flow:
**User → Employee → Role → Policy → Permission**

### Kiến trúc

```
User (directus_users)
  ├── employee_id → Employee (employees)
  └── role → Role (directus_roles)
              └── policies (many-to-many via directus_access)
                  └── Policy (directus_policies)
                      └── Permissions (directus_permissions)
```

## Backend Implementation

### 1. Auth Service (`auth.service.ts`)

Service chính để lấy User Identity đầy đủ:

```typescript
import authService from "./modules/auth/auth.service";

// Get full identity với Employee, Role, Policies, Permissions
const identity = await authService.getUserIdentity(userClient);

// Check permissions
const canRead = authService.hasPermission(identity, 'read', 'employees');
const canCreate = authService.hasPermission(identity, 'create', 'shifts');

// Check multiple permissions
const hasAny = authService.hasAnyPermission(identity, [
  { action: 'read', collection: 'employees' },
  { action: 'update', collection: 'employees' }
]);

// Get allowed actions for collection
const actions = authService.getAllowedActions(identity, 'employees');
// Returns: ['create', 'read', 'update'] (không có 'delete' nếu user không có quyền)
```

### 2. API Endpoints

#### GET /api/auth/me
Lấy full identity của user hiện tại (yêu cầu authentication):

```typescript
// Response
{
  "success": true,
  "data": {
    "id": "user-uuid",
    "email": "user@example.com",
    "first_name": "John",
    "last_name": "Doe",
    "name": "John Doe",
    "employee_id": "employee-uuid",
    "employee": {
      "id": "employee-uuid",
      "employee_code": "EMP001",
      "full_name": "John Doe",
      // ... other employee fields
    },
    "role": {
      "id": "role-uuid",
      "name": "Manager",
      "policies": [
        {
          "id": "policy-uuid",
          "name": "Employee Management",
          "admin_access": false,
          "app_access": true,
          "permissions": [
            {
              "id": "perm-uuid",
              "collection": "employees",
              "action": "read",
              "fields": "*"
            }
          ]
        }
      ],
      "all_permissions": [ /* flattened permissions */ ]
    },
    "permissions": [ /* all permissions từ role */ ],
    "is_admin": false,
    "can_access_app": true
  }
}
```

#### GET /api/users/me
Alias của `/api/auth/me` (để tương thích với FE)

### 3. Middleware Usage

#### Permission Middleware

```typescript
import { requireAuth } from './middlewares/auth.middleware';
import { 
  checkPermission, 
  checkAnyPermission,
  requireAdmin,
  loadIdentity 
} from './middlewares/permission.middleware';

// Kiểm tra permission cụ thể
router.get('/employees', 
  requireAuth(), 
  checkPermission('read', 'employees'), 
  listEmployees
);

// Kiểm tra bất kỳ permission nào
router.put('/employees/:id',
  requireAuth(),
  checkAnyPermission([
    { action: 'update', collection: 'employees' },
    { action: 'update', collection: 'own_employee' }
  ]),
  updateEmployee
);

// Chỉ admin mới truy cập
router.delete('/users/:id',
  requireAuth(),
  requireAdmin(),
  deleteUser
);

// Load identity vào request (không check permission)
router.get('/dashboard',
  requireAuth(),
  loadIdentity(), // (req as any).identity sẽ có full data
  getDashboard
);
```

#### Access Identity trong Controller

```typescript
export const getEmployee = async (req: Request, res: Response) => {
  // Identity được inject bởi middleware
  const identity = (req as any).identity as UserIdentityDto;
  
  // Kiểm tra quyền động
  if (!authService.hasPermission(identity, 'read', 'employees')) {
    throw new HttpError(403, "Forbidden");
  }
  
  // Lấy employee info
  const currentEmployee = identity.employee;
  
  // Check admin
  if (identity.is_admin) {
    // Admin logic
  }
};
```

## Frontend Implementation

### 1. Get Identity Hook

```typescript
import { useGetIdentity } from "@refinedev/core";
import { UserIdentity } from "@/types/auth";

function MyComponent() {
  const { data: identity } = useGetIdentity<UserIdentity>();
  
  // Access user info
  console.log(identity?.name); // "John Doe"
  console.log(identity?.email); // "user@example.com"
  
  // Access employee info
  console.log(identity?.employee?.employee_code); // "EMP001"
  console.log(identity?.employee?.full_name); // "John Doe"
  
  // Access role
  console.log(identity?.role?.name); // "Manager"
  
  // Check permissions
  console.log(identity?.is_admin); // false
  console.log(identity?.can_access_app); // true
  
  // Access permissions array
  console.log(identity?.permissions); // [...all permissions]
}
```

### 2. Permission Helper Functions

```typescript
import { 
  hasPermission, 
  hasAnyPermission,
  isAdmin,
  getEmployeeInfo,
  getAllowedActions
} from "@/utils/permissions";
import { UserIdentity } from "@/types/auth";

function EmployeeList() {
  const { data: identity } = useGetIdentity<UserIdentity>();
  
  // Check single permission
  const canCreateEmployee = hasPermission(identity, 'create', 'employees');
  const canReadShifts = hasPermission(identity, 'read', 'shifts');
  
  // Check multiple permissions
  const canManageEmployees = hasAnyPermission(identity, [
    { action: 'update', collection: 'employees' },
    { action: 'delete', collection: 'employees' }
  ]);
  
  // Check admin
  const userIsAdmin = isAdmin(identity);
  
  // Get allowed actions
  const allowedActions = getAllowedActions(identity, 'employees');
  // Returns: ['create', 'read', 'update']
  
  // Get employee info
  const employee = getEmployeeInfo(identity);
  
  return (
    <div>
      {canCreateEmployee && (
        <Button onClick={handleCreate}>Tạo nhân viên</Button>
      )}
      
      {canReadShifts && (
        <ShiftCalendar />
      )}
      
      {userIsAdmin && (
        <AdminPanel />
      )}
      
      <p>Xin chào, {employee?.full_name}</p>
    </div>
  );
}
```

### 3. Conditional Rendering

```typescript
import { hasPermission } from "@/utils/permissions";

function ShiftManagement() {
  const { data: identity } = useGetIdentity<UserIdentity>();
  
  const canCreate = hasPermission(identity, 'create', 'shifts');
  const canUpdate = hasPermission(identity, 'update', 'shifts');
  const canDelete = hasPermission(identity, 'delete', 'shifts');
  
  return (
    <div>
      <Table>
        {/* ... table content ... */}
      </Table>
      
      {canCreate && (
        <Button type="primary">Tạo ca mới</Button>
      )}
      
      {canUpdate && (
        <Button>Cập nhật</Button>
      )}
      
      {canDelete && (
        <Popconfirm title="Xóa ca?" onConfirm={handleDelete}>
          <Button danger>Xóa</Button>
        </Popconfirm>
      )}
    </div>
  );
}
```

## Flow tối ưu cho hệ thống

### 1. Setup Directus

Tạo structure trong Directus Admin:

```
1. Tạo Roles (directus_roles)
   - Admin Role
   - Manager Role
   - Staff Role

2. Tạo Policies (directus_policies)
   - Employee Management Policy
   - Shift Management Policy
   - Read-only Policy

3. Tạo Permissions (directus_permissions)
   Cho mỗi Policy, tạo permissions:
   - collection: "employees", action: "read"
   - collection: "employees", action: "create"
   - collection: "shifts", action: "read"
   - collection: "shifts", action: "update"

4. Link Roles → Policies (directus_access table)
   - Manager Role → Employee Management Policy
   - Manager Role → Shift Management Policy
   - Staff Role → Read-only Policy

5. Tạo Users (directus_users)
   - Assign role cho user
   - Set employee_id nếu đã có employee record

6. Tạo Employees (employees collection)
   - Set user_id để link với user
```

### 2. Luồng Authentication & Authorization

```
1. User đăng nhập → POST /api/auth/login
   Response: { token, refresh_token }

2. Frontend lưu token → localStorage/cookie

3. Mỗi request → Header: Authorization: Bearer <token>

4. Backend middleware (requireAuth) verify token

5. Route cần permission → checkPermission('read', 'employees')
   - Middleware lấy identity qua authService
   - Check permission từ identity.permissions
   - Pass hoặc throw 403 Forbidden

6. Controller xử lý logic với identity
   - Access employee info: identity.employee
   - Check dynamic permission: authService.hasPermission()
   - Filter data based on permissions
```

### 3. Best Practices

#### Backend

```typescript
// ✅ GOOD: Sử dụng middleware cho permission check
router.get('/employees', 
  requireAuth(), 
  checkPermission('read', 'employees'),
  listEmployees
);

// ✅ GOOD: Dynamic permission check trong controller
export const updateEmployee = async (req: Request) => {
  const identity = (req as any).identity;
  const targetEmployeeId = req.params.id;
  
  // User chỉ có thể update chính mình (nếu không phải admin)
  if (!identity.is_admin && identity.employee_id !== targetEmployeeId) {
    throw new HttpError(403, "Can only update your own profile");
  }
  
  // ...
};

// ✅ GOOD: Cache identity trong middleware
// Tránh query lại nhiều lần trong cùng 1 request
```

#### Frontend

```typescript
// ✅ GOOD: Sử dụng helper functions
import { hasPermission } from "@/utils/permissions";

const canEdit = hasPermission(identity, 'update', 'employees');

// ✅ GOOD: Type-safe với UserIdentity
const { data: identity } = useGetIdentity<UserIdentity>();

// ✅ GOOD: Check employee link
if (identity?.employee) {
  console.log("Current employee:", identity.employee.employee_code);
}

// ❌ BAD: Hardcode role check
if (identity?.role?.name === "Manager") { } // Không nên

// ✅ GOOD: Check permission instead
if (hasPermission(identity, 'update', 'employees')) { }
```

## Ví dụ hoàn chỉnh

### Backend: Employee Controller với RBAC

```typescript
import { requireAuth } from "../../middlewares/auth.middleware";
import { checkPermission, loadIdentity } from "../../middlewares/permission.middleware";

// Routes
router.get("/employees", 
  requireAuth(), 
  checkPermission("read", "employees"),
  listEmployees
);

router.post("/employees",
  requireAuth(),
  checkPermission("create", "employees"),
  createEmployee
);

router.put("/employees/:id",
  requireAuth(),
  loadIdentity(), // Load identity nhưng check động trong controller
  updateEmployee
);

// Controller
export const updateEmployee = async (req: Request, res: Response) => {
  const identity = (req as any).identity;
  const targetId = req.params.id;
  
  // Admin hoặc có permission 'update' trên 'employees'
  const canUpdateAny = authService.hasPermission(identity, 'update', 'employees');
  
  // Hoặc update chính mình
  const isOwnProfile = identity.employee_id === targetId;
  
  if (!canUpdateAny && !isOwnProfile) {
    throw new HttpError(403, "Forbidden");
  }
  
  // Update logic...
  const updated = await employeeService.update(targetId, req.body);
  
  return sendSuccess(res, updated);
};
```

### Frontend: Employee Management với RBAC

```typescript
import { useGetIdentity } from "@refinedev/core";
import { UserIdentity } from "@/types/auth";
import { hasPermission, isAdmin } from "@/utils/permissions";

export function EmployeeManagement() {
  const { data: identity } = useGetIdentity<UserIdentity>();
  
  const canCreate = hasPermission(identity, "create", "employees");
  const canUpdate = hasPermission(identity, "update", "employees");
  const canDelete = hasPermission(identity, "delete", "employees");
  const userIsAdmin = isAdmin(identity);
  
  const currentEmployee = identity?.employee;
  
  return (
    <div>
      <h1>Quản lý nhân viên</h1>
      
      {currentEmployee && (
        <Alert>
          Xin chào, {currentEmployee.full_name} ({currentEmployee.employee_code})
        </Alert>
      )}
      
      {canCreate && (
        <Button type="primary" onClick={handleCreate}>
          Thêm nhân viên
        </Button>
      )}
      
      <Table
        dataSource={employees}
        columns={[
          { title: "Mã NV", dataIndex: "employee_code" },
          { title: "Tên", dataIndex: "full_name" },
          {
            title: "Thao tác",
            render: (_, record) => (
              <Space>
                {(canUpdate || record.id === currentEmployee?.id) && (
                  <Button onClick={() => handleEdit(record)}>Sửa</Button>
                )}
                
                {(canDelete || userIsAdmin) && (
                  <Popconfirm onConfirm={() => handleDelete(record.id)}>
                    <Button danger>Xóa</Button>
                  </Popconfirm>
                )}
              </Space>
            )
          }
        ]}
      />
    </div>
  );
}
```

## Migration từ hệ thống cũ

Nếu bạn đang có hệ thống cũ check role bằng `role.name`:

```typescript
// ❌ Cũ
if (user.role?.name === "Manager") {
  // Logic...
}

// ✅ Mới
import { hasPermission } from "@/utils/permissions";

if (hasPermission(identity, 'manage', 'employees')) {
  // Logic...
}
```

## Troubleshooting

### Backend không trả về permissions

Check:
1. User có role không? (`SELECT role FROM directus_users WHERE id = ?`)
2. Role có policies không? (`SELECT * FROM directus_access WHERE role = ?`)
3. Policy có permissions không? (`SELECT * FROM directus_permissions WHERE policy = ?`)

### Frontend không nhận được employee data

Check:
1. User có `employee_id` không? Hoặc Employee có `user_id` không?
2. Backend log có show "Employee" trong response không?
3. Network tab → `/api/users/me` có trả về `employee` object không?

### Permission check luôn trả về false

Check:
1. `identity.permissions` có data không?
2. Collection name có đúng không? (e.g., "employees" chứ không phải "employee")
3. Action name có đúng không? (e.g., "read", "create", "update", "delete")

---

**Kết luận**: Hệ thống RBAC giờ đã tối ưu, sử dụng đầy đủ Policy và Permission của Directus, giúp quản lý quyền linh hoạt và an toàn hơn.
