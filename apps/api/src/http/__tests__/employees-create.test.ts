import { execSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import type { PrismaClient } from "@prisma/client";
import request from "supertest";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { createApp } from "../app.js";

let prisma: PrismaClient;

describe("POST /employees", () => {
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
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("creates an inactive employee with auto-generated code", async () => {
    const app = createApp({ prisma });

    const response = await request(app)
      .post("/employees")
      .send({
        firstName: "Test",
        lastName: "User",
        email: "inactive.create@acme.org",
        phone: "1234567890",
        country: "India",
        department: "IT",
        jobTitle: "Engineer",
        employmentStatus: "INACTIVE",
        joiningDate: "2026-05-29T00:00:00.000Z",
        currency: "USD",
        annualSalary: 50_000,
      })
      .expect(201);

    expect(response.body.employeeNumber).toMatch(/^EMP\d{5}$/);
    expect(response.body.employmentStatus).toBe("INACTIVE");
    expect(response.body.compensation).toMatchObject({
      amount: 50_000,
      currency: "USD",
    });
  });
});
