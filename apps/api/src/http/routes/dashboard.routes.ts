import type { PrismaClient } from "@prisma/client";
import { Router } from "express";
import { createDashboardInsightsRepository } from "../../repositories/dashboard-insights.repository.js";
import { createDashboardRepository } from "../../repositories/dashboard.repository.js";

export function createDashboardRouter(prisma: PrismaClient): Router {
  const router = Router();
  const dashboard = createDashboardRepository(prisma);
  const insights = createDashboardInsightsRepository(prisma);

  router.get("/summary", async (_request, response) => {
    const summary = await dashboard.getSummary();
    response.json(summary);
  });

  router.get("/insights", async (_request, response) => {
    const data = await insights.getInsights();
    response.json(data);
  });

  return router;
}
