import { assertOk } from "@/lib/api/http";
import { DEFAULT_PAGE_SIZE } from "@/lib/constants";
import type { EmployeeListResponse } from "@/types/employee";

export type FetchEmployeesParams = {
  page?: number;
  pageSize?: number;
  search?: string;
  country?: string;
};

export async function fetchEmployees(
  params: FetchEmployeesParams = {},
  signal?: AbortSignal,
): Promise<EmployeeListResponse> {
  const query = new URLSearchParams();

  query.set("page", String(params.page ?? 1));
  query.set("pageSize", String(params.pageSize ?? DEFAULT_PAGE_SIZE));

  if (params.search) {
    query.set("search", params.search);
  }

  if (params.country) {
    query.set("country", params.country);
  }

  const response = await fetch(`/api/employees?${query.toString()}`, { signal });
  await assertOk(response);

  return response.json() as Promise<EmployeeListResponse>;
}
