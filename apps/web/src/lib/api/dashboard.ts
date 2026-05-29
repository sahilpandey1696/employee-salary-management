import type { DashboardInsights } from "@/types/dashboard";
import { apiFetch } from "./http";

export function fetchDashboardInsights(): Promise<DashboardInsights> {
  return apiFetch<DashboardInsights>("/dashboard/insights");
}
