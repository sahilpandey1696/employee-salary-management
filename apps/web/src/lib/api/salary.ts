import { assertOk } from "@/lib/api/http";
import type {
  CreateSalaryPayload,
  Salary,
  UpdateSalaryPayload,
} from "@/types/salary";

export async function fetchEmployeeSalary(
  employeeId: string,
): Promise<Salary | null> {
  const response = await fetch(`/api/employees/${employeeId}/salary`);

  if (response.status === 404) {
    return null;
  }

  await assertOk(response);

  return response.json() as Promise<Salary>;
}

export async function createEmployeeSalary(
  employeeId: string,
  payload: CreateSalaryPayload,
): Promise<Salary> {
  const response = await fetch(`/api/employees/${employeeId}/salary`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  await assertOk(response);

  return response.json() as Promise<Salary>;
}

export async function updateEmployeeSalary(
  employeeId: string,
  payload: UpdateSalaryPayload,
): Promise<Salary> {
  const response = await fetch(`/api/employees/${employeeId}/salary`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  await assertOk(response);

  return response.json() as Promise<Salary>;
}
