export type Salary = {
  id: string;
  employeeId: string;
  amount: number;
  currency: string;
  effectiveFrom: string;
  isActive: boolean;
};

export type CreateSalaryPayload = {
  amount: number;
  currency: string;
  effectiveFrom: string;
};

export type UpdateSalaryPayload = {
  amount: number;
};
