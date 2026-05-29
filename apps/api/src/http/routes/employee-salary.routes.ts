import type { PrismaClient } from "@prisma/client";
import { Router } from "express";
import { validateSalaryAmount } from "../../domain/salary/salary-record.js";
import {
  SalaryConflictError,
  SalaryNotFoundError,
  createSalaryRepository,
} from "../../repositories/salary.repository.js";

export function createEmployeeSalaryRouter(prisma: PrismaClient): Router {
  const router = Router({ mergeParams: true });
  const salaries = createSalaryRepository(prisma);

  router.get("/", async (request, response) => {
    const employeeId = parseEmployeeId(request.params.employeeId);

    if (!(await employeeExists(prisma, employeeId))) {
      response.status(404).json({ error: "Employee not found" });
      return;
    }

    try {
      const salary = await salaries.getActive(employeeId);

      if (salary === null) {
        response.status(404).json({
          error: "No active salary record found for employee",
        });
        return;
      }

      response.json(serializeSalary(salary));
    } catch (error) {
      sendDomainError(response, error);
    }
  });

  router.post("/", async (request, response) => {
    const employeeId = parseEmployeeId(request.params.employeeId);

    if (!(await employeeExists(prisma, employeeId))) {
      response.status(404).json({ error: "Employee not found" });
      return;
    }

    try {
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
      sendDomainError(response, error);
    }
  });

  router.patch("/", async (request, response) => {
    const employeeId = parseEmployeeId(request.params.employeeId);

    if (!(await employeeExists(prisma, employeeId))) {
      response.status(404).json({ error: "Employee not found" });
      return;
    }

    try {
      const amount = parseRequiredNumber(request.body?.amount, "amount");
      const salary = await salaries.updateAmount(employeeId, amount);
      response.json(serializeSalary(salary));
    } catch (error) {
      sendDomainError(response, error);
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
    throw new Error("Employee id is required");
  }

  return value;
}

function parseRequiredString(value: unknown, field: string): string {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`${field} is required`);
  }

  return value;
}

function parseRequiredNumber(value: unknown, field: string): number {
  if (typeof value !== "number" || Number.isNaN(value)) {
    throw new Error(`${field} must be a number`);
  }

  return validateSalaryAmount(value);
}

function parseEffectiveFrom(value: unknown): Date {
  if (value === undefined) {
    return new Date();
  }

  if (typeof value !== "string") {
    throw new Error("effectiveFrom must be an ISO date string");
  }

  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    throw new Error("effectiveFrom must be an ISO date string");
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

function sendDomainError(
  response: import("express").Response,
  error: unknown,
): void {
  if (error instanceof SalaryNotFoundError) {
    response.status(404).json({ error: error.message });
    return;
  }

  if (error instanceof SalaryConflictError) {
    response.status(409).json({ error: error.message });
    return;
  }

  if (error instanceof Error) {
    response.status(400).json({ error: error.message });
    return;
  }

  throw error;
}
