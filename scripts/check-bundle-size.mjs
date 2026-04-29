#!/usr/bin/env node
/**
 * Bundle-size budget enforcement.
 *
 * Reads the post-build dist/assets/ output, gzips each entry-relevant
 * chunk in memory, and fails (exit 1) if any chunk exceeds its budget.
 *
 * Budgets are intentionally tight:
 *   - The entry chunk is what every renter pays for first-paint.
 *   - The "vendor" splits (radix, supabase, posthog, gadget, sentry,
 *     icons, dates, forms, tanstack) are loaded lazily but still hit
 *     the user's data plan; we cap each so a careless `import { a } from
 *     'big-package'` doesn't drag the whole library into a chunk.
 *
 * Usage: invoked via `npm run check:bundle` after `npm run build`.
 *        Lands in CI as the trailing step of the build job (CT-2).
 *
 * Exits 0 on green, 1 on any over-budget chunk, 2 on missing dist/.
 */

import { promises as fs } from "node:fs";
import path from "node:path";
import zlib from "node:zlib";
import { promisify } from "node:util";

const gzip = promisify(zlib.gzip);

const DIST_ASSETS = path.resolve(process.cwd(), "dist/assets");

// Budgets in kilobytes (gzip). Numbers reflect the post-PR-#6 baseline
// (see tasks/todo.md §post-merge best-practices). Bumping requires a PR
// note + reviewer sign-off, not a unilateral commit.
const BUDGETS_KB = {
  // Entry chunk — first byte every visitor downloads.
  "index-": 100,
  // Vendor splits — each loaded lazily but still individually large.
  "radix-": 100,
  "supabase-": 60,
  "posthog-": 70,
  "gadget-": 60,
  "sentry-": 35,
  "icons-": 20,
  "dates-": 25,
  "forms-": 30,
  "tanstack-": 20,
};

function matchBudget(filename) {
  for (const [prefix, budgetKb] of Object.entries(BUDGETS_KB)) {
    if (filename.startsWith(prefix)) return { prefix, budgetKb };
  }
  return null;
}

async function gzipBytes(buf) {
  const out = await gzip(buf, { level: 9 });
  return out.length;
}

function fmtKb(bytes) {
  return `${(bytes / 1024).toFixed(2)} KB`;
}

async function main() {
  let entries;
  try {
    entries = await fs.readdir(DIST_ASSETS);
  } catch {
    console.error(
      `[check-bundle-size] dist/assets not found at ${DIST_ASSETS}. Run 'npm run build' first.`,
    );
    process.exit(2);
  }

  const jsFiles = entries.filter((f) => f.endsWith(".js"));
  if (jsFiles.length === 0) {
    console.error(
      "[check-bundle-size] no .js files in dist/assets — was the build empty?",
    );
    process.exit(2);
  }

  let failed = 0;
  const rows = [];

  for (const file of jsFiles.sort()) {
    const budget = matchBudget(file);
    if (!budget) continue;
    const buf = await fs.readFile(path.join(DIST_ASSETS, file));
    const gz = await gzipBytes(buf);
    const overBy = gz - budget.budgetKb * 1024;
    const status = overBy > 0 ? "❌ OVER" : "✅";
    rows.push({
      file,
      gzip: fmtKb(gz),
      budget: `${budget.budgetKb} KB`,
      delta: overBy > 0 ? `+${fmtKb(overBy)}` : "OK",
      status,
    });
    if (overBy > 0) failed++;
  }

  // Pretty print
  console.log("");
  console.log("Bundle budget check");
  console.log("───────────────────────────────────────────────────────────");
  for (const r of rows) {
    console.log(
      `  ${r.status}  ${r.file.padEnd(38)} ${r.gzip.padStart(10)}  budget ${r.budget.padStart(8)}  ${r.delta}`,
    );
  }
  console.log("───────────────────────────────────────────────────────────");
  console.log(
    `  ${rows.length} chunk(s) checked · ${failed} over budget`,
  );
  console.log("");

  if (failed > 0) {
    console.error(
      "[check-bundle-size] FAILED — at least one chunk is over budget. See table above.",
    );
    process.exit(1);
  }
  console.log("[check-bundle-size] all chunks within budget ✓");
  process.exit(0);
}

main().catch((err) => {
  console.error("[check-bundle-size] threw:", err);
  process.exit(2);
});
