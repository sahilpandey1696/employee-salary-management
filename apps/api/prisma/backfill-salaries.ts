import { PrismaClient } from "@prisma/client";
import {
  buildSalaryAmount,
  parseEmployeeSequence,
} from "../src/infrastructure/seed/seed-data.js";

const prisma = new PrismaClient();
const BATCH_SIZE = 500;

async function main() {
  const employees = await prisma.employee.findMany({
    where: { salaries: { none: {} } },
    select: {
      id: true,
      employeeNumber: true,
      joiningDate: true,
      employmentStatus: true,
    },
  });

  if (employees.length === 0) {
    return;
  }

  for (let index = 0; index < employees.length; index += BATCH_SIZE) {
    const batch = employees.slice(index, index + BATCH_SIZE);

    await prisma.$transaction(
      batch.map((employee) =>
        prisma.salary.create({
          data: {
            employeeId: employee.id,
            amount: buildSalaryAmount(parseEmployeeSequence(employee.employeeNumber)),
            currency: "USD",
            effectiveFrom: employee.joiningDate,
            isActive: employee.employmentStatus === "ACTIVE",
          },
        }),
      ),
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
