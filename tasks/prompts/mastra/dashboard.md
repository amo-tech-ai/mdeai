---
title: Mastra Task Pack — Dashboard
status: Live
updated: 2026-05-10
scope: One-page status across the Mastra task pack. Pulls from each task's frontmatter `status`, [notes/06-checklist.md §C.1](./notes/06-checklist.md#c1-canonical-task-files) doc-quality scores, and verified runtime artifacts (PR #20 merged → main `8c00ddb`).
legend:
  green: 🟢 Complete + tested with shipped proof (archived)
  yellow: 🟡 Complete-but-evidence-stale OR In-Progress OR doc-quality ≥85% awaiting code
  red: 🔴 Not Started AND doc-quality <85%
---

# Mastra Dashboard

> **One source for "what's done, what's next."** Mirrors [notes/08-dashboard.md](./notes/08-dashboard.md), kept at the pack root for at-a-glance access.

Latest verified runtime: **2026-05-10 06:30 CDT** — `bash scripts/mastra-smoke.sh` on branch `claude/mastra-pr2-mde-primitives` (worktree `practical-carson-f17be4`), **5 consecutive runs PASS, 0 fail**:
- agent.generate (ping-agent) → HTTP 200
- workflow.start-async (weather-workflow) → `status=success`, steps `fetch-weather,plan-activities`
- agent.generate (router-agent, model `google/gemini-3.1-flash-lite`, with workflow dispatch + confidence threshold + follow-up preservation) → HTTP 200
- agent.generate (concierge-agent, with neighborhood/budget intelligence + ≤5 cards + empty-state recovery + best-for labels) → HTTP 200
- workflow.start-async (rental-search-workflow Laureles, with new `rerank-rentals` step) → `status=success`, **5 cards each with `rank` + `bestForLabel`**, `sourceUrl` + `scheduleViewingUrl`
- agent.generate (concierge multi-turn) → turn-2 "when can I view" **stayed in rental context** in 5/5 runs (no rentals-vs-events reset)
- workflow.start-async (event-discovery-workflow) → `status=success`, 1 card

New this iteration: router→workflow dispatch wired (`workflows: { rentalSearchWorkflow, eventDiscoveryWorkflow }` on routerAgent); `evaluationAgent` registered for future LLM-based reranking; deterministic `rerank-rentals` workflow step with preference scoring + dedup-aware "Best for" labels (10 label categories); event memory schema added to concierge (`lastEventQuery`, `lastEventResults`, `selectedEventId`); skill `mde-mastra-routing` published at `.claude/skills/mde-mastra-routing/SKILL.md`.

Parent repo `/home/sk/mde/my-mastra-app` ENETUNREACH: **resolved** by switching `DATABASE_URL` to the Session Pooler URL (`aws-1-us-east-1.pooler.supabase.com:6543`, IPv4) and adding `.nvmrc=22`. Remaining blocker on parent repo only: pooler returns *"Authentication credentials are invalid"* — user must refresh pooler password in Supabase dashboard → Project Settings → Database → Connection pooling. For TLS, either run dev with `NODE_TLS_REJECT_UNAUTHORIZED=0` (dev only) or set `NODE_OPTIONS=--use-openssl-ca` to use the system trust store.

Pending merge: PR #2 (`claude/mastra-pr2-mde-primitives`) carries the new agents/tools/workflows + concierge memory + storage fingerprint logger + router workflow dispatch + rerank step + evaluation agent + skill file.

---

## A. Composite at-a-glance

