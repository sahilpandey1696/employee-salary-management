import { describe, expect, it } from "vitest";
import {
  computeDashboardAnalytics,
  type DashboardEmployee,
} from "../dashboard-analytics.js";
import type { Salary } from "../../salary/salary-record.js";

const employees: DashboardEmployee[] = [
  { id: "1", country: "US" },
  { id: "2", country: "US" },
  { id: "3", country: "UK" },
  { id: "4", country: "DE" },
];

function activeSalary(
  employeeId: string,
  amount: number,
  overrides: Partial<Salary> = {},
): Salary {
  return {
    id: `s-${employeeId}`,
    employeeId,
    amount,
    currency: "USD",
    effectiveFrom: new Date("2024-01-01"),
    isActive: true,
    ...overrides,
  };
}

describe("computeDashboardAnalytics", () => {
  it("calculates total payroll from active salaries only", () => {
    const salaries: Salary[] = [
      activeSalary("1", 100_000),
      activeSalary("2", 80_000),
      activeSalary("3", 60_000),
      activeSalary("4", 50_000, { isActive: false }),
    ];

    const result = computeDashboardAnalytics(employees, salaries);

    expect(result.totalPayroll).toBe(240_000);
  });

  it("calculates average salary across employees with an active salary", () => {
    const salaries: Salary[] = [
      activeSalary("1", 100_000),
      activeSalary("2", 80_000),
      activeSalary("3", 60_000),
    ];

    const result = computeDashboardAnalytics(employees, salaries);

    expect(result.averageSalary).toBe(80_000);
  });

  it("returns zero totals when no active salaries exist", () => {
    const salaries: Salary[] = [
      activeSalary("1", 100_000, { isActive: false }),
    ];

    const result = computeDashboardAnalytics(employees, salaries);

    expect(result.totalPayroll).toBe(0);
    expect(result.averageSalary).toBe(0);
  });

  it("groups payroll and headcount by employee country", () => {
    const salaries: Salary[] = [
      activeSalary("1", 100_000),
      activeSalary("2", 50_000),
      activeSalary("3", 60_000),
    ];

    const result = computeDashboardAnalytics(employees, salaries);

    expect(result.countryBreakdown).toEqual([
      { country: "DE", payroll: 0, headcount: 1 },
      { country: "UK", payroll: 60_000, headcount: 1 },
      { country: "US", payroll: 150_000, headcount: 2 },
    ]);
  });

  it("includes employees without salary in country headcount", () => {
    const salaries: Salary[] = [activeSalary("1", 90_000)];

    const result = computeDashboardAnalytics(employees, salaries);

    const us = result.countryBreakdown.find((row) => row.country === "US");

    expect(us).toEqual({
      country: "US",
      payroll: 90_000,
      headcount: 2,
    });
  });
});
