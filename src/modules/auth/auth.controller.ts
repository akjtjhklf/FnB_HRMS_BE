import { Request, Response } from "express";
import { HttpError } from "../../core/base";
import { ApiResponse } from "../../core/response";
import { directus } from "../../utils/directusClient";
import { sendError } from "../../core/response";

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
  _req: Request,
  res: Response<ApiResponse<unknown>>
) => {
  try {
    const response = await directus.refresh();
    const token = response.access_token;
    const refresh_token = response.refresh_token;

    return res.json({ success: true, data: { token, refresh_token } });
  } catch {
    throw new HttpError(401, "Unable to refresh token");
  }
};
