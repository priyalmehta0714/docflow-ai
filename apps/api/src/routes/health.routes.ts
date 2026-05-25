import { FastifyPluginAsync } from "fastify";
import { prisma } from "@docflow/db";

export const healthRoutes: FastifyPluginAsync = async (app) => {
  app.get("/health", async () => {
    // Quick DB ping
    await prisma.$queryRaw`SELECT 1`;
    return {
      ok: true,
      service: "docflow-api",
      time: new Date().toISOString(),
    };
  });
};