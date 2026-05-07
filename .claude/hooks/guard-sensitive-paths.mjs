#!/usr/bin/env node
// PreToolUse hook for Edit|Write|MultiEdit.
// - Blocks writes to .env / .env.local / .env.production (allows .env.example).
// - Blocks writes under supabase/migrations/** unless the user has set MDEAI_ALLOW_MIGRATION_EDIT=1.
// Reads the hook payload from stdin (JSON with tool_input.file_path).
// Exit 2 = block; print reason to stderr.

import { readFileSync } from "node:fs";

let payload;
try {
  const raw = readFileSync(0, "utf8");
  payload = JSON.parse(raw || "{}");
} catch {
  process.exit(0); // never block on parse failure
}

const filePath = payload?.tool_input?.file_path || payload?.tool_input?.path || "";
if (!filePath) process.exit(0);

const rel = filePath.replace(/^.*?\/mde\/(\.claude\/worktrees\/[^/]+\/)?/, "");

// 1. .env protection
const isEnvFile = /(^|\/)\.env(\.[^./]+)?$/.test(rel);
const isEnvExample = /(^|\/)\.env\.example$/.test(rel);
if (isEnvFile && !isEnvExample) {
  process.stderr.write(
    `BLOCKED: Writes to .env files are forbidden. Secrets live in Supabase dashboard or Infisical.\n` +
      `If this is an .env.example update, name the file .env.example.\n` +
      `Path: ${rel}\n`,
  );
  process.exit(2);
}

// 2. supabase/migrations/** protection
const isMigration = /^supabase\/migrations\//.test(rel);
if (isMigration && process.env.MDEAI_ALLOW_MIGRATION_EDIT !== "1") {
  process.stderr.write(
    `BLOCKED: Edits to supabase/migrations/** require explicit approval.\n` +
      `Migrations are irreversible in prod. To proceed, ask the user to run with MDEAI_ALLOW_MIGRATION_EDIT=1.\n` +
      `Path: ${rel}\n`,
  );
  process.exit(2);
}

process.exit(0);
