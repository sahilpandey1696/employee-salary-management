import { execSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import type { PrismaClient } from "@prisma/client";
import request from "supertest";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { createApp } from "../app.js";

let prisma: PrismaClient;

describe("employee unique fields", () => {
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

  const createPayload = (overrides: Record<string, unknown> = {}) => ({
    firstName: "Alex",
    lastName: "Taylor",
    email: "alex.taylor@acme.org",
    phone: "+15550001111",
    country: "United States",
    department: "Engineering",
    jobTitle: "Engineer",
    employmentStatus: "ACTIVE",
    joiningDate: "2026-05-29T00:00:00.000Z",
    currency: "USD",
    annualSalary: 80_000,
    ...overrides,
  });

  it("rejects duplicate work email on create", async () => {
    const app = createApp({ prisma });

    await request(app).post("/employees").send(createPayload()).expect(201);

    const response = await request(app)
      .post("/employees")
      .send(createPayload({ email: "alex.taylor@acme.org", phone: "+15550002222" }))
      .expect(409);

    expect(response.body.error).toBe("This work email is already in use.");
  });

  it("rejects duplicate phone number on create", async () => {
    const app = createApp({ prisma });

    await request(app).post("/employees").send(createPayload()).expect(201);

    const response = await request(app)
      .post("/employees")
      .send(createPayload({ email: "other.person@acme.org", phone: "+15550001111" }))
      .expect(409);

    expect(response.body.error).toBe("This phone number is already in use.");
  });

  it("rejects duplicate employee code on create", async () => {
    const app = createApp({ prisma });

    await request(app)
      .post("/employees")
      .send(createPayload({ employeeNumber: "EMP00999" }))
      .expect(201);

    const response = await request(app)
      .post("/employees")
      .send(
        createPayload({
          employeeNumber: "EMP00999",
          email: "unique.email@acme.org",
          phone: "+15550003333",
        }),
      )
      .expect(409);

    expect(response.body.error).toContain("employee code is already in use");
  });
});
