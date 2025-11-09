import swaggerJsdoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";
import { Express } from "express";
import express from 'express';
import { apiKeyAuth } from "../middlewares/auth.middleware";

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "HRMS API Documentation",
      version: "1.0.0",
      description: "API documentation for the HRMS backend",
    },
    servers: [
      {
        url: "http://localhost:4000/api",
        description: "Development server",
      },
    ],
  },
  apis: ["./src/modules/**/*.routes.ts"], // Đường dẫn tới file route
};

const specs = swaggerJsdoc(options);

export const setupSwagger = (app: Express) => {
  const serveMiddleware = swaggerUi.serve as unknown as express.RequestHandler;
  app.use("/api-docs", serveMiddleware, apiKeyAuth(true),swaggerUi.setup(specs));
  console.log("✅ Swagger configured");
};

