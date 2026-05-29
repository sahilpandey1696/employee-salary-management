import type { PrismaClient } from "@prisma/client";
import {
  computeDashboardAnalytics,
  type DashboardAnalytics,
} from "../domain/dashboard/dashboard-analytics.js";
import type { Salary } from "../domain/salary/salary-record.js";

export function createDashboardRepository(prisma: PrismaClient) {
  return {
    async getSummary(): Promise<DashboardAnalytics> {
      const [employees, salaries] = await prisma.$transaction([
        prisma.employee.findMany({
          select: { id: true, country: true },
        }),
        prisma.salary.findMany({
          where: { isActive: true },
        }),
      ]);

      return computeDashboardAnalytics(
        employees,
        salaries.map(toSalary),
      );
    },
  };
}

function toSalary(record: {
  id: string;
  employeeId: string;
  amount: { toString(): string };
  currency: string;
  effectiveFrom: Date;
  isActive: boolean;
}): Salary {
  return {
    id: record.id,
    employeeId: record.employeeId,
    amount: Number(record.amount),
    currency: record.currency,
    effectiveFrom: record.effectiveFrom,
    isActive: record.isActive,
  };
}
