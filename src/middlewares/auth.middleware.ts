import { NextFunction, Request, Response } from "express";
import { HttpError } from "../core/base";
import { ApiResponse } from "../core/response";
import { createDirectus, rest, staticToken, readMe, readItems, authentication } from "@directus/sdk";
import { adminDirectus as directus } from "../utils/directusClient";

// Optional stub: validate API key if provided
export function apiKeyAuth(optional = true) {
  return (
    req: Request,
    _res: Response<ApiResponse<unknown>>,
    next: NextFunction
  ) => {
    console.log("Authorization Header:", req.headers.authorization);
    console.log("x-api-key Header:", req.header("x-api-key"));

    const apiKey = req.header("x-api-key") || req.query.api_key;
    if (!apiKey && optional) return next();
    const expected = process.env.API_KEY;
    if (expected && apiKey === expected) return next();
    if (optional) return next();
    return next(new HttpError(401, "Unauthorized"));
  };
}

// JWT Authentication middleware - đồng bộ với Directus
export function requireAuth() {
  return async (
    req: Request,
    _res: Response<ApiResponse<unknown>>,
    next: NextFunction
  ) => {
    try {
      const authHeader = req.headers.authorization;
      console.log("Authorization Header:", authHeader);

      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        console.log("No token provided or invalid format");
        return next(new HttpError(401, "No token provided", "UNAUTHORIZED"));
      }

      const token = authHeader.substring(7); // Remove "Bearer " prefix
      console.log("Extracted Token:", token);

      if (!token || token.trim().length === 0) {
        console.log("Invalid token format");
        return next(new HttpError(401, "Invalid token format", "UNAUTHORIZED"));
      }

      // Tạo client mới cho mỗi request với token của user
      const userClient = createDirectus(process.env.DIRECTUS_URL!)
        .with(staticToken(token))
        .with(rest());

      // Verify token bằng cách lấy thông tin user hiện tại
      const currentUser = await userClient.request(
        readMe({
          fields: ['*', 'role.*']
        })
      );

      console.log("Current User:", currentUser);

      if (!currentUser) {
        console.log("Invalid or expired token");
        return next(new HttpError(401, "Invalid or expired token", "UNAUTHORIZED"));
      }

      // Tìm employee_id nếu user chưa có - SỬ DỤNG ADMIN CLIENT để bypass permission
      let employeeId = (currentUser as any).employee_id;
      if (!employeeId) {
        try {
          // Dùng admin directus client thay vì user client
          const employees = await directus.request(
            readItems<any, any, any>("employees", {
              filter: { user_id: { _eq: (currentUser as any).id } },
              fields: ["id"] as any,
              limit: 1,
            })
          );
          if (employees && employees.length > 0) {
            employeeId = employees[0].id;
          }
        } catch (error) {
          console.error("❌ Error fetching employee by user_id:", error);
        }
      }

      // Gắn user và client vào request để sử dụng sau này
      (req as any).user = {
        ...currentUser,
        employee_id: employeeId,
      };
      (req as any).directusClient = userClient;

      next();
    } catch (error: any) {
      console.error("❌ Auth middleware error:", error?.message || error);

      // Xử lý các loại lỗi cụ thể
      if (error?.errors?.[0]?.extensions?.code === "INVALID_CREDENTIALS") {
        return next(new HttpError(401, "Invalid credentials", "UNAUTHORIZED"));
      }

      if (error?.errors?.[0]?.extensions?.code === "TOKEN_EXPIRED") {
        return next(new HttpError(401, "Token expired", "TOKEN_EXPIRED"));
      }

      return next(new HttpError(401, "Authentication failed", "UNAUTHORIZED"));
    }
  };
}
