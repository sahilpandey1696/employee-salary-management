import { execSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import type { PrismaClient } from "@prisma/client";
import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createApp } from "../app.js";

let prisma: PrismaClient;

describe("API error handling", () => {
  beforeAll(async () => {
    const apiRoot = fileURLToPath(new URL("../../..", import.meta.url));
    execSync("npx prisma migrate deploy", {
      cwd: apiRoot,
      stdio: "ignore",
    });

    const { PrismaClient: Client } = await import("@prisma/client");
    prisma = new Client();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("returns 404 for unknown routes", async () => {
    const app = createApp({ prisma });

    const response = await request(app).get("/unknown-route").expect(404);

    expect(response.body).toEqual({ error: "Not found" });
  });

  it("returns 400 for invalid JSON request bodies", async () => {
    const app = createApp({ prisma });
    const { buildTestEmployee } = await import("../../test/employee-fixture.js");
    const employee = await prisma.employee.create({
      data: buildTestEmployee({
        employeeNumber: `E${Date.now()}`,
        fullName: "Test User",
        email: `test${Date.now()}@acme.org`,
      }),
    });

    const response = await request(app)
      .post(`/employees/${employee.id}/salary`)
      .set("Content-Type", "application/json")
      .send("{ invalid")
      .expect(400);

    expect(response.body).toEqual({ error: "Invalid JSON body" });
  });

  it("returns 400 for invalid employee list query parameters", async () => {
    const app = createApp({ prisma });

    const response = await request(app)
      .get("/employees")
      .query({ page: "abc" })
      .expect(400);

    expect(response.body).toEqual({ error: "page must be a valid integer" });
  });

  it("returns 500 without leaking internal details for unexpected errors", async () => {
    const app = createApp({
      prisma: {
        $transaction: async () => {
          throw new Error("database secret details");
        },
      } as unknown as PrismaClient,
    });

    const response = await request(app).get("/employees").expect(500);

    expect(response.body).toEqual({ error: "Internal server error" });
    expect(JSON.stringify(response.body)).not.toContain("database secret");
  });
});
