import { NextFunction, Request, Response } from "express";
import { HttpError } from "../core/base";
import { ApiResponse } from "../core/response";
import { createDirectus, rest, staticToken, readMe } from "@directus/sdk";

// Optional stub: validate API key if provided
export function apiKeyAuth(optional = true) {
  return (
    req: Request,
    _res: Response<ApiResponse<unknown>>,
    next: NextFunction
  ) => {
    const apiKey = req.header("x-api-key") || req.query.api_key;
    if (!apiKey && optional) return next();
    const expected = process.env.API_KEY;
    if (expected && apiKey === expected) return next();
    if (optional) return next();
    return next(new HttpError(401, "Unauthorized"));
  };
}

// JWT Authentication middleware
export function requireAuth() {
  return async (
    req: Request,
    _res: Response<ApiResponse<unknown>>,
    next: NextFunction
  ) => {
    try {
      const authHeader = req.headers.authorization;
      
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return next(new HttpError(401, "No token provided", "UNAUTHORIZED"));
      }

      const token = authHeader.substring(7); // Remove "Bearer " prefix

      console.log("🔐 Token received:", token.substring(0, 20) + "...");

      // Create a new Directus client with the user's token
      const client = createDirectus(process.env.DIRECTUS_URL!)
        .with(staticToken(token))
        .with(rest());

      // Fetch current user using the token
      const currentUser = await client.request(readMe());

      console.log("✅ User authenticated:", currentUser);

      if (!currentUser) {
        return next(new HttpError(401, "Invalid token", "UNAUTHORIZED"));
      }

      // Attach user to request object
      (req as any).user = currentUser;
      next();
    } catch (error) {
      console.error("❌ Auth middleware error:", error);
      return next(new HttpError(401, "Authentication failed", "UNAUTHORIZED"));
    }
  };
}
