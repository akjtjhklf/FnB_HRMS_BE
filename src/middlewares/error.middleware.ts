import { NextFunction, Request, Response } from "express";
import { HttpError } from "../core/base";
import { ApiError, ApiResponse } from "../core/response";

export function errorMiddleware(
  err: unknown,
  _req: Request,
  res: Response<ApiResponse<unknown>>,
  _next: NextFunction
) {
  if (err instanceof HttpError) {
    return res.status(err.status).json({
      success: false,
      error: { message: err.message, code: err.code, details: err.details },
    } as ApiError);
  }
  const message = err instanceof Error ? err.message : "Internal Server Error";
  return res.status(500).json({ success: false, error: { message } });
}
