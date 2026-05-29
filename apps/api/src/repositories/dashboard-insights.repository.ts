import type { PrismaClient } from "@prisma/client";

export type DashboardInsights = {
  kpis: {
    activeEmployees: number;
    inactiveEmployees: number;
    countries: number;
  };
  averageSalaryByCountry: { country: string; average: number }[];
  employeesByDepartment: { department: string; count: number }[];
  workforceStatus: { status: string; count: number }[];
  topHighestPaid: { name: string; amount: number }[];
  topLowestPaid: { name: string; amount: number }[];
  averageSalaryByDepartment: { department: string; average: number }[];
  medianSalaryByCountry: { country: string; median: number }[];
};

export function createDashboardInsightsRepository(prisma: PrismaClient) {
  return {
    async getInsights(): Promise<DashboardInsights> {
      const [
        activeEmployees,
        inactiveEmployees,
        countries,
        averageSalaryByCountry,
        employeesByDepartment,
        workforceStatus,
        topHighestPaid,
        topLowestPaid,
        averageSalaryByDepartment,
        medianSalaryByCountry,
      ] = await Promise.all([
        prisma.employee.count({ where: { employmentStatus: "ACTIVE" } }),
        prisma.employee.count({ where: { employmentStatus: "INACTIVE" } }),
        prisma.employee.findMany({
          distinct: ["country"],
          select: { country: true },
        }),
        prisma.$queryRaw<{ country: string; average: number }[]>`
          SELECT e.country AS country,
            AVG(CAST(s.amount AS REAL)) AS average
          FROM Employee e
          INNER JOIN Salary s ON s.employeeId = e.id AND s.isActive = 1
          GROUP BY e.country
          ORDER BY e.country ASC
        `,
        prisma.employee.groupBy({
          by: ["department"],
          _count: { id: true },
          orderBy: { department: "asc" },
        }),
        prisma.employee.groupBy({
          by: ["employmentStatus"],
          _count: { id: true },
        }),
        prisma.$queryRaw<{ name: string; amount: number }[]>`
          SELECT e.fullName AS name, CAST(s.amount AS REAL) AS amount
          FROM Employee e
          INNER JOIN Salary s ON s.employeeId = e.id AND s.isActive = 1
          ORDER BY s.amount DESC
          LIMIT 10
        `,
        prisma.$queryRaw<{ name: string; amount: number }[]>`
          SELECT e.fullName AS name, CAST(s.amount AS REAL) AS amount
          FROM Employee e
          INNER JOIN Salary s ON s.employeeId = e.id AND s.isActive = 1
          ORDER BY s.amount ASC
          LIMIT 10
        `,
        prisma.$queryRaw<{ department: string; average: number }[]>`
          SELECT e.department AS department,
            AVG(CAST(s.amount AS REAL)) AS average
          FROM Employee e
          INNER JOIN Salary s ON s.employeeId = e.id AND s.isActive = 1
          GROUP BY e.department
          ORDER BY average DESC
        `,
        prisma.$queryRaw<{ country: string; median: number }[]>`
          SELECT e.country AS country,
            AVG(CAST(s.amount AS REAL)) AS median
          FROM Employee e
          INNER JOIN Salary s ON s.employeeId = e.id AND s.isActive = 1
          GROUP BY e.country
          ORDER BY e.country ASC
        `,
      ]);

      return {
        kpis: {
          activeEmployees,
          inactiveEmployees,
          countries: countries.length,
        },
        averageSalaryByCountry: averageSalaryByCountry.map((row) => ({
          country: row.country,
          average: Number(row.average),
        })),
        employeesByDepartment: employeesByDepartment.map((row) => ({
          department: row.department,
          count: row._count.id,
        })),
        workforceStatus: workforceStatus.map((row) => ({
          status: row.employmentStatus,
          count: row._count.id,
        })),
        topHighestPaid: topHighestPaid.map((row) => ({
          name: row.name,
          amount: Number(row.amount),
        })),
        topLowestPaid: topLowestPaid.map((row) => ({
          name: row.name,
          amount: Number(row.amount),
        })),
        averageSalaryByDepartment: averageSalaryByDepartment.map((row) => ({
          department: row.department,
          average: Number(row.average),
        })),
        medianSalaryByCountry: medianSalaryByCountry.map((row) => ({
          country: row.country,
          median: Number(row.median),
        })),
      };
    },
  };
}
