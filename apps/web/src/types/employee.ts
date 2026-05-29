export type Employee = {
  id: string;
  employeeNumber: string;
  fullName: string;
  country: string;
  department?: string;
};

export type EmployeeListResponse = {
  items: Employee[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};
