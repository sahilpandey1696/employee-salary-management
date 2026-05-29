import type { Salary } from "../salary/salary-record.js";

export type DashboardEmployee = {
  id: string;
  country: string;
};

export type CountryBreakdownRow = {
  country: string;
  payroll: number;
  headcount: number;
};

export type DashboardAnalytics = {
  totalPayroll: number;
  averageSalary: number;
  countryBreakdown: CountryBreakdownRow[];
};

export function computeDashboardAnalytics(
  employees: DashboardEmployee[],
  salaries: Salary[],
): DashboardAnalytics {
  const activeAmountByEmployee = buildActiveAmountIndex(salaries);
  const activeAmounts = [...activeAmountByEmployee.values()];

  const totalPayroll = activeAmounts.reduce((sum, amount) => sum + amount, 0);
  const averageSalary =
    activeAmounts.length === 0 ? 0 : totalPayroll / activeAmounts.length;

  const countryBreakdown = buildCountryBreakdown(
    employees,
    activeAmountByEmployee,
  );

  return { totalPayroll, averageSalary, countryBreakdown };
}

function buildActiveAmountIndex(salaries: Salary[]): Map<string, number> {
  const activeAmountByEmployee = new Map<string, number>();

  for (const salary of salaries) {
    if (salary.isActive) {
      activeAmountByEmployee.set(salary.employeeId, salary.amount);
    }
  }

  return activeAmountByEmployee;
}

function buildCountryBreakdown(
  employees: DashboardEmployee[],
  activeAmountByEmployee: Map<string, number>,
): CountryBreakdownRow[] {
  const byCountry = new Map<string, CountryBreakdownRow>();

  for (const employee of employees) {
    const existing = byCountry.get(employee.country) ?? {
      country: employee.country,
      payroll: 0,
      headcount: 0,
    };

    const amount = activeAmountByEmployee.get(employee.id) ?? 0;

    byCountry.set(employee.country, {
      country: employee.country,
      payroll: existing.payroll + amount,
      headcount: existing.headcount + 1,
    });
  }

  return [...byCountry.values()].sort((left, right) =>
    left.country.localeCompare(right.country),
  );
}
