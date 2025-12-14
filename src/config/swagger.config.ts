import swaggerUi from "swagger-ui-express";
import { Express } from "express";
import express from 'express';
import { apiKeyAuth } from "../middlewares/auth.middleware";
import * as swaggerDocument from "../../swagger.json";

export const setupSwagger = (app: Express) => {
  const serveMiddleware = swaggerUi.serve as unknown as express.RequestHandler;
  
  // Swagger UI options
  const swaggerOptions = {
    explorer: true,
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: "HRMS API Documentation",
  };
  
  app.use(
    "/api-docs",
    serveMiddleware,
    apiKeyAuth(true),
    swaggerUi.setup(swaggerDocument, swaggerOptions)
  );
  
  console.log("✅ Swagger UI configured at http://localhost:4000/api-docs");
};

