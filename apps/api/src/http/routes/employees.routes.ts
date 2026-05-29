import type { PrismaClient } from "@prisma/client";
import { Router } from "express";
import { BadRequestError } from "../errors.js";
import {
  parseOptionalInteger,
  parseOptionalString,
} from "../query-parsers.js";
import {
  DEFAULT_LIST_PAGE_SIZE,
  createEmployeeRepository,
} from "../../repositories/employee.repository.js";
import { createEmployeeSalaryRouter } from "./employee-salary.routes.js";

const MAX_PAGE_SIZE = 100;

export function createEmployeesRouter(prisma: PrismaClient): Router {
  const router = Router();
  const employees = createEmployeeRepository(prisma);

  router.get("/", async (request, response, next) => {
    try {
      const query = parseListQuery(request.query);
      const result = await employees.list(query);
      response.json(result);
    } catch (error) {
      next(toHttpError(error));
    }
  });

  router.post("/", async (request, response, next) => {
    try {
      const body = request.body as Record<string, unknown>;
      const record = await employees.create({
        firstName: requireString(body.firstName, "firstName"),
        lastName: requireString(body.lastName, "lastName"),
        employeeNumber: parseOptionalString(body.employeeNumber),
        email: requireString(body.email, "email"),
        phone: parseOptionalString(body.phone),
        country: requireString(body.country, "country"),
        department: requireString(body.department, "department"),
        jobTitle: requireString(body.jobTitle, "jobTitle"),
        employmentStatus: requireString(body.employmentStatus, "employmentStatus"),
        joiningDate: parseDate(body.joiningDate, "joiningDate"),
        currency: requireString(body.currency, "currency"),
        annualSalary: requireNumber(body.annualSalary, "annualSalary"),
      });
      response.status(201).json(record);
    } catch (error) {
      next(error);
    }
  });

  router.get("/:employeeId", async (request, response, next) => {
    try {
      const id = parseEmployeeId(request.params.employeeId);
      const record = await employees.getById(id);
      response.json(record);
    } catch (error) {
      next(error);
    }
  });

  router.patch("/:employeeId", async (request, response, next) => {
    try {
      const id = parseEmployeeId(request.params.employeeId);
      const body = request.body as Record<string, unknown>;
      const record = await employees.update(id, {
        firstName: parseOptionalString(body.firstName),
        lastName: parseOptionalString(body.lastName),
        email: parseOptionalString(body.email),
        phone: parseOptionalString(body.phone),
        country: parseOptionalString(body.country),
        department: parseOptionalString(body.department),
        jobTitle: parseOptionalString(body.jobTitle),
        employmentStatus: parseOptionalString(body.employmentStatus),
        joiningDate:
          body.joiningDate === undefined
            ? undefined
            : parseDate(body.joiningDate, "joiningDate"),
        currency: parseOptionalString(body.currency),
        annualSalary:
          body.annualSalary === undefined
            ? undefined
            : requireNumber(body.annualSalary, "annualSalary"),
      });
      response.json(record);
    } catch (error) {
      next(error);
    }
  });

  router.delete("/:employeeId", async (request, response, next) => {
    try {
      const id = parseEmployeeId(request.params.employeeId);
      await employees.delete(id);
      response.status(204).send();
    } catch (error) {
      next(error);
    }
  });

  router.use("/:employeeId/salary", createEmployeeSalaryRouter(prisma));

  return router;
}

function parseListQuery(query: Record<string, unknown>) {
  const page = parseOptionalInteger(query.page, "page") ?? 1;
  const pageSize =
    parseOptionalInteger(query.pageSize, "pageSize") ?? DEFAULT_LIST_PAGE_SIZE;

  if (page < 1) {
    throw new BadRequestError("Page must be at least 1");
  }

  if (pageSize < 1) {
    throw new BadRequestError("Page size must be at least 1");
  }

  if (pageSize > MAX_PAGE_SIZE) {
    throw new BadRequestError(`Page size must not exceed ${MAX_PAGE_SIZE}`);
  }

  const sortDir = query.sortDir === "desc" ? "desc" : "asc";
  const sortBy =
    typeof query.sortBy === "string" && query.sortBy.length > 0
      ? query.sortBy
      : "fullName";

  const employmentStatus = parseOptionalString(query.employmentStatus);
  const normalizedStatus =
    employmentStatus === undefined
      ? undefined
      : employmentStatus.toUpperCase() === "ALL"
        ? undefined
        : employmentStatus.toUpperCase();

  const search = parseOptionalString(query.search)?.toLowerCase();

  return {
    page,
    pageSize,
    search,
    employmentStatus: normalizedStatus,
    sortBy,
    sortDir: sortDir as "asc" | "desc",
  };
}

function parseEmployeeId(value: string | string[] | undefined): string {
  if (typeof value !== "string" || value.length === 0) {
    throw new BadRequestError("Employee id is required");
  }
  return value;
}

function requireString(value: unknown, field: string): string {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new BadRequestError(`${field} is required`);
  }
  return value;
}

function requireNumber(value: unknown, field: string): number {
  if (typeof value !== "number" || Number.isNaN(value)) {
    throw new BadRequestError(`${field} must be a number`);
  }
  return value;
}

function parseDate(value: unknown, field: string): Date {
  if (typeof value !== "string") {
    throw new BadRequestError(`${field} must be an ISO date string`);
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    throw new BadRequestError(`${field} must be an ISO date string`);
  }
  return parsed;
}

function toHttpError(error: unknown): unknown {
  if (error instanceof BadRequestError) {
    return error;
  }
  return error;
}
