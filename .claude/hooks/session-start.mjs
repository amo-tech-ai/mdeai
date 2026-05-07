#!/usr/bin/env node
// SessionStart hook — emits a small situational preamble when a session begins.
// Stdout is injected into the session as additional context (per Claude Code hook spec).
// Keep output short: branch + ahead/behind + 5 recent commits + today's tasks (if file exists).

import { readFileSync, existsSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { resolve } from "node:path";

function sh(cmd, args) {
  const r = spawnSync(cmd, args, { encoding: "utf8", timeout: 5000 });
  if (r.status !== 0) return "";
  return (r.stdout || "").trim();
}

const cwd = process.cwd();

// Best-effort repo root (handles worktrees too).
const repoRoot = sh("git", ["rev-parse", "--show-toplevel"]) || cwd;

const branch = sh("git", ["rev-parse", "--abbrev-ref", "HEAD"]) || "(detached)";
const upstream = sh("git", ["rev-parse", "--abbrev-ref", "--symbolic-full-name", "@{u}"]);
let aheadBehind = "";
if (upstream) {
  const ab = sh("git", ["rev-list", "--left-right", "--count", `${upstream}...HEAD`]);
  if (ab) {
    const [behind, ahead] = ab.split(/\s+/);
    aheadBehind = ` · ahead ${ahead}, behind ${behind} vs ${upstream}`;
  }
}

const log = sh("git", ["log", "--oneline", "-5", "--no-decorate"]);
const status = sh("git", ["status", "--porcelain"]);
const dirty = status ? `${status.split("\n").length} changed file(s)` : "clean";

let todoSection = "";
const todoPath = resolve(repoRoot, "tasks/todo.md");
if (existsSync(todoPath)) {
  try {
    const head = readFileSync(todoPath, "utf8").split("\n").slice(0, 30).join("\n");
    todoSection = `\n## tasks/todo.md (first 30 lines)\n\n${head}\n`;
  } catch {
    /* ignore */
  }
}

const out = `# Session preamble

- Branch: \`${branch}\`${aheadBehind}
- Working tree: ${dirty}

## Recent commits

\`\`\`
${log || "(no commits)"}
\`\`\`
${todoSection}
Use \`mde-task-lifecycle\` to plan/ship a task. Floor before shipping: \`npm run lint && npm run build && npm run test\`.
`;

process.stdout.write(out);
process.exit(0);
