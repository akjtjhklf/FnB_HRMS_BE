// import { ClassConstructor, plainToInstance } from "class-transformer";
// import { validate } from "class-validator";
// import { NextFunction, Request, Response } from "express";
// import { HttpError } from "../core/base";
// import { ApiResponse } from "../core/response";

// export function validateBody<T>(dto: ClassConstructor<T>) {
//   return async (
//     req: Request,
//     _res: Response<ApiResponse<unknown>>,
//     next: NextFunction
//   ) => {
//     const instance = plainToInstance(dto, req.body, {
//       enableImplicitConversion: true,
//     });
//     const errors = await validate(instance as object, {
//       whitelist: true,
//       forbidNonWhitelisted: true,
//     });
//     if (errors.length) {
//       return next(
//         new HttpError(400, "Validation failed", "VALIDATION_ERROR", errors)
//       );
//     }
//     // assign transformed instance back
//     req.body = instance as unknown as Record<string, unknown>;
//     return next();
//   };
// }
import { z, ZodTypeAny } from "zod";
import { NextFunction, Request, Response } from "express";
import { HttpError } from "../core/base";
import { ApiResponse } from "../core/response";

/**
 * Middleware validate body bằng Zod schema
 * @param schema - Zod schema dùng để kiểm tra dữ liệu
 */
export function validateBody(schema: ZodTypeAny) {
  return (
    req: Request,
    _res: Response<ApiResponse<unknown>>,
    next: NextFunction
  ) => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      const formattedErrors = result.error.issues.map((err) => ({
        path: err.path.join("."),
        message: err.message,
      }));

      return next(
        new HttpError(
          400,
          "Dữ liệu gửi lên không hợp lệ",
          "VALIDATION_ERROR",
          formattedErrors
        )
      );
    }

    // Gán lại dữ liệu đã parse để đảm bảo đúng kiểu
    req.body = result.data;
    next();
  };
}
