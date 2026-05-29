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
    expect(new Set(employeeNumbers).size).toBe(SEED_EMPLOYEE_COUNT);
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
      "E00001",
      "E00002",
      "E00003",
    ]);
  });
});

describe("createSeedSalaries", () => {
  it("creates one active salary per employee", () => {
    const employees = createSeedEmployees(5);
    const salaries = createSeedSalaries(employees);

    expect(salaries).toHaveLength(5);
    expect(salaries.every((salary) => salary.isActive)).toBe(true);
    expect(salaries.every((salary) => salary.amount > 0)).toBe(true);
  });
});
