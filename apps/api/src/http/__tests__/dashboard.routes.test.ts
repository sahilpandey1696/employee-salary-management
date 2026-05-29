import { execSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import type { PrismaClient } from "@prisma/client";
import request from "supertest";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { buildTestEmployee } from "../../test/employee-fixture.js";
import { createApp } from "../app.js";

let prisma: PrismaClient;

describe("GET /dashboard/summary", () => {
  beforeAll(async () => {
    const apiRoot = fileURLToPath(new URL("../../..", import.meta.url));
    execSync("npx prisma migrate deploy", {
      cwd: apiRoot,
      stdio: "ignore",
    });

    const { PrismaClient: Client } = await import("@prisma/client");
    prisma = new Client();
    await prisma.$executeRawUnsafe("PRAGMA foreign_keys = ON");
  });

  beforeEach(async () => {
    await prisma.salary.deleteMany();
    await prisma.employee.deleteMany();

    const alice = await prisma.employee.create({
      data: buildTestEmployee({
        employeeNumber: "E100",
        country: "United States",
      }),
    });
    const bob = await prisma.employee.create({
      data: buildTestEmployee({
        employeeNumber: "E200",
        firstName: "Bob",
        lastName: "Brown",
        fullName: "Bob Brown",
        email: "bob@acme.org",
        country: "United States",
      }),
    });
    const carol = await prisma.employee.create({
      data: buildTestEmployee({
        employeeNumber: "E300",
        firstName: "Carol",
        lastName: "Chen",
        fullName: "Carol Chen",
        email: "carol@acme.org",
        country: "United Kingdom",
      }),
    });
    const david = await prisma.employee.create({
      data: buildTestEmployee({
        employeeNumber: "E400",
        firstName: "David",
        lastName: "Diaz",
        fullName: "David Diaz",
        email: "david@acme.org",
        country: "Germany",
      }),
    });

    await prisma.salary.createMany({
      data: [
        {
          employeeId: alice.id,
          amount: 100_000,
          currency: "USD",
          effectiveFrom: new Date("2024-01-01"),
          isActive: true,
        },
        {
          employeeId: bob.id,
          amount: 50_000,
          currency: "USD",
          effectiveFrom: new Date("2024-01-01"),
          isActive: true,
        },
        {
          employeeId: carol.id,
          amount: 60_000,
          currency: "USD",
          effectiveFrom: new Date("2024-01-01"),
          isActive: true,
        },
        {
          employeeId: david.id,
          amount: 40_000,
          currency: "USD",
          effectiveFrom: new Date("2024-01-01"),
          isActive: false,
        },
      ],
    });
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("returns payroll totals and country breakdown", async () => {
    const app = createApp({ prisma });

    const response = await request(app).get("/dashboard/summary").expect(200);

    expect(response.body).toMatchObject({
      totalPayroll: 210_000,
      averageSalary: 70_000,
    });
    expect(response.body.countryBreakdown).toEqual([
      { country: "Germany", payroll: 0, headcount: 1 },
      { country: "United Kingdom", payroll: 60_000, headcount: 1 },
      { country: "United States", payroll: 150_000, headcount: 2 },
    ]);
  });
});
