---
title: Audit summary — Mastra skills, MCP docs, task plan, PR queue
date: 2026-05-10
sources:
  - .claude/skills/mastra/SKILL.md
  - .claude/skills/mastra-smoke-test/SKILL.md
  - tasks/prompts/mastra/tasks/000-index.md
  - Mastra MCP (user-mastra): listMastraPackages, readMastraDocs, searchMastraDocs
  - my-mastra-app/package.json
---

# Forensic audit (condensed)

## Percent correct (rolled up)

| Dimension | % | Notes |
| --- | ---: | --- |
| **Task sequencing vs architecture** (Mastra runtime, Supabase SoT, gateways) | **~88%** | `000-index.md` dependency order is sound (022→024→003→012… before verticals). |
| **Doc truth** (inventory / paths / stale vs repo) | **~58%** | Index “source plans” paths point at **`/tasks/mastra/*.md`** — **wrong**; canonical lives under **`tasks/prompts/mastra/tasks/`**. MASTRA-001 must be refreshed after Mastra PR land. |
| **Skill compliance** (embedded docs + smoke matrix) | **~72%** | Repo follows **curl/script-first** smoke; official skill wants **API + browser Studio** for release-grade local smoke. Mastra skill “verify every API” is **partly** met; MCP shows **gaps** for some packages (below). |
| **MCP / embedded docs coverage** | **~65%** | `listMastraPackages` → **6** packages with embedded docs; **`@mastra/pg`, `@mastra/client-js`, `@mastra/observability`, `@mastra/libsql`, `@mastra/duckdb`, `@mastra/editor`** installed but **not** in that list — **verify via `getMastraExports` + `dist` source**, not prose docs alone. |
| **Commands & scripts** | **~76%** | **`my-mastra-app`**: `build`, `typecheck`, `health`, `smoke:runtime` defined; **`test`** script is a **failing placeholder**. **Root**: no **`npm run typecheck`**; **`npm run lint`** **exit 1**. |
| **Merge / CI hygiene** (open PRs) | **~25%** | **1/5** PRs mergeable on GitHub; **#7/#8** conflicting + failing checks. |
| **Weighted composite (engineering + governance)** | **~71%** | Rises to **~86%** after: fix index paths, refresh MASTRA-001, green **lint** / optional root **typecheck**, **browser** smoke for releases, rebase landlord PRs + fix Supabase Preview + **GitHub Actions billing** for e2e. |

---

## Skill cross-check — `.claude/skills/mastra` (SKILL.md)

| Rule | Verdict | Risk / action |
| --- | --- | --- |
| **Do not trust memory — verify current docs** | **Partially enforced** | Task prompts must pin **installed** versions; use **`grep` / `readMastraDocs` / `searchMastraDocs` / `getMastraExports`**. |
| **Embedded docs first (`node_modules/@mastra/*/dist/docs`)** | **Gaps** | MCP **`listMastraPackages`** only lists **6** packages with embedded docs for this tree — **not** all installed `@mastra/*` deps. **Fallback:** source in `node_modules/@mastra/<pkg>/dist`. |
| **Remote docs** (`https://mastra.ai/llms.txt`) | **Valid fallback** | Use when local prose missing or exploring newer APIs; **may differ** from installed version — prefer match to **lockfile**. |
| **`scripts/provider-registry.mjs` before model slugs** | **Gap in task automation** | Mega-plan must **not** hard-code provider/model strings without a **verify** step per skill. |
| **`npm run dev` / Studio** | **Aligned** | `my-mastra-app` uses **`mastra dev`**; Studio port **not fixed** — use **CLI-printed port** (4111, 4112, …). |

### MCP verification (official local docs index)

- **`listMastraPackages`** (`projectPath=/home/sk/mde/my-mastra-app`): reports **6** packages **with embedded documentation** (`@mastra/core`, `@mastra/deployer`, `@mastra/evals`, `@mastra/loggers`, `@mastra/memory`, `@mastra/server`).
- **`searchMastraDocs`** query **`workflow`**: returns embedded **`@mastra/core`** references (e.g. `docs-workflows-overview.md`, `Workflow` class, suspend/resume, snapshots) — confirms **workflows** are first-class in shipped docs and task plan alignment with **MASTRA-012 / workflow** work is **directionally correct**.
- **`@mastra/pg`** / Postgres: **no** search hit for “Postgres storage configuration” in MCP search — **supports** the finding that **Postgres/storage must be verified from package exports + source**, not assumed from skimmed prose.

---

## Skill cross-check — `.claude/skills/mastra-smoke-test` (SKILL.md)

| Mandate | mdeAI today | Gap |
| --- | --- | --- |
| **11-step checklist** (setup → agents → tools → workflows → traces → scorers → memory → MCP → errors → studio/server deploy) | **`scripts/mastra-smoke.sh`** covers **setup + typecheck + build + dev + selective agent/workflow probes** | **Traces, scorers, MCP, errors** not systematically probed; **browser Studio** not required by script (**skill:** API + browser for local release smoke). |
| **Do not skip without blocker** | Bash smoke **can** pass end-to-end (`SMOKE_EXIT:0` observed) | **Intermittent** `ENOTEMPTY` under **`.mastra/output/`** — treat as **environment** issue; **`rm -rf .mastra/output`** before smoke if needed. |
| **Storage migration smoke** | Referenced in skill for provider changes | Must run when **PostgresStore** / pooler / schema changes (**MASTRA-003 / 012 / 021**). |

---

## P0 blockers (stop-the-line)

