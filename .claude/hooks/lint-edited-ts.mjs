#!/usr/bin/env node
// PostToolUse hook for Edit|Write|MultiEdit.
// Runs `npx eslint <file>` on the touched file if it's a .ts/.tsx under src/ or supabase/functions/.
// Warn-only: prints lint output to stderr, never blocks (exit 0).

import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";

let payload;
try {
  payload = JSON.parse(readFileSync(0, "utf8") || "{}");
} catch {
  process.exit(0);
}

const filePath = payload?.tool_input?.file_path || "";
if (!filePath) process.exit(0);

const isTs = /\.(ts|tsx)$/.test(filePath);
if (!isTs) process.exit(0);

const isInScope = /\/(src|supabase\/functions)\//.test(filePath);
if (!isInScope) process.exit(0);

const result = spawnSync("npx", ["--no", "eslint", "--no-warn-ignored", filePath], {
  encoding: "utf8",
  timeout: 20_000,
});

if (result.status !== 0) {
  process.stderr.write(`[lint warn] ${filePath}\n`);
  if (result.stdout) process.stderr.write(result.stdout);
  if (result.stderr) process.stderr.write(result.stderr);
}

process.exit(0); // warn-only
