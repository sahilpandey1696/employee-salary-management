import type { DashboardSummary } from "@/types/dashboard";

export async function fetchDashboardSummary(): Promise<DashboardSummary> {
  const response = await fetch("/api/dashboard/summary");

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as {
      error?: string;
    } | null;
    throw new Error(body?.error ?? "Failed to load dashboard summary");
  }

  return response.json() as Promise<DashboardSummary>;
}
