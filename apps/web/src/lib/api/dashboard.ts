import { assertOk } from "@/lib/api/http";
import type { DashboardSummary } from "@/types/dashboard";

export async function fetchDashboardSummary(): Promise<DashboardSummary> {
  const response = await fetch("/api/dashboard/summary");
  await assertOk(response);

  return response.json() as Promise<DashboardSummary>;
}
