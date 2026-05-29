export const SEED_EMPLOYEE_COUNT = 10_002;

export const COUNTRIES = [
  "United States",
  "United Kingdom",
  "Germany",
  "Canada",
  "India",
  "Singapore",
] as const;

const DEPARTMENTS = [
  "Engineering",
  "Product",
  "Finance",
  "HR",
  "Operations",
  "Sales",
  "Support",
  "IT",
] as const;

const JOB_TITLES = [
  "Software Engineer",
  "Senior Software Engineer",
  "QA Engineer",
  "Product Manager",
  "Finance Analyst",
  "Sales Executive",
  "Engineering Manager",
  "HR Specialist",
] as const;

const FIRST_NAMES = [
  "Aarav",
  "Emma",
  "Olivia",
  "Lucas",
  "Charlotte",
  "Amelia",
  "Harper",
  "Mason",
  "Sophia",
  "Liam",
] as const;

const LAST_NAMES = [
  "Anderson",
  "Brown",
  "Chen",
  "Diaz",
  "Harris",
  "Joshi",
  "Mehta",
  "Nair",
  "Patel",
  "Singh",
] as const;

export type SeedEmployee = {
  employeeNumber: string;
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  phone: string;
  country: string;
  department: string;
  jobTitle: string;
  employmentStatus: "ACTIVE" | "INACTIVE";
  joiningDate: Date;
};

export type SeedSalary = {
  employeeNumber: string;
  amount: number;
  currency: string;
  effectiveFrom: Date;
  isActive: true;
};

export function createSeedEmployees(count: number): SeedEmployee[] {
  return Array.from({ length: count }, (_, index) => buildEmployee(index + 1));
}

export function createSeedSalaries(employees: SeedEmployee[]): SeedSalary[] {
  return employees
    .filter((employee) => employee.employmentStatus === "ACTIVE")
    .map((employee, index) => ({
      employeeNumber: employee.employeeNumber,
      amount: buildSalaryAmount(index + 1),
      currency: "USD",
      effectiveFrom: employee.joiningDate,
      isActive: true as const,
    }));
}

function buildEmployee(sequence: number): SeedEmployee {
  const firstName = FIRST_NAMES[(sequence - 1) % FIRST_NAMES.length];
  const lastName = LAST_NAMES[Math.floor((sequence - 1) / FIRST_NAMES.length) % LAST_NAMES.length];
  const country = COUNTRIES[(sequence - 1) % COUNTRIES.length];
  const department = DEPARTMENTS[(sequence - 1) % DEPARTMENTS.length];
  const jobTitle = JOB_TITLES[(sequence - 1) % JOB_TITLES.length];
  const employeeNumber = formatEmployeeNumber(sequence);
  const employmentStatus = sequence % 7 === 0 ? "INACTIVE" : "ACTIVE";

  return {
    employeeNumber,
    firstName,
    lastName,
    fullName: `${firstName} ${lastName}`,
    email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}.${sequence}@acme.org`,
    phone: `+1${String(2000000000 + (sequence % 799999999)).slice(0, 10)}`,
    country,
    department,
    jobTitle,
    employmentStatus,
    joiningDate: new Date(2020 + (sequence % 5), (sequence % 12), 1 + (sequence % 28)),
  };
}

function formatEmployeeNumber(sequence: number): string {
  return `EMP${sequence.toString().padStart(5, "0")}`;
}

function buildSalaryAmount(sequence: number): number {
  const base = 42_000 + (sequence % 200) * 260;
  return Math.round(base * 100) / 100;
}
