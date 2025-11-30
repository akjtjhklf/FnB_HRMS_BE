import { NextFunction, Request, Response } from "express";
import { HttpError } from "../core/base";
import { ApiResponse } from "../core/response";
import { createDirectus, rest, staticToken, readMe, authentication } from "@directus/sdk";

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
export function requireAuth(allowedRoles?: string[]) {
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

      // ✅ Role-Based Access Control
      if (allowedRoles && allowedRoles.length > 0) {
        const userRole = (currentUser as any).role?.name?.toLowerCase();
        
        // Always allow 'administrator' role
        if (userRole === 'administrator') {
          console.log(`✅ Access granted. User is Administrator.`);
        } else {
          const hasPermission = allowedRoles.some(role => 
            role.toLowerCase() === userRole
          );

          if (!hasPermission) {
            console.log(`❌ Access denied. User role: ${userRole}, Required: ${allowedRoles.join(', ')}`);
            return next(new HttpError(403, "Forbidden: Insufficient permissions", "FORBIDDEN"));
          }

          console.log(`✅ Access granted. User role: ${userRole}`);
        }
      }

      // ✅ NEW: Lookup employee linked to this user
      try {
        const { readItems } = await import("@directus/sdk");
        const employees: any[] = await userClient.request(
          readItems("employees", {
            filter: {
              user_id: { _eq: currentUser.id }
            },
            limit: 1,
          })
        );

        // Attach employee_id if found
        if (employees && Array.isArray(employees) && employees.length > 0) {
          (currentUser as any).employee_id = employees[0].id;
          console.log("✅ Employee found:", employees[0].id);
        } else {
          console.log("⚠️ No employee linked to user:", currentUser.id);
        }
      } catch (empError) {
        console.warn("Could not fetch employee:", empError);
        // Continue anyway - some users may not be employees
      }

      // Attach user and client to request
      (req as any).user = currentUser;
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
