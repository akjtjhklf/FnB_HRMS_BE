import { Request, Response, NextFunction } from "express";
import { HttpError } from "../core/base";
import authService from "../modules/auth/auth.service";

/**
 * Middleware kiểm tra quyền truy cập dựa trên permissions
 * Sử dụng sau requireAuth() middleware
 * 
 * @param action - Hành động cần kiểm tra (create, read, update, delete)
 * @param collection - Collection cần kiểm tra quyền
 * 
 * @example
 * router.get('/employees', requireAuth(), checkPermission('read', 'employees'), listEmployees);
 * router.post('/shifts', requireAuth(), checkPermission('create', 'shifts'), createShift);
 */
export function checkPermission(action: string, collection: string) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const directusClient = (req as any).directusClient;
      
      if (!directusClient) {
        return next(new HttpError(401, "Unauthorized", "UNAUTHORIZED"));
      }

      // Kiểm tra admin_access từ JWT token trước (không cần query DB)
      const user = (req as any).user;
      if (user?.admin_access === true) {
        // Admin có full quyền, bypass permission check
        return next();
      }

      // Lấy full identity cho non-admin users
      const identity = await authService.getUserIdentity(directusClient);

      // Cache identity vào request để tránh phải query lại
      (req as any).identity = identity;

      // Kiểm tra permission
      const hasAccess = authService.hasPermission(identity, action, collection);

      if (!hasAccess) {
        return next(new HttpError(
          403, 
          `Bạn không có quyền ${action} trên ${collection}`, 
          "FORBIDDEN"
        ));
      }

      next();
    } catch (error: any) {
      console.error("❌ Permission check error:", error);
      return next(new HttpError(403, "Forbidden", "FORBIDDEN"));
    }
  };
}

/**
 * Middleware kiểm tra có bất kỳ permission nào trong list
 */
export function checkAnyPermission(requiredPerms: Array<{ action: string, collection: string }>) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const directusClient = (req as any).directusClient;
      
      if (!directusClient) {
        return next(new HttpError(401, "Unauthorized", "UNAUTHORIZED"));
      }

      // Kiểm tra admin_access từ JWT token trước
      const user = (req as any).user;
      if (user?.admin_access === true) {
        return next();
      }

      const identity = await authService.getUserIdentity(directusClient);
      (req as any).identity = identity;

      const hasAccess = authService.hasAnyPermission(identity, requiredPerms);

      if (!hasAccess) {
        return next(new HttpError(403, "Insufficient permissions", "FORBIDDEN"));
      }

      next();
    } catch (error: any) {
      console.error("❌ Permission check error:", error);
      return next(new HttpError(403, "Forbidden", "FORBIDDEN"));
    }
  };
}

/**
 * Middleware kiểm tra có tất cả permissions trong list
 */
export function checkAllPermissions(requiredPerms: Array<{ action: string, collection: string }>) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const directusClient = (req as any).directusClient;
      
      if (!directusClient) {
        return next(new HttpError(401, "Unauthorized", "UNAUTHORIZED"));
      }

      // Kiểm tra admin_access từ JWT token trước
      const user = (req as any).user;
      if (user?.admin_access === true) {
        return next();
      }

      const identity = await authService.getUserIdentity(directusClient);
      (req as any).identity = identity;

      const hasAccess = authService.hasAllPermissions(identity, requiredPerms);

      if (!hasAccess) {
        return next(new HttpError(403, "Insufficient permissions", "FORBIDDEN"));
      }

      next();
    } catch (error: any) {
      console.error("❌ Permission check error:", error);
      return next(new HttpError(403, "Forbidden", "FORBIDDEN"));
    }
  };
}

/**
 * Middleware kiểm tra admin access
 */
export function requireAdmin() {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const directusClient = (req as any).directusClient;
      
      if (!directusClient) {
        return next(new HttpError(401, "Unauthorized", "UNAUTHORIZED"));
      }

      // Kiểm tra admin_access từ JWT token trước (không cần query DB)
      const user = (req as any).user;
      if (user?.admin_access === true) {
        return next();
      }

      const identity = await authService.getUserIdentity(directusClient);
      (req as any).identity = identity;

      if (!identity.is_admin) {
        return next(new HttpError(403, "Admin access required", "FORBIDDEN"));
      }

      next();
    } catch (error: any) {
      console.error("❌ Admin check error:", error);
      return next(new HttpError(403, "Forbidden", "FORBIDDEN"));
    }
  };
}

/**
 * Middleware load identity vào request mà không check permission
 * Dùng khi cần identity nhưng không cần check quyền cụ thể
 */
export function loadIdentity() {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const directusClient = (req as any).directusClient;
      
      if (!directusClient) {
        return next();
      }

      const identity = await authService.getUserIdentity(directusClient);
      (req as any).identity = identity;

      next();
    } catch (error: any) {
      console.error("❌ Load identity error:", error);
      next();
    }
  };
}
