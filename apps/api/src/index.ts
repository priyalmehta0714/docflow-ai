import { existsSync } from "fs";
import { resolve } from "path";
import { config } from "dotenv";
import { buildApp } from "./app.js";

// 1) Find .env at repo root (works whether you run from root or apps/api)
const envPaths = [
  resolve(process.cwd(), ".env"),
  resolve(process.cwd(), "../../.env"),
];

for (const envPath of envPaths) {
  if (existsSync(envPath)) {
    config({ path: envPath });
    break;
  }
}

// 2) Start server
async function main() {
  const { app, env } = await buildApp();

  const port = Number(process.env.PORT ?? env.API_PORT);

  await app.listen({
    port,
    host: "0.0.0.0",
  });

  console.log(`API running on port ${port}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});