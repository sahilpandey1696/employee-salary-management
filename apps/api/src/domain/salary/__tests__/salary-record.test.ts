import { describe, expect, it } from "vitest";
import {
  createSalaryRecord,
  getActiveSalary,
  updateActiveSalaryAmount,
  validateSalaryAmount,
  type Salary,
} from "../salary-record.js";

const baseDate = new Date("2024-06-01T00:00:00.000Z");

function salary(overrides: Partial<Salary> & Pick<Salary, "id" | "employeeId">): Salary {
  return {
    amount: 80_000,
    currency: "USD",
    effectiveFrom: baseDate,
    isActive: true,
    ...overrides,
  };
}

describe("validateSalaryAmount", () => {
  it("accepts positive amounts with up to two decimal places", () => {
    expect(validateSalaryAmount(85_000)).toBe(85_000);
    expect(validateSalaryAmount(1234.56)).toBe(1234.56);
  });

  it("rejects zero and negative amounts", () => {
    expect(() => validateSalaryAmount(0)).toThrow(
      "Salary amount must be greater than zero",
    );
    expect(() => validateSalaryAmount(-1)).toThrow(
      "Salary amount must be greater than zero",
    );
  });

  it("rejects amounts with more than two decimal places", () => {
    expect(() => validateSalaryAmount(100.999)).toThrow(
      "Salary amount must have at most two decimal places",
    );
  });
});

describe("getActiveSalary", () => {
  it("returns the active salary for an employee", () => {
    const records: Salary[] = [
      salary({ id: "s1", employeeId: "emp-1", amount: 90_000 }),
      salary({
        id: "s2",
        employeeId: "emp-1",
        amount: 70_000,
        isActive: false,
      }),
      salary({ id: "s3", employeeId: "emp-2", amount: 60_000 }),
    ];

    const active = getActiveSalary(records, "emp-1");

    expect(active?.id).toBe("s1");
    expect(active?.amount).toBe(90_000);
  });

  it("returns null when the employee has no active salary", () => {
    const records: Salary[] = [
      salary({
        id: "s1",
        employeeId: "emp-1",
        isActive: false,
      }),
    ];

    expect(getActiveSalary(records, "emp-1")).toBeNull();
  });
});

describe("createSalaryRecord", () => {
  it("creates an active salary when none exists for the employee", () => {
    const result = createSalaryRecord([], {
      id: "s-new",
      employeeId: "emp-1",
      amount: 75_000.5,
      currency: "usd",
      effectiveFrom: baseDate,
    });

    expect(result.record).toMatchObject({
      id: "s-new",
      employeeId: "emp-1",
      amount: 75_000.5,
      currency: "USD",
      effectiveFrom: baseDate,
      isActive: true,
    });
    expect(result.salaries).toHaveLength(1);
    expect(getActiveSalary(result.salaries, "emp-1")).toEqual(result.record);
  });

  it("rejects creating a second active salary for the same employee", () => {
    const existing = [
      salary({ id: "s1", employeeId: "emp-1", amount: 80_000 }),
    ];

    expect(() =>
      createSalaryRecord(existing, {
        id: "s2",
        employeeId: "emp-1",
        amount: 85_000,
        currency: "USD",
        effectiveFrom: baseDate,
      }),
    ).toThrow("Employee already has an active salary record");
  });
});

describe("updateActiveSalaryAmount", () => {
  it("updates the active salary amount for an employee", () => {
    const records = [
      salary({ id: "s1", employeeId: "emp-1", amount: 80_000 }),
      salary({
        id: "s2",
        employeeId: "emp-1",
        amount: 70_000,
        isActive: false,
      }),
    ];

    const result = updateActiveSalaryAmount(records, "emp-1", 92_500.25);

    expect(getActiveSalary(result, "emp-1")).toMatchObject({
      id: "s1",
      amount: 92_500.25,
      isActive: true,
    });
    expect(getActiveSalary(result, "emp-1")?.id).toBe("s1");
  });

  it("rejects updates when no active salary exists", () => {
    expect(() =>
      updateActiveSalaryAmount([], "emp-1", 50_000),
    ).toThrow("No active salary record found for employee");
  });

  it("validates the updated amount", () => {
    const records = [salary({ id: "s1", employeeId: "emp-1" })];

    expect(() =>
      updateActiveSalaryAmount(records, "emp-1", -100),
    ).toThrow("Salary amount must be greater than zero");
  });
});
