export type DashboardInsights = {
  kpis: {
    activeEmployees: number;
    inactiveEmployees: number;
    countries: number;
  };
  averageSalaryByCountry: { country: string; average: number }[];
  employeesByDepartment: { department: string; count: number }[];
  workforceStatus: { status: string; count: number }[];
  topHighestPaid: { name: string; amount: number }[];
  topLowestPaid: { name: string; amount: number }[];
  averageSalaryByDepartment: { department: string; average: number }[];
  medianSalaryByCountry: { country: string; median: number }[];
};
