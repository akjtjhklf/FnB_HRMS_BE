import { Request, Response } from "express";
import { HttpError } from "../../core/base";
import { ApiResponse } from "../../core/response";
import { directus } from "../../utils/directusClient";
import { sendError } from "../../core/response";
import authService from "./auth.service";
import { createDirectus, rest, staticToken } from "@directus/sdk";

export const login = async (
  req: Request,
  res: Response<ApiResponse<unknown>>
) => {
  const { email, password } = req.body;

  try {
    const response = await directus.login(email, password);

    // SDK mới trả về token trực tiếp
    const token = response.access_token;
    const refresh_token = response.refresh_token;

    return res.json({
      success: true,
      data: { token, refresh_token },
    });
  } catch (e) {
    console.error("❌ Login failed:", e);

    // Use sendError helper to ensure proper ApiResponse type
    return sendError(res, "Invalid credentials", 401);
  }
};

export const logout = async (
  _req: Request,
  res: Response<ApiResponse<unknown>>
) => {
  try {
    await directus.logout();
  } catch {}
  return res.json({ success: true, data: { loggedOut: true } });
};

export const refresh = async (
  req: Request,
  res: Response<ApiResponse<unknown>>
) => {
  try {
    console.log("🔄 Refresh request received");
    console.log("📦 Request body:", req.body);
    
    const { refresh_token } = req.body;

    if (!refresh_token) {
      console.error("❌ No refresh token provided");
      return sendError(res, "Refresh token is required", 400);
    }

    console.log("🔄 Attempting to refresh token with:", refresh_token.substring(0, 20) + "...");

    // Make a direct HTTP request to Directus refresh endpoint
    const directusUrl = process.env.DIRECTUS_URL;
    const refreshResponse = await fetch(`${directusUrl}/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        refresh_token: refresh_token,
        mode: 'json'
      })
    });

    if (!refreshResponse.ok) {
      const errorData = await refreshResponse.json();
      console.error("❌ Directus refresh failed:", errorData);
      return sendError(res, "Unable to refresh token. Please log in again.", 401);
    }

    const data = await refreshResponse.json();
    const token = data.data.access_token;
    const new_refresh_token = data.data.refresh_token;

    console.log("✅ Token refreshed successfully");

    return res.json({ success: true, data: { token, refresh_token: new_refresh_token } });
  } catch (error: any) {
    console.error("❌ Token refresh failed:");
    console.error("Error message:", error?.message);
    console.error("Error details:", error);
    return sendError(res, "Unable to refresh token. Please log in again.", 401);
  }
};

/**
 * Get current user identity with full Employee, Role, and Permissions
 * Route: GET /api/auth/me
 */
export const getMe = async (
  req: Request,
  res: Response<ApiResponse<unknown>>
) => {
  try {
    const userClient = (req as any).directusClient;
    
    if (!userClient) {
      return sendError(res, "Unauthorized", 401);
    }

    // Get full identity using AuthService
    const identity = await authService.getUserIdentity(userClient);

    return res.json({
      success: true,
      data: identity
    });
  } catch (error: any) {
    console.error("❌ Get me failed:", error);
    return sendError(res, error?.message || "Failed to get user info", 401);
  }
};
