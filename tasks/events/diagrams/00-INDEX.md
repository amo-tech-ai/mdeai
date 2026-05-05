# Diagram index — mdeai Events + Contests + Sponsorship

**Source.** Generated from [`../09-prd.md`](../09-prd.md) per the `system.md` discipline:
> **PRD → Diagrams → Diagram Index → Task Files → Roadmap → Milestones → Progress**
> Diagrams define HOW the system behaves. Tasks are generated ONLY from diagrams. Every diagram belongs to exactly one phase.

**Phase mapping.** This initiative's 4-phase plan ([`08-plan-audit-response.md`](../08-plan-audit-response.md)) maps to `system.md` phases as:

| `system.md` phase | Initiative phase | Question it answers |
|---|---|---|
| **CORE** | Phase 1 — Contest Engine | Can it work at all? |
| **MVP** | Phase 2 (Sponsorship + Growth) + Phase 3 (Events + Tickets) | Does it solve the main problem? |
| **ADVANCED** | Phase 4 — AI Orchestration | Does it help users do better? |
| **PRODUCTION** | Post-v1.0 (Bogotá expansion, white-label, recurring events) | Can it be trusted at scale? |

**Flagship Phase 1 contest.** [Miss Elegance Colombia 2026](https://misseleganceco.com/) — *Certamen Nacional de Elegancia, Liderazgo y Autenticidad*. Free voting. Medellín-focused amplification. English-first product, Spanish-Paisa localization.

---

## All 15 diagrams by phase

### 🟢 CORE — Phase 1 (6 diagrams)

> **Milestone rule:** users can complete the basic vote → leaderboard flow end-to-end with hybrid scoring + fraud defense visible to the public.

| ID | Title | Type | PRD section | File |
|---|---|---|---|---|
| `VOTE-CAST-FLOW` | Vote cast end-to-end | sequence | §2.2 E1.1, §4.4 vote-cast | [01-vote-cast-flow.md](./01-vote-cast-flow.md) |
| `HYBRID-SCORING-FORMULA` | 50/30/20 hybrid scoring | flowchart | §1.2, §6 Q3 | [02-hybrid-scoring-formula.md](./02-hybrid-scoring-formula.md) |
| `FRAUD-DEFENSE-LAYERS` | 5-layer fraud defense | flowchart | §2.2 E1, §5.2 vote manipulation | [03-fraud-defense-layers.md](./03-fraud-defense-layers.md) |
| `VOTE-SCHEMA` | `vote.*` schema (full ERD) | erd | §4.3 schemas | [04-vote-schema.md](./04-vote-schema.md) |
| `IDENTITY-VERIFY-FLOW` | Contestant identity verification | sequence | §6 Q3 deltas, §5.1 ships | [05-identity-verify-flow.md](./05-identity-verify-flow.md) |
| `LEADERBOARD-BROADCAST` | OpenClaw 4-hourly broadcast | sequence | `02-openclaw-growth.md` Workflow C | [12-leaderboard-broadcast.md](./12-leaderboard-broadcast.md) |

### 🟡 MVP — Phases 2 + 3 (6 diagrams)

> **Milestone rule:** organizers, sponsors, and ticket buyers can achieve their main goals reliably; sponsor revenue flows; events bundle contests.

| ID | Title | Type | PRD section | File |
|---|---|---|---|---|
| `SPONSOR-ONBOARDING` | Sponsor onboarding end-to-end | sequence | §2.2 E3, §4.4 sponsor edge fns | [06-sponsor-onboarding.md](./06-sponsor-onboarding.md) |
| `SPONSOR-ROI-ATTRIBUTION` | Impression → click → vote → attribution | flowchart | §2.2 E3.2 | [07-sponsor-roi-attribution.md](./07-sponsor-roi-attribution.md) |
| `OUTREACH-CAMPAIGN-FLOW` | Compliant outreach send-loop | flowchart | `02-openclaw-growth.md` Workflow A+B | [08-outreach-campaign-flow.md](./08-outreach-campaign-flow.md) |
| `EVENT-TICKET-PURCHASE` | Stripe Checkout → QR → venue scan | sequence | §4.4 ticket-* edge fns | [09-event-ticket-purchase.md](./09-event-ticket-purchase.md) |
| `EVENT-CREATION-WIZARD` | Organizer 6-step wizard | flowchart | §2.2 E2.1 | [10-event-creation-wizard.md](./10-event-creation-wizard.md) |
| `INTEGRATED-SCHEMA-MAP` | 4-schema cross-FK relationships | erd | §4.3 schemas | [11-integrated-schema-map.md](./11-integrated-schema-map.md) |

### 🔵 ADVANCED — Phase 4 (3 diagrams)

> **Milestone rule:** AI proactively assists users; trio orchestration enforces governance; CPL pricing unlocks via 30+ days of dashboard data.

| ID | Title | Type | PRD section | File |
|---|---|---|---|---|
| `TRIO-ARCHITECTURE` | OpenClaw + Hermes + Paperclip + Supabase | flowchart (C4) | `06-trio-integration.md`, §4.1 Phase 4 | [13-trio-architecture.md](./13-trio-architecture.md) |
| `A6-ATTENDANCE-CONFIRMATION` | T-12h ticket-holder confirmation | sequence | `07-ai-event-research.md` A6 | [14-a6-attendance-confirmation.md](./14-a6-attendance-confirmation.md) |
| `AI-ROI-OPTIMIZATION-LOOP` | Daily Gemini insight → admin apply → metrics improve | flowchart | §3.1, `03-sponsorship-system.md` §6 | [15-ai-roi-optimization-loop.md](./15-ai-roi-optimization-loop.md) |

### ⚪ REALITY — what's actually deployed today (3 diagrams, May 2026)

> **Purpose:** ground all aspirational diagrams above in actual current state. Updated after `medellin` Supabase project inspection + `src/pages` walkthrough.

| ID | Title | Type | Source | File |
|---|---|---|---|---|
| `CURRENT-SUPABASE-ERD` | What's actually in Supabase today (events domain, ~12 of 44 tables shown) | erd | `medellin` project inspection + `public.events` DDL | [16-current-supabase-erd.md](./16-current-supabase-erd.md) |
| `CURRENT-DATA-FLOW` | How `/events` + `EventDetail.tsx` + `useEvents` work end-to-end today | sequence | `src/hooks/useEvents.ts` + pages | [17-current-data-flow.md](./17-current-data-flow.md) |
| `MVP-GAP` | Exact 3-week gap from current state to Phase 1 launch | flowchart | the user's "stop with minute details" reset | [18-mvp-gap.md](./18-mvp-gap.md) |

---

## Diagrams by domain (cross-cut)

### Voting (CORE)
- 01 vote-cast-flow · 02 hybrid-scoring-formula · 03 fraud-defense-layers · 04 vote-schema · 05 identity-verify-flow

### Marketing + social media (CORE + MVP)
- 12 leaderboard-broadcast (CORE) · 08 outreach-campaign-flow (MVP)

### Sponsorship (MVP)
- 06 sponsor-onboarding · 07 sponsor-roi-attribution

### Ticketing + events (MVP)
- 09 event-ticket-purchase · 10 event-creation-wizard

### Schema integration (CORE + MVP)
- 04 vote-schema (CORE) · 11 integrated-schema-map (MVP)

### AI orchestration (ADVANCED)
- 13 trio-architecture · 14 a6-attendance-confirmation · 15 ai-roi-optimization-loop

---

## Diagram type counts

| Type | Count | Files |
|---|---|---|
| Sequence | 6 | 01, 05, 06, 09, 12, 14 |
| Flowchart | 6 | 02, 03, 08, 10, 13, 15 |
| ERD | 2 | 04, 11 |
| Flowchart (C4) | 1 | 13 |

---

## What's deliberately NOT diagrammed yet

These exist conceptually in the PRD but a diagram would be redundant or premature:

| Concept | Why not yet | When to diagram |
|---|---|---|
| Voter user journey | Covered in `09-prd.md` §2.2 E1 walkthrough | Add user-journey diagram if voter onboarding pain surfaces in dogfood |
| Organizer user journey | Covered in `09-prd.md` §2.2 E2 walkthrough + diagram 10 | Add when 5+ organizers onboarded for retention analysis |
| Judge scoring journey | Covered in `09-prd.md` §2.2 E5 | Add when judge dashboard ships in Phase 2 |
| `sponsor.*` field-level ERD | Field details in `03-sponsorship-system.md` §3 | Add if RLS or migration design needs it |
| `event.*` field-level ERD | Field details in `05-unified-platform.md` §8 | Add at start of Phase 3 |
| `growth.*` field-level ERD with nielsberglund 5 tables | Listed in `02-openclaw-growth.md` + `07-ai-event-research.md` | Add at start of Phase 2 |
| `trio.*` field-level ERD | Field details in `06-trio-integration.md` §8 | Add at start of Phase 4 |
| Phase Gantt chart | The 4-phase calendar lives in `08-plan-audit-response.md` | Add if visualizing dependencies for stakeholders |
| Brand-safety auto-pause state machine | Logic described in `09-prd.md` §5.2 | Add when implementing in Phase 2 |
| Stripe Connect organizer payout flow | Sequence covered in `05-unified-platform.md` §8 + `09-prd.md` §2.2 E2.3 | Add at start of Phase 3 |
| Multi-tenant white-label routing | Concept in `06-trio-integration.md` Phase 4+ scope | Add when first white-label organizer signs |

---

## Generating tasks from these diagrams

Per `system.md`:
> **Tasks are generated ONLY from diagrams.** Every task prompt MUST start with the meta block referencing its parent `diagram_id`.

Example task derived from diagram 01 (`VOTE-CAST-FLOW`):

```yaml
---
id: VOTE-CAST-FLOW-01
diagram_id: VOTE-CAST-FLOW
prd_section: 2.2 Epic E1.1, 4.4 vote-cast endpoint
title: Implement vote-cast edge function with Turnstile + nonce + rate limit + idempotency
skill: backend
phase: CORE
priority: P0
status: Open
owner: Backend
dependencies:
  - VOTE-SCHEMA-01
estimated_effort: M
percent_complete: 0
---
## Objective
Implement the vote-cast edge function per the diagram VOTE-CAST-FLOW sequence.

## Scope
- Cloudflare Turnstile token verification
- 60s single-use nonce JWT verification
- Postgres rate_limit_hits via check_rate_limit RPC
- Idempotency_key UNIQUE constraint
- Synchronous L4 fraud rule check (<30ms)
- Realtime broadcast of entity_tally update

## Acceptance Criteria
- 1000 concurrent votes from 100 unique voters → exactly 100 rows in vote.votes
- Replay of same idempotency_key returns 200 OK already_counted (no duplicate)
- L4 flag (synthetic IP burst) → fraud_signals row created, vote.weight=0
- Realtime channel broadcasts within 2s of insert

## Failure Handling
- Stripe-style structured error response { success: false, error: { code, message } }
- 429 Too Many Requests on rate-limit hit
- 401 Unauthorized on missing/invalid nonce
```

When ready to generate tasks, walk each diagram and produce 1–N task prompts with the `diagram_id` foreign key.

---

## Diagram completion checklist (for milestone validation)

A phase is **complete** only when all its diagrams are:

| Check | How to verify |
|---|---|
| Diagram syntax valid | Renders cleanly in GitHub markdown preview |
| All entities/actors named | No `TBD` placeholders in flows |
| Linked to PRD section | `prd_section` field in frontmatter |
| Tasks generated | At least one `diagram_id`-tagged task exists |
| Implementation present | Code references the diagram-defined contract |
| Acceptance criteria met | Tests prove the diagram's behavior |

---

## Where to render these diagrams

| Audience | Render path |
|---|---|
| Engineers reviewing code | GitHub renders mermaid natively in markdown — open file directly |
| Founders / advisors | [Mermaid Live Editor](https://mermaid.live) — paste the diagram code |
| Sponsors / partner pitches | Export to SVG/PNG via Mermaid CLI: `mmdc -i 01-vote-cast-flow.md -o flow.png` |
| In docs (Notion, Confluence) | Built-in mermaid support; copy code block in |
| Local IDE preview | VS Code with [Markdown Preview Mermaid Support](https://marketplace.visualstudio.com/items?itemName=bierner.markdown-mermaid) extension |

---

## Source documents these diagrams pull from

- [`../09-prd.md`](../09-prd.md) — PRD (the WHY)
- [`../00-overview.md`](../00-overview.md) — initiative index
- [`../01-contests.md`](../01-contests.md) — voting engine spec (CORE diagrams 01–05)
- [`../02-openclaw-growth.md`](../02-openclaw-growth.md) — OpenClaw plan (diagrams 08, 12)
- [`../03-sponsorship-system.md`](../03-sponsorship-system.md) — sponsorship plan (diagrams 06, 07)
- [`../05-unified-platform.md`](../05-unified-platform.md) — events + integration plan (diagrams 09, 10)
- [`../06-trio-integration.md`](../06-trio-integration.md) — Hermes + Paperclip plan (diagrams 13, 14, 15)
- [`../07-ai-event-research.md`](../07-ai-event-research.md) — research (informs diagrams 14, 15)
- [`../08-plan-audit-response.md`](../08-plan-audit-response.md) — phased plan (canonical phase mapping)
- [`../10-roadmap.md`](../10-roadmap.md) — strategic roadmap (Now/Next/Later → CORE/MVP/ADVANCED)
- [`/home/sk/mde/system.md`](/home/sk/mde/system.md) — phase discipline source
- [`.claude/skills/mermaid-diagrams/SKILL.md`](../../../.claude/skills/mermaid-diagrams/SKILL.md) — syntax reference
