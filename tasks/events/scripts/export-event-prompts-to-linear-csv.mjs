#!/usr/bin/env node
/**
 * Emit a Linear CSV compatible with `pnpm dlx @linear/import --importer linearCsv`.
 * Importer expects columns defined in Linear's LinearCsvImporter (Title, Description,
 * Priority ∈ No priority|Urgent|High|Medium|Low, Status, Labels comma+space, etc.).
 *
 * Usage:
 *   node tasks/events/scripts/export-event-prompts-to-linear-csv.mjs
 *   node tasks/events/scripts/export-event-prompts-to-linear-csv.mjs --include-archive --out /tmp/events.csv
 *
 * Import (team + project; you still pick the CSV path when prompted):
 *   LINEAR_API_KEY=lin_api_xxx pnpm dlx @linear/import --importer linearCsv --team SAN --project mdeai
 *
 * @see https://github.com/linear/linear/tree/master/packages/import
 */

import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const PROMPTS_ROOT = path.resolve(__dirname, "../prompts");
const REPO_ROOT = path.resolve(__dirname, "../../..");

/** Headers must match packages/import LinearCsvImporter.ts */
const HEADERS = [
  "Id",
  "Team",
  "Title",
  "Description",
  "Status",
  "Estimate",
  "Priority",
  "Project",
  "Creator",
  "Assignee",
  "Labels",
  "Cycle Number",
  "Cycle Name",
  "Cycle Start",
  "Cycle End",
  "Created",
  "Updated",
  "Started",
  "Completed",
  "Canceled",
  "Archived",
];

function parseArgs(argv) {
  let includeArchive = false;
  let out = path.join(PROMPTS_ROOT, "event-prompts.linear.csv");
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--include-archive") includeArchive = true;
    else if (a === "--out") out = argv[++i] ?? out;
    else if (a === "--help" || a === "-h") {
      console.error(`Usage: export-event-prompts-to-linear-csv.mjs [--include-archive] [--out path]\n`);
      process.exit(0);
    }
  }
  return { includeArchive, out };
}

function csvCell(value) {
  if (value === undefined || value === null) return "";
  const s = String(value);
  if (/[",\r\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function csvRow(cols) {
  return cols.map(csvCell).join(",");
}

/** Pull scalar frontmatter keys; ignores nested YAML blocks (skill:, arrays). */
function extractScalarFrontmatter(rawFile) {
  const m = rawFile.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
  if (!m) return { fmText: "", body: rawFile };
  return { fmText: m[1], body: m[2] };
}

function fmPick(fmText, key) {
  const re = new RegExp(`^${key}:\\s*(.*)$`, "m");
  const hit = fmText.match(re);
  return hit ? hit[1].trim() : "";
}

function mapPriority(p) {
  const x = (p || "").toUpperCase();
  if (x === "P0") return "High";
  if (x === "P1") return "Medium";
  if (x === "P2") return "Low";
  return "Medium";
}

function mapStatus(s) {
  const x = (s || "").trim().toLowerCase();
  if (x === "done" || x === "closed") return "Done";
  if (x === "in progress" || x === "started") return "In Progress";
  return "Backlog";
}

/** Rough story points from estimated_effort like "1 day", "2d", "0.5d" */
function parseEstimate(effort) {
  if (!effort) return "";
  const n = Number.parseFloat(String(effort).replace(/[^\d.]/g, ""));
  if (!Number.isFinite(n)) return "";
  return String(Math.max(1, Math.round(n)));
}

async function collectMarkdownFiles(dir, { includeArchive }) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = [];
  for (const ent of entries) {
    const full = path.join(dir, ent.name);
    if (ent.isDirectory()) {
      if (ent.name === "archive" && !includeArchive) continue;
      files.push(...(await collectMarkdownFiles(full, { includeArchive })));
    } else if (ent.isFile() && ent.name.endsWith(".md")) {
      if (ent.name === "000-index.md") continue;
      if (/^notes/i.test(ent.name)) continue;
      if (!/^\d{3}-/.test(ent.name)) continue;
      files.push(full);
    }
  }
  return files;
}

async function main() {
  const { includeArchive, out } = parseArgs(process.argv);

  const mdPaths = (await collectMarkdownFiles(PROMPTS_ROOT, { includeArchive })).sort((a, b) =>
    path.basename(a).localeCompare(path.basename(b), undefined, { numeric: true }),
  );

  const rows = [csvRow(HEADERS)];

  for (const abs of mdPaths) {
    const raw = await fs.readFile(abs, "utf8");
    const { fmText, body } = extractScalarFrontmatter(raw);
    const rel = path.relative(REPO_ROOT, abs).replace(/\\/g, "/");

    const taskId = fmPick(fmText, "task_id");
    const titleBase = fmPick(fmText, "title");
    const phase = fmPick(fmText, "phase");
    const priority = fmPick(fmText, "priority");
    const status = fmPick(fmText, "status");
    const effort = fmPick(fmText, "estimated_effort");
    const area = fmPick(fmText, "area");

    const num = path.basename(abs).slice(0, 3);
    const title = titleBase ? `[${num}] ${titleBase}` : `[${num}] ${path.basename(abs, ".md")}`;

    const labelParts = ["events-prompt", taskId || undefined, phase || undefined, area || undefined].filter(Boolean);
    const labels = labelParts.join(", ");

    const description = [
      `**Source file:** \`${rel}\`${taskId ? ` · \`${taskId}\`` : ""}`,
      "",
      "---",
      "",
      body.trim(),
    ].join("\n");

    rows.push(
      csvRow([
        "",
        "",
        title,
        description,
        mapStatus(status || "Open"),
        parseEstimate(effort),
        mapPriority(priority),
        "",
        "",
        "",
        labels,
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
      ]),
    );
  }

  await fs.mkdir(path.dirname(out), { recursive: true });
  await fs.writeFile(out, rows.join("\n") + "\n", "utf8");
  console.error(`Wrote ${mdPaths.length} rows (+ header) → ${out}`);
  console.error(`Import: LINEAR_API_KEY=… pnpm dlx @linear/import --importer linearCsv --team SAN --project mdeai`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
