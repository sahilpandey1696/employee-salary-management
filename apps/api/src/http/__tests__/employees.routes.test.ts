import { execSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import type { PrismaClient } from "@prisma/client";
import request from "supertest";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { buildTestEmployee } from "../../test/employee-fixture.js";
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
        buildTestEmployee({
          employeeNumber: "E100",
          fullName: "Alice Anderson",
          email: "alice.anderson@acme.org",
          country: "United States",
        }),
        buildTestEmployee({
          employeeNumber: "E200",
          firstName: "Bob",
          lastName: "Brown",
          fullName: "Bob Brown",
          email: "bob.brown@acme.org",
          country: "United Kingdom",
          department: "Finance",
        }),
        buildTestEmployee({
          employeeNumber: "E300",
          firstName: "Carol",
          lastName: "Chen",
          fullName: "Carol Chen",
          email: "carol.chen@acme.org",
          country: "United States",
        }),
        buildTestEmployee({
          employeeNumber: "E400",
          firstName: "David",
          lastName: "Diaz",
          fullName: "David Diaz",
          email: "david.diaz@acme.org",
          country: "Germany",
        }),
        buildTestEmployee({
          employeeNumber: "E500",
          firstName: "Alice",
          lastName: "Adams",
          fullName: "Alice Adams",
          email: "alice.adams@acme.org",
          country: "United States",
        }),
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
      pageSize: 20,
      total: 5,
      totalPages: 1,
    });
    expect(response.body.items).toHaveLength(5);
    expect(response.body.items[0]).toMatchObject({
      employeeNumber: "E500",
      fullName: "Alice Adams",
      country: "United States",
    });
  });

  it("supports search, employment status filter, and pagination query params", async () => {
    const app = createApp({ prisma });

    const response = await request(app)
      .get("/employees")
      .query({ search: "alice", employmentStatus: "ACTIVE", page: 1, pageSize: 1 })
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

  it("returns 400 when page size exceeds the maximum", async () => {
    const app = createApp({ prisma });

    const response = await request(app)
      .get("/employees")
      .query({ pageSize: 101 })
      .expect(400);

    expect(response.body).toMatchObject({
      error: "Page size must not exceed 100",
    });
  });
});
