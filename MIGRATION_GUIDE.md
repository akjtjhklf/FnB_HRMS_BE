# Hướng dẫn Migration - Cập nhật Query System

## Tóm tắt các thay đổi

Hệ thống đã được cập nhật để hỗ trợ đầy đủ các tính năng query cho table quản lý:
- ✅ **Pagination**: `page`, `limit`
- ✅ **Sorting**: `sort` (ví dụ: `sort=name` hoặc `sort=-created_at`)
- ✅ **Filtering**: `filter` (JSON object)
- ✅ **Search**: `search` (global search across defined fields)
- ✅ **Field selection**: `fields` (comma-separated list)

## Các module đã được cập nhật

- ✅ **employees** - Hoàn thành
- ✅ **devices** - Hoàn thành
- ✅ **positions** - Hoàn thành

## Authentication đã được sửa

### 1. Auth Middleware (`src/middlewares/auth.middleware.ts`)
- Tạo client riêng cho mỗi request với token của user
- Xử lý lỗi chi tiết hơn (TOKEN_EXPIRED, INVALID_CREDENTIALS)
- Gắn cả `user` và `directusClient` vào request

### 2. Directus Client (`src/utils/directusClient.ts`)
- Thêm auto-refresh token mỗi 10 phút
- Kiểm tra trạng thái authentication
- Error handling tốt hơn

## Cách cập nhật các module còn lại

### Bước 1: Cập nhật Repository

Thêm `searchFields` vào repository class:

```typescript
import { DirectusRepository } from "../../core/directus.repository";
import { YourModel, YOUR_COLLECTION } from "./your.model";

export class YourRepository extends DirectusRepository<YourModel> {
  // THÊM DÒNG NÀY - danh sách các field có thể search
  protected searchFields = ["name", "code", "description", "email"];

  constructor() {
    super(YOUR_COLLECTION);
  }
  
  // ... các methods khác
}
```

### Bước 2: Cập nhật Service

Thêm method `listPaginated`:

```typescript
import { BaseService, HttpError } from "../../core/base";
import { YourModel } from "./your.model";
import YourRepository from "./your.repository";
import { PaginationQueryDto, PaginatedResponse } from "../../core/dto/pagination.dto";

export class YourService extends BaseService<YourModel> {
  constructor(repo = new YourRepository()) {
    super(repo);
  }

  // THÊM METHOD NÀY
  async listPaginated(query: PaginationQueryDto): Promise<PaginatedResponse<YourModel>> {
    return await (this.repo as YourRepository).findAllPaginated(query);
  }

  // ... các methods khác
}
```

### Bước 3: Cập nhật Controller

Sử dụng `parsePaginationQuery` helper:

```typescript
import { Request, Response, NextFunction } from "express";
import { ApiResponse, sendSuccess } from "../../core/response";
import YourService from "./your.service";
import { toYourResponseDto } from "./your.dto";
import { parsePaginationQuery } from "../../utils/query.utils";

const service = new YourService();

export const listYours = async (
  req: Request,
  res: Response<ApiResponse<unknown>>,
  next: NextFunction
) => {
  try {
    // THAY ĐỔI PHẦN NÀY
    const query = parsePaginationQuery(req);
    const result = await service.listPaginated(query);
    
    return sendSuccess(
      res,
      {
        items: result.data.map(toYourResponseDto),
        ...result.meta,
      },
      200,
      "Lấy danh sách thành công"
    );
  } catch (err) {
    next(err);
  }
};
```

## Ví dụ sử dụng API

### 1. Pagination cơ bản
```
GET /api/employees?page=1&limit=20
```

### 2. Sorting
```
GET /api/employees?sort=full_name           # Sắp xếp tăng dần
GET /api/employees?sort=-created_at         # Sắp xếp giảm dần
GET /api/employees?sort=status,-created_at  # Nhiều fields
```

### 3. Search
```
GET /api/employees?search=John
```

### 4. Filter
```
GET /api/employees?filter={"status":"active"}
GET /api/employees?filter={"hire_date":{"_gte":"2024-01-01"}}
```

### 5. Field selection
```
GET /api/employees?fields=id,full_name,email
```

### 6. Kết hợp tất cả
```
GET /api/employees?page=1&limit=20&sort=-created_at&search=John&filter={"status":"active"}
```

## Response format

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
  "message": "Lấy danh sách thành công"
}
```

## Directus filter operators

- `_eq`: Equals
- `_neq`: Not equals
- `_lt`: Less than
- `_lte`: Less than or equal
- `_gt`: Greater than
- `_gte`: Greater than or equal
- `_in`: In array
- `_nin`: Not in array
- `_contains`: Contains substring
- `_ncontains`: Not contains substring
- `_null`: Is null
- `_nnull`: Is not null

## Danh sách modules cần cập nhật

### Modules ưu tiên cao:
- [ ] users
- [ ] shifts
- [ ] contracts
- [ ] attendance-logs
- [ ] attendance-adjustments
- [ ] salary-requests
- [ ] schedule-assignments

### Modules khác:
- [ ] attendance-shifts
- [ ] deductions
- [ ] employee-availability
- [ ] employee-availability-positions
- [ ] files
- [ ] monthly-employee-stats
- [ ] permissions
- [ ] policies
- [ ] rfid-cards
- [ ] roles
- [ ] salary-schemes
- [ ] schedule-change-requests
- [ ] shift-position-requirements
- [ ] shift-types
- [ ] weekly-schedule

## Testing

Sau khi cập nhật, test các endpoints với:

1. Pagination cơ bản
2. Search functionality
3. Sort ascending/descending
4. Complex filters
5. Field selection
6. Kết hợp nhiều tính năng

## Notes

- `searchFields` trong repository nên chứa các fields quan trọng nhất
- Limit tối đa là 100 items per page (được set trong repository)
- Token sẽ tự động refresh mỗi 10 phút
- Mỗi request có token riêng, không share client giữa các requests
