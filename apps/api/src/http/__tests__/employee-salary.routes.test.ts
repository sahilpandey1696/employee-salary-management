import { execSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import type { PrismaClient } from "@prisma/client";
import request from "supertest";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { createApp } from "../app.js";

let prisma: PrismaClient;
let employeeId: string;

describe("employee salary routes", () => {
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
      data: {
        employeeNumber: "E100",
        fullName: "Alice Anderson",
        country: "US",
      },
    });

    employeeId = employee.id;
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("GET /employees/:employeeId/salary returns the active salary", async () => {
    await prisma.salary.create({
      data: {
        employeeId,
        amount: 85_000,
        currency: "USD",
        effectiveFrom: new Date("2024-03-01T00:00:00.000Z"),
        isActive: true,
      },
    });

    const app = createApp({ prisma });
    const response = await request(app)
      .get(`/employees/${employeeId}/salary`)
      .expect(200);

    expect(response.body).toMatchObject({
      employeeId,
      amount: 85_000,
      currency: "USD",
      isActive: true,
    });
    expect(response.body.effectiveFrom).toBe("2024-03-01T00:00:00.000Z");
  });

  it("GET returns 404 when no active salary exists", async () => {
    const app = createApp({ prisma });

    const response = await request(app)
      .get(`/employees/${employeeId}/salary`)
      .expect(404);

    expect(response.body).toMatchObject({
      error: "No active salary record found for employee",
    });
  });

  it("POST creates an active salary for the employee", async () => {
    const app = createApp({ prisma });

    const response = await request(app)
      .post(`/employees/${employeeId}/salary`)
      .send({
        amount: 72_500.5,
        currency: "usd",
        effectiveFrom: "2024-04-15T00:00:00.000Z",
      })
      .expect(201);

    expect(response.body).toMatchObject({
      employeeId,
      amount: 72_500.5,
      currency: "USD",
      isActive: true,
    });
  });

  it("POST returns 409 when an active salary already exists", async () => {
    await prisma.salary.create({
      data: {
        employeeId,
        amount: 80_000,
        currency: "USD",
        effectiveFrom: new Date("2024-01-01T00:00:00.000Z"),
        isActive: true,
      },
    });

    const app = createApp({ prisma });

    const response = await request(app)
      .post(`/employees/${employeeId}/salary`)
      .send({ amount: 90_000, currency: "USD" })
      .expect(409);

    expect(response.body).toMatchObject({
      error: "Employee already has an active salary record",
    });
  });

  it("PATCH updates the active salary amount", async () => {
    await prisma.salary.create({
      data: {
        employeeId,
        amount: 80_000,
        currency: "USD",
        effectiveFrom: new Date("2024-01-01T00:00:00.000Z"),
        isActive: true,
      },
    });

    const app = createApp({ prisma });

    const response = await request(app)
      .patch(`/employees/${employeeId}/salary`)
      .send({ amount: 95_000.25 })
      .expect(200);

    expect(response.body).toMatchObject({
      employeeId,
      amount: 95_000.25,
      currency: "USD",
      isActive: true,
    });
  });

  it("PATCH returns 400 for invalid amounts", async () => {
    await prisma.salary.create({
      data: {
        employeeId,
        amount: 80_000,
        currency: "USD",
        effectiveFrom: new Date("2024-01-01T00:00:00.000Z"),
        isActive: true,
      },
    });

    const app = createApp({ prisma });

    const response = await request(app)
      .patch(`/employees/${employeeId}/salary`)
      .send({ amount: -1 })
      .expect(400);

    expect(response.body).toMatchObject({
      error: "Salary amount must be greater than zero",
    });
  });
});
