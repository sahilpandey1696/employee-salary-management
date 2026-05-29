import { describe, expect, it, vi } from "vitest";
import { createDashboardRepository } from "../dashboard.repository.js";

describe("createDashboardRepository", () => {
  it("aggregates dashboard metrics without loading all employee rows", async () => {
    const aggregate = vi.fn().mockResolvedValue({
      _sum: { amount: 210_000 },
      _avg: { amount: 70_000 },
    });
    const count = vi.fn().mockResolvedValue(3);
    const queryRaw = vi.fn().mockResolvedValue([
      { country: "DE", headcount: 1, payroll: 0 },
      { country: "UK", headcount: 1, payroll: 60_000 },
      { country: "US", headcount: 2, payroll: 150_000 },
    ]);
    const findMany = vi.fn();

    const prisma = {
      salary: { aggregate, count: count },
      employee: { findMany },
      $queryRaw: queryRaw,
      $transaction: vi.fn((operations: Promise<unknown>[]) => Promise.all(operations)),
    };

    const repository = createDashboardRepository(prisma as never);
    const summary = await repository.getSummary();

    expect(findMany).not.toHaveBeenCalled();
    expect(aggregate).toHaveBeenCalledOnce();
    expect(queryRaw).toHaveBeenCalledOnce();
    expect(summary).toEqual({
      totalPayroll: 210_000,
      averageSalary: 70_000,
      countryBreakdown: [
        { country: "DE", payroll: 0, headcount: 1 },
        { country: "UK", payroll: 60_000, headcount: 1 },
        { country: "US", payroll: 150_000, headcount: 2 },
      ],
    });
  });
});
