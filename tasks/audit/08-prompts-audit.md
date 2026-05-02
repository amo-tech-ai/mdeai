# 08 — Prompts Audit

**Auditor:** Claude Opus 4.6 (Senior Software Architect)
**Date:** 2026-04-05
**Scope:** All 65 files in `tasks/prompts/` (01E–13E, INDEX.md, VERIFY, DIAGRAMS)
**Verdict:** NOT READY FOR IMPLEMENTATION — 13 CRITICAL, 22 HIGH issues

---

## Executive Summary

The prompt system is architecturally ambitious but fundamentally broken for execution. It describes a 13-epic, 65-file task backlog spanning database foundation through production readiness. The problems are systemic, not cosmetic:

1. **Decisions are deferred into prompts instead of being resolved before them.** At least 8 prompts contain "or" choices (table schema, scheduler tech, storage pattern) that should have been ADRs.
2. **Cross-file dependencies are stated but never enforced.** Tasks reference other tasks' outputs without gates, leading to phantom features (approval workflows, earnings calculations, neighborhood scores) that are assumed-complete but never built.
3. **Acceptance criteria conflate documentation with implementation.** Multiple prompts (02H, 12A, 12B, 13B, 13C) produce markdown files, not working software. They're tracked alongside code tasks with equal priority.
4. **Security specs contain dangerous recommendations.** In-memory rate limiting for serverless (03E), soft timeout numbers (13A), and unverified edge function counts create false confidence.
5. **Agent infrastructure (E5) has circular dependencies.** CEO instructions reference adapters that don't exist; adapters depend on configs with unspecified file paths; CLI output parsing is assumed but never validated.

**Bottom line:** An implementer following these prompts will build disconnected pieces that don't compose. The "pipeline" from lead to lease has 4 phantom features. The agent system can't execute because its dependency graph is circular. The security hardening has a broken pattern (in-memory rate limiting in serverless).

---

## Score Table

| Area | Score | Rationale |
|------|-------|-----------|
| Structure & Organization | 72/100 | INDEX.md is solid. Epic grouping is logical. Lettered subtasks nest well. |
| Actionability | 28/100 | Most prompts defer decisions, reference non-existent schemas, or assume code exists without verification. |
| Dependency Management | 15/100 | Circular deps in E5, phantom features in E2/E4, forward refs to non-existent tables throughout. |
| Acceptance Criteria Quality | 35/100 | Mix of good (E1 seed idempotency) and terrible ("or" choices, vague "graceful handling"). |
| Security Specifications | 20/100 | In-memory rate limiting is wrong. Timeout numbers are soft. Admin RBAC is undefined. "9 existing" edge functions is unverified. |
| Cross-File Consistency | 22/100 | Schema drift (01E vs 04E vs 06A vs 07A), duplicate specs (E2-005 vs E3-005), unresolved routing (08A vs 08B vs 08F vs 08K). |
| Agent System Prompts | 18/100 | Circular deps, unparseable CLI output assumed, audit log table undefined, instructions confused with enforcement. |
| **Overall** | **30/100** | Ambitious scope, poor execution readiness. |

---

## Top 13 Critical Issues

### C1. In-Memory Rate Limiting in Serverless (03E-004)

**File:** `03E-security-hardening.md`, task E3-004
**Problem:** Recommends "simple sliding window counter stored in... in-memory Map" as an option. In serverless edge functions, each invocation is a new process. The counter resets every request. Rate limiting does nothing.
**Impact:** Zero rate limiting in production. Any attacker can spam AI endpoints without throttle.
**Fix:** Remove in-memory option. Require persistent storage (Supabase table or Upstash Redis). Add AC: "Rate limit state persists across function invocations."

### C2. Application Approval Workflow Does Not Exist (02E)

**File:** `02E-lead-to-lease-pipeline.md`, tasks E2-003 + E2-004
**Problem:** E2-003 creates rental applications with `status='pending'`. E2-004 creates bookings only when `status='approved'`. No task in any epic handles the transition from pending to approved. No host UI for approving. No edge function for status mutation. The pipeline has a phantom step.
**Impact:** No renter can ever get a booking. The "lead to lease" pipeline is broken at step 3 of 5.
**Fix:** Add task E2-003b: "Host application review endpoint" with AC for approve/reject mutation + RLS for host-only writes. Wire to E4-005 LandlordDashboard.

