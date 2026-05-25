import { existsSync } from "fs";
import { resolve } from "path";
import { config } from "dotenv";

const envPaths = [
  resolve(process.cwd(), ".env"),
  resolve(process.cwd(), "../../.env"),
];

for (const p of envPaths) {
  if (existsSync(p)) {
    config({ path: p });
    break;
  }
}
