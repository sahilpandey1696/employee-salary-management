export const SEED_EMPLOYEE_COUNT = 10_000;

export const COUNTRIES = ["US", "UK", "DE", "CA", "AU", "IN", "SG", "FR"] as const;

const DEPARTMENTS = [
  "Engineering",
  "Product",
  "Design",
  "Sales",
  "Marketing",
  "Operations",
  "Finance",
  "People",
] as const;

const FIRST_NAMES = [
  "Alex",
  "Jordan",
  "Taylor",
  "Morgan",
  "Casey",
  "Riley",
  "Avery",
  "Quinn",
  "Sam",
  "Jamie",
] as const;

const LAST_NAMES = [
  "Anderson",
  "Brown",
  "Chen",
  "Diaz",
  "Evans",
  "Foster",
  "Garcia",
  "Hayes",
  "Ibrahim",
  "Johnson",
] as const;

export type SeedEmployee = {
  employeeNumber: string;
  fullName: string;
  country: string;
  department: string;
};

export type SeedSalary = {
  employeeNumber: string;
  amount: number;
  currency: string;
  effectiveFrom: Date;
  isActive: true;
};

export function createSeedEmployees(count: number): SeedEmployee[] {
  return Array.from({ length: count }, (_, index) =>
    buildEmployee(index + 1),
  );
}

export function createSeedSalaries(employees: SeedEmployee[]): SeedSalary[] {
  return employees.map((employee, index) => ({
    employeeNumber: employee.employeeNumber,
    amount: buildSalaryAmount(index + 1),
    currency: "USD",
    effectiveFrom: new Date("2024-01-01T00:00:00.000Z"),
    isActive: true,
  }));
}

function buildEmployee(sequence: number): SeedEmployee {
  const country = COUNTRIES[(sequence - 1) % COUNTRIES.length];
  const department = DEPARTMENTS[(sequence - 1) % DEPARTMENTS.length];
  const firstName = FIRST_NAMES[(sequence - 1) % FIRST_NAMES.length];
  const lastName = LAST_NAMES[Math.floor((sequence - 1) / FIRST_NAMES.length) % LAST_NAMES.length];

  return {
    employeeNumber: formatEmployeeNumber(sequence),
    fullName: `${firstName} ${lastName}`,
    country,
    department,
  };
}

function formatEmployeeNumber(sequence: number): string {
  return `E${sequence.toString().padStart(5, "0")}`;
}

function buildSalaryAmount(sequence: number): number {
  const base = 45_000 + (sequence % 155) * 1_000;
  const cents = (sequence % 100) / 100;
  return Math.round((base + cents) * 100) / 100;
}
