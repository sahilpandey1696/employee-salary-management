export type EmployeeCompensation = {
  amount: number;
  currency: string;
};

export type Employee = {
  id: string;
  employeeNumber: string;
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  phone: string | null;
  country: string;
  department: string;
  jobTitle: string;
  employmentStatus: string;
  joiningDate: string;
  compensation: EmployeeCompensation | null;
};

export type EmployeeListResponse = {
  items: Employee[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

export type EmployeeListParams = {
  page?: number;
  pageSize?: number;
  search?: string;
  employmentStatus?: string;
  sortBy?: string;
  sortDir?: "asc" | "desc";
};

export type CreateEmployeePayload = {
  firstName: string;
  lastName: string;
  employeeNumber?: string;
  email: string;
  phone?: string;
  country: string;
  department: string;
  jobTitle: string;
  employmentStatus: string;
  joiningDate: string;
  currency: string;
  annualSalary: number;
};
