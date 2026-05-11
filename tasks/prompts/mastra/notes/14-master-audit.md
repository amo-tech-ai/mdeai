---
title: Master forensic audit — Mastra task plan, skills compliance, PR queue
audited: 2026-05-10
auditor: senior software specialist / forensic auditor
sources_verified:
  - .claude/skills/mastra/SKILL.md
  - .claude/skills/mastra-smoke-test/SKILL.md
  - tasks/prompts/mastra/notes/10-praudit..md
  - tasks/prompts/mastra/notes/11-mastra-pr-report.md
  - tasks/prompts/mastra/notes/13-audit-report.md
  - Mastra MCP (listMastraPackages, searchMastraDocs)
  - Live `gh pr view` (2026-05-10)
  - my-mastra-app/package.json
supersedes: extends 11 + 13 with skill-discipline scoring and PR-merge gating
legend: 🟢 green = ready/aligned · 🟡 yellow = needs follow-up · 🔴 red = blocker
---

# Forensic Audit Report — Master roll-up

## 1. Executive verdict

| Metric | Value | Dot |
|---|---:|:---:|
| **Overall percent correct** (plan + deps + live GH + skill compliance) | **~72%** | 🟡 |
| **Merge readiness** (open PRs that can ship today) | **~20%** (1/5) | 🔴 |
| **PRD alignment** (Mastra=runtime, Supabase=SoT, phase gates) | **~84%** | 🟢 |
| **Skill compliance** (`mastra` + `mastra-smoke-test`) | **~70%** | 🟡 |
| **Task plan will succeed if followed?** | **Directionally yes**, calendar uncertain | 🟡 |
| **Tasks achieve PRD goals?** | **Yes** if foundations (003/012/018/021) ship before vertical agents | 🟢 |

**One-liner:** Plan is sound, **#21 is the only mergeable PR**, the other four (#7/#8/#11/#14) are `CONFLICTING`; skill discipline is partially encoded but not yet enforceable in CI.

---

## 2. PR queue — live state (2026-05-10)

| PR | Title | Mergeable | Checks | Dot | Action |
|---|---|---|---|:---:|---|
| **#21** | mastra primitives | **MERGEABLE / CLEAN** | Vercel ✓ · Supabase Preview **SKIPPED** | 🟢 | **Merge** after CodeRabbit fixes (see §6) |
| **#14** | strip Shopify/Gadget docs | CONFLICTING / DIRTY | Vercel ✓ · Supabase **SKIPPED** | 🟡 | Rebase on `main`, then merge |
| **#11** | Vercel Web Analytics (draft) | CONFLICTING / DIRTY | Vercel ✓ · Supabase **SKIPPED** | 🔴 | Rebase + undraft |
| **#8** | landlord launch blockers | CONFLICTING / DIRTY | Vercel ✓ · Supabase Preview **FAILURE** | 🔴 | **Close**: 700 files / +128 K LOC / scope mismatch |
| **#7** | landlord V1 D5–D14 | CONFLICTING / DIRTY | Vercel ✓ · Playwright **FAILURE** · Supabase Preview **FAILURE** | 🔴 | Split into 4 sub-PRs; fix CI billing |

**Scale red flags:** PR #7 = 308 files / +61,380 LOC, 39 commits across D5→D14. PR #8 = 700 files / +128,930 LOC, body claims "7 P0–P2 bugs" but ships contests + events + sponsors (out-of-phase per CLAUDE.md Phase 1 gate).

---

## 3. Mastra skill compliance

### `.claude/skills/mastra/SKILL.md`