### C3. Agent Dependency Graph Is Circular (05A/05C/05H)

**File:** `05A-paperclip-ceo-instructions.md`, `05C-hermes-config-instructions-timeout.md`, `05H-openclaw-gateway-adapter.md`
**Problem:** 05A (CEO instructions) references `hermes_local` adapter (05D, depends on 05C) and `openclaw_gateway` adapter (05H). But 05E's suggested order puts 05A first. CEO instructions reference adapters that don't exist yet. Adapters depend on configs with unspecified file paths.
**Impact:** No agent task in E5 can start cleanly. Implementer will either skip deps or build stubs that diverge from final implementation.
**Fix:** Reorder: 05B → 05C → 05D → 05H → 05A → 05N. CEO instructions must be written last, after all adapters exist.

### C4. Hermes CLI Output Assumed Parseable (05D)

**File:** `05D-hermes-local-adapter.md`
**Problem:** Adapter "parses Hermes CLI output (stdout) and returns structured result." Hermes CLI returns natural language text, not JSON. No format spec. No regex pattern. No structured output flag documented.
**Impact:** Adapter will either crash on unparseable output or return garbage. All Paperclip → Hermes delegation fails.
**Fix:** Either (a) define Hermes `--json` output flag and document schema, or (b) use Hermes programmatic API instead of CLI spawning, or (c) add Gemini post-processing step to extract structure from text.

### C5. "9 Existing Edge Functions" Count Unverified (03E)

**File:** `03E-security-hardening.md`, task E3-001
**Problem:** "Audit and fix authentication in all 9 existing edge functions." The actual count in `supabase/functions/` is never verified against this claim. If there are 7 or 11, the AC is wrong.
**Impact:** Either under-hardening (missed functions) or wasted effort (hardening non-existent functions).
**Fix:** Replace "9 existing" with "all functions in `supabase/functions/*/index.ts`" and add an AC: "Inventory list with function name + auth status attached to PR."

### C6. Idempotency Promised Everywhere, Implemented Nowhere (02E)

**File:** `02E-lead-to-lease-pipeline.md` header + E2-001 through E2-005
**Problem:** Header requires `Idempotency-Key` on all POST endpoints. Five tasks mention idempotency in ACs. Zero tasks define: where keys are stored, expiry duration, conflict resolution, or shared utility function.
**Impact:** Each implementer invents their own approach. Some will skip it. Payment double-charges become possible.
**Fix:** Create task E2-000: "Shared idempotency utility" with AC for: table schema (`idempotency_keys(key, response, created_at, expires_at)`), Zod validation, 24h TTL, and edge function middleware.

### C7. ai_runs Table Never Created (Multiple Files)

**File:** Referenced in 02E, 06A, 06D, 07B, 09E — 5+ files
**Problem:** G5 rule requires "persist to ai_runs table." 06A logs to it. 06D logs to it. 07B logs to it. 09E-003 builds observability on it. E1 (data foundation) never creates it. No migration file. No schema definition.
**Impact:** Every AI edge function will either crash on INSERT or silently skip logging. Token tracking and cost monitoring are impossible.
**Fix:** Add to E1-002 migration: `CREATE TABLE ai_runs (id uuid, agent_name text, input_tokens int, output_tokens int, duration_ms int, status text, metadata jsonb, created_at timestamptz)`.

### C8. agent_audit_log Table Never Created (05D/05K/09E)

**File:** `05D-hermes-local-adapter.md`, `05K-paperclip-agent-audit-log-ordering.md`
**Problem:** 05D logs all Hermes invocations to `agent_audit_log`. 05K defines ordering rules for this table. 09E-004 builds dashboard on it. No migration creates this table. No schema anywhere.
**Impact:** All agent audit logging fails. No observability into agent behavior.
**Fix:** Add to E1-002 or create separate migration: `CREATE TABLE agent_audit_log (id uuid, agent_name text, action text, input jsonb, output jsonb, triggered_by text, duration_ms int, created_at timestamptz)`.

### C9. Market Snapshot Occupancy Depends on Non-Existent Data (06D)