1. **Wrong canonical paths in `000-index.md` “Source plans”** — breaks copy-paste and automation; **must** reference `tasks/prompts/mastra/tasks/*.md`.
2. **`my-mastra-app` `npm test`** — exits **1** by design; **not** a real test gate. Replace with Vitest or drop from “green” narrative until added.
3. **Open PR queue** — **#7/#8/#11/#14** **`CONFLICTING`**; **#7** e2e red on **GitHub billing** (job not started); **#7/#8** Supabase Preview **FAILURE**. Not merge-safe.
4. **Root `npm run lint` — `LINT_EXIT:1`** — ship floor in **CLAUDE.md** includes **lint**; workspace must either fix or scope **ESLint** until green.

---

## P1 red flags / failure points

| Flag | Detail |
| --- | --- |
| **Supabase Preview SKIPPED** on Mastra PR | **Not** proof of DB migrations; document as skipped, not pass. |
| **Doc ↔ package drift** | Tasks referencing APIs **without** per-milestone `getMastraExports` check will rot (**skill warning**). |
| **Hybrid / VDB split-brain** | **MASTRA-004** depends on **MASTRA-021** + **VDB-01**; local ≠ remote search until reconciled — tests must encode **both** or mark prod-only. |
| **Governance tables** (audit / workflow / handoff) | Plan assumes migrations land **before** scaling tools — **MASTRA-003 / 012 / 018** remain critical path. |

---

## Commands & dependencies (plan vs repo)

| Item | Correct? | Evidence |
| --- | :---: | --- |
| Order **001→002→022→024→023→003→012→…** | **Yes** | Safer than rushing vertical agents before audit + workflow storage. |
| **`mastra build` / `mastra dev`** (`my-mastra-app`) | **Yes** | Aligns with packaged **Mastra CLI** + **ESM** (`"type": "module"`, Node **≥22.13**). |
| **`npm run smoke:runtime`** | **Cond. yes** | Passes when clean; **ENOTEMPTY** possible on dirty `.mastra/output`. |
| **Root `npm run test`** | **Yes** | **41** tests pass (current workspace). |
| **Root `npm run typecheck`** | **No script** | Add or document `npx tsc --noEmit`. |
| **`provider-registry.mjs`** in task steps | **Not wired** | Add explicit verify step for model IDs (**mastra skill**). |

---

## Will the task plan succeed if followed?

**Directionally yes** — sequencing matches PRD boundaries (Mastra orchestrates; Supabase holds data; no rogue Stripe/DB from agents). **Calendar and “done” claims are not guaranteed**: depends on **migration throughput**, **VDB-021**, **lint debt**, and **CI** (billing / Supabase Preview). **No** until index paths fixed and MASTRA-001 refreshed.

---

## Will tasks achieve PRD goals?

**Yes if** foundations ship before domain scale: **tool audit + workflow state + tenant isolation + rate limits + registry** before **RE/Events** verticals; **Mastra as AI backend, Supabase as SoT** preserved. **Gaps:** governance tables, **client SDK (019)**, **observability (011)**, **Paperclip bridge (020)** must land for “safe tool execution + audit path” narrative in **prd.md**.

---

## Recommended improvements (best practices)

1. **Single source of truth for task paths** — fix **`000-index.md`** → `tasks/prompts/mastra/tasks/`.
2. **Release smoke parity** — for **production gate**, add **browser Studio** pass on **printed port** (**mastra-smoke-test** skill) or document **explicit waiver**.
3. **MCP + exports discipline** — for packages **without** embedded docs in MCP list, run **`getMastraExports`** / read **`dist`** before implementing **storage, observability, pg**.
4. **Replace `npm test` placeholder** in **`my-mastra-app`** with minimal Vitest or remove from CI expectations.
5. **Pin model verification** — run **`provider-registry`** (per **mastra** skill) in **MASTRA-022** evidence or CI snippet.

---

## Feature / PR dots (GitHub)

| Item | Status | Note |
| --- | ---: | --- |
| **PR #21** Mastra primitives | 🟢 | `MERGEABLE` / `CLEAN`; Supabase Preview **SKIPPED** |
| **PR #14** CLAUDE.md cleanup | 🟡 | **CONFLICTING** |
| **PR #11** Vercel Analytics | 🔴 | **Draft** + **CONFLICTING** |
| **PR #8** landlord blockers | 🔴 | **CONFLICTING** + Supabase Preview **FAILURE** |
| **PR #7** landlord D5–D14 | 🔴 | **CONFLICTING** + Supabase **FAILURE** + e2e blocked (**billing**) |

---

## Errors observed (exact)

| Check | Result |
| --- | --- |
| `npm run typecheck` (repo root) | **No script** in root `package.json` |
| `npm run lint` (root) | **Exit 1** (`LINT_EXIT:1`) |
| `npm run smoke:runtime` / `mastra-smoke.sh` | **PASS** `SMOKE_EXIT:0` possible; **also** **`ENOTEMPTY`** on `.mastra/output/...` when output dir dirty |
| `gh run view 25240769698` (PR #7 e2e) | **Billing lockout** — job not started |

---

## Executive line

**~71%** composite today: **plan architecture is strong**, **execution hygiene is the bottleneck** (paths, lint, tests, PR conflicts, CI). Align task docs with **mastra** + **mastra-smoke-test** skills: **verify exports**, **don’t trust MCP package list as exhaustive**, **add browser smoke for release**, **fix index paths**, **refresh MASTRA-001**. Ship **#21** first on GitHub; **rebase/split** other PRs.
