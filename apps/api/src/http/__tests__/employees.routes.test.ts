import { execSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import type { PrismaClient } from "@prisma/client";
import request from "supertest";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { createApp } from "../app.js";

let prisma: PrismaClient;

describe("GET /employees", () => {
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
    await prisma.employee.createMany({
      data: [
        {
          employeeNumber: "E100",
          fullName: "Alice Anderson",
          country: "US",
          department: "Engineering",
        },
        {
          employeeNumber: "E200",
          fullName: "Bob Brown",
          country: "UK",
        },
        {
          employeeNumber: "E300",
          fullName: "Carol Chen",
          country: "US",
        },
        {
          employeeNumber: "E400",
          fullName: "David Diaz",
          country: "DE",
        },
        {
          employeeNumber: "E500",
          fullName: "Alice Adams",
          country: "US",
        },
      ],
    });
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("returns a paginated employee list with defaults", async () => {
    const app = createApp({ prisma });

    const response = await request(app).get("/employees").expect(200);

    expect(response.body).toMatchObject({
      page: 1,
      pageSize: 25,
      total: 5,
      totalPages: 1,
    });
    expect(response.body.items).toHaveLength(5);
    expect(response.body.items[0]).toMatchObject({
      employeeNumber: "E500",
      fullName: "Alice Adams",
      country: "US",
    });
  });

  it("supports search, country filter, and pagination query params", async () => {
    const app = createApp({ prisma });

    const response = await request(app)
      .get("/employees")
      .query({ search: "alice", country: "US", page: 1, pageSize: 1 })
      .expect(200);

    expect(response.body).toMatchObject({
      total: 2,
      page: 1,
      pageSize: 1,
      totalPages: 2,
    });
    expect(response.body.items).toHaveLength(1);
    expect(response.body.items[0].employeeNumber).toBe("E500");
  });

  it("returns 400 for invalid pagination params", async () => {
    const app = createApp({ prisma });

    const response = await request(app)
      .get("/employees")
      .query({ page: 0 })
      .expect(400);

    expect(response.body).toMatchObject({
      error: "Page must be at least 1",
    });
  });
});
