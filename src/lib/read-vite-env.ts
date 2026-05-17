import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

/** Minimal VITE_* loader for Vitest live integration tests (avoids importing vite/loadEnv in jsdom). */
export function readViteEnv(cwd = process.cwd()): Record<string, string> {
  const out: Record<string, string> = {};
  for (const key of Object.keys(process.env)) {
    if (key.startsWith("VITE_") && process.env[key]) {
      out[key] = process.env[key]!;
    }
  }
  for (const file of [".env.local", ".env"]) {
    const path = join(cwd, file);
    if (!existsSync(path)) continue;
    for (const line of readFileSync(path, "utf8").split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq === -1) continue;
      const key = trimmed.slice(0, eq).trim();
      if (!key.startsWith("VITE_")) continue;
      let value = trimmed.slice(eq + 1).trim();
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
      out[key] = value;
    }
  }
  return out;
}