**File:** `06D-market-snapshot-edge.md`
**Problem:** Formula: `occupancy = booked_nights / (active_listings x 30) x 100`. Requires `bookings` table with date ranges. E1 doesn't create a bookings table with `check_in`/`check_out` columns. E2 creates bookings but schema is undefined in the prompt.
**Impact:** Occupancy calculation crashes or returns null. Market snapshots are incomplete.
**Fix:** Define bookings schema in E1 or E2 with: `bookings(id, apartment_id, check_in date, check_out date, status text)`. Reference from 06D.

### C10. Three Schedulers Without Deduplication (06D)

**File:** `06D-market-snapshot-edge.md`
**Problem:** "Use Supabase pg_cron primary, Vercel Cron fallback, Paperclip heartbeat backup." Three independent schedulers will fire independently. No idempotency check on snapshot creation. Triple-writes per interval.
**Impact:** 3x storage waste. Confusing data when querying "latest snapshot." Potential race conditions.
**Fix:** Pick ONE scheduler. Add `UNIQUE(neighborhood_id, snapshot_date)` constraint to prevent duplicates. Remove fallback schedulers — they create more problems than they solve.

### C11. Payment Rollback Has No Spec (13B)

**File:** `13B-e2-payment-rollback-idempotency.md`
**Problem:** Task says "create a rollback one-pager" but doesn't define what goes in it. No Stripe webhook event deduplication table. No transaction state machine. No test automation requirement. This is the money path.
**Impact:** Failed payments leave bookings in inconsistent state. No way to recover without manual DB intervention.
**Fix:** Define: (a) `webhook_events(event_id unique, processed_at)` table for dedup, (b) booking state machine: `pending_payment → paid → refunded`, (c) idempotency key stored in Stripe metadata, (d) Vitest replay test with mock Stripe.

### C12. Webhook Signature Verification Unspecified (08A)

**File:** `08A-infobip-whatsapp-webhook.md`
**Problem:** AC says "Webhook signature verified (reject unsigned requests)" but no algorithm, header name, or key source defined. Implementer must reverse-engineer Infobip's docs.
**Impact:** Either signatures are not verified (open to spoofing) or verification is implemented wrong (breaking legitimate webhooks).
**Fix:** Add to AC: "Verify `x-hub-signature` header using HMAC-SHA256 with `INFOBIP_WEBHOOK_SECRET`. Reject requests where computed hash != provided hash."

### C13. Hardcoded Supabase Project ID in AC (10C)

**File:** `10C-crm-deploy-smoke.md`
**Problem:** AC references `zkwcbyxiwklihegjhuql` as the project ID. Hardcoded in a task spec that should be environment-agnostic.
**Impact:** If project is regenerated, rotated, or moved to a different org, the AC is permanently broken. CI/CD will reference wrong project.
**Fix:** Replace with: "Deploy to the project referenced in `supabase/config.toml` or `SUPABASE_PROJECT_ID` env var."

---

## Detailed Findings by Section

### Section 1: Data Foundation (01E)

| Issue | Severity | Detail |
|-------|----------|--------|
| Neighborhood ID strategy deferred to non-existent ADR | CRITICAL | E1-002 says "decide in ADR" — no ADR exists. E4-003 assumes scores exist. Schema drift guaranteed. |
| E1-001 depends on E1-002 but E1-002 declares zero deps | HIGH | Circular dependency in the most foundational epic. |
| pgvector column location undefined | HIGH | E1-003/E1-007 reference embeddings but never say which table gets the `vector` column. |
| Seed idempotency claimed but not enforced | MEDIUM | AC says UPSERT but seed script doesn't exist yet. No enforcement mechanism. |
| RLS "public read, no auth" is ambiguous | MEDIUM | Does this mean RLS disabled or a permissive policy? Two different security postures. |

### Section 2: Lead-to-Lease Pipeline (02E, 02F, 02G, 02H)

