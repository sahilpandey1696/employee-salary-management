import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  await prisma.salary.updateMany({
    where: {
      isActive: false,
      employee: { employmentStatus: "ACTIVE" },
    },
    data: { isActive: true },
  });
}

main()
  .catch(() => {
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
