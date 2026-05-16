#!/usr/bin/env -S npx tsx
/**
 * 25V JWT audit gate — fails CI if any edge function has verify_jwt=false
 * without a documented justification in tasks/audit/25V-edge-fn-jwt-decision.csv.
 *
 * Usage: npx tsx scripts/audit-edge-fn-jwt.ts
 * Exit 0 = all functions documented. Exit 1 = undocumented function(s) found.
 */

import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");

// ── Parse config.toml ────────────────────────────────────────────────────────

const toml = readFileSync(resolve(root, "supabase/config.toml"), "utf-8");

type FnEntry = { name: string; verifyJwt: boolean };

function parseConfigToml(src: string): FnEntry[] {
  const entries: FnEntry[] = [];
  const lines = src.split("\n");
  let current: string | null = null;
  let verifyJwt = true; // Supabase default is true

  for (const raw of lines) {
    const line = raw.trim();

    const sectionMatch = line.match(/^\[functions\.(.+?)\]$/);
    if (sectionMatch) {
      if (current !== null) entries.push({ name: current, verifyJwt });
      current = sectionMatch[1];
      verifyJwt = true; // reset to Supabase default
      continue;
    }

    if (current !== null && line.startsWith("verify_jwt")) {
      verifyJwt = !line.includes("false");
    }
  }

  if (current !== null) entries.push({ name: current, verifyJwt });
  return entries;
}

// ── Parse CSV ─────────────────────────────────────────────────────────────────

function parseCsvApproved(src: string): Set<string> {
  const lines = src.trim().split("\n").slice(1); // skip header
  const approved = new Set<string>();
  for (const line of lines) {
    const name = line.split(",")[0].trim();
    if (name) approved.add(name);
  }
  return approved;
}

// ── Main ─────────────────────────────────────────────────────────────────────

const csvPath = resolve(root, "tasks/audit/25V-edge-fn-jwt-decision.csv");
const functions = parseConfigToml(toml);
const approved = parseCsvApproved(readFileSync(csvPath, "utf-8"));

const falseJwt = functions.filter((f) => !f.verifyJwt);
const undocumented = falseJwt.filter((f) => !approved.has(f.name));

console.log(`\n25V JWT Audit Gate`);
console.log(`──────────────────`);
console.log(`Total functions in config.toml : ${functions.length}`);
console.log(`Functions with verify_jwt=false: ${falseJwt.length}`);
console.log(`Documented in CSV              : ${falseJwt.length - undocumented.length}`);
console.log(`Missing from CSV               : ${undocumented.length}`);

if (undocumented.length > 0) {
  console.error(`\n❌ FAIL — Undocumented verify_jwt=false functions:`);
  for (const fn of undocumented) {
    console.error(`   - ${fn.name}`);
  }
  console.error(
    `\nAdd an entry for each to tasks/audit/25V-edge-fn-jwt-decision.csv` +
    ` with auth_mechanism and justification before deploying.\n`,
  );
  process.exit(1);
}

console.log(`\n✅ PASS — All verify_jwt=false functions are documented.\n`);