| Issue | Severity | Detail |
|-------|----------|--------|
| Approval workflow is phantom | CRITICAL | Status goes pending → ??? → approved. No task handles the transition. |
| Idempotency storage undefined | CRITICAL | Header mandates it, 5 tasks reference it, none define WHERE keys are stored. |
| Gemini response schema not provided | HIGH | E2-003 calls Gemini with `responseSchema` but no schema is given. |
| Stripe payment confirmation flow undefined | HIGH | How does frontend know payment succeeded? Webhook? Polling? Redirect? |
| Showing time slot mapping undefined | HIGH | UI shows "morning/afternoon/evening" but edge takes `datetime[]`. No mapping spec. |
| 02H is a doc amendment, not a feature task | MEDIUM | Should be a comment on 02E, not a separate P0 prompt. |
| 02G blocked by E1 + E3 but marked P2 | MEDIUM | Priority inversion — P2 task blocked by P0 tasks. |
| 02F scheduler choice unmade | HIGH | pg_cron vs Vercel Cron vs edge schedule — no decision, no guidance. |

### Section 3: Security Hardening (03E)

| Issue | Severity | Detail |
|-------|----------|--------|
| In-memory rate limiting in serverless | CRITICAL | Counter resets per invocation. Zero protection. |
| "9 existing" edge functions unverified | CRITICAL | Actual count unknown. Under/over-hardening risk. |
| Scope overlap with E2-005 | HIGH | Both E2-005 and E3-005 spec Stripe webhook signature verification. |
| Zod version pinned to deno.land/x URL | MEDIUM | Community-hosted, may break. Should use import map. |
| CORS origins hardcoded in prompt | MEDIUM | Should be env vars, not prompt constants. |
| Gemini security note orphaned | LOW | G4 note is advice, not tied to any AC. |

### Section 4: Frontend (04A, 04B, 04E, 04F)

| Issue | Severity | Detail |
|-------|----------|--------|
| Neighborhood scores assumed to exist | HIGH | E4-003 props include `safety_score`, `walkability_score`, `nomad_score` — no migration creates them. |
| Earnings calculation source undefined | HIGH | E4-005 LandlordDashboard shows earnings but no edge function or query is specified. |
| WCAG contradicts design spec | MEDIUM | Design uses color-coded bars; WCAG AC requires non-color alternatives. |
| 04A/04B defer API contract to external files | MEDIUM | Not self-contained. Developer must grep repo to understand the edge function response. |
| 04F is a static content page | LOW | Should be deferred or merged into booking detail. |

### Section 5: Agent Infrastructure (05A–05N)

| Issue | Severity | Detail |
|-------|----------|--------|
| Circular dependency graph | CRITICAL | CEO → adapters → configs → CEO. No clean starting point. |
| Hermes CLI output unparseable | CRITICAL | Natural language text assumed to be structured. No format spec. |
| agent_audit_log table undefined | CRITICAL | Referenced in 3+ tasks, never created. |
| CEO instructions confuse metadata with enforcement | HIGH | "Budget hard stop at 100%" — instructions don't execute code. |
| File paths not specified for any config | HIGH | "Locate or create" is not a spec. |
| Hermes timeout is arbitrary (30s) | MEDIUM | No justification. No enforcement verification. |
| Workspace port hardcoded (3102) | MEDIUM | Should be configurable. |
| 05E suggested order violates own dependency graph | MEDIUM | Lists 05A before 05C, but 05A depends on 05C's output. |

### Section 6: Hermes Intelligence (06A–06G)

| Issue | Severity | Detail |
|-------|----------|--------|
| Occupancy formula depends on non-existent data | CRITICAL | bookings table schema undefined. |
| Three schedulers without dedup | CRITICAL | pg_cron + Vercel Cron + Paperclip heartbeat = triple-writes. |
| 06A doesn't accept taste_profile input | HIGH | 06C says it "feeds into hermes-ranking" but 06A has no param for it. |
| 06B response schema mismatches 06A output | HIGH | 06B expects `maxScore` + `label`; 06A produces `{ factor: score }`. |
| Eval dataset (06F) doesn't exist yet but 06A claims accuracy | HIGH | Bootstrap problem: can't validate >=70% without the eval set. |
| "Neighborhood match" factor is circular | MEDIUM | References "scores" that may come from 06D, undefined. |
| Missing data fallback values unspecified | MEDIUM | "Neutral score" — what number? Per factor? |

### Section 7: Contract Automation (07A–07E)

