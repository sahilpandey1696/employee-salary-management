import type { PrismaClient } from "@prisma/client";
import express from "express";
import { createDashboardRouter } from "./routes/dashboard.routes.js";
import { createEmployeesRouter } from "./routes/employees.routes.js";

export type AppDependencies = {
  prisma: PrismaClient;
};

export function createApp(dependencies: AppDependencies) {
  const app = express();

  app.use(express.json());
  app.use("/employees", createEmployeesRouter(dependencies.prisma));
  app.use("/dashboard", createDashboardRouter(dependencies.prisma));

  return app;
}
