// src/core/response.ts
import { Response, Request, NextFunction } from "express";
import { HttpError } from "./base";

export interface ApiSuccess<T> {
  success: true;
  data: T;
  message?: string;
}

export interface ApiError {
  success: false;
  error: { message: string; code?: string; details?: unknown };
}

export type ApiResponse<T> = ApiSuccess<T> | ApiError;

// ====== Helpers ======
export function sendSuccess<T>(
  res: Response<ApiResponse<T>>,
  data: T,
  status = 200,
  message?: string
) {
  const response: ApiSuccess<T> = { success: true, data };
  if (message) response.message = message;
  return res.status(status).json(response);
}

export const sendError = (
  res: Response,
  message: string,
  status = 400,
  code?: string,
  details?: unknown
) => {
  const payload: ApiResponse<unknown> = {
    success: false,
    error: { message, code, details },
  };
  return res.status(status).json(payload);
};

// ====== Middleware ======
export const errorMiddleware = (
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
) => {
  if (err instanceof HttpError) {
    return sendError(res, err.message, err.status, err.code, err.details);
  }
  console.error("[UnhandledError]", err);
  return sendError(res, "Internal Server Error", 500);
};