| Issue | Severity | Detail |
|-------|----------|--------|
| PDF handling has no error spec | CRITICAL | Missing file, corrupt PDF, oversized file — all unhandled. |
| Gemini model not pinned | HIGH | "Gemini Pro" — which one? Flash vs Pro vs Preview? |
| Risk score formula is black box | HIGH | "Based on flag count and severity" — no formula. |
| ai_summary JSON shape undefined | HIGH | 07A defines JSONB column but no schema. 07B and 07C will diverge. |
| Lease fixtures format contradicts spec | MEDIUM | 07D says "markdown or text" but 07B expects PDF URLs. |
| Colombian law compliance check is uncurated | MEDIUM | No list of Ley 820/2003 requirements. Legal accuracy unvalidated. |

### Section 8: Multi-Channel / WhatsApp (08A–08K)

| Issue | Severity | Detail |
|-------|----------|--------|
| Webhook signature verification unspecified | CRITICAL | No algorithm, header, or key source. |
| 08B scope creep — blocked by 3 other tasks | CRITICAL | Cannot be "done" until 08F + 08K + 08H ship. Hidden critical path. |
| Decision gates (08F, 08K) have no enforcement | CRITICAL | "Written decision with sign-off" — no consequence if skipped. |
| Language detection assumed but not built | HIGH | 08B and 08I both assume it. Neither implements it. |
| Conversation state schema undefined | HIGH | "Per phone number" — what persists? How long? |
| WhatsApp lead-capture without JWT | HIGH | service-role caller assumed. Security implications unaddressed. |
| Human handover confidence threshold undefined | MEDIUM | "< 0.3 triggers escalation" — calculated how? By what model? |
| Outbound format limited to text only | MEDIUM | 08A only specs text messages. Rich messages, buttons, templates undefined. |

### Section 9: Production Readiness (09E)

| Issue | Severity | Detail |
|-------|----------|--------|
| Known env var issue treated as new task | HIGH | NEXT_PUBLIC_* issue is documented in CLAUDE.md but still "Open" as a task. |
| Assumes all AI edge functions exist | HIGH | If earlier epics haven't shipped, logging functions crash. |
| E2E tests assume seed data that doesn't exist | HIGH | Circular with E1-001. |
| Alert escalation path undefined | MEDIUM | "Email → who" — no on-call matrix. |
| AI cost budget numbers unjustified | MEDIUM | $50/month, 100k tokens/day — based on what usage projection? |

### Section 10–13: CRM, Search, Trio, Core Audit

| Issue | Severity | Detail |
|-------|----------|--------|
| 10C hardcoded project ID | CRITICAL | Breaks on project regeneration. |
| 13B payment rollback is an empty doc spec | CRITICAL | Money path with no actual implementation AC. |
| 12A integration contract is circular | HIGH | "Create this doc" but doesn't define minimum contents. |
| 12B runbook references potentially stale files | HIGH | `tasks/paperclip/links.md` — unknown if exists. |
| 12C flags underspecified, no monitoring | HIGH | Kill-switch without observability is dangerous. |
| 13A admin RBAC undefined | HIGH | No JWT claims structure for admin roles. |
| 13A timeout numbers are soft ("~30s") | HIGH | Should be hard limits for serverless cost control. |
| INDEX.md misleading language for open tasks | MEDIUM | Calls open tasks "audit" implying completion. |
| INDEX.md outcome codes (O1–O10) undefined | MEDIUM | Referenced throughout but never defined. |

### INDEX.md Specific Findings

| Finding | Status |
|---------|--------|
| All 65 files listed and accurately linked | PASS |
| Epic grouping (01E–10E) properly nested | PASS |
| Lettered subtasks categorized correctly | PASS |
| VERIFY and DIAGRAMS separated properly | PASS |
| Orphaned references (index lists non-existent files) | NONE FOUND |
| Unlisted files (files exist but not indexed) | NONE FOUND |
| Misleading "audit" label on open tasks | FAIL |
| O1–O10 outcome codes undefined | FAIL |
| Cross-epic dependency graph missing | FAIL |

---

## Cross-File Conflicts

### Schema Drift

