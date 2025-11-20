# Backend Changes for Dynamic RBAC

## Summary

Updated BE to support dynamic RBAC by populating role information with admin_access flag in `/users/me` endpoint.

## Changes Made

### 1. User Model (`user.model.ts`)
- Added `Role` interface with `admin_access` and `app_access` flags
- Updated `User.role` to support both string (ID) and populated Role object
- Added `employee_id` field to link users to employees table

```typescript
export interface Role {
  id: string;
  name: string;
  icon?: string | null;
  description?: string | null;
  admin_access?: boolean;
  app_access?: boolean;
}

export interface User {
  // ... other fields
  role?: string | Role | null; // Can be ID or populated
  employee_id?: string | null;
}
```

### 2. User Repository (`user.repository.ts`)
- Override `findById()` to populate role fields automatically
- Update `findByEmail()` to populate role fields

```typescript
async findById(id: string | number, fields?: string[]): Promise<User | null> {
  const result = await this.findAll({
    filter: { id: { _eq: String(id) } },
    fields: fields || ["*", "role.id", "role.name", "role.icon", "role.description", "role.admin_access", "role.app_access"],
    limit: 1,
  });
  return result[0] ?? null;
}
```

### 3. User DTO (`user.dto.ts`)
- Added `roleResponseSchema` for populated role structure
- Updated `userResponseSchema` to accept both string and object for role
- Added `employee_id` to response
- Preserve role structure in mapper (don't serialize to string)

```typescript
export const roleResponseSchema = z.object({
  id: z.string(),
  name: z.string(),
  icon: z.string().nullable(),
  description: z.string().nullable(),
  admin_access: z.boolean().optional(),
  app_access: z.boolean().optional(),
});

export const userResponseSchema = z.object({
  // ... other fields
  role: z.union([z.string(), roleResponseSchema]).nullable(),
  employee_id: z.string().nullable(),
});
```

### 4. Auth Middleware (`auth.middleware.ts`)
- Already populating role with `fields: ['*', 'role.*']`
- No changes needed - already working correctly!

```typescript
const currentUser = await userClient.request(
  readMe({
    fields: ['*', 'role.*'] // Populate role
  })
);
```

## API Response Examples

### Before
```json
{
  "data": {
    "id": "uuid",
    "email": "user@example.com",
    "role": "role-uuid", // Just ID
    ...
  }
}
```

### After
```json
{
  "data": {
    "id": "uuid",
    "email": "user@example.com",
    "role": {
      "id": "role-uuid",
      "name": "Manager",
      "admin_access": false,
      "app_access": true
    },
    "employee_id": "emp-uuid",
    ...
  }
}
```

## Endpoints Status

### ✅ Working
- `GET /users/me` - Returns user with populated role

### 🔄 Placeholder (TODO)
- `GET /permissions?policy={policyId}` - Get permissions by policy
- `GET /permissions/me` - Get current user's permissions
- `GET /policies/me` - Get current user's policies

## Directus Structure

### Current Tables
- `directus_users` - User accounts
- `directus_roles` - Roles with admin_access flag
- `directus_policies` - Access policies (admin_access, app_access)
- `directus_permissions` - Collection-level permissions (create, read, update, delete)

### Relationships
```
User → Role → (has implicit) → Policies → Permissions
```

**Note**: Directus v10 handles policy-role relationships internally. We only need to:
1. Populate role in user responses ✅
2. Check `admin_access` flag on role ✅
3. (Future) Query permissions via Directus API

## Frontend Impact

Frontend now receives:
```typescript
interface User {
  role?: {
    id: string;
    name: string;
    admin_access?: boolean;
    app_access?: boolean;
  }
}
```

Can check permissions:
```typescript
// Admin check
if (user?.role?.admin_access) {
  // Full access
}

// Role name check (fallback)
if (user?.role?.name?.includes('manager')) {
  // Manager access
}
```

## Testing

Test with different user roles:

1. **Admin User** (admin_access = true):
   - Should have full access to all features
   - Bypass all permission checks

2. **Manager User** (name contains "manager"):
   - Can manage schedules, assignments
   - Cannot register availability

3. **Employee User**:
   - Can register availability
   - Can view own schedule
   - Cannot manage schedules

## Next Steps

1. ✅ Populate role in /users/me
2. ✅ Add admin_access to Role model
3. ✅ Update FE to check admin_access
4. 🔄 Implement policy-role relationships (if needed)
5. 🔄 Add permission API endpoints (if needed)

## Notes

- Directus v10 manages permissions internally via policies
- For most use cases, checking `admin_access` + role name is sufficient
- Full permission API only needed for fine-grained control
- Current implementation provides good balance of security and simplicity
