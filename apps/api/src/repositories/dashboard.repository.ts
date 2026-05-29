import type { PrismaClient } from "@prisma/client";
import type { DashboardAnalytics } from "../domain/dashboard/dashboard-analytics.js";

type CountryAggregateRow = {
  country: string;
  headcount: number | bigint;
  payroll: number | bigint;
};

export function createDashboardRepository(prisma: PrismaClient) {
  return {
    async getSummary(): Promise<DashboardAnalytics> {
      const [payrollAggregate, activeSalaryCount, countryRows] =
        await prisma.$transaction([
          prisma.salary.aggregate({
            where: { isActive: true },
            _sum: { amount: true },
            _avg: { amount: true },
          }),
          prisma.salary.count({ where: { isActive: true } }),
          prisma.$queryRaw<CountryAggregateRow[]>`
            SELECT
              e.country AS country,
              COUNT(e.id) AS headcount,
              COALESCE(SUM(CAST(s.amount AS REAL)), 0) AS payroll
            FROM Employee e
            LEFT JOIN Salary s
              ON s.employeeId = e.id AND s.isActive = 1
            GROUP BY e.country
            ORDER BY e.country ASC
          `,
        ]);

      const totalPayroll = decimalToNumber(payrollAggregate._sum.amount);
      const averageSalary =
        activeSalaryCount === 0
          ? 0
          : decimalToNumber(payrollAggregate._avg.amount);

      return {
        totalPayroll,
        averageSalary,
        countryBreakdown: countryRows.map((row) => ({
          country: row.country,
          headcount: Number(row.headcount),
          payroll: Number(row.payroll),
        })),
      };
    },
  };
}

function decimalToNumber(value: { toString(): string } | null | undefined): number {
  if (value === null || value === undefined) {
    return 0;
  }

  return Number(value);
}