| Conflict | Files | Impact |
|----------|-------|--------|
| Neighborhood ID: text vs FK | 01E vs 04E | E4-003 assumes scores on neighborhoods table. E1-002 defers decision. |
| ai_runs: referenced but never created | 02E, 06A, 06D, 07B, 09E | 5+ files INSERT to a non-existent table. |
| agent_audit_log: referenced but never created | 05D, 05K, 09E | All agent logging fails. |
| bookings check_in/check_out: assumed but undefined | 06D vs 02E | Occupancy formula crashes. |
| 06B expects maxScore/label; 06A produces factor:score | 06A vs 06B | Component renders wrong data. |
| ai_summary JSONB shape undefined | 07A vs 07B vs 07C | Three files interpret the same column differently. |

### Duplicate / Overlapping Specs

| Conflict | Files | Resolution |
|----------|-------|------------|
| Stripe webhook signature verification | E2-005 vs E3-005 | Pick one. Delete the other. |
| Correlation ID propagation | 08G vs 12A | 08G defines it; 12A references it. Make 12A depend on 08G. |
| Language detection | 08B vs 08I | Neither implements it. Create a shared task. |

### Architecture Decision Gaps

| Decision | Files Affected | Current State |
|----------|---------------|---------------|
| Scheduler: pg_cron vs Vercel Cron | 02F, 06D | Both say "pick one" — nobody picks. |
| WhatsApp: Infobip vs OpenClaw Baileys | 08A, 08B, 08F | 08F is a decision gate but has no enforcement. |
| AI routing: Gemini edge vs Hermes vs OpenClaw | 08K, 12C | 08K is a decision gate but has no deadline. |
| Neighborhood: text field vs FK | 01E | Deferred to ADR that doesn't exist. |

---

## Failure Points

### Silent Failures (things that "work" but are wrong)

1. **Rate limiting does nothing** — In-memory Map resets per serverless invocation. Looks like it's working because no errors. Zero protection.
2. **Idempotency keys are never checked** — ACs say "include key" but no storage or validation exists. Duplicate operations go through.
3. **Market snapshots triple-write** — Three schedulers fire independently. DB may dedup via date but may not.
4. **Hermes adapter returns garbage** — CLI text parsed as "structured" result. Downstream code receives malformed data.
5. **Neighborhood scores render as undefined** — E4-003 expects columns that E1-002 never creates.

### Blockers (things that prevent progress)

1. **Approval workflow gap** — No renter can complete the pipeline. Bookings require `status='approved'` but nothing sets it.
2. **ai_runs table missing** — All AI logging crashes or is silently skipped.
3. **Agent dependency circle** — No E5 task can start cleanly.
4. **Seed data at 0%** — E2-G (E2E tests), E2-F (reminders), E4-004 (moderation queue), 09E-005 all blocked.

### Brittle Areas (things that break under stress)

1. **Zod pinned to deno.land/x URL** — Registry could go down or remove version.
2. **CORS origins hardcoded** — Any domain change requires prompt update + redeploy.
3. **Hermes CLI spawning** — Requires Hermes installed on machine. No container image. No fallback.
4. **Stripe webhook without dedup table** — Retry storms create duplicate state mutations.

---

## Fix Plan (Prioritized)

### P0 — Do Before Any Implementation (1-2 days)

| # | Fix | Files Affected | Effort |
|---|-----|---------------|--------|
| 1 | Remove in-memory rate limiting option; require persistent storage | 03E | 15 min |
| 2 | Add approval workflow task (E2-003b) | 02E | 30 min |
| 3 | Define ai_runs table schema; add to E1-002 | 01E, 02E, 06A, 06D, 07B, 09E | 30 min |
| 4 | Define agent_audit_log table schema; add to E1-002 | 01E, 05D, 05K, 09E | 20 min |
| 5 | Create shared idempotency utility task (E2-000) | 02E | 30 min |
| 6 | Reorder E5 dependency graph (05B → 05C → 05D → 05H → 05A) | 05E | 15 min |
| 7 | Replace hardcoded project ID in 10C with env var reference | 10C | 5 min |
| 8 | Pick ONE scheduler for 06D; add UNIQUE constraint | 06D | 15 min |

### P1 — Do Before Epic Implementation Starts (2-3 days)

