import type { PrismaClient } from "@prisma/client";
import { Router } from "express";
import { createDashboardRepository } from "../../repositories/dashboard.repository.js";

export function createDashboardRouter(prisma: PrismaClient): Router {
  const router = Router();
  const dashboard = createDashboardRepository(prisma);

  router.get("/summary", async (_request, response) => {
    const summary = await dashboard.getSummary();
    response.json(summary);
  });

  return router;
}
