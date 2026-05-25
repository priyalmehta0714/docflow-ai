import { isAbsolute, resolve } from "path";
import process from "process";

/**
 * PDF path saved by API may be absolute or relative to apps/api.
 */
export function resolveStoragePath(storagePath: string): string {
  if (isAbsolute(storagePath)) {
    return storagePath;
  }
  return resolve(process.cwd(), "../api", storagePath);
}