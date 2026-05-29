import type {
  CreateEmployeePayload,
  Employee,
  EmployeeListParams,
  EmployeeListResponse,
} from "@/types/employee";
import { formatEmployeeNumber } from "@/lib/employee-code";
import { apiFetch } from "./http";

function toQuery(params: EmployeeListParams): string {
  const searchParams = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== "") {
      searchParams.set(key, String(value));
    }
  }

  const query = searchParams.toString();
  return query.length > 0 ? `?${query}` : "";
}

export function fetchEmployees(
  params: EmployeeListParams,
): Promise<EmployeeListResponse> {
  return apiFetch<EmployeeListResponse>(`/employees${toQuery(params)}`);
}

export function fetchEmployee(id: string): Promise<Employee> {
  return apiFetch<Employee>(`/employees/${id}?_=${Date.now()}`);
}

export function createEmployee(
  payload: CreateEmployeePayload,
): Promise<Employee> {
  return apiFetch<Employee>("/employees", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateEmployee(
  id: string,
  payload: Partial<CreateEmployeePayload>,
): Promise<Employee> {
  return apiFetch<Employee>(`/employees/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export function deleteEmployee(id: string): Promise<void> {
  return apiFetch<void>(`/employees/${id}`, { method: "DELETE" });
}

export async function fetchNextEmployeeCode(): Promise<{ employeeNumber: string }> {
  try {
    return await apiFetch<{ employeeNumber: string }>("/employees/next-code");
  } catch {
    const response = await fetchEmployees({ page: 1, pageSize: 1 });
    return { employeeNumber: formatEmployeeNumber(response.total + 1) };
  }
}
