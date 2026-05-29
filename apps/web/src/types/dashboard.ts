export type CountryBreakdownRow = {
  country: string;
  payroll: number;
  headcount: number;
};

export type DashboardSummary = {
  totalPayroll: number;
  averageSalary: number;
  countryBreakdown: CountryBreakdownRow[];
};
