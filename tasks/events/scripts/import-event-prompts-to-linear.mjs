#!/usr/bin/env node
/**
 * Non-interactive import of tasks/events/prompts/*.md into Linear via GraphQL.
 * Reads LINEAR_API_KEY from env or repo-root .env.local (never prints the key).
 *
 * Usage:
 *   node tasks/events/scripts/import-event-prompts-to-linear.mjs [--team SAN] [--project mdeai] [--dry-run] [--include-archive]
 */

import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROMPTS_ROOT = path.resolve(__dirname, "../prompts");
const REPO_ROOT = path.resolve(__dirname, "../../..");

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function linearGql(apiKey, query, variables) {
  const res = await fetch("https://api.linear.app/graphql", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: apiKey,
    },
    body: JSON.stringify({ query, variables }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${JSON.stringify(json)}`);
  if (json.errors?.length) throw new Error(json.errors.map((e) => e.message).join("; "));
  return json.data;
}

async function loadLinearApiKey() {
  const fromEnv = process.env.LINEAR_API_KEY?.trim();
  if (fromEnv) return fromEnv.replace(/^["']|["']$/g, "");
  try {
    const raw = await fs.readFile(path.join(REPO_ROOT, ".env.local"), "utf8");
    const m = raw.match(/^LINEAR_API_KEY=(.+)$/m);
    if (!m) return "";
    return m[1].trim().replace(/^["']|["']$/g, "");
  } catch {
    return "";
  }
}

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

function mapPriorityInt(p) {
  const x = (p || "").toUpperCase();
  if (x === "P0") return 2;
  if (x === "P1") return 3;
  if (x === "P2") return 4;
  return 3;
}

function mapStatusCategory(s) {
  const x = (s || "").trim().toLowerCase();
  if (x === "done" || x === "closed") return "completed";
  if (x === "in progress" || x === "started") return "started";
  return "backlog";
}

function parseEstimate(effort) {
  if (!effort) return undefined;
  const n = Number.parseFloat(String(effort).replace(/[^\d.]/g, ""));
  if (!Number.isFinite(n)) return undefined;
  return Math.max(1, Math.round(n));
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

function parseArgs(argv) {
  let teamKey = "SAN";
  let projectQuery = "mdeai";
  let dryRun = false;
  let includeArchive = false;
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--dry-run") dryRun = true;
    else if (a === "--include-archive") includeArchive = true;
    else if (a === "--team") teamKey = argv[++i] ?? teamKey;
    else if (a === "--project") projectQuery = argv[++i] ?? projectQuery;
    else if (a === "--help" || a === "-h") {
      console.error(
        `Usage: import-event-prompts-to-linear.mjs [--team SAN] [--project mdeai] [--dry-run] [--include-archive]\n`,
      );
      process.exit(0);
    }
  }
  return { teamKey, projectQuery, dryRun, includeArchive };
}

async function resolveTeamProjectStates(apiKey, teamKey, projectQuery) {
  const teamsData = await linearGql(
    apiKey,
    `query Teams { teams(first: 250) { nodes { id key name } } }`,
    {},
  );
  const team = teamsData.teams.nodes.find((t) => t.key?.toLowerCase() === teamKey.toLowerCase());
  if (!team) {
    const keys = teamsData.teams.nodes.map((t) => t.key).join(", ");
    throw new Error(`Team "${teamKey}" not found. Available keys: ${keys}`);
  }

  const teamDetail = await linearGql(
    apiKey,
    `query TeamDetail($id: String!) {
      team(id: $id) {
        id
        projects(first: 100) { nodes { id name slugId } }
        states {
          nodes { id name type }
        }
      }
    }`,
    { id: team.id },
  );

  const projects = teamDetail.team.projects.nodes;
  const pq = projectQuery.toLowerCase();
  const project =
    projects.find((p) => p.id === projectQuery) ||
    projects.find((p) => (p.slugId || "").toLowerCase().includes(pq)) ||
    projects.find((p) => (p.name || "").toLowerCase() === pq);

  if (!project) {
    const names = projects.map((p) => p.name).join(", ") || "(none)";
    throw new Error(`Project "${projectQuery}" not found on team ${teamKey}. Projects: ${names}`);
  }

  const states = teamDetail.team.states.nodes;
  const byType = (t) => states.filter((s) => s.type === t);

  return {
    teamId: team.id,
    projectId: project.id,
    stateIds: {
      backlog: byType("backlog")[0]?.id,
      started: byType("started")[0]?.id,
      completed: byType("completed")[0]?.id,
    },
    states,
  };
}

function pickStateId(category, stateIds) {
  if (category === "completed") return stateIds.completed ?? stateIds.backlog;
  if (category === "started") return stateIds.started ?? stateIds.backlog;
  return stateIds.backlog;
}

async function main() {
  const { teamKey, projectQuery, dryRun, includeArchive } = parseArgs(process.argv);
  const apiKey = await loadLinearApiKey();
  if (!apiKey) {
    console.error("Missing LINEAR_API_KEY (env or .env.local).");
    process.exit(1);
  }

  const ctx = await resolveTeamProjectStates(apiKey, teamKey, projectQuery);
  if (!ctx.stateIds.backlog) {
    throw new Error("Could not resolve a backlog workflow state for this team.");
  }

  const mdPaths = (await collectMarkdownFiles(PROMPTS_ROOT, { includeArchive })).sort((a, b) =>
    path.basename(a).localeCompare(path.basename(b), undefined, { numeric: true }),
  );

  console.error(`${dryRun ? "[dry-run]" : "Import"} ${mdPaths.length} prompts → team ${teamKey}, project ${projectQuery}`);

  let ok = 0;
  for (const abs of mdPaths) {
    const raw = await fs.readFile(abs, "utf8");
    const { fmText, body } = extractScalarFrontmatter(raw);
    const rel = path.relative(REPO_ROOT, abs).replace(/\\/g, "/");

    const taskId = fmPick(fmText, "task_id");
    const titleBase = fmPick(fmText, "title");
    const priority = fmPick(fmText, "priority");
    const status = fmPick(fmText, "status");
    const effort = fmPick(fmText, "estimated_effort");

    const num = path.basename(abs).slice(0, 3);
    const title = titleBase ? `[${num}] ${titleBase}` : `[${num}] ${path.basename(abs, ".md")}`;
    const description = [
      `**Source file:** \`${rel}\`${taskId ? ` · \`${taskId}\`` : ""}`,
      "",
      "---",
      "",
      body.trim(),
    ].join("\n");

    const category = mapStatusCategory(status || "Open");
    const stateId = pickStateId(category, ctx.stateIds);
    const estimate = parseEstimate(effort);

    const input = {
      teamId: ctx.teamId,
      projectId: ctx.projectId,
      title,
      description,
      priority: mapPriorityInt(priority),
      stateId,
    };
    if (estimate !== undefined) input.estimate = estimate;

    if (dryRun) {
      console.error(`would create: ${title.slice(0, 72)}…`);
      ok++;
      continue;
    }

    const data = await linearGql(
      apiKey,
      `mutation IssueCreate($input: IssueCreateInput!) {
        issueCreate(input: $input) {
          success
          issue { identifier url }
        }
      }`,
      { input },
    );

    const ic = data.issueCreate;
    if (!ic?.success || !ic.issue) throw new Error(`Failed: ${title}`);
    console.error(`${ic.issue.identifier} ${ic.issue.url}`);
    ok++;
    await sleep(180);
  }

  console.error(`Done: ${ok}/${mdPaths.length}`);
}

main().catch((e) => {
  console.error(e.message || e);
  process.exit(1);
});
