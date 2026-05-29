import { describe, expect, it } from "vitest";
import {
  COUNTRIES,
  SEED_EMPLOYEE_COUNT,
  createSeedEmployees,
  createSeedSalaries,
} from "../seed-data.js";

describe("createSeedEmployees", () => {
  it("creates the configured number of unique employees", () => {
    const employees = createSeedEmployees(SEED_EMPLOYEE_COUNT);

    expect(employees).toHaveLength(SEED_EMPLOYEE_COUNT);

    const employeeNumbers = employees.map((employee) => employee.employeeNumber);
    const emails = employees.map((employee) => employee.email);
    const phones = employees.map((employee) => employee.phone);

    expect(new Set(employeeNumbers).size).toBe(SEED_EMPLOYEE_COUNT);
    expect(new Set(emails).size).toBe(SEED_EMPLOYEE_COUNT);
    expect(new Set(phones).size).toBe(SEED_EMPLOYEE_COUNT);
  });

  it("assigns countries from the supported set", () => {
    const employees = createSeedEmployees(100);

    for (const employee of employees) {
      expect(COUNTRIES).toContain(employee.country);
    }
  });

  it("formats employee numbers with a stable prefix", () => {
    const employees = createSeedEmployees(3);

    expect(employees.map((employee) => employee.employeeNumber)).toEqual([
      "EMP00001",
      "EMP00002",
      "EMP00003",
    ]);
  });
});

describe("createSeedSalaries", () => {
  it("creates a salary record for every employee", () => {
    const employees = createSeedEmployees(7);
    const salaries = createSeedSalaries(employees);

    expect(salaries).toHaveLength(employees.length);
    expect(salaries.every((salary) => salary.amount > 0)).toBe(true);
    expect(
      salaries.filter((salary) => salary.isActive).length,
    ).toBe(
      employees.filter((employee) => employee.employmentStatus === "ACTIVE")
        .length,
    );
  });
});
