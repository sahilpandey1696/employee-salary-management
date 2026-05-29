import type { Employee as PrismaEmployee, Prisma, PrismaClient } from "@prisma/client";
import { BadRequestError, ConflictError, NotFoundError } from "../http/errors.js";

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

const compensationInclude = {
  salaries: {
    orderBy: { effectiveFrom: "desc" },
    take: 1,
  },
} satisfies Prisma.EmployeeInclude;

export function createEmployeeRepository(prisma: PrismaClient) {
  return {
    async getNextEmployeeNumber(): Promise<string> {
      return generateEmployeeNumber(prisma);
    },

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
          include: compensationInclude,
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
        include: compensationInclude,
      });

      if (employee === null) {
        throw new NotFoundError("Employee not found");
      }

      return toEmployeeRecord(employee);
    },

    async create(input: CreateEmployeeInput): Promise<EmployeeRecord> {
      const employeeNumber = (
        input.employeeNumber?.trim() ?? (await generateEmployeeNumber(prisma))
      ).toUpperCase();
      const email = input.email.trim().toLowerCase();
      const phone = normalizePhone(input.phone);
      const employmentStatus = normalizeStatus(input.employmentStatus);

      await assertUniqueEmployeeFields(prisma, { employeeNumber, email, phone });

      const employee = await prisma.employee.create({
        data: {
          employeeNumber,
          firstName: input.firstName.trim(),
          lastName: input.lastName.trim(),
          fullName: `${input.firstName.trim()} ${input.lastName.trim()}`,
          email,
          phone,
          country: input.country.trim(),
          department: input.department.trim(),
          jobTitle: input.jobTitle.trim(),
          employmentStatus,
          joiningDate: input.joiningDate,
          salaries: {
            create: {
              amount: input.annualSalary,
              currency: input.currency.toUpperCase(),
              effectiveFrom: input.joiningDate,
              isActive: employmentStatus === "ACTIVE",
            },
          },
        },
        include: compensationInclude,
      });

      return toEmployeeRecord(employee);
    },

    async update(id: string, input: UpdateEmployeeInput): Promise<EmployeeRecord> {
      const existing = await prisma.employee.findUnique({
        where: { id },
        include: {
          salaries: {
            orderBy: [{ isActive: "desc" }, { effectiveFrom: "desc" }],
          },
        },
      });

      if (existing === null) {
        throw new NotFoundError("Employee not found");
      }

      const firstName = input.firstName?.trim() ?? existing.firstName;
      const lastName = input.lastName?.trim() ?? existing.lastName;
      const email = input.email?.trim().toLowerCase() ?? existing.email;
      const phone =
        input.phone === undefined ? existing.phone : normalizePhone(input.phone);
      const employmentStatus =
        input.employmentStatus === undefined
          ? existing.employmentStatus
          : normalizeStatus(input.employmentStatus);

      await assertUniqueEmployeeFields(prisma, { email, phone }, id);

      const employee = await prisma.$transaction(async (tx) => {
        const updated = await tx.employee.update({
          where: { id },
          data: {
            firstName,
            lastName,
            fullName: `${firstName} ${lastName}`,
            email,
            phone,
            country: input.country?.trim() ?? existing.country,
            department: input.department?.trim() ?? existing.department,
            jobTitle: input.jobTitle?.trim() ?? existing.jobTitle,
            employmentStatus,
            joiningDate: input.joiningDate ?? existing.joiningDate,
          },
        });

        await syncEmploymentCompensation(tx, id, existing, {
          employmentStatus,
          annualSalary: input.annualSalary,
          currency: input.currency,
          joiningDate: input.joiningDate,
        });

        return tx.employee.findUniqueOrThrow({
          where: { id: updated.id },
          include: compensationInclude,
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

type SalaryRow = {
  id: string;
  amount: { toString(): string };
  currency: string;
  isActive: boolean;
};

async function syncEmploymentCompensation(
  tx: Prisma.TransactionClient,
  employeeId: string,
  existing: {
    employmentStatus: string;
    joiningDate: Date;
    salaries: SalaryRow[];
  },
  input: {
    employmentStatus: string;
    annualSalary?: number;
    currency?: string;
    joiningDate?: Date;
  },
): Promise<void> {
  const becameActive =
    existing.employmentStatus === "INACTIVE" && input.employmentStatus === "ACTIVE";
  const becameInactive =
    existing.employmentStatus === "ACTIVE" && input.employmentStatus === "INACTIVE";

  if (input.annualSalary !== undefined) {
    await upsertCompensation(tx, employeeId, existing.salaries, {
      annualSalary: input.annualSalary,
      currency: input.currency,
      effectiveFrom: input.joiningDate ?? existing.joiningDate,
      isActive: input.employmentStatus === "ACTIVE",
    });
    return;
  }

  if (becameActive) {
    if (existing.salaries.length === 0) {
      throw new BadRequestError(
        "Active employees must have an annual salary. Enter a salary and save again.",
      );
    }

    await tx.salary.updateMany({
      where: { employeeId },
      data: { isActive: true },
    });
    return;
  }

  if (becameInactive && existing.salaries.length > 0) {
    await tx.salary.updateMany({
      where: { employeeId },
      data: { isActive: false },
    });
  }
}

async function upsertCompensation(
  tx: Prisma.TransactionClient,
  employeeId: string,
  existingSalaries: SalaryRow[],
  input: {
    annualSalary: number;
    currency?: string;
    effectiveFrom: Date;
    isActive: boolean;
  },
): Promise<void> {
  const currency =
    input.currency?.toUpperCase() ?? existingSalaries[0]?.currency ?? "USD";
  const activeSalary = existingSalaries.find((salary) => salary.isActive);
  const latestSalary = existingSalaries[0];

  if (activeSalary) {
    await tx.salary.update({
      where: { id: activeSalary.id },
      data: {
        amount: input.annualSalary,
        currency,
        isActive: input.isActive,
      },
    });
    return;
  }

  if (latestSalary) {
    await tx.salary.update({
      where: { id: latestSalary.id },
      data: {
        amount: input.annualSalary,
        currency,
        isActive: input.isActive,
      },
    });
    return;
  }

  await tx.salary.create({
    data: {
      employeeId,
      amount: input.annualSalary,
      currency,
      effectiveFrom: input.effectiveFrom,
      isActive: input.isActive,
    },
  });
}

function toEmployeeRecord(
  record: PrismaEmployee & {
    salaries: SalaryRow[];
  },
): EmployeeRecord {
  const compensationSalary = record.salaries[0];

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
      compensationSalary === undefined
        ? null
        : {
            amount: Number(compensationSalary.amount),
            currency: compensationSalary.currency,
          },
  };
}

async function generateEmployeeNumber(prisma: PrismaClient): Promise<string> {
  const rows = await prisma.$queryRaw<{ maxSequence: bigint | number | null }[]>`
    SELECT MAX(CAST(SUBSTR(employeeNumber, 4) AS INTEGER)) AS maxSequence
    FROM Employee
    WHERE employeeNumber GLOB 'EMP[0-9]*'
  `;

  const maxSequence = Number(rows[0]?.maxSequence ?? 0);
  return `EMP${(maxSequence + 1).toString().padStart(5, "0")}`;
}

function normalizeStatus(status: string): string {
  const normalized = status.trim().toUpperCase();
  if (normalized !== "ACTIVE" && normalized !== "INACTIVE") {
    throw new BadRequestError("Employment status must be Active or Inactive");
  }
  return normalized;
}

function normalizePhone(phone: string | undefined): string | null {
  if (phone === undefined) {
    return null;
  }

  const trimmed = phone.trim();
  return trimmed.length === 0 ? null : trimmed;
}

async function assertUniqueEmployeeFields(
  prisma: PrismaClient,
  fields: {
    employeeNumber?: string;
    email?: string;
    phone?: string | null;
  },
  excludeEmployeeId?: string,
): Promise<void> {
  const exclude = excludeEmployeeId === undefined ? {} : { NOT: { id: excludeEmployeeId } };

  if (fields.employeeNumber !== undefined) {
    const existing = await prisma.employee.findFirst({
      where: { employeeNumber: fields.employeeNumber, ...exclude },
      select: { id: true },
    });

    if (existing !== null) {
      throw new ConflictError(
        "This employee code is already in use. Refresh the form for a new code.",
      );
    }
  }

  if (fields.email !== undefined) {
    const existing = await prisma.employee.findFirst({
      where: { email: fields.email, ...exclude },
      select: { id: true },
    });

    if (existing !== null) {
      throw new ConflictError("This work email is already in use.");
    }
  }

  if (fields.phone !== undefined && fields.phone !== null) {
    const existing = await prisma.employee.findFirst({
      where: { phone: fields.phone, ...exclude },
      select: { id: true },
    });

    if (existing !== null) {
      throw new ConflictError("This phone number is already in use.");
    }
  }
}
