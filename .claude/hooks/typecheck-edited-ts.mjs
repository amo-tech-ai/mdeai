#!/usr/bin/env node
// PostToolUse hook for Edit|Write|MultiEdit.
// Runs `npx tsc --noEmit` (project-wide) when a .ts/.tsx file under src/ or supabase/functions/ is touched.
// Warn-only: never blocks. Emits errors to stderr so Claude can see them and fix.

import { readFileSync, existsSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { resolve } from "node:path";

let payload;
try {
  payload = JSON.parse(readFileSync(0, "utf8") || "{}");
} catch {
  process.exit(0);
}

const filePath = payload?.tool_input?.file_path || "";
if (!filePath) process.exit(0);

if (!/\.(ts|tsx)$/.test(filePath)) process.exit(0);
if (!/\/(src|supabase\/functions)\//.test(filePath)) process.exit(0);

const cwd = sh("git", ["rev-parse", "--show-toplevel"]) || process.cwd();
if (!existsSync(resolve(cwd, "tsconfig.json"))) process.exit(0);

// Skip if tsc is already running (debounce — file lock based)
const lock = resolve(cwd, "node_modules/.cache/.tsc-hook-running");
if (existsSync(lock)) process.exit(0);

const result = spawnSync(
  "npx",
  ["--no", "--", "tsc", "--noEmit", "--pretty", "false", "--incremental", "false"],
  {
    cwd,
    encoding: "utf8",
    timeout: 60_000,
  },
);

if (result.status !== 0) {
  // Filter to only show errors mentioning the touched file or its directory.
  const allOutput = `${result.stdout || ""}${result.stderr || ""}`;
  const lines = allOutput.split("\n").filter(Boolean);
  const relevant = lines.filter((l) => l.includes(filePath.replace(`${cwd}/`, "")));
  const showLines = relevant.length ? relevant : lines.slice(0, 25);

  process.stderr.write(`[tsc warn] ${filePath}\n`);
  process.stderr.write(showLines.join("\n") + "\n");
}

process.exit(0); // warn-only

function sh(cmd, args) {
  const r = spawnSync(cmd, args, { encoding: "utf8", timeout: 5000 });
  return r.status === 0 ? (r.stdout || "").trim() : "";
}
