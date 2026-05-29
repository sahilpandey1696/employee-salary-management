import { execSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import type { PrismaClient } from "@prisma/client";
import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createApp } from "../app.js";

let prisma: PrismaClient;

describe("GET /employees/next-code", () => {
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

  it("returns the next available employee number", async () => {
    const app = createApp({ prisma });

    const response = await request(app).get("/employees/next-code").expect(200);

    expect(response.body.employeeNumber).toMatch(/^EMP\d{5}$/);
  });
});
