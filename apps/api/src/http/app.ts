import type { PrismaClient } from "@prisma/client";
import express from "express";
import { errorHandler } from "./middleware/error-handler.js";
import { notFoundHandler } from "./middleware/not-found-handler.js";
import { createDashboardRouter } from "./routes/dashboard.routes.js";
import { createEmployeesRouter } from "./routes/employees.routes.js";
import { createEmployeeRepository } from "../repositories/employee.repository.js";

export type AppDependencies = {
  prisma: PrismaClient;
};

export function createApp(dependencies: AppDependencies) {
  const app = express();

  app.set("etag", false);

  app.use(express.json());
  app.use((request, response, next) => {
    response.setHeader("Cache-Control", "no-store");
    response.setHeader("Access-Control-Allow-Origin", "*");
    response.setHeader(
      "Access-Control-Allow-Headers",
      "Content-Type, Authorization",
    );
    response.setHeader("Access-Control-Allow-Methods", "GET,POST,PATCH,DELETE,OPTIONS");
    if (request.method === "OPTIONS") {
      response.sendStatus(204);
      return;
    }
    next();
  });
  const employeeRepository = createEmployeeRepository(dependencies.prisma);

  app.get("/employees/next-code", async (_request, response, next) => {
    try {
      const employeeNumber = await employeeRepository.getNextEmployeeNumber();
      response.json({ employeeNumber });
    } catch (error) {
      next(error);
    }
  });

  app.use("/employees", createEmployeesRouter(dependencies.prisma));
  app.use("/dashboard", createDashboardRouter(dependencies.prisma));
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
