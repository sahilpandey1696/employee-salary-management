import type { PrismaClient } from "@prisma/client";
import { Router } from "express";
import {
  parseEmployeeListParams,
  type EmployeeListParams,
} from "../../domain/employee/list-employees.js";
import { createEmployeeRepository } from "../../repositories/employee.repository.js";

export function createEmployeesRouter(prisma: PrismaClient): Router {
  const router = Router();
  const employees = createEmployeeRepository(prisma);

  router.get("/", async (request, response) => {
    try {
      const params = parseEmployeeListParams(parseListQuery(request.query));
      const result = await employees.list(params);
      response.json(result);
    } catch (error) {
      if (error instanceof Error) {
        response.status(400).json({ error: error.message });
        return;
      }

      throw error;
    }
  });

  return router;
}

function parseListQuery(query: Record<string, unknown>): EmployeeListParams {
  return {
    page: parseOptionalInteger(query.page),
    pageSize: parseOptionalInteger(query.pageSize),
    search: parseOptionalString(query.search),
    country: parseOptionalString(query.country),
  };
}

function parseOptionalString(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined;
}

function parseOptionalInteger(value: unknown): number | undefined {
  if (typeof value !== "string" || value.trim().length === 0) {
    return undefined;
  }

  const parsed = Number.parseInt(value, 10);
  return Number.isNaN(parsed) ? undefined : parsed;
}