| Rule | Compliance | Dot | Evidence / gap |
|---|---|:---:|---|
| ES2022 modules in tsconfig | Verified | 🟢 | `my-mastra-app` uses `"type":"module"`, Node ≥22.13 |
| Models as `provider/model-name` | Followed | 🟢 | `google/gemini-3.1-flash-lite`, `openai/gpt-5.5`, `google/gemini-2.5-flash-lite` |
| Run `provider-registry.mjs` before model strings | **Not wired** | 🔴 | Task pack hard-codes model IDs; no verify step. CodeRabbit flagged `google/gemini-2.5-flash-lite` as **possibly unsupported** (PR #21 finding) |
| Embedded docs first (`node_modules/@mastra/*/dist/docs`) | Partial | 🟡 | MCP `listMastraPackages` returns **6 of 10** installed packages; `pg`, `observability`, `libsql`, `duckdb`, `editor`, `client-js` lack embedded prose docs |
| Studio at `localhost:4111` | Conditional | 🟡 | CLI auto-falls-back to 4112 when busy; runbooks must use printed port, not fixed |
| Don't trust memory — verify current docs | Partial | 🟡 | Task prompts not yet pinning Mastra version per milestone |

### `.claude/skills/mastra-smoke-test/SKILL.md` — 11-step matrix

| # | Test | mdeAI today | Dot |
|---|---|---|:---:|
| 1 | Setup | `mastra-smoke.sh` covers env + dev + ports | 🟢 |
| 2 | Agents | API probes for ping/router/concierge | 🟢 |
| 3 | Tools | Indirect via agents | 🟡 |
| 4 | Workflows | weather + rental-search + event-discovery | 🟢 |
| 5 | Traces / observability | Not in smoke | 🔴 |
| 6 | Scorers | CodeRabbit found scorer references wrong tool id (`weatherTool` vs `get-weather`) | 🔴 |
| 7 | Memory | Concierge multi-turn covered | 🟢 |
| 8 | MCP | Not probed | 🟡 |
| 9 | Errors | No negative test | 🔴 |
| 10 | Studio (browser) | curl-only; skill mandates **API + browser** | 🔴 |
| 11 | Server deploy | Out of scope (cloud) | 🟢 |

**Skill score: 7/11 green or yellow, 4 red → ~64% smoke parity.**

---

## 4. Critical blockers (P0)

1. **PR #21 CodeRabbit findings unfixed** before merge:
   - 🔴 hardcoded `/home/sk/mde/my-mastra-app` in `.claude/launch.json` (portability)
   - 🔴 invalid model id `google/gemini-2.5-flash-lite` in `agents/evaluation.ts`
   - 🔴 scorer expects `weatherTool` but tool id is `get-weather`
   - 🟠 smoke script requires `DATABASE_URL` before local DB fallback
   - 🟠 workflow smoke can pass on unexpected failure
2. **PRs #7/#8 fail Supabase Preview** — migration set not applying cleanly. `detailsUrl` on each check points to Supabase project dashboard.
3. **PR #7 Playwright FAILURE** — 5 s job kill = setup error (likely GitHub Actions billing lock per prior audit `gh run view 25240769698`); not a real test signal.
4. **Four PRs CONFLICTING** with `main` — none mergeable without rebase.
5. **`my-mastra-app` `npm test` is a placeholder** that exits 1 — not a real gate.
6. **`000-index.md` source paths point to `/tasks/mastra/`** but canonical lives at `tasks/prompts/mastra/tasks/`.

---

## 5. Red flags (P1/P2)

| Flag | Severity | Detail |
|---|:---:|---|
| Phase-gate violation in #8 | P1 | Ships contest voting (Phase 2) before Phase 1 events gate; CLAUDE.md prohibits |
| MCP doc coverage gap | P1 | `@mastra/pg`, `observability`, `libsql` lack embedded prose docs — fall back to `getMastraExports` + `dist` |
| `searchMastraDocs("workflow agent registration")` returns nothing | P2 | Embedded docs are sparse; rule "verify in embedded docs" needs softening to "verify via exports + source" |
| Roadmap path drift | P2 | `apps/mastra` in roadmap vs `my-mastra-app/` on disk |
| Score duplication in `10-praudit..md` | P2 | §1 (72%) and §11 (62%) describe same dimension with different weights |
| Local working tree dirty | P2 | Parent `/home/sk/mde` has many `??` files; gate on CI not local |
| Root `npm run lint` exit 1 | P2 | Pre-existing config debt, not Mastra-caused |

---

## 6. Commands & dependencies

| Item | Correct? | Dot | Evidence |
|---|---|:---:|---|
| `cd my-mastra-app && npm run build` | Yes | 🟢 | Mastra CLI builds clean |
| `npm run typecheck` (mastra) | Yes | 🟢 | `tsc --noEmit` clean |
| `npm run smoke:runtime` | Conditional | 🟡 | Passes on clean tree; `ENOTEMPTY` on dirty `.mastra/output` |
| `npm run health` | Yes | 🟢 | Returns `{ok:true, storage:"postgres"}` |
| `npm test` (mastra) | **Placeholder** | 🔴 | `echo "Error: no test specified" && exit 1` |
| Root `npm run build` / `test` | Yes | 🟢 | 41/41 tests pass; build ~4 s |
| Root `npm run lint` | Fails | 🔴 | Pre-existing eslint debt |
| Root `npm run typecheck` | **Missing script** | 🟡 | Use `npx tsc --noEmit` |
| Implementation order 001→002→022→024→023→003→012→… | Yes | 🟢 | Foundations before verticals — sound |
| Node engine ≥22.13 | Yes | 🟢 | `.nvmrc` = 22 |
| `provider-registry.mjs` verify before model IDs | **Not wired** | 🔴 | Skill mandate skipped |

---

## 7. PRD alignment

| PRD goal | Supported? | Dot | Gap |
|---|---|:---:|---|
| Chat-first AI concierge | Yes | 🟢 | Router → concierge → workflows wired in #21 |
| Mastra = AI runtime, Supabase = SoT | Yes | 🟢 | #21 uses mock data only; no rogue DB writes |
| Rentals-first wedge | Yes | 🟢 | rental-search-workflow + rerank in #21 |
| Phase 1 Events ticketing gate | **No advance** | 🔴 | None of #7/#8/#11/#14/#21 closes the 5 PRD-listed gates (Camila E2E, Roberto E2E, scanner revoke, load test, Lighthouse a11y ≥90) |
| Safe tool execution / audit trail | Planned | 🟡 | Governance tables 003/012/018 still task-level, not migrated |
| Testable production readiness | Partial | 🟡 | GA billing blocks e2e; lint red on root |

---

## 8. Will the plan succeed?

**Yes if** these things land in this order:

1. Fix CodeRabbit findings on #21 → merge.
2. Refresh MASTRA-001 inventory with real 10-package list post-merge.
3. Fix `000-index.md` paths to `tasks/prompts/mastra/tasks/`.
4. Land governance migrations (003/012/018) before scaling tools.
5. Reconcile local↔remote DB parity (MASTRA-021) before claiming "tests green = prod safe".
6. Add browser Studio probe to smoke for release-grade gate (skill rule).
7. Rebase or close #7/#8/#11/#14 — none ship as-is.
8. Restore GitHub Actions billing so Playwright runs.

**Will not succeed if** the team merges either #7 or #8 by `--admin` override (Supabase Preview FAILURE = migrations break prod).

---

## 9. Best-practice improvements (prioritized)

1. **Stack a fix PR on #21's branch** for the 9 CodeRabbit findings (8–10 file PR), merge clean.
2. **Add `provider-registry.mjs` verify** to `MASTRA-022` smoke evidence — encodes skill mandate.
3. **Replace `npm test` placeholder** in `my-mastra-app` with a minimal Vitest run.
4. **Add browser Studio probe** to `mastra-smoke.sh` for release gate (or document waiver).
5. **Fix path drift** — `000-index.md` paths + `apps/mastra` → `my-mastra-app/`.
6. **Pin Mastra core version** in task prompts that name APIs.
7. **Pin dashboard to commit SHA**, not PR number, for "verified runtime" rows.
8. **Close PR #8** — body says "7 bugs" but ships 700 files. Re-file as 7 small PRs.
9. **Split PR #7** into 4 sub-PRs (D5+D6, D7+D9+RLS, D10+WhatsApp, D12+E2E).

---

## 10. Final recommendation

### MERGE NOW
- **None.** Even #21 should merge **after** the 9 CodeRabbit fixes are stacked.

### MERGE NEXT (after fix-stack)
- **PR #21** + fix-stack → clean Mastra runtime baseline.
- **PR #14** after rebase → strips Shopify, aligns docs with PRD.

### DO NOT MERGE
- **PR #7** — split required.
- **PR #8** — close + re-file as small bug-PRs.
- **PR #11** — rebase + undraft.

### NEXT COMMANDS

```bash
# 1. Stack fix PR on #21's head
cd /home/sk/mde
git fetch origin claude/mastra-pr2-mde-primitives
git checkout -b fix/mastra-pr21-coderabbit-findings origin/claude/mastra-pr2-mde-primitives

# 2. Apply 9 fixes to: launch.json, .gitignore, mastra-smoke.sh, agents/ping.ts,
#    agents/evaluation.ts (model id), mastra/index.ts (DuckDB import), 
#    scorers/weather-scorer.ts, weather fetch error handling

# 3. Verify
cd my-mastra-app
rm -rf .mastra/output
npm run typecheck && npm run build && npm run smoke:runtime

# 4. Push, open PR targeting claude/mastra-pr2-mde-primitives (stacked)
gh pr create --base claude/mastra-pr2-mde-primitives --title "fix(mastra): CodeRabbit findings on #21"
```

---

## 11. Composite score table

| Layer | % | Dot |
|---|---:|:---:|
| Architecture & sequencing | 89 | 🟢 |
| PRD alignment | 84 | 🟢 |
| Dependency graph | 90 | 🟢 |
| Skill compliance (mastra) | 70 | 🟡 |
| Smoke parity (mastra-smoke-test) | 64 | 🟡 |
| Doc ↔ code truth (paths, inventory) | 58 | 🟡 |
| Merge hygiene (open PR queue) | 20 | 🔴 |
| **Weighted composite** | **~72%** | 🟡 |

**Path to 88%+:** fix-stack on #21, refresh MASTRA-001, fix index paths, browser smoke, rebase/close #7/#8/#11, restore GA billing.

---

*Re-run after: PR #21 + fix-stack merge, MASTRA-001 refresh, any migration adding governance tables, GA billing restored, or `mastra-smoke.sh` browser probe added.*
