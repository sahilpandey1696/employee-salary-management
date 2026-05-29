import type { Employee as PrismaEmployee, Prisma, PrismaClient } from "@prisma/client";
import type { Employee } from "../domain/employee/list-employees.js";
import type { ParsedEmployeeListParams } from "../domain/employee/list-employees.js";
import type { EmployeeListResult } from "../domain/employee/list-employees.js";

export function createEmployeeRepository(prisma: PrismaClient) {
  return {
    async list(params: ParsedEmployeeListParams): Promise<EmployeeListResult> {
      const where = buildWhere(params);

      const [total, rows] = await prisma.$transaction([
        prisma.employee.count({ where }),
        prisma.employee.findMany({
          where,
          orderBy: [{ fullName: "asc" }, { employeeNumber: "asc" }],
          skip: (params.page - 1) * params.pageSize,
          take: params.pageSize,
        }),
      ]);

      return {
        items: rows.map(toEmployee),
        total,
        page: params.page,
        pageSize: params.pageSize,
        totalPages: total === 0 ? 0 : Math.ceil(total / params.pageSize),
      };
    },
  };
}

function buildWhere(params: ParsedEmployeeListParams): Prisma.EmployeeWhereInput {
  const where: Prisma.EmployeeWhereInput = {};

  if (params.country !== undefined) {
    where.country = params.country;
  }

  if (params.search !== undefined) {
    where.OR = [
      { fullName: { contains: params.search } },
      { employeeNumber: { contains: params.search } },
    ];
  }

  return where;
}

function toEmployee(record: PrismaEmployee): Employee {
  return {
    id: record.id,
    employeeNumber: record.employeeNumber,
    fullName: record.fullName,
    country: record.country,
    department: record.department ?? undefined,
  };
}