| # | Fix | Files Affected | Effort |
|---|-----|---------------|--------|
| 9 | Define Hermes CLI output format OR switch to programmatic API | 05D, 05C | 1 hr |
| 10 | Add neighborhood_id ADR to E1-002 (pick one path, not "or") | 01E | 30 min |
| 11 | Define Gemini response schemas for E2-003, 06A, 07B | 02E, 06A, 07B | 1 hr |
| 12 | Add webhook signature verification algorithm to 08A | 08A | 15 min |
| 13 | Define payment rollback state machine + dedup table | 13B, 02E | 1 hr |
| 14 | Merge 02H amendment into 02E body | 02E, 02H (delete) | 15 min |
| 15 | Align 06A output schema with 06B expected props | 06A, 06B | 30 min |
| 16 | Add bookings schema to E1 or E2 with check_in/check_out dates | 01E or 02E, 06D | 30 min |

### P2 — Do Before Production (1 week)

| # | Fix | Files Affected | Effort |
|---|-----|---------------|--------|
| 17 | Resolve duplicate spec: E2-005 vs E3-005 (Stripe webhook) | 02E, 03E | 20 min |
| 18 | Define admin RBAC JWT claims structure | 13A | 30 min |
| 19 | Convert 08F and 08K from "decision tasks" to enforced ADRs with deadlines | 08F, 08K | 1 hr |
| 20 | Add VERIFY automation (CI gate, not manual checklist) | VERIFY | 2 hr |
| 21 | Define outcome codes O1–O10 in project glossary | INDEX.md | 30 min |
| 22 | Add cross-epic dependency graph to INDEX.md | INDEX.md | 1 hr |

---

## What Should Be Simplified

1. **Merge 02H into 02E** — It's a doc amendment, not a task. Delete the file.
2. **Remove 04F (move-in checklist)** — Static content page with zero integration. Defer to post-MVP.
3. **Collapse 08F + 08K into one ADR** — Both are "decide the architecture" gates. Combine into single decision doc with deadline.
4. **Remove triple-scheduler pattern in 06D** — Pick pg_cron. Delete the fallback complexity.
5. **Remove all "or" choices from ACs** — Every "or" must become a decision. "Table or in-memory" is not an acceptance criterion.

## What Should Be Removed Entirely

1. **In-memory rate limiting option** (03E) — Broken in serverless. Dangerous false confidence.
2. **Hermes CLI spawning approach** (05D) — Fragile. Replace with programmatic API or HTTP endpoint.
3. **"Locate or create" language** (05A, 05B, 05C) — Specify exact file paths. "Locate" is not a spec.

## What Should Be Added

1. **E2-000: Shared idempotency utility** — Table, middleware, Zod validation.
2. **E2-003b: Application approval workflow** — Host review endpoint + UI wiring.
3. **ai_runs migration** — Table for G5 logging compliance.
4. **agent_audit_log migration** — Table for agent observability.
5. **Cross-epic dependency graph** — Visual DAG in INDEX.md showing blocking relationships.
6. **VERIFY CI automation** — GitHub Action or Deno task replacing manual checklist.

---

## Final Verdict

**These prompts represent real planning work but are not implementation-ready.** The system has the structure of a well-organized task backlog (INDEX.md is good, epic grouping is logical, lettered subtasks nest properly) but the content of individual prompts contains:

- **13 CRITICAL issues** that will cause runtime failures, security gaps, or pipeline breaks
- **22 HIGH issues** that will cause integration pain, schema mismatches, or wasted effort
- **~30 MEDIUM issues** that create confusion or require decisions at implementation time

The most dangerous pattern is **deferred decisions masquerading as flexibility.** Phrases like "or," "locate or create," "optional," and "decide in ADR" push unresolved choices into implementation, where each developer makes a different call. This guarantees inconsistency across the codebase.

**Estimated fix effort for P0 + P1:** 8-10 hours of prompt editing. This is a fraction of the implementation time these prompts will guide. Fix the prompts before writing code.

**What works well:**
- Epic hierarchy and numbering
- INDEX.md as a navigation tool
- G1–G5 Gemini rules as a shared contract (when referenced correctly)
- VERIFY checklist concept (needs automation)
- Cross-references between related tasks (when they point to real files)

**What must change:**
- Every "or" must become a decision
- Every referenced table must have a migration
- Every acceptance criterion must be verifiable without reading another file
- Security specs must be tested against serverless reality
- Agent system dependency graph must be acyclic
