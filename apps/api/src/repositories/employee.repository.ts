import type { Employee as PrismaEmployee, Prisma, PrismaClient } from "@prisma/client";
import { BadRequestError, NotFoundError } from "../http/errors.js";

export const DEFAULT_LIST_PAGE_SIZE = 20;

export type EmployeeListQuery = {
  page: number;
  pageSize: number;
  search?: string;
  employmentStatus?: string;
  sortBy: string;
  sortDir: "asc" | "desc";
};

export type EmployeeCompensation = {
  amount: number;
  currency: string;
};

export type EmployeeRecord = {
  id: string;
  employeeNumber: string;
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  phone: string | null;
  country: string;
  department: string;
  jobTitle: string;
  employmentStatus: string;
  joiningDate: string;
  compensation: EmployeeCompensation | null;
};

export type EmployeeListResult = {
  items: EmployeeRecord[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

export type CreateEmployeeInput = {
  firstName: string;
  lastName: string;
  employeeNumber?: string;
  email: string;
  phone?: string;
  country: string;
  department: string;
  jobTitle: string;
  employmentStatus: string;
  joiningDate: Date;
  currency: string;
  annualSalary: number;
};

export type UpdateEmployeeInput = Partial<
  Omit<CreateEmployeeInput, "employeeNumber">
>;

const SORTABLE_FIELDS = new Set([
  "fullName",
  "email",
  "country",
  "department",
  "jobTitle",
  "employmentStatus",
  "employeeNumber",
]);

export function createEmployeeRepository(prisma: PrismaClient) {
  return {
    async list(query: EmployeeListQuery): Promise<EmployeeListResult> {
      const where = buildWhere(query);
      const orderBy = buildOrderBy(query);

      const [total, rows] = await prisma.$transaction([
        prisma.employee.count({ where }),
        prisma.employee.findMany({
          where,
          orderBy,
          skip: (query.page - 1) * query.pageSize,
          take: query.pageSize,
          include: {
            salaries: {
              where: { isActive: true },
              take: 1,
            },
          },
        }),
      ]);

      return {
        items: rows.map(toEmployeeRecord),
        total,
        page: query.page,
        pageSize: query.pageSize,
        totalPages: total === 0 ? 0 : Math.ceil(total / query.pageSize),
      };
    },

    async getById(id: string): Promise<EmployeeRecord> {
      const employee = await prisma.employee.findUnique({
        where: { id },
        include: {
          salaries: {
            where: { isActive: true },
            take: 1,
          },
        },
      });

      if (employee === null) {
        throw new NotFoundError("Employee not found");
      }

      return toEmployeeRecord(employee);
    },

    async create(input: CreateEmployeeInput): Promise<EmployeeRecord> {
      const employeeNumber =
        input.employeeNumber ?? (await generateEmployeeNumber(prisma));

      const employee = await prisma.employee.create({
        data: {
          employeeNumber,
          firstName: input.firstName.trim(),
          lastName: input.lastName.trim(),
          fullName: `${input.firstName.trim()} ${input.lastName.trim()}`,
          email: input.email.trim().toLowerCase(),
          phone: input.phone?.trim() ?? null,
          country: input.country.trim(),
          department: input.department.trim(),
          jobTitle: input.jobTitle.trim(),
          employmentStatus: normalizeStatus(input.employmentStatus),
          joiningDate: input.joiningDate,
          salaries:
            input.employmentStatus === "INACTIVE"
              ? undefined
              : {
                  create: {
                    amount: input.annualSalary,
                    currency: input.currency.toUpperCase(),
                    effectiveFrom: input.joiningDate,
                    isActive: true,
                  },
                },
        },
        include: {
          salaries: {
            where: { isActive: true },
            take: 1,
          },
        },
      });

      return toEmployeeRecord(employee);
    },

    async update(id: string, input: UpdateEmployeeInput): Promise<EmployeeRecord> {
      const existing = await prisma.employee.findUnique({
        where: { id },
        include: { salaries: { where: { isActive: true }, take: 1 } },
      });

      if (existing === null) {
        throw new NotFoundError("Employee not found");
      }

      const firstName = input.firstName?.trim() ?? existing.firstName;
      const lastName = input.lastName?.trim() ?? existing.lastName;

      const employee = await prisma.$transaction(async (tx) => {
        const updated = await tx.employee.update({
          where: { id },
          data: {
            firstName,
            lastName,
            fullName: `${firstName} ${lastName}`,
            email: input.email?.trim().toLowerCase() ?? existing.email,
            phone: input.phone === undefined ? existing.phone : input.phone.trim(),
            country: input.country?.trim() ?? existing.country,
            department: input.department?.trim() ?? existing.department,
            jobTitle: input.jobTitle?.trim() ?? existing.jobTitle,
            employmentStatus:
              input.employmentStatus === undefined
                ? existing.employmentStatus
                : normalizeStatus(input.employmentStatus),
            joiningDate: input.joiningDate ?? existing.joiningDate,
          },
        });

        if (input.annualSalary !== undefined && existing.salaries[0]) {
          await tx.salary.update({
            where: { id: existing.salaries[0].id },
            data: {
              amount: input.annualSalary,
              currency: input.currency?.toUpperCase() ?? existing.salaries[0].currency,
            },
          });
        }

        return tx.employee.findUniqueOrThrow({
          where: { id: updated.id },
          include: { salaries: { where: { isActive: true }, take: 1 } },
        });
      });

      return toEmployeeRecord(employee);
    },

    async delete(id: string): Promise<void> {
      try {
        await prisma.employee.delete({ where: { id } });
      } catch {
        throw new NotFoundError("Employee not found");
      }
    },
  };
}

function buildWhere(query: EmployeeListQuery): Prisma.EmployeeWhereInput {
  const where: Prisma.EmployeeWhereInput = {};

  if (query.employmentStatus) {
    where.employmentStatus = query.employmentStatus;
  }

  if (query.search) {
    where.OR = [
      { fullName: { contains: query.search } },
      { employeeNumber: { contains: query.search } },
      { email: { contains: query.search } },
    ];
  }

  return where;
}

function buildOrderBy(
  query: EmployeeListQuery,
): Prisma.EmployeeOrderByWithRelationInput[] {
  const field = SORTABLE_FIELDS.has(query.sortBy) ? query.sortBy : "fullName";
  return [{ [field]: query.sortDir }, { employeeNumber: "asc" }];
}

function toEmployeeRecord(
  record: PrismaEmployee & {
    salaries: { amount: { toString(): string }; currency: string }[];
  },
): EmployeeRecord {
  const activeSalary = record.salaries[0];

  return {
    id: record.id,
    employeeNumber: record.employeeNumber,
    firstName: record.firstName,
    lastName: record.lastName,
    fullName: record.fullName,
    email: record.email,
    phone: record.phone,
    country: record.country,
    department: record.department,
    jobTitle: record.jobTitle,
    employmentStatus: record.employmentStatus,
    joiningDate: record.joiningDate.toISOString(),
    compensation:
      activeSalary === undefined
        ? null
        : {
            amount: Number(activeSalary.amount),
            currency: activeSalary.currency,
          },
  };
}

async function generateEmployeeNumber(prisma: PrismaClient): Promise<string> {
  const count = await prisma.employee.count();
  return `EMP${(count + 1).toString().padStart(5, "0")}`;
}

function normalizeStatus(status: string): string {
  const normalized = status.trim().toUpperCase();
  if (normalized !== "ACTIVE" && normalized !== "INACTIVE") {
    throw new BadRequestError("Employment status must be Active or Inactive");
  }
  return normalized;
}