| Bucket | Count | IDs |
|---|---:|---|
| 🟢 Complete + archived | 1 | MASTRA-001 |
| 🟡 Complete (evidence-stale) | 1 | MASTRA-022 *(PR #20 shipped; `status_evidence` still names obsolete `smoke-runtime.mjs`)* |
| 🟡 In Progress (code on a branch, mock data, not merged) | 4 | MASTRA-002, **005**, **006**, **007** |
| 🟡 Doc-ready (≥90%) awaiting code | 7 | 008, 009, 010, 020, 021, 023, 024 *(024 partial — fingerprint logger landed on PR #2)* |
| 🟡 Doc-ready (85–89%) | 5 | 011, 015, 018, 019, 025 |
| 🔴 Doc-thin (<85%) | 7 | 003, 004, 012, 013, 014, 016, 017 |
| **Total active** | **24** | (001 archived) |

**Implementation completion: 1 / 25 = 4% green.** With In-Progress weighted at 0.5: 1 + 4×0.5 = **3 / 25 ≈ 12% effective**. Doc-quality mean: 88.6%.

---

## B. Per-task table

| Task | Feature | Agent(s) | Workflow(s) | Doc % | Status | Dot |
|---|---|---|---|---:|---|:-:|
| **MASTRA-001** *(archived)* | Source inventory + safety baseline | — | — | 96 | Complete | 🟢 |
| **MASTRA-002** | Core runtime scaffold (`my-mastra-app/`) | weatherAgent, pingAgent | weatherWorkflow | 98 | In Progress | 🟡 |
| **MASTRA-003** | Tool audit + control events table | (cross-cutting) | — | 92 | Not Started | 🔴 |
| **MASTRA-004** | Hybrid FTS + pgvector search tools | searchTool consumers | — | 86 | Not Started | 🔴 |
| **MASTRA-005** | Chat router + concierge MVP | routerAgent (`gemini-3.1-flash-lite`, dispatches workflows, confidence ≥0.6 threshold, follow-up preservation), conciergeAgent (thread-scoped Memory + neighborhood/budget intelligence + ≤5 cards + empty-state + best-for), evaluationAgent | rentalSearchWorkflow, eventDiscoveryWorkflow (router-dispatched) | 92 | In Progress *(5/5 stability runs PASS on `claude/mastra-pr2-mde-primitives`; mock data; not merged)* | 🟡 |
| **MASTRA-006** | Real-estate MVP agents | conciergeAgent (rental path) | rentalSearchWorkflow (search → format → **rerank** w/ preference scoring + 10 best-for label categories + dedup) | 86 | In Progress *(8 mock listings incl. 5 Laureles; rerank step proven via 5x smoke; rank + bestForLabel returned per card; no Supabase yet)* | 🟡 |
| **MASTRA-007** | Events MVP runtime | conciergeAgent (event path, with `lastEventQuery`/`lastEventResults`/`selectedEventId` memory) | eventDiscoveryWorkflow | 86 | In Progress *(5 mock events; concierge event memory mirrors rental memory; no tickets/payment yet)* | 🟡 |
| **MASTRA-008** | Restaurants MVP discovery | restaurantsAgent | reservationWorkflow | 96 | Not Started | 🟡 |
| **MASTRA-009** | UI dojo / chat frontend (reference patterns) | — *(frontend only)* | — | 97 | Not Started | 🟡 |
| **MASTRA-010** | Memory + RAG MVP | memoryAgent | ragIngestWorkflow | 95 | Not Started | 🟡 |
| **MASTRA-011** | Observability + evals + guardrails | (all agents) | (all workflows) | 90 | Not Started | 🟡 |
| **MASTRA-012** | Workflow state runtime (Supabase-backed) | — | (all workflows) | 82 | Not Started | 🔴 |
| **MASTRA-013** | Tenant + organization isolation (RLS) | — *(infra)* | — | 84 | Not Started | 🔴 |
| **MASTRA-014** | AI rate limits + cost controls | (all agents) | — | 82 | Not Started | 🔴 |
| **MASTRA-015** | Shared tool registry + audit wrapper | — *(infra)* | — | 88 | Not Started | 🟡 |
| **MASTRA-016** | Streaming UI state contracts | (all agents) | — | 76 | Not Started | 🔴 |
| **MASTRA-017** | Workflow recovery + dead-letter | — | (all workflows) | 74 | Not Started | 🔴 |
| **MASTRA-018** | Human handoff runtime | handoffAgent | escalationWorkflow | 86 | Not Started | 🟡 |
| **MASTRA-019** | Client SDK integration layer | — *(frontend gateway)* | (consumes all) | 86 | Not Started | 🟡 |
| **MASTRA-020** | Paperclip approval bridge | approvalAgent | approvalQueueWorkflow | 93 | Not Started | 🟡 |
| **MASTRA-021** | VDB local↔remote reconciliation | — *(migration)* | — | 94 | Not Started | 🟡 |
| **MASTRA-022** | Runtime smoke script + probes | pingAgent | weatherWorkflow | 95 | Complete | 🟡 |
| **MASTRA-023** | Replace weather demo with mdeAI ping/router | mdePingAgent | mdeRuntimeSmokeWorkflow | 94 | Not Started | 🟡 |
| **MASTRA-024** | Env + secret boundary | — *(infra)* | — | 94 | In Progress *(PR #2 added DB-URL fingerprint logger + Supabase-direct-host warning in `storage/config.ts`; env-boundary script still pending)* | 🟡 |
| **MASTRA-025** | Dependency alias map | — *(planning)* | — | 92 | Not Started | 🟡 |

---

## C. Dot rules

| Color | Required signals |
|---|---|
| 🟢 | `status: Complete` AND `status_evidence` names a real artifact AND artifact verified live AND task moved to `archive/` |
| 🟡 | Any one of: Complete-with-stale-evidence; In Progress; Not Started AND doc % ≥ 85 |
| 🔴 | Not Started AND doc % < 85 |

**Why 022 is 🟡 not 🟢:** PR #20 ships `mastra-smoke.sh` with both probes green on main, but the task's `status_evidence` line still references the obsolete `smoke-runtime.mjs` filename. Flips to 🟢 once corrected (slated for PR #2).

---

## D. Next archive candidates (after PR #2 merges)

| ID | Why it can flip to 🟢 | Required edit |
|---|---|---|
| **MASTRA-022** | Code shipped, only doc lags | Rewrite `status_evidence` → `my-mastra-app/scripts/mastra-smoke.sh + bash scripts/mastra-smoke.sh — 7 probes green incl. concierge multi-turn rental context, verified 2026-05-10 on branch claude/mastra-pr2-mde-primitives` |
| **MASTRA-023** | Demo-runtime renamed | Rename `weather-*` → `mdePing*` in `src/mastra/`, update probe targets in smoke, archive |
| **MASTRA-024** | Half landed on PR #2; finish env-boundary script | Add `scripts/env-boundary-check.sh` that asserts `.env` has only `VITE_*`, wire into smoke, archive |
| **MASTRA-005** | Concierge MVP behavior locked | Replace mock `searchRentals`/`searchEvents` with Supabase-backed tools; keep working-memory schema; archive after live verification |
| **MASTRA-006** | Rentals MVP behind real data | Same as 005 plus `apartments` table reads + RLS scope |
| **MASTRA-007** | Events MVP behind real data | Same as 005 plus `events` table reads + ticket placeholder |

---

## E. Path to 100% all-green (suggested sequencing)

Goal: every row 🟢 (Complete + tested-with-proof + archived). Today: 1/25 = 4%. Estimated raw effort: **~38 dev-days** across 24 active tasks. Below groups them into 6 sequenced waves so each wave unlocks the next without rework.

### Wave 0 — Bookkeeping (≤1 day, unblocks 4 archives)
Closes the gap between code-shipped and dot-green.

| ID | Action | Why | Effort |
|---|---|---|---|
| 022 | Rewrite `status_evidence` to point at `mastra-smoke.sh` + PR #20 | Code already shipped; only the doc lags | 15 min |
| 002 | Mark Complete once 023+024 land (scaffold is shipped, agents added in waves) | Closes the In-Progress runtime task | rolls up |
| 023 | Rename `weather-*` → `mdePing*` agent + workflow, update probe targets | Drops the demo from the smoke surface | 2 h |
| 024 | Add `scripts/env-boundary-check.sh`, wire into smoke | Proves no secrets ride in `.env` | 3 h |

**Gate:** smoke green on main, 4 tasks archive, dashboard 5/25 = 20% 🟢.

### Wave 1 — Foundations (≈5 days, unblocks every domain task)
Infra that every later task depends on. Doing these first prevents rewrites.

| ID | Feature | Why first | Effort |
|---|---|---|---|
| 028 *(new)* | Connection pooling for `@mastra/pg` | Every agent + workflow hits Postgres | 1 d |
| 015 | Shared tool registry + audit wrapper | All later tools log via this | 1 d |
| 013 | Tenant + organization isolation (RLS) | All later reads/writes are tenant-scoped | 1 d |
| 014 | AI rate limits + cost controls | Prevents runaway spend during dev | 1 d |
| 003 | Tool audit + control events table | Audit log every later tool writes to | 1 d |

**Gate:** 10/25 = 40% 🟢. Doc-thin (003, 013, 014) requires body expansion before pickup — budget +0.5d each.

### Wave 2 — Search + memory primitives (≈4 days)
Everything user-facing reads from these.

| ID | Feature | Effort |
|---|---|---|
| 004 | Hybrid FTS + pgvector search tools | 1.5 d *(doc thin — expand first)* |
| 010 | Memory + RAG MVP | 1.5 d |
| 021 | VDB local↔remote reconciliation | 1 d |

**Gate:** 13/25 = 52% 🟢.

### Wave 3 — Domain MVP agents (≈8 days)
First user-visible agents. Each can ship independently after Wave 2.

| ID | Feature | Effort |
|---|---|---|
| 005 | Chat router + concierge MVP | 2 d *(doc thin)* |
| 006 | Real-estate MVP agents | 2 d *(doc thin)* |
| 007 | Events MVP runtime | 2 d *(doc thin)* |
| 008 | Restaurants MVP discovery | 2 d |

**Gate:** 17/25 = 68% 🟢.

### Wave 4 — Runtime resilience (≈6 days)
Hardening once domain agents exist.

| ID | Feature | Effort |
|---|---|---|
| 011 | Observability + evals + guardrails | 1.5 d |
| 012 | Workflow state runtime (Supabase-backed) | 1.5 d *(doc thin)* |
| 016 | Streaming UI state contracts | 1 d *(doc thin — biggest doc gap, 76%)* |
| 017 | Workflow recovery + dead-letter | 1 d *(doc thin — 74%)* |
| 027 *(new)* | Reconciliation job (VDB drift, ai_runs, control_events) | 1 d |

**Gate:** 22/25 = 88% 🟢.

### Wave 5 — Surfaces + ops (≈6 days)
Operator + frontend + handoff. Last because they ride on everything above.

| ID | Feature | Effort |
|---|---|---|
| 018 | Human handoff runtime | 1 d |
| 019 | Client SDK integration layer | 1 d |
| 020 | Paperclip approval bridge | 1 d |
| 025 | Dependency alias map | 0.5 d |
| 009 | UI dojo / chat frontend (reference patterns) | 1 d |
| 026 *(new)* | Operator console (read-only runs/traces dashboard) | 1.5 d |
| 029 *(new)* | Server deployment (Vercel/Fly host for `my-mastra-app`) | 1 d |

**Gate:** 25 + 4 new = 29 / 29 = 100% 🟢.

---

## F. Critical-path summary

```
Wave 0 → Wave 1 → Wave 2 → Wave 3 → Wave 4 → Wave 5
 1d       5d       4d       8d       6d       6d        ≈ 30 dev-days serial
                                                        ≈ 18 dev-days w/ 2-track parallel (domain ⊥ infra)
```

**Highest leverage right now:** Wave 0 (4 archives in <1 day). After that, Wave 1 — without pooling (028) and rate limits (014), every domain agent in Wave 3 ships with a known-bad foundation and gets reworked.

**Doc-thin blocker:** 9 tasks (003, 004, 005, 006, 007, 012, 013, 014, 016, 017) need body expansion to ≥85% before they're safe to pick up. Budget +0.5 day per task = +5 days. Ideally clear these in a single doc PR before Wave 1 kickoff.

**Riskiest tasks:** 016 (Streaming UI, 76%) and 017 (Workflow recovery, 74%) — biggest doc gaps + cross-cutting. Promote these to "doc-first" before scheduling.

---

## G. Recompute trigger

Re-run when:
- Any frontmatter `status` flips
- New task added under `tasks/`
- A PR merges that changes `my-mastra-app/` runtime surface
- 06-checklist §C.1 numbers shift

Keep this file under ~250 lines — it must stay glanceable.
