import type { PrismaClient } from "@prisma/client";
import express from "express";
import { createEmployeesRouter } from "./routes/employees.routes.js";

export type AppDependencies = {
  prisma: PrismaClient;
};

export function createApp(dependencies: AppDependencies) {
  const app = express();

  app.use(express.json());
  app.use("/employees", createEmployeesRouter(dependencies.prisma));

  return app;
}
