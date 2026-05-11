---
title: Forensic Audit Report — Mastra PR queue & release gate
audited: 2026-05-10
repo: amo-tech-ai/mdeai (local /home/sk/mde)
sources:
  - tasks/prompts/mastra/tasks/mastra-prd.md (referenced)
  - tasks/prompts/mastra/tasks/mastra-roadmap.md (referenced)
  - tasks/prompts/mastra/tasks/000-index.md (referenced)
  - CLAUDE.md
  - Live: gh pr view / gh run view / npm scripts
verification_note: Open PRs and GitHub check rollups verified via gh CLI on 2026-05-10.
---

# Forensic Audit Report

## 1. Executive Verdict

| Metric | Value |
| --- | ---: |
| **Overall percent correct** (plan + deps + live GH facts) | **~73%** |
| **Merge readiness percent** (share of open PRs actually mergable + green merge gate) | **~25%** (1/5 PRs `MERGEABLE`; local/working tree not a clean ship surface) |
| **PRD alignment percent** (Mastra as runtime, Supabase SoT, Phase 1 gate discipline) | **~84%** (architecture matches; landlord mega-PRs conflict product Phase 1 sequencing) |
| **Risk level** | **Medium–high** until #7/#8/#11/#14 are rebased; **low** for isolated **#21** codepaths if merged with post-merge verification |
| **One-line verdict** | **Only PR #21 is merge-ready on GitHub; all other open PRs are `CONFLICTING`; #7/#8 add failing checks; local `npm run smoke:runtime` failed once with Mastra build `ENOTEMPTY` — treat as gate noise until reproduced clean.** |

---

## 2. PR Status Matrix

| PR | Current state | Checks | Blockers | Merge risk | Verdict | Exact next action |
| --- | --- | --- | --- | --- | --- | --- |
| **#21** | `MERGEABLE`, `mergeStateStatus: CLEAN`, branch `claude/mastra-pr2-mde-primitives`, **not draft** | Vercel **SUCCESS**; CodeRabbit **SUCCESS**; Supabase Preview **SKIPPED** (not a DB proof) | SKIPPED ≠ pass; no automated DB migration proof on this PR | Low for Mastra-only scope | **Merge candidate** after maintainer spot-check (secrets, mock-only data) | Merge after optional `git diff` review of `my-mastra-app/**`; then run full floor on **main**: `npm run lint && npm run build && npm run test` |
| **#11** | `CONFLICTING`, `mergeStateStatus: DIRTY`, **isDraft: true** | Vercel **SUCCESS**; Supabase Preview **SKIPPED** | Must resolve conflicts with `main`; draft | High until rebase | **Do not merge** | Rebase `vercel/install-vercel-web-analytics-jtuzx6` onto `main`, resolve `App.tsx` / lockfile conflicts, undraft, confirm single `<Analytics />` and no duplicate analytics providers |
| **#8** | `CONFLICTING`, `mergeStateStatus: DIRTY` | CodeRabbit **SUCCESS**; Vercel **SUCCESS**; **Supabase Preview FAILURE** | Merge conflicts + failing Supabase Preview | **Critical** | **Do not merge** | Rebase; open Supabase integration dashboard from check `detailsUrl`; fix preview project/migrations; reduce scope (split PRs) |
| **#7** | `CONFLICTING`, `mergeStateStatus: DIRTY` | Vercel **SUCCESS**; CodeRabbit **SUCCESS**; **Playwright (chromium) FAILURE**; **Supabase Preview FAILURE** | Conflicts; CI failures; huge diff | **Critical** | **Do not merge** | Rebase; fix **GitHub Actions billing** (job never started — see §3); fix Supabase preview; split into reviewable PRs |
| **#14** | `CONFLICTING`, `mergeStateStatus: DIRTY` | Vercel **SUCCESS**; CodeRabbit **SUCCESS**; Supabase Preview **SKIPPED** | Conflicts with `main` | Medium (docs-only intent) | **Do not merge until rebased** | Rebase `docs/2026-05-08-strip-shopify` onto `main`, resolve conflicts, re-run CI |

