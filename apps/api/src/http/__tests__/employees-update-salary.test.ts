import { execSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import type { PrismaClient } from "@prisma/client";
import request from "supertest";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { buildTestEmployee } from "../../test/employee-fixture.js";
import { createApp } from "../app.js";

let prisma: PrismaClient;
let employeeId: string;

describe("PATCH /employees/:employeeId salary", () => {
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

    const employee = await prisma.employee.create({
      data: buildTestEmployee({
        employmentStatus: "INACTIVE",
      }),
    });

    employeeId = employee.id;
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("creates compensation when updating salary for an employee without a salary record", async () => {
    const app = createApp({ prisma });

    const response = await request(app)
      .patch(`/employees/${employeeId}`)
      .send({ annualSalary: 1676, currency: "USD" })
      .expect(200);

    expect(response.body.compensation).toMatchObject({
      amount: 1676,
      currency: "USD",
    });
  });

  it("reactivates and updates salary when an inactive employee becomes active", async () => {
    await prisma.salary.create({
      data: {
        employeeId,
        amount: 55_000,
        currency: "USD",
        effectiveFrom: new Date("2024-01-01"),
        isActive: false,
      },
    });

    const app = createApp({ prisma });

    const response = await request(app)
      .patch(`/employees/${employeeId}`)
      .send({
        employmentStatus: "ACTIVE",
        annualSalary: 72_000,
        currency: "USD",
      })
      .expect(200);

    expect(response.body).toMatchObject({
      employmentStatus: "ACTIVE",
      compensation: { amount: 72_000, currency: "USD" },
    });
  });

  it("reactivates existing salary when status changes to active without a new amount", async () => {
    await prisma.salary.create({
      data: {
        employeeId,
        amount: 61_000,
        currency: "USD",
        effectiveFrom: new Date("2024-01-01"),
        isActive: false,
      },
    });

    const app = createApp({ prisma });

    const response = await request(app)
      .patch(`/employees/${employeeId}`)
      .send({ employmentStatus: "ACTIVE" })
      .expect(200);

    expect(response.body).toMatchObject({
      employmentStatus: "ACTIVE",
      compensation: { amount: 61_000, currency: "USD" },
    });
  });
});
