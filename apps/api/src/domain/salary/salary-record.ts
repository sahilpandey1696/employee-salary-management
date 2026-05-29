export type Salary = {
  id: string;
  employeeId: string;
  amount: number;
  currency: string;
  effectiveFrom: Date;
  isActive: boolean;
};

export type CreateSalaryInput = {
  id: string;
  employeeId: string;
  amount: number;
  currency: string;
  effectiveFrom: Date;
};

export type CreateSalaryResult = {
  salaries: Salary[];
  record: Salary;
};

export function validateSalaryAmount(amount: number): number {
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error("Salary amount must be greater than zero");
  }

  if (!hasAtMostTwoDecimalPlaces(amount)) {
    throw new Error("Salary amount must have at most two decimal places");
  }

  return amount;
}

export function getActiveSalary(
  salaries: Salary[],
  employeeId: string,
): Salary | null {
  return (
    salaries.find(
      (record) => record.employeeId === employeeId && record.isActive,
    ) ?? null
  );
}

export function createSalaryRecord(
  salaries: Salary[],
  input: CreateSalaryInput,
): CreateSalaryResult {
  if (getActiveSalary(salaries, input.employeeId) !== null) {
    throw new Error("Employee already has an active salary record");
  }

  const record: Salary = {
    id: input.id,
    employeeId: input.employeeId,
    amount: validateSalaryAmount(input.amount),
    currency: normalizeCurrency(input.currency),
    effectiveFrom: input.effectiveFrom,
    isActive: true,
  };

  return {
    salaries: [...salaries, record],
    record,
  };
}

export function updateActiveSalaryAmount(
  salaries: Salary[],
  employeeId: string,
  amount: number,
): Salary[] {
  const active = getActiveSalary(salaries, employeeId);

  if (active === null) {
    throw new Error("No active salary record found for employee");
  }

  const validatedAmount = validateSalaryAmount(amount);

  return salaries.map((record) =>
    record.id === active.id
      ? { ...record, amount: validatedAmount }
      : record,
  );
}

function normalizeCurrency(currency: string): string {
  return currency.trim().toUpperCase();
}

function hasAtMostTwoDecimalPlaces(amount: number): boolean {
  return Math.abs(amount * 100 - Math.round(amount * 100)) < 1e-8;
}