**Scale (#7 / #8):** `gh api repos/amo-tech-ai/mdeai/pulls/7` → **308** files, **+61,380** / **−233** lines. PR **8** → **700** files, **+128,930** / **−292** lines. Both are **unreviewable at merge** without split + rebase.

---

## 3. Critical Blockers (P0)

1. **Four of five open PRs are `CONFLICTING` with `main`** (#7, #8, #11, #14) — **not merge-ready** regardless of other green checks.
2. **PR #8 — Supabase Preview `FAILURE`** (`detailsUrl` points at Supabase dashboard for project `uutyatioppbugptlvafw`) — migration or integration mismatch; **not shippable** until preview applies cleanly.
3. **PR #7 — Supabase Preview `FAILURE`** (project `moblancfvvinnluiesuo`) + **Playwright** reported **FAILURE** — but `gh run view 25240769698` shows: *“The job was not started because your account is locked due to a billing issue.”* So the **Playwright red X is org billing**, not a test assertion failure; **still a CI blocker** until Actions can run.
4. **Local/working tree is not a release surrogate** — `/home/sk/mde` has extensive **modified and untracked** files; **gate on CI + clean branch**, not only local commands.

---

## 4. Red Flags / Failure Points (P1/P2)

| Flag | Detail |
| --- | --- |
| **Supabase Preview SKIPPED on #21 and #11** | Document as **not run to success** — do not treat as database integration verified. |
| **PR #7 / #8 size** | CodeRabbit likely skips or shallow-reviews; **merge risk** and **rollback risk** are extreme. |
| **Phase 1 product gate (CLAUDE.md)** | Landlord + bundled work does **not** unblock the five Phase 1 QA gates (E2E, load, Lighthouse, etc.); **roadmap priority** vs open PRs is misaligned if goal is “ship Phase 1”. |
| **Root `npm run lint` exit 1** | Local run: **`LINT_EXIT:1`** — large number of `@typescript-eslint/no-explicit-any`, missing ESLint plugin definitions in generated/large paths, etc. Treat as **pre-existing / config debt** unless a PR touches those files. |
| **Root `typecheck` script** | **`package.json` has no `npm run typecheck`** — `|| true` would hide absence; use `npx tsc --noEmit` when needed until scripted. |
| **`npm run smoke:runtime` (my-mastra-app)** | Failed with **`npm error ENOTEMPTY`** during `mastra build` under `.mastra/output/node_modules` — **intermittent/npm race**; **`npm run build` alone succeeded** before smoke. Mitigation: `rm -rf .mastra/output` before smoke, or run smoke on CI/clean tree. |
| **`npm run health` (my-mastra-app)** | **Exit 0** — `{"ok":true,"storage":"postgres",...}` (Storage layer reachable with current env). |

---

## 5. Commands & Dependency Audit

| Command / dependency | Correct? | Evidence | Fix |
| --- | :---: | --- | --- |
| Root `npm run build` | **Yes** | **Success** (~4.3s); artifacts built | — |
| Root `npm run test` | **Yes** | **41 passed** | — |
| Root `npm run typecheck` | **N/A** | No script in `package.json` | Add script or document `npx tsc --noEmit` |
| Root `npm run lint` | **Fails** | **`LINT_EXIT:1`** (many ESLint errors) | Fix scope or eslint config; do not blame Mastra PR unless it touches same paths |
| `my-mastra-app` `npm run build` | **Yes** | Mastra CLI: build successful | — |
| `my-mastra-app` `npm run typecheck` | **Yes** | `tsc --noEmit` clean | — |
| `my-mastra-app` `npm run test` | **No script** | `npm error ... no test specified` (exit 1) | Add tests or remove script expectation from gate |
| `my-mastra-app` `npm run smoke:runtime` | **Failed (this run)** | **`ENOTEMPTY`** in `.mastra/output/node_modules/...` | Clean output dir; re-run; add to smoke docs |
| `my-mastra-app` `npm run health` | **Yes** | JSON ok + storage postgres | — |

---

## 6. PRD Alignment

| Goal | Supported? | Gap | Fix |
| --- | :---: | --- | --- |
| Chat-first architecture | **Yes** | Mastra tasks + #21 move runtime toward typed agents/workflows | Wire Supabase tools after mock phase; keep edge functions until cutover |
| Mastra as AI backend, not SoT | **Yes** (#21 desc: mock data) | Production data still Supabase | MASTRA-001 inventory refresh post-merge |
| Supabase as source of truth | **Yes** | Preview failures on #7/#8 undermine trust | Fix preview + migrations on rebased branches |
| Phase 1 Events gate | **Partial** | Open PRs (#7/#8) do not close Camila/Roberto/load/Lighthouse | Execute PRD QA gates on `main` |
| Safe tool execution / audit path | **Planned** | Governance tables still task-level | Land migrations + Mastra audit tasks before prod traffic |
| Testable production readiness | **Partial** | Actions billing blocks e2e; lint red on root | Restore GA billing or move e2e to passing runner |

---

## 7. Best-Practice Improvements

- **Single “merge hygiene” score** in written audits (avoid duplicating §1 vs §11 percent for the same dimension).
- **MCP `listMastraPackages` vs full `node_modules/@mastra/*`** — use MCP for packages with embedded docs; for `@mastra/pg`, `@mastra/observability`, etc., verify via **`getMastraExports` / `dist` source** when docs are absent.
- **Embedded docs are necessary but not sufficient** — combine with runtime smoke and typecheck.
- **PR bodies must match diff size** — split mega-PRs; enforce path filters for CodeRabbit.
- **After #21 merge:** refresh **MASTRA-001** / source inventory to match **10+** `@mastra/*` packages on disk.

---

## 8. Final Recommendation

### MERGE NOW

- **PR #21** — **Reason:** Only PR with `mergeable: MERGEABLE` and `mergeStateStatus: CLEAN`; Vercel + CodeRabbit green; scope isolated to `my-mastra-app/`; commit messages state **mock** rental/event data (no Supabase wire). **Caveat:** Supabase Preview **SKIPPED** — not a database gate; run project floor on **`main` after merge**.

### DO NOT MERGE

- **PR #11** — Draft + **CONFLICTING**.
- **PR #7** — **CONFLICTING** + **Supabase Preview FAILURE** + **Playwright blocked by GitHub billing** (not a green e2e signal).
- **PR #8** — **CONFLICTING** + **Supabase Preview FAILURE** + excessive scope.
- **PR #14** — **CONFLICTING** (docs worth landing **after** rebase).

### FIX FIRST

- Rebase **#7, #8, #11, #14** onto current **`main`** and resolve conflicts.
- **GitHub Actions:** resolve **account billing lock** so `e2e` can start (PR #7 Playwright).
- **Supabase:** use failed Preview check `detailsUrl` for **#7** and **#8** to fix integration/migrations.
- **Local smoke:** `rm -rf my-mastra-app/.mastra/output && cd my-mastra-app && npm run smoke:runtime` (or document CI-only smoke).

### NEXT COMMANDS

```bash
cd /home/sk/mde && gh pr list --state open
cd /home/sk/mde && gh pr view 21 --json mergeable,mergeStateStatus,statusCheckRollup
cd /home/sk/mde && npm run lint && npm run build && npm run test
cd /home/sk/mde/my-mastra-app && rm -rf .mastra/output && npm run smoke:runtime
cd /home/sk/mde && gh run view 25240769698   # PR #7 — confirm billing annotation
```

---

*Re-run this report after: merges to `main`, rebases of #7/#8/#11/#14, Supabase integration changes, or edits to `mastra-smoke.sh` / Mastra CLI version.*
