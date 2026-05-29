import { describe, expect, it } from "vitest";
import {
  DEFAULT_PAGE_SIZE,
  listEmployees,
  parseEmployeeListParams,
  type Employee,
} from "../list-employees.js";

const employees: Employee[] = [
  {
    id: "1",
    employeeNumber: "E100",
    fullName: "Alice Anderson",
    country: "US",
    department: "Engineering",
  },
  {
    id: "2",
    employeeNumber: "E200",
    fullName: "Bob Brown",
    country: "UK",
  },
  {
    id: "3",
    employeeNumber: "E300",
    fullName: "Carol Chen",
    country: "US",
  },
  {
    id: "4",
    employeeNumber: "E400",
    fullName: "David Diaz",
    country: "DE",
  },
  {
    id: "5",
    employeeNumber: "E500",
    fullName: "Alice Adams",
    country: "US",
  },
];

describe("parseEmployeeListParams", () => {
  it("defaults page to 1 and pageSize to 25", () => {
    expect(parseEmployeeListParams({})).toEqual({
      page: 1,
      pageSize: DEFAULT_PAGE_SIZE,
      search: undefined,
      country: undefined,
    });
  });

  it("normalizes search and country filters", () => {
    expect(
      parseEmployeeListParams({
        page: 2,
        pageSize: 10,
        search: "  alice  ",
        country: " us ",
      }),
    ).toEqual({
      page: 2,
      pageSize: 10,
      search: "alice",
      country: "US",
    });
  });

  it("rejects invalid page numbers", () => {
    expect(() => parseEmployeeListParams({ page: 0 })).toThrow(
      "Page must be at least 1",
    );
  });

  it("rejects invalid page sizes", () => {
    expect(() => parseEmployeeListParams({ pageSize: 0 })).toThrow(
      "Page size must be at least 1",
    );
  });
});

describe("listEmployees", () => {
  it("returns employees sorted by full name ascending", () => {
    const result = listEmployees(employees, {});

    expect(result.items.map((e) => e.fullName)).toEqual([
      "Alice Adams",
      "Alice Anderson",
      "Bob Brown",
      "Carol Chen",
      "David Diaz",
    ]);
  });

  it("preserves stable order for equal names by employee number", () => {
    const tieBreak: Employee[] = [
      {
        id: "a",
        employeeNumber: "E002",
        fullName: "Sam Smith",
        country: "US",
      },
      {
        id: "b",
        employeeNumber: "E001",
        fullName: "Sam Smith",
        country: "US",
      },
    ];

    const result = listEmployees(tieBreak, {});

    expect(result.items.map((e) => e.employeeNumber)).toEqual(["E001", "E002"]);
  });

  it("filters by search on full name (case insensitive)", () => {
    const result = listEmployees(employees, { search: "ALICE" });

    expect(result.total).toBe(2);
    expect(result.items.map((e) => e.id)).toEqual(["5", "1"]);
  });

  it("filters by search on employee number", () => {
    const result = listEmployees(employees, { search: "e300" });

    expect(result.total).toBe(1);
    expect(result.items[0]?.employeeNumber).toBe("E300");
  });

  it("filters by country", () => {
    const result = listEmployees(employees, { country: "US" });

    expect(result.total).toBe(3);
    expect(result.items.every((e) => e.country === "US")).toBe(true);
  });

  it("combines search and country filters", () => {
    const result = listEmployees(employees, {
      search: "alice",
      country: "US",
    });

    expect(result.total).toBe(2);
    expect(result.items.map((e) => e.id)).toEqual(["5", "1"]);
  });

  it("paginates results with metadata", () => {
    const result = listEmployees(employees, { page: 2, pageSize: 2 });

    expect(result.items.map((e) => e.fullName)).toEqual([
      "Bob Brown",
      "Carol Chen",
    ]);
    expect(result).toMatchObject({
      total: 5,
      page: 2,
      pageSize: 2,
      totalPages: 3,
    });
  });

  it("returns an empty page when no employees match", () => {
    const result = listEmployees(employees, { search: "zzz" });

    expect(result.items).toEqual([]);
    expect(result.total).toBe(0);
    expect(result.totalPages).toBe(0);
  });
});
