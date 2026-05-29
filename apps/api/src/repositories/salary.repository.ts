import type { PrismaClient, Salary as PrismaSalary } from "@prisma/client";
import {
  validateSalaryAmount,
  type Salary,
} from "../domain/salary/salary-record.js";

type CreateSalaryData = {
  amount: number;
  currency: string;
  effectiveFrom: Date;
};

export function createSalaryRepository(prisma: PrismaClient) {
  return {
    async getActive(employeeId: string): Promise<Salary | null> {
      const record = await prisma.salary.findFirst({
        where: { employeeId, isActive: true },
      });

      return record === null ? null : toSalary(record);
    },

    async create(employeeId: string, input: CreateSalaryData): Promise<Salary> {
      const active = await this.getActive(employeeId);

      if (active !== null) {
        throw new SalaryConflictError(
          "Employee already has an active salary record",
        );
      }

      const record = await prisma.salary.create({
        data: {
          employeeId,
          amount: validateSalaryAmount(input.amount),
          currency: normalizeCurrency(input.currency),
          effectiveFrom: input.effectiveFrom,
          isActive: true,
        },
      });

      return toSalary(record);
    },

    async updateAmount(employeeId: string, amount: number): Promise<Salary> {
      const active = await this.getActive(employeeId);

      if (active === null) {
        throw new SalaryNotFoundError(
          "No active salary record found for employee",
        );
      }

      const validatedAmount = validateSalaryAmount(amount);

      const record = await prisma.salary.update({
        where: { id: active.id },
        data: { amount: validatedAmount },
      });

      return toSalary(record);
    },
  };
}

export class SalaryNotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SalaryNotFoundError";
  }
}

export class SalaryConflictError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SalaryConflictError";
  }
}

function normalizeCurrency(currency: string): string {
  return currency.trim().toUpperCase();
}

function toSalary(record: PrismaSalary): Salary {
  return {
    id: record.id,
    employeeId: record.employeeId,
    amount: Number(record.amount),
    currency: record.currency,
    effectiveFrom: record.effectiveFrom,
    isActive: record.isActive,
  };
}
