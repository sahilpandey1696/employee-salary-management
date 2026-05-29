import type { PrismaClient } from "@prisma/client";
import { Router } from "express";
import { validateSalaryAmount } from "../../domain/salary/salary-record.js";
import {
  BadRequestError,
  ConflictError,
  NotFoundError,
} from "../errors.js";
import {
  SalaryConflictError,
  SalaryNotFoundError,
  createSalaryRepository,
} from "../../repositories/salary.repository.js";

export function createEmployeeSalaryRouter(prisma: PrismaClient): Router {
  const router = Router({ mergeParams: true });
  const salaries = createSalaryRepository(prisma);

  router.get("/", async (request, response, next) => {
    try {
      const employeeId = parseEmployeeId(request.params.employeeId);

      if (!(await employeeExists(prisma, employeeId))) {
        throw new NotFoundError("Employee not found");
      }

      const salary = await salaries.getActive(employeeId);

      if (salary === null) {
        throw new NotFoundError("No active salary record found for employee");
      }

      response.json(serializeSalary(salary));
    } catch (error) {
      next(mapSalaryRouteError(error));
    }
  });

  router.post("/", async (request, response, next) => {
    try {
      const employeeId = parseEmployeeId(request.params.employeeId);

      if (!(await employeeExists(prisma, employeeId))) {
        throw new NotFoundError("Employee not found");
      }

      const amount = parseRequiredNumber(request.body?.amount, "amount");
      const currency = parseRequiredString(request.body?.currency, "currency");
      const effectiveFrom = parseEffectiveFrom(request.body?.effectiveFrom);

      const salary = await salaries.create(employeeId, {
        amount,
        currency,
        effectiveFrom,
      });

      response.status(201).json(serializeSalary(salary));
    } catch (error) {
      next(mapSalaryRouteError(error));
    }
  });

  router.patch("/", async (request, response, next) => {
    try {
      const employeeId = parseEmployeeId(request.params.employeeId);

      if (!(await employeeExists(prisma, employeeId))) {
        throw new NotFoundError("Employee not found");
      }

      const amount = parseRequiredNumber(request.body?.amount, "amount");
      const salary = await salaries.updateAmount(employeeId, amount);
      response.json(serializeSalary(salary));
    } catch (error) {
      next(mapSalaryRouteError(error));
    }
  });

  return router;
}

async function employeeExists(
  prisma: PrismaClient,
  employeeId: string,
): Promise<boolean> {
  const count = await prisma.employee.count({ where: { id: employeeId } });
  return count > 0;
}

function parseEmployeeId(value: string | string[] | undefined): string {
  if (typeof value !== "string" || value.length === 0) {
    throw new BadRequestError("Employee id is required");
  }

  return value;
}

function parseRequiredString(value: unknown, field: string): string {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new BadRequestError(`${field} is required`);
  }

  return value;
}

function parseRequiredNumber(value: unknown, field: string): number {
  if (typeof value !== "number" || Number.isNaN(value)) {
    throw new BadRequestError(`${field} must be a number`);
  }

  return validateSalaryAmount(value);
}

function parseEffectiveFrom(value: unknown): Date {
  if (value === undefined) {
    return new Date();
  }

  if (typeof value !== "string") {
    throw new BadRequestError("effectiveFrom must be an ISO date string");
  }

  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    throw new BadRequestError("effectiveFrom must be an ISO date string");
  }

  return parsed;
}

function serializeSalary(salary: {
  id: string;
  employeeId: string;
  amount: number;
  currency: string;
  effectiveFrom: Date;
  isActive: boolean;
}) {
  return {
    id: salary.id,
    employeeId: salary.employeeId,
    amount: salary.amount,
    currency: salary.currency,
    effectiveFrom: salary.effectiveFrom.toISOString(),
    isActive: salary.isActive,
  };
}

function mapSalaryRouteError(error: unknown): unknown {
  if (
    error instanceof BadRequestError ||
    error instanceof NotFoundError ||
    error instanceof ConflictError
  ) {
    return error;
  }

  if (error instanceof SalaryNotFoundError) {
    return new NotFoundError(error.message);
  }

  if (error instanceof SalaryConflictError) {
    return new ConflictError(error.message);
  }

  if (error instanceof Error) {
    return new BadRequestError(error.message);
  }

  return error;
}
