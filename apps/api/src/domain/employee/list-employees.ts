export const DEFAULT_PAGE_SIZE = 25;
export const MAX_PAGE_SIZE = 100;

export type Employee = {
  id: string;
  employeeNumber: string;
  fullName: string;
  country: string;
  department?: string;
};

export type EmployeeListParams = {
  page?: number;
  pageSize?: number;
  search?: string;
  country?: string;
};

export type ParsedEmployeeListParams = {
  page: number;
  pageSize: number;
  search: string | undefined;
  country: string | undefined;
};

export type EmployeeListResult = {
  items: Employee[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

export function parseEmployeeListParams(
  input: EmployeeListParams,
): ParsedEmployeeListParams {
  const page = input.page ?? 1;
  const pageSize = input.pageSize ?? DEFAULT_PAGE_SIZE;

  if (page < 1) {
    throw new Error("Page must be at least 1");
  }

  if (pageSize < 1) {
    throw new Error("Page size must be at least 1");
  }

  if (pageSize > MAX_PAGE_SIZE) {
    throw new Error(`Page size must not exceed ${MAX_PAGE_SIZE}`);
  }

  const search = normalizeSearch(input.search);
  const country = normalizeCountry(input.country);

  return { page, pageSize, search, country };
}

export function listEmployees(
  employees: Employee[],
  params: EmployeeListParams,
): EmployeeListResult {
  const { page, pageSize, search, country } = parseEmployeeListParams(params);

  const filtered = employees
    .filter((employee) => matchesCountry(employee, country))
    .filter((employee) => matchesSearch(employee, search))
    .sort(compareEmployees);

  const total = filtered.length;
  const totalPages = total === 0 ? 0 : Math.ceil(total / pageSize);
  const start = (page - 1) * pageSize;
  const items = filtered.slice(start, start + pageSize);

  return { items, total, page, pageSize, totalPages };
}

function normalizeSearch(value: string | undefined): string | undefined {
  if (value === undefined) {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed.length === 0 ? undefined : trimmed.toLowerCase();
}

function normalizeCountry(value: string | undefined): string | undefined {
  if (value === undefined) {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed.length === 0 ? undefined : trimmed.toUpperCase();
}

function matchesCountry(employee: Employee, country: string | undefined): boolean {
  if (country === undefined) {
    return true;
  }

  return employee.country.toUpperCase() === country;
}

function matchesSearch(employee: Employee, search: string | undefined): boolean {
  if (search === undefined) {
    return true;
  }

  const name = employee.fullName.toLowerCase();
  const number = employee.employeeNumber.toLowerCase();

  return name.includes(search) || number.includes(search);
}

function compareEmployees(left: Employee, right: Employee): number {
  const byName = left.fullName.localeCompare(right.fullName);
  if (byName !== 0) {
    return byName;
  }

  return left.employeeNumber.localeCompare(right.employeeNumber);
}
