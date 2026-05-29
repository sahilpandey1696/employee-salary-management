import { PrismaClient } from "@prisma/client";
import {
  SEED_EMPLOYEE_COUNT,
  createSeedEmployees,
  createSeedSalaries,
} from "../src/infrastructure/seed/seed-data.js";

const prisma = new PrismaClient();
const BATCH_SIZE = 500;

async function main() {
  await prisma.salary.deleteMany();
  await prisma.employee.deleteMany();

  const employees = createSeedEmployees(SEED_EMPLOYEE_COUNT);
  const salaries = createSeedSalaries(employees);
  const salaryByEmployeeNumber = new Map(
    salaries.map((salary) => [salary.employeeNumber, salary]),
  );

  for (let index = 0; index < employees.length; index += BATCH_SIZE) {
    const employeeBatch = employees.slice(index, index + BATCH_SIZE);

    await prisma.$transaction(
      employeeBatch.map((employee) => {
        const salary = salaryByEmployeeNumber.get(employee.employeeNumber);

        if (salary === undefined) {
          throw new Error(`Missing salary for ${employee.employeeNumber}`);
        }

        return prisma.employee.create({
          data: {
            employeeNumber: employee.employeeNumber,
            fullName: employee.fullName,
            country: employee.country,
            department: employee.department,
            salaries: {
              create: {
                amount: salary.amount,
                currency: salary.currency,
                effectiveFrom: salary.effectiveFrom,
                isActive: salary.isActive,
              },
            },
          },
        });
      }),
    );
  }

  const employeeCount = await prisma.employee.count();
  const salaryCount = await prisma.salary.count({ where: { isActive: true } });

  if (employeeCount !== SEED_EMPLOYEE_COUNT || salaryCount !== SEED_EMPLOYEE_COUNT) {
    throw new Error(
      `Seed incomplete: expected ${SEED_EMPLOYEE_COUNT} employees and salaries, got ${employeeCount} and ${salaryCount}`,
    );
  }
}

main()
  .catch(() => {
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
