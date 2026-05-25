import Fastify from "fastify";
import jwt from "@fastify/jwt";
import multipart from "@fastify/multipart";
import { loadEnv } from "@docflow/shared";
import { authPlugin } from "./plugins/auth.js";
import { healthRoutes } from "./routes/health.routes.js";
import { authRoutes } from "./routes/auth.routes.js";
import { documentRoutes } from "./routes/documents.routes.js";

export async function buildApp() {
  const env = loadEnv();

  const app = Fastify({
    logger: true,
  });

  await app.register(jwt, {
    secret: process.env.JWT_SECRET!,
  });

  // File uploads
  await app.register(multipart, {
    limits: { fileSize: Number(process.env.MAX_UPLOAD_MB ?? 25) * 1024 * 1024 },
  });

  await app.register(authPlugin);
  await app.register(healthRoutes);
  await app.register(authRoutes);
  await app.register(documentRoutes);

  return { app, env };
}