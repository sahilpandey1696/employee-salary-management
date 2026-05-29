import type { PrismaClient } from "@prisma/client";
import { Router } from "express";
import {
  parseEmployeeListParams,
  type EmployeeListParams,
} from "../../domain/employee/list-employees.js";
import { BadRequestError } from "../errors.js";
import {
  parseOptionalInteger,
  parseOptionalString,
} from "../query-parsers.js";
import { createEmployeeRepository } from "../../repositories/employee.repository.js";
import { createEmployeeSalaryRouter } from "./employee-salary.routes.js";

export function createEmployeesRouter(prisma: PrismaClient): Router {
  const router = Router();
  const employees = createEmployeeRepository(prisma);

  router.use("/:employeeId/salary", createEmployeeSalaryRouter(prisma));

  router.get("/", async (request, response, next) => {
    try {
      const params = parseEmployeeListParams(parseEmployeeListQuery(request.query));
      const result = await employees.list(params);
      response.json(result);
    } catch (error) {
      next(toHttpError(error));
    }
  });

  return router;
}

function parseEmployeeListQuery(
  query: Record<string, unknown>,
): EmployeeListParams {
  return {
    page: parseOptionalInteger(query.page, "page"),
    pageSize: parseOptionalInteger(query.pageSize, "pageSize"),
    search: parseOptionalString(query.search),
    country: parseOptionalString(query.country),
  };
}

function toHttpError(error: unknown): unknown {
  if (error instanceof BadRequestError) {
    return error;
  }

  if (error instanceof Error) {
    const { message } = error;
    if (message.startsWith("Page ") || message.startsWith("Page size ")) {
      return new BadRequestError(message);
    }
  }

  return error;
}
