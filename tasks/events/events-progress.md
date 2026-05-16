---
doc_id: EVENTS-PROGRESS
title: Events vertical — diagram/task rollup progress
version: 1.0
date: 2026-05-15
status: Active — rolled up manually until wired to CI
sources:
  - ./events-diagram-index.md
  - ./V2-tasks/README.md
  - ./events-milestones.md
---

# Events progress

Roll-up: **Tasks** → **Diagrams** (all tasks for a `diagram_id` done) → **Phase** → **Milestone**. No task is marked **Done** in this initiative until code + tests + evidence exist (owner updates each task file).

| Phase | Diagrams complete | Tasks complete | Milestone status | Blockers | Next action |
|-------|--------------------|----------------|------------------|----------|-------------|
| CORE | 0 / 3 🟥 | 2 / 26 🟡 | EVT-MILESTONE-CORE 🟥 | EVT-009 + EVT-069 ✅; hosted Checkout pay path + UI next | **Checkout UI** on `/events/:id` (after optional hosted pay E2E) |
| MVP | 0 / 3 🟥 | 0 / 12 🟥 | EVT-MILESTONE-MVP 🟥 | Blocked by CORE milestone | Defer UI hardening until spine green |
| ADVANCED | 0 / 3 🟥 | 0 / 18 🟥 | EVT-MILESTONE-ADVANCED 🟥 | Maps train + MASTRA-041/007; OpenClaw gates | Follow `events-roadmap.md` Post-MVP train |
| PRODUCTION | 0 / 2 🟥 | 0 / 16 🟥 | EVT-MILESTONE-PRODUCTION 🟥 | Audit 35 HIGH items; remote parity; Paperclip audit (EVT-064) | Treat EVT-057/059/064/068 as launch-blocking gates that move earlier when they block CORE/MVP safety |

## Health strip

| Metric | Value |
|--------|--------|
| Diagrams indexed (task-bearing EVT-DIAG) | 10 |
| Task files (diagram-derived) | 72 under `V2-tasks/` — filenames `001-`…`072-` = `implementation_order` (see `events-diagram-index.md`) |
| Tests passed (events spine) | Vitest `ticket-edge-verify-jwt` 5/5; gateway curl proof 2026-05-15; Stripe E2E **pending EVT-069** |
| Docs verified | PRD v2 + roadmap + diagrams + this index **read** 2026-05-15 |
| MCP verified | Mastra docs MCP verified for MCP/agent/workflow concepts; Gemini docs MCP returned 429; Supabase and Google Maps Code Assist MCP unavailable in this Codex session — mark per task as UNVERIFIED where not checked |
| Last verified date | 2026-05-15 |

## Percent complete (weighted guess — replace with counts from disk)

- **0%** milestone completion (no task closed yet for this spine).

**Last updated:** 2026-05-15
