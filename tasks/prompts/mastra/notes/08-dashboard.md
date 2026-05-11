---
title: Mastra Task Pack — Dashboard
status: Reference
created: 2026-05-10
scope: One-page status dashboard across the Mastra task pack. Generated from frontmatter `status`, `notes/06-checklist.md` doc-quality scores, and verified runtime artifacts (PR #20, my-mastra-app/).
legend:
  green: 🟢 Complete + tested with shipped proof (archived)
  yellow: 🟡 Complete-but-evidence-stale OR In-Progress OR doc-quality ≥85% awaiting code
  red: 🔴 Not Started or doc-quality <85%
---

# 08 — Mastra Dashboard

> **One source for "what's done, what's next."** Pulls from each task's frontmatter (`status`, `status_evidence`), [06-checklist.md §C.1](./06-checklist.md#c1-canonical-task-files) doc-quality %, and the merged/open code artifacts.

## A. Composite at-a-glance

| Bucket | Count | IDs |
|---|---|---|
| 🟢 Complete + archived | 1 | MASTRA-001 |
| 🟡 Complete (evidence-stale) — code shipped, doc lagging | 1 | MASTRA-022 (PR #20, evidence references stale `.mjs` filename) |
| 🟡 In Progress | 1 | MASTRA-002 |
| 🟡 Doc-ready awaiting code (doc ≥90%) | 7 | MASTRA-008, 009, 010, 020, 021, 023, 024 |
| 🟡 Doc-ready (doc 85–89%) | 5 | MASTRA-011, 015, 018, 019, 025 |
| 🔴 Doc-thin (<85%) — needs body expansion before pickup | 9 | MASTRA-003, 004, 005, 006, 007, 012, 013, 014, 016, 017 |
| **Total active** | **24** | (001 archived) |

**Implementation completion: 1 / 25 = 4%.** Doc-quality mean: 88.6% (per 06-checklist §C.1).

---

## B. Per-task dashboard

Columns:
- **Task** — ID + canonical filename
- **Feature** — user-visible / system surface this delivers
- **Agent(s)** — Mastra agent(s) registered or referenced
- **Workflow(s)** — Mastra workflow(s) registered or referenced
- **Doc %** — from 06-checklist §C.1 post-followup column
- **Status** — frontmatter status
- **Dot** — composite signal

| Task | Feature | Agent(s) | Workflow(s) | Doc % | Status | Dot |
|---|---|---|---|---:|---|:-:|
| **MASTRA-001** *(archived)* | Source inventory + safety baseline | — *(audit-only)* | — | 96 | Complete | 🟢 |
| **MASTRA-002** | Core runtime scaffold (`my-mastra-app/`) | weatherAgent, pingAgent | weatherWorkflow | 98 | In Progress | 🟡 |
| **MASTRA-003** | Tool audit + control events table | (cross-cutting) | — | 92 | Not Started | 🔴 |
| **MASTRA-004** | Hybrid FTS + pgvector search tools | searchTool consumers | — | 86 | Not Started | 🔴 |
| **MASTRA-005** | Chat router + concierge MVP | conciergeAgent, intentRouter | conciergeWorkflow | 88 | Not Started | 🔴 |
| **MASTRA-006** | Real-estate MVP agents | realEstateConciergeAgent, listingsAgent | realEstateInquiryWorkflow | 82 | Not Started | 🔴 |
| **MASTRA-007** | Events MVP runtime | eventsAgent, ticketHelperAgent | eventsTicketWorkflow | 84 | Not Started | 🔴 |
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
| **MASTRA-024** | Env + secret boundary | — *(infra)* | — | 94 | Not Started | 🟡 |
| **MASTRA-025** | Dependency alias map | — *(planning)* | — | 92 | Not Started | 🟡 |

---

## C. Dot rules (so the colors are repeatable)

| Color | Meaning | Required signals |
|---|---|---|
| 🟢 | Complete + archived | `status: Complete` AND `status_evidence` points at real artifact AND artifact verified live AND task moved to `archive/` |
| 🟡 | Complete-stale, In-Progress, or doc-ready | Any one of: `status: Complete` with stale/inaccurate `status_evidence`; `status: In Progress`; `status: Not Started` AND doc % ≥ 85 |
| 🔴 | Doc-thin or unstarted | `status: Not Started` AND doc % < 85 |

> **Why two yellows instead of green for MASTRA-002 / 022:**
> - **MASTRA-002** is genuinely In Progress (only the runtime scaffold ships; agents/workflows still added piecemeal).
> - **MASTRA-022** is implementation-Complete (PR #20 ships `mastra-smoke.sh` with agent + workflow probes, all green) but its `status_evidence` line still references the obsolete `smoke-runtime.mjs` filename. Until that line is corrected (PR #2), it isn't archive-eligible by the strict rule "evidence valid + accurate."

---

## D. Path to more 🟢 (next archive candidates after PR #2)

| ID | Why it can flip to 🟢 after PR #2 | Required PR-#2 edit |
|---|---|---|
| **MASTRA-022** | Code already shipped (PR #20). Only the doc lags. | Update `status_evidence` line to `my-mastra-app/scripts/mastra-smoke.sh + npm run smoke:runtime — agent.generate (ping-agent) HTTP 200 + workflow.start-async (weather-workflow) status=success verified 2026-05-10 (PR #20)` |
| **MASTRA-023** | If we replace `weather-*` with `mdePing*` in the same PR (small swap). | Rename agent + workflow in `src/mastra/`, update probe targets in smoke, archive task |
| **MASTRA-024** | Env-boundary denylist scan can be added as a pre-commit/CI step. | Add `scripts/env-boundary-check.sh`, wire into smoke, archive task |

---

## E. Recompute trigger

Re-run when:
- Any frontmatter `status` flips
- Any new task is added under `tasks/`
- A PR merges that changes `my-mastra-app/` runtime surface
- 06-checklist §C.1 numbers shift

Keep this file under 200 lines so it stays glanceable.
