import { NextFunction, Request, Response } from "express";
import { HttpError } from "../core/base";
import { ApiResponse } from "../core/response";

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
