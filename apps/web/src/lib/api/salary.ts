import type {
  CreateSalaryPayload,
  Salary,
  UpdateSalaryPayload,
} from "@/types/salary";

async function readError(response: Response): Promise<string> {
  const body = (await response.json().catch(() => null)) as {
    error?: string;
  } | null;
  return body?.error ?? "Request failed";
}

export async function fetchEmployeeSalary(
  employeeId: string,
): Promise<Salary | null> {
  const response = await fetch(`/api/employees/${employeeId}/salary`);

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    throw new Error(await readError(response));
  }

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

  if (!response.ok) {
    throw new Error(await readError(response));
  }

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

  if (!response.ok) {
    throw new Error(await readError(response));
  }

  return response.json() as Promise<Salary>;
}
