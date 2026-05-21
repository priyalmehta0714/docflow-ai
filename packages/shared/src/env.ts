    import { z } from "zod";

/**
 * Validates environment variables when the app starts.
 * If something is missing/wrong, you get a clear error immediately.
 */
const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  DATABASE_URL: z.string().url().or(z.string().startsWith("postgresql://")),
  REDIS_URL: z.string().url().or(z.string().startsWith("redis://")),
  API_PORT: z.coerce.number().default(3001),
  JWT_SECRET: z.string().min(16),
});

export type Env = z.infer<typeof envSchema>;

export function loadEnv(): Env {
  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    console.error("Invalid environment variables:", parsed.error.flatten().fieldErrors);
    throw new Error("Fix .env file — see .env.example");
  }
  return parsed.data;
}