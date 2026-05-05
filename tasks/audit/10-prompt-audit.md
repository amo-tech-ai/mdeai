# FORENSIC AUDIT REPORT — Task Prompts & Planning Documents

> **Auditor:** Claude Opus 4.6 (forensic mode)
> **Date:** 2026-04-05
> **Scope:** 66 task prompts (INDEX.md), 10 planning/PRD documents, 11 progress/audit documents, codebase verification
> **Method:** Parallel agent sweep of all documents + codebase state verification

---

## Executive Summary

**Overall judgment:** The project has excellent documentation volume and ambitious architecture, but suffers from **systemic inconsistencies between claimed state and actual state**, **circular dependencies in agent infrastructure**, and **unresolved architectural decisions blocking entire epics**. The CORE phase (19 files) is mostly implementation-ready with targeted fixes. The ADVANCED phase (41 files) is approximately 40% design-decision-pending and cannot be built as-written.

### Top 5 Risks

1. **Secrets in tracked `.env` file** — Shopify CLI token, Admin API token, Gadget secret committed to git. Codex flagged this as P0. Rotate immediately.
2. **CORS regression** — `jsonResponse()` in `_shared/http.ts` falls back to static `Access-Control-Allow-Origin: https://mdeai.co` when `req` not passed. Most edge functions call it without `req`, breaking localhost/preview origins.
3. **Circular dependency chain in E5 (Agent Infrastructure)** — 05D, 05F, 05G all require `agent_audit_log` table, but 05K is an unresolved *decision task* (pick A/B/C), not an implementation task. Nothing in E5 can ship until 05K resolves.
4. **3 unresolved architectural decisions block E8 (WhatsApp)** — 08F (ingress pattern), 08K (provider strategy), and 05J (SoT choice) are open design questions, not implementation tasks. 08B (the main WhatsApp adapter) is gated by all three.
5. **Progress Tracker claims don't match reality** — Onboarding claimed 100% but only Step 2 exists. ai-search marked TODO but is deployed. Auth marked "OAuth fix applied" but Auth Audit shows "PENDING VERIFICATION" for 72 days.

### Top 5 Strengths

1. **Tech Audit (18-mdeai-tech-audit.md)** — Most credible document. Correctly identifies timeline inflation, Hydrogen risk, Stripe Colombia complications, and agent maturity gaps.
2. **Risk Assessment (9-trio-best-practices-risks.md)** — Brutally honest. Identifies Paperclip deadlock (#2516), prompt injection CVE, state sync divergence. Recommends "Safest MVP: Paperclip + OpenClaw only."
3. **Reference documents (11A, 11B, VERIFY)** — Search stack architecture, LLM prompt templates, and verification checklist are well-crafted, internally consistent, and immediately usable.
4. **CORE task prompts have testable ACs** — 17/20 CORE files have explicit acceptance criteria. Most reference exact table names, function names, and routes.
5. **Security hardening was partially executed** — `verify_jwt: true` confirmed for all 10 functions in `config.toml`. P1 CRM deployed with Zod validation. Pipeline tables (leads, showings, applications, payments, neighborhoods) created in migrations.

### Overall Recommendation

**Buildable with major corrections.** CORE phase can ship after 8 targeted fixes. ADVANCED phase needs 3 architectural decisions resolved before any implementation begins. Production readiness requires secrets rotation and CORS fix immediately.

---

## Document-by-Document Audit

### 1. INDEX.md — Task Prompt Organization

**Summary:** Maps 66 task prompts across 4 phase folders (CORE/ADVANCED/PRODUCTION/REFERENCE). Claims 19 CORE files but directory contains 20.

**Strengths:**
- Clear phase folder structure with exit criteria
- Week-by-week sequencing within CORE
- Explicit "ship first" vs "ship after" ordering

**Errors and Inconsistencies:**
- **File count mismatch:** Line 12 says `core/` has 19 files. Line 160 says CORE has 20. Directory actually contains 20 files. The discrepancy is between the header table (19) and the file counts table (20).
- **Phase conflict:** `09E-production-readiness.md` is listed under CORE (line 48) but its YAML header says `phase: PRODUCTION`. This creates confusion about whether production tasks block CORE ship.
- **Originals folder undocumented:** `originals/` contains 48 files — full duplicates of phase folder contents. INDEX says "Original flat files kept for backward compatibility" but doesn't specify which copy is canonical.
- **Missing file in INDEX:** 14A-chatbot-cleanup.md is listed in "Chatbot Cleanup (Week 1)" section but the advanced section lists "Testing & Ops — 5 files" and only shows 4.

**Red Flags:**
- Duplicate maintenance burden: editing a prompt requires updating both `core/` and `originals/`. Drift is inevitable.
- "Backward compatibility" for a 4-month-old project is premature. Delete `originals/`.

**Critical Fixes:**
- **P0:** Reconcile file count (19 vs 20) — update header to 20
- **P1:** Decide: is 09E CORE or PRODUCTION? Update YAML header or move file
- **P1:** Delete `originals/` folder or add a script that syncs them
- **P2:** Add a "done" column to the INDEX tables showing completion status

**Best Practices Verification:**

| Category | Score | Reason |
|----------|-------|--------|
| Documentation clarity | PASS | Clean tables, clear structure |
| Implementation sequencing | PARTIAL | Week ranges present but no dependency DAG |
| Developer handoff quality | PARTIAL | Missing "done" status and dependency arrows |

**Scores:** Overall: 72/100 | Clarity: 85/100 | Technical correctness: 65/100 | Build readiness: 70/100 | Best-practice: 70/100

**Rewrite Recommendation:** Lightly revised — fix counts, add dependency DAG, delete originals.

---

### 2. CORE Task Prompts (20 files)

#### 2.1 Foundation & Security (4 files)

**01E-data-foundation.md** (478 lines)
- Well-structured with 11 sub-tasks (E1-001 through E1-011)
- **Issue:** E1-001 (seed script) listed before E1-002 (schema migration) but depends on it. Ordering chart exists but ACs don't enforce it.
- **Issue:** `neighborhoods` table marked "optional" — vague. Migration now exists (verified in codebase), so doc is stale.
- **Issue:** References `vector` extension and `ai_runs` table not created in this epic.
- **Score:** 74/100

**03E-security-hardening.md** (267 lines)
- 5 sub-tasks (E3-001 through E3-005) covering auth, Zod, CORS, rate limits, Stripe webhooks
- **Issue:** Rate limit implementation suggests "in-memory Map" but edge functions are stateless — Map resets per invocation. Must use Supabase table or external store.
- **Issue:** Stripe webhook "does NOT require JWT" creates inconsistency with E3-001 "all functions validate auth."
- **Partially resolved:** `verify_jwt: true` now confirmed in config.toml for all functions. Doc should be updated.
- **Score:** 71/100

**13A-e3-edge-security-extensions.md** (68 lines)
- Admin RBAC, timeouts, JWT story doc
- **Issue:** References `user_roles` table not created in any E1 migration. Who creates it?
- **Issue:** Timeout testing AC says "max 30s" but no automated verification method specified.
- **Score:** 65/100

**13E-gemini-g1g5-edge-acceptance-audit.md** (61 lines)
- Gemini compliance matrix across all edge functions
- **Issue:** G4 rule says "NEVER log the key value" but doesn't prevent accidental logging of request headers (which contain the key).
- **Issue:** E2-003 AC doesn't mention G1-G5 compliance — integration gap.
- **Score:** 68/100

#### 2.2 Pipeline & Landlord Comms (7 files)

**02E-lead-to-lease-pipeline.md** (535 lines)
- Most comprehensive CORE task. 9 sub-tasks covering lead → showing → application → booking → payment.
- **Issue:** Prerequisite migration (idempotency_keys, notifications) defined inline but not in a separate migration file. Schema is assumed, not specified.
- **Issue:** E2-001 says "do NOT add anonymous/no-JWT path" but 08C (also CORE) requires anonymous WhatsApp leads. Phasing doc (02H) exists but contradicts this.
- **Issue:** `resource_id` + `booking_type` pattern referenced but no migration shows how existing `bookings` table is modified.
- **Score:** 70/100

**02H-e2-pipeline-phasing-web-vs-whatsapp.md** (44 lines)
- Clarification doc, not a feature. Should be merged into 02E.
- **Issue:** States WhatsApp leads are Phase 2, but 08C is CORE priority.
- **Score:** 55/100 — should be deleted and absorbed into 02E.

**13B-e2-payment-rollback-idempotency.md** (53 lines)
- Stripe rollback playbook and webhook idempotency
- **Issue:** `stripe_event_id UNIQUE` column migration not provided — assumed in E2 prerequisite.
- **Issue:** No actual rollback procedure test (attempt refund and verify state).
- **Score:** 66/100

**10A-crm-api-envelope.md** (50 lines) — **DONE**. No issues. Score: 92/100.

**10B-crm-ui-pipeline.md** (61 lines) — **DONE**. No issues. Score: 90/100.

**10C-crm-deploy-smoke.md** (49 lines)
- Hardcoded project ID `zkwcbyxiwklihegjhuql`. No test data specified.
- **Score:** 62/100

**10E-crm-real-estate.md** (25 lines) — Epic index. Dependencies unclear. Score: 60/100.

#### 2.3 Frontend & Search (3 files)

**04E-frontend-rental-flow.md** (289 lines)
- 5 sub-tasks: MapView, ListingDetail, NeighborhoodCard, ModerationQueue, LandlordDashboard
- **Issue:** WCAG 2.1 AA mentioned in ACs but no testing tool specified (axe, Lighthouse).
- **Issue:** No dependency relationships between E4 tasks (parallelizable? sequential?).
- **Score:** 73/100

**04A-ai-search-wire.md** (59 lines)
- Wire useAISearch to ai-search edge function
- **Issue:** `searchBodySchema` referenced but not linked to actual function file.
- **Issue:** Manual smoke test ("network tab shows ai-search invocation") — not automated.
- **Score:** 67/100

**09E-production-readiness.md** (394 lines)
- 6 sub-tasks: env vars, analytics, ai_runs, audit log, E2E tests, monitoring
- **CRITICAL:** Phase header says PRODUCTION but INDEX lists it under CORE.
- **Issue:** "agent_audit_log table does NOT exist" + "Do NOT assume E5-001 creates it" — strong warning but no resolution path.
- **Score:** 63/100

#### 2.4 WhatsApp v1 (4 files)

**08A-infobip-whatsapp-webhook.md** (81 lines)
- Infobip webhook config, signature verification
- **Issue:** Signature verification algorithm not specified. No docs link.
- **Score:** 70/100

**08C-wa-lead-capture.md** (76 lines)
- WhatsApp → lead-capture flow
- **Issue:** Creates separate `wa-lead-capture` function but E2-001 extends `p1-crm`. Contradiction.
- **Issue:** `source: 'whatsapp'` field not defined in E2-001 lead schema.
- **Score:** 64/100

**08L-wa-apartment-search.md** (107 lines)
- WhatsApp apartment search via ai-search bridge
- **Issue:** Hardcoded `https://mdeai.co/apartments/{id}` contradicts 14A cleanup.
- **Issue:** "Spanish message → Spanish response" heuristic undefined.
- **Issue:** Reply "1"/"2"/"3" for showing creates implicit conversation state not specified.
- **Score:** 62/100

**02F-e2-showing-reminders-cron.md** (46 lines)
- Showing reminders via cron
- **Issue:** Minimal ACs (3 checkboxes). No anti-spam test. Metadata query assumes undefined schema.
- **Score:** 60/100

#### 2.5 Cleanup & Docs (2 files)

**14A-chatbot-cleanup.md** (116 lines)
- Remove wasted ai-router call, delete orphaned files, fix hardcoded URLs
- **Issue:** grep for `eyJhbGciOi` (JWT prefix) could match false positives.
- **Issue:** All verification is manual ("Chat still works in browser") — no automated tests.
- **Score:** 65/100

**13C-docs-hygiene-prd-index-rice-dod.md** (42 lines)
- Fix broken links, RICE sort, DoD template
- **Issue:** "Sort by score **or** rename column" — ambiguous AC (which one?).
- **Issue:** No link-checking tool specified.
- **Score:** 55/100

---

### 3. ADVANCED Task Prompts (41 files)

#### 3.1 Agent Infrastructure — E5 (14 files)

**Systemic problem:** The entire E5 epic has a **circular dependency on 05K** (agent_audit_log decision task). 05D, 05F, and 05G all require logging to `agent_audit_log`, but 05K is a *design decision* (pick A/B/C), not an implementation. Until 05K ships, nothing that requires audit logging can be completed.

| File | Score | Key Issue |
|------|-------|-----------|
| 05A (CEO instructions) | 68 | References CMO/CTO/OpsManager agents that may not exist |
| 05B (workspace bind) | 72 | Hardcoded `/home/sk/mde` path, no env var |
| 05C (Hermes config) | 65 | Instructions file location undefined, API key provisioning unclear |
| 05D (Hermes adapter) | 58 | Blocked by 05K, output parser undefined, error fallback undefined |
| 05E (epic index) | 55 | Suggested order doesn't match dependency DAG |
| 05F (heartbeat) | 60 | "Daily 15-minute cycle" ambiguous, edge function specs missing |
| 05G (approval gates) | 55 | Blocked by 05K, notification system undefined, human approval UI missing |
| 05H (OpenClaw adapter) | 58 | OpenClaw endpoint spec missing, blocked by 05M |
| 05I (API lifecycle) | 62 | 409 reconciliation algorithm undefined |
| 05J (goals sync) | 50 | Open design decision, AC allows passing without goal IDs |
| 05K (audit log ordering) | 52 | Decision task blocking 3+ other tasks, no implementation |
| 05L (gates phase 1) | 65 | Should block 05G but 05G is listed Open |
| 05M (gateway health) | 58 | Security audit command may not exist in OpenClaw |
| 05N (human escalation) | 60 | Frustration signal detection undefined, 08D sync required |

**E5 Average Score: 60/100**

#### 3.2 Hermes Intelligence — E6 (7 files)

| File | Score | Key Issue |
|------|-------|-----------|
| 06A (ranking edge) | 70 | Assumes `apartments` columns (wifi_speed, host_rating) that may not exist |
| 06B (score breakdown UI) | 75 | Well-specified, minor WCAG gaps |
| 06C (taste profile) | 65 | Table dependency unclear (inline vs 07A), decay formula missing |
| 06D (market snapshot) | 62 | 3 scheduler options with no decision, occupancy formula vague |
| 06E (epic index) | 55 | G1-G5 enforcement locations not mapped |
| 06F (eval dataset) | 68 | Good idea, but baseline and validation method undefined |
| 06G (post-showing suggestions) | 58 | Trigger condition and suggestion API both undefined |

**E6 Average Score: 65/100**

#### 3.3 Contract Automation — E7 (5 files)

| File | Score | Key Issue |
|------|-------|-----------|
| 07A (P2 tables) | 68 | Duplicate definitions with 06C/06D, RLS policies not provided |
| 07B (contract analysis) | 62 | Gemini prompt text missing, risk score algorithm undefined |
| 07C (lease review UI) | 65 | Component states don't map to DB status values |
| 07D (test fixtures) | 60 | Markdown fixtures ≠ PDF input format, accuracy validation unclear |
| 07E (epic index) | 50 | Minimal 27-line index, no dependency ordering |

**E7 Average Score: 61/100**

#### 3.4 WhatsApp v2 + OpenClaw — E8v2 (8 files)

**Systemic problem:** Two unresolved architectural decisions (08F ingress pattern, 08K provider strategy) block the main adapter (08B). Neither is an implementation task — they're design docs requiring owner sign-off.

| File | Score | Key Issue |
|------|-------|-----------|
| 08B (WhatsApp adapter) | 50 | Blocked by 08F, 08H, 08K, 05M — cannot be built |
| 08D (human handover) | 62 | Confidence source undefined, RBAC missing |
| 08E (epic index) | 55 | 13-step execution order, complex gating |
| 08F (ingress architecture) | 60 | Open design decision, not implementation |
| 08G (correlation/observability) | 65 | Header name undefined ("or agreed name") |
| 08H (Phase 1 echo adapter) | 68 | Clear scope, but echo vs static ack undecided |
| 08I (domain skills) | 60 | OpenClaw skill format undefined |
| 08K (provider strategy) | 55 | Open design decision, circular phrasing |

**E8v2 Average Score: 59/100**

#### 3.5 Testing, Trio, & Ops (7 files)

| File | Score | Key Issue |
|------|-------|-----------|
| 02G (E2E smoke) | 65 | Stub contract undefined |
| 04B (trip planner wire) | 68 | Schema reference missing |
| 04F (move-in checklist) | 65 | Route spec undecided |
| 13D (landlord journey doc) | 62 | Documentation location undecided |
| 12A (trio integration) | 58 | Minimum flows vague, duplicate ranking unresolved |
| 12B (staging runbook) | 60 | No actual commands provided, on-call undefined |
| 12C (feature flags) | 62 | Flag implementation method undecided |

#### 3.6 Production (1 file)

**08J-lobster-workflows-spike.md** — Research spike. Outcome is a recommendation, not implementation. Score: 65/100.

#### 3.7 Reference (4 files)

| File | Score | Notes |
|------|-------|-------|
| 11A (search stack) | 90 | Best architecture reference. Clear, actionable. |
| 11B (LLM prompts) | 88 | Copy-paste ready. Spanish/English. Safety appendix. |
| VERIFY checklist | 85 | Comprehensive. Anti-patterns flagged. Output template. |
| DIAGRAMS sync | 70 | Meta-task. Prevents Hermes CLI/edge conflation. |

---

### 4. Planning & PRD Documents

#### 4.1 Master Plan (3-master-plan.md)
- **Credibility: 40/100.** Claims security is locked (it wasn't until recently). Phase 1 Sprint 1 is still TODO despite being 4+ weeks past the "Now" date. Treats experimental agents as production-ready.
- **Key contradiction:** "28 tables | RLS on all" shown in diagram but all had 0 rows at time of writing.
- **Rewrite recommendation:** Rename to `roadmap-aspirational.md`. Separate what exists from what's planned.

#### 4.2 PRD (21-prd.md)
- **Credibility: 65/100.** Feature specs are solid but assume Gadget/security are ready (they weren't). Missing acceptance criteria for Phase 1 completion.
- **Key issue:** "Freshness Badges — Roasted X Hours Ago" assumes Shopify metafields exist and sync. They don't.
- **Rewrite recommendation:** Add a "current state" section that honestly documents what works vs what's aspirational.

#### 4.3 PRD Draft (19-prd-draft.md)
- **Credibility: 85/100.** Most grounded document. "The fastest path to a real marketplace is adding commerce to what already exists — not rebuilding everything." Best advice in the entire doc set.
- **Rewrite recommendation:** Keep as-is. This should be the canonical PRD.

#### 4.4 Tech Audit (18-mdeai-tech-audit.md)
- **Credibility: 95/100.** Correctly identifies: Hydrogen rewrite is 8-12 weeks not 2-3, triple DB sync has no conflict resolution, Stripe Connect limited in Colombia, WhatsApp approval takes 2-4 weeks.
- **Rewrite recommendation:** Keep as-is. Reference from all other docs.

#### 4.5 Agentic Trio Plan (24-agentic-trio-plan.md)
- **Credibility: 50/100.** Treats experimental tools as production-ready. Timeline (Month 2: OpenClaw installed) underestimates by 2-4 weeks. Hermes is Python in a TypeScript stack — language mismatch acknowledged but not resolved.
- **Key issue:** "Phase 1 does NOT need OpenClaw, Hermes, or Paperclip" — correct statement that contradicts the plan's own urgency.

#### 4.6 Trio Best Practices & Risks (9-trio-best-practices-risks.md)
- **Credibility: 95/100.** Identifies Paperclip deadlock (#2516), OpenClaw CVE-2026-25253, and state sync divergence. Recommends MVP without Hermes.
- **Rewrite recommendation:** Keep. This is the truth document for agent work.

---

### 5. Progress & Audit Documents

#### 5.1 Progress Tracker
- **Accuracy: 68/100.** Multiple stale/false claims:
  - Onboarding Wizard claimed 100% — only Step 2 exists, navigation broken
  - ai-search marked TODO — actually deployed (never called)
  - Auth marked "OAuth fix applied" — Auth Audit shows "PENDING VERIFICATION" for 72 days
- **Rewrite recommendation:** Heavily revised. Add "Last Verified" dates. Cross-check each claim against codebase.

#### 5.2 Auth Audit
- **Accuracy: 60/100.** Last updated 2026-01-23 (72 days stale). All items still marked `[ ]` unchecked. If site is live with all routes returning 200, this should be updated or closed.

#### 5.3 Database Schema Audit
- **Accuracy: 95/100.** Authoritative. Correctly inventories 24 existing tables. Clear about 0 rows.

#### 5.4 Edge Function Audit
- **Accuracy: 92/100.** Detailed findings pre-date p1-crm deployment. 5 P0 security issues documented. Now partially resolved (verify_jwt: true confirmed).

---

## Cross-Document Audit

### A. Cross-Document Contradictions

| Contradiction | Document A | Document B | Severity |
|--------------|-----------|-----------|----------|
| Onboarding 100% vs broken | Progress Tracker | Forensic Audit (04-forensic-audit.md) | CRITICAL |
| ai-search TODO vs deployed | Progress Tracker | CHANGELOG | HIGH |
| Auth pending vs routes 200 | Auth Audit | CHANGELOG | HIGH |
| CORE has 19 files vs 20 | INDEX.md line 12 | INDEX.md line 160 | MEDIUM |
| 09E is CORE vs PRODUCTION | INDEX.md | 09E YAML header | HIGH |
| E2-001 no anonymous vs 08C anonymous WA | 02E | 08C | HIGH |
| 28 tables vs 24 existing | CLAUDE.md | Database Schema Audit | MEDIUM |
| Hydrogen as future vs keep Vite | Master Plan | PRD Draft (19) | MEDIUM |
| Code splitting done vs not | Overview.md | Forensic Audit | MEDIUM |
| `useIntentRouter.ts` exists vs deleted | CLAUDE.md | git status / codebase | MEDIUM |
| `ChatRightPanel.tsx` exists vs deleted | Implied in docs | git status / codebase | LOW |

### B. Missing System Links

1. **PRD → Task Prompts:** PRD describes "Freshness Badges" but no task prompt implements it. PRD describes "Vendor Portal" but no CORE task covers vendor onboarding.
2. **Supabase schema → Product flows:** `user_roles` table referenced in 13A (RBAC) but no migration creates it. `agent_audit_log` referenced by 5 tasks but no migration exists.
3. **AI agents → Execution paths:** Paperclip CEO references CMO/CTO/OpsManager sub-agents but no task creates them. Hermes CLI output format never specified but adapter (05D) parses it.
4. **Booking flows → Payment flows:** E2-005 references `Idempotency-Key` header but idempotency_keys table schema never fully specified.
5. **Data model → UI screens:** 07C (lease review UI) maps 4 component states but 07B (edge function) defines 4 different DB status values. No mapping document.
6. **Confidence score → Usage:** Three tasks (05N, 08D, 08K) reference "confidence < 0.3" but no task defines where confidence scores come from.

### C. Execution Risk

**CORE phase:** Mostly buildable. 17/20 files have testable ACs. Security hardening partially complete (verify_jwt done, CORS partially done). Pipeline tables created. Main risks: CORS regression, secrets in .env, and 3 tasks with vague or manual-only verification.

**ADVANCED phase:** High-risk / fragmented. 3 unresolved architectural decisions (08F, 08K, 05J) block entire epics. Circular dependency on 05K blocks E5 agent infrastructure. 12 out of 41 files are "PARTIAL" or "NO" testability.

**Full system:** Over-scoped for current phase. The 66-file prompt system covers 22 weeks of work but the CORE phase alone (8 weeks planned) has 15 open tasks with at least 8 requiring fixes before implementation.

### D. Architecture Risk

- **Agent trio (OpenClaw/Hermes/Paperclip):** Upstream bugs (#2516 deadlock, CVE-2026-25253), language mismatch (Python Hermes in TypeScript stack), no cost model. Risk Assessment doc correctly flags this.
- **Triple data sync (Shopify/Gadget/Supabase):** No conflict resolution strategy. Tech Audit correctly flags this.
- **Gemini dependency:** Single AI provider with no fallback strategy. If Gemini pricing changes or endpoint deprecates, all 6 AI functions break.

### E. Product Risk

- **Zero test data:** All 28 tables still have 0 rows (migrations exist but no seed script has been run).
- **Zero Shopify products:** Dev store has no products. Commerce flow untestable.
- **Manual verification culture:** 5+ tasks rely on "check in browser" or "inspect network tab" instead of automated tests.

---

## Priority Fix Plan

### Immediate Fixes (before any new work)

| # | Fix | File(s) Affected | Effort |
|---|-----|-------------------|--------|
| 1 | **Rotate all secrets in `.env`** — move Shopify CLI token, Admin API token, Gadget secret to `.env.local`. Reset compromised tokens. | `.env`, `.env.local` | 1 hour |
| 2 | **Fix CORS regression** — ensure all edge functions pass `req` to `jsonResponse()` or update fallback to check `ALLOWED_ORIGINS` dynamically | `_shared/http.ts`, all 10 edge functions | 2 hours |
| 3 | **Resolve 05K (audit log decision)** — pick Option B (stdout stub) so E5 tasks can proceed. Update 05D/05F/05G ACs to match. | 05K, 05D, 05F, 05G | 30 min |
| 4 | **Decide 08F (WhatsApp ingress pattern)** — pick Option A (Infobip primary) to unblock E8 | 08F, 08B, 08E | 30 min |
| 5 | **Remove deleted files from CLAUDE.md** — `useIntentRouter.ts` and `ChatRightPanel.tsx` are deleted but still listed | CLAUDE.md | 15 min |

### Before Implementation

| # | Fix | File(s) Affected | Effort |
|---|-----|-------------------|--------|
| 6 | **Fix INDEX.md file count** — update header to 20, reconcile 09E phase | INDEX.md, 09E header | 15 min |
| 7 | **Merge 02H into 02E** — phasing clarification should be in the pipeline doc, not a separate file | 02E, 02H | 30 min |
| 8 | **Delete `originals/` folder** — or add sync script. Dual maintenance will drift. | originals/ | 15 min |
| 9 | **Add `user_roles` table to E1 or E3 migration** — 13A references it, nothing creates it | 01E or 13A | 30 min |
| 10 | **Specify rate limit storage** — 03E suggests in-memory Map but edge functions are stateless. Use Supabase table or Upstash Redis. | 03E | 15 min |
| 11 | **Define confidence score source** — centralize in one doc, link from 05N, 08D, 08K | New reference doc or 06E | 30 min |
| 12 | **Resolve 08C vs E2-001 conflict** — either E2-001 accepts anonymous WA leads or 08C creates its own function | 02E, 08C | 30 min |
| 13 | **Add automated tests to 14A** — replace "check in browser" with Playwright assertions | 14A | 30 min |
| 14 | **Update Progress Tracker** — mark onboarding as 50%, ai-search as "deployed/unwired", auth as "needs verification" | progress.md | 30 min |

### Before Production

| # | Fix | File(s) Affected | Effort |
|---|-----|-------------------|--------|
| 15 | Run seed script (E1-001) and verify all 28 tables have data | 01E | 2 hours |
| 16 | Add Shopify test products to dev store | External | 1 hour |
| 17 | Complete Auth Audit verification or mark it as resolved | auth-audit.md | 1 hour |
| 18 | Add Claude/Anthropic as Gemini fallback in at least `ai-chat` function | ai-chat/index.ts | 2 hours |
| 19 | Create E2E Playwright test for critical path (search → detail → booking) | E9-005 scope | 4 hours |
| 20 | Resolve all open design decisions (08K, 05J) before ADVANCED phase begins | 08K, 05J | 1 hour |

---

## Final Scorecard

| Category | Score | Rationale |
|----------|-------|-----------|
| **Product readiness** | 55/100 | Features well-designed but zero test data, zero products, and 5+ unresolved design decisions |
| **Technical readiness** | 62/100 | Security partially hardened, migrations created, but CORS regression, secrets leaked, agents untested |
| **Documentation quality** | 68/100 | High volume, mostly well-structured, but systemic inconsistencies and stale claims undermine trust |
| **Best-practice alignment** | 65/100 | Task prompts follow good AC patterns but rate limiting, testing, and privacy compliance are weak |
| **Build readiness** | 58/100 | CORE is ~75% buildable after fixes. ADVANCED is ~40% buildable due to circular deps and open decisions |
| **Production readiness** | 32/100 | Secrets in git, CORS broken for dev, 0 rows, 0 products, 0 E2E tests, stale progress claims |
| **Overall** | 55/100 | |

---

## Final Verdict

### Buildable with major corrections.

The project has strong bones: 178 React components, clean Supabase schema with RLS, 10 deployed edge functions, and a comprehensive task system. The Tech Audit and Risk Assessment docs are unusually honest and should be trusted over the Master Plan.

**However:**
1. The `.env` secret leak is an active emergency. Rotate tokens today.
2. The CORS regression makes all edge functions fail from localhost. Fix before any dev work.
3. The Progress Tracker is unreliable — at least 4 claims are demonstrably false. No document should cite it as authoritative until audited.
4. The ADVANCED phase (63% of all prompts) cannot be built until 3 design decisions are resolved and the E5 circular dependency is broken.
5. The Master Plan's timeline is 4-6 weeks behind reality. Rename it to avoid confusion.

**Path forward:** Fix the 5 immediate issues. Build CORE (15 open tasks, ~8 weeks). Resolve ADVANCED design decisions during CORE build. Do not start ADVANCED until CORE exit criteria are met.

---

## APPENDIX: CODEBASE VERIFICATION — Will Each CORE Task Succeed?

> Cross-referenced every CORE task prompt against actual migrations, edge functions, components, hooks, and config files. Verified whether prerequisites exist, workflows complete, and user journeys function end-to-end.

### Verification Matrix

| # | Task | Goal | Will Succeed? | Status |
|---|------|------|:---:|--------|
| 1 | 01E Data Foundation | Schema + seed + indexes + RLS | **PARTIAL** | Migrations exist, 24 apartments seeded, indexes unaudited, types not regenerated |
| 2 | 03E Security Hardening | JWT + Zod + CORS + rate limits + Stripe webhook | **PARTIAL** | JWT/CORS/Zod/rate-limit infra exist; Stripe webhook missing entirely |
| 3 | 13A Edge Security Extensions | Service role ban + RBAC + timeouts + JWT doc | **NO** | Service role in user endpoints, RBAC not enforced, JWT matrix missing |
| 4 | 13E Gemini G1-G5 Audit | Compliance matrix for all Gemini functions | **NO** | 0/7 functions comply with G1-G5; no JSON schema, wrong temps, no logging |
| 5 | 02E Lead-to-Lease Pipeline | Lead → showing → application → booking → payment | **PARTIAL** | Lead + showing + application work; booking + payment functions missing |
| 6 | 02H Pipeline Phasing | Clarify web-first vs WhatsApp phasing | **NO** | Edits not applied to 02E; meta-task not executed |
| 7 | 13B Payment Rollback | Stripe rollback playbook + idempotency tests | **PARTIAL** | DB columns exist; webhook handler + playbook + tests missing |
| 8 | 10A CRM API Envelope | Typed client + JSON parsing | **YES** | Done. Envelope, client, and Vitest tests all verified. |
| 9 | 10B CRM UI Pipeline | CRM UI CTAs + My Rentals page | **YES** | Done. Components, hooks, RLS all verified. |
| 10 | 10C CRM Deploy Smoke | Deploy p1-crm + smoke test | **PARTIAL** | Function deployed in config.toml; no smoke test evidence recorded |
| 11 | 02F Showing Reminders | T-24h/T-1h cron reminders | **NO** | No cron job, no reminder function, no notification send logic |
| 12 | 04E Frontend Rental Flow | MapView + ListingDetail + NeighborhoodCard + LandlordDashboard | **NO** | MapView, PricePin, NeighborhoodCard, LandlordDashboard don't exist |
| 13 | 04A AI Search Wiring | Wire useAISearch to ai-search edge | **PARTIAL** | Hook exists but calls `ai-chat` instead of `ai-search`; response format mismatch |
| 14 | 09E Production Readiness | ai_runs logging + E2E tests + monitoring | **PARTIAL** | ai_runs table exists; only ai-chat logs; 0 Playwright tests |
| 15 | 14A Chatbot Cleanup | Remove wasted calls + orphaned files + hardcoded secrets | **YES** | Problems 1 & 3 already solved; file deletions safe; straightforward cleanup |
| 16 | 08A Infobip Webhook | WhatsApp webhook receiver + outbound sender | **NO** | No edge function exists; no Infobip client anywhere |
| 17 | 08C WA Lead Capture | WhatsApp → lead-capture flow | **NO** | No wa-lead-capture function; depends on 08A |
| 18 | 08L WA Apartment Search | WhatsApp apartment search via ai-search | **NO** | No function exists; depends on 04A (which itself calls wrong endpoint) |
| 19 | 02F Showing Reminders | T-24h/T-1h cron (duplicate of #11) | **NO** | Same as #11 |
| 20 | 13C Docs Hygiene | Fix broken links + RICE sort + DoD | **NO** | Broken links to 04B, 04F; no DoD template exists |

### Results Summary

| Outcome | Count | Tasks |
|---------|-------|-------|
| **YES** (will succeed) | 3 | 10A, 10B, 14A |
| **PARTIAL** (achievable with fixes) | 7 | 01E, 03E, 02E, 13B, 10C, 04A, 09E |
| **NO** (will fail as-written) | 10 | 13A, 13E, 02H, 02F, 04E, 08A, 08C, 08L, 13C, 11 |

**Success rate: 3/20 (15%) will succeed. 7/20 (35%) partial. 10/20 (50%) will fail.**

---

### Detailed Failure Analysis

#### Foundation & Security (Tasks 1-4)

**01E Data Foundation — PARTIAL**
- Migrations exist for all P1 tables (neighborhoods, leads, showings, rental_applications, payments, property_verifications)
- Seed script inserts 24 apartments, 12 neighborhoods, 5 user profiles with `ON CONFLICT` upsert
- RLS uses correct `(select auth.uid())` subquery pattern
- **Gaps:** Index audit (E1-003) never completed. `database.types.ts` not regenerated post-migration. pgvector extension not enabled (blocks E6 later).

**03E Security Hardening — PARTIAL**
- `verify_jwt = true` confirmed for all 10 functions in config.toml
- CORS: `_shared/http.ts` has `ALLOWED_ORIGINS` with proper `getCorsHeaders(req)` function
- Zod validation exists in 5/10 functions (ai-chat, ai-router, ai-search, p1-crm, rentals)
- Rate limiting: `_shared/rate-limit.ts` exists with sliding window; p1-crm uses it
- **Gaps:** `ai-optimize-route`, `google-directions`, `ai-suggest-collections`, `rules-engine` — no Zod schemas verified. E3-005 (Stripe webhook) function does not exist at all. Rate limit values not tuned to spec (10 AI/30 search).

**13A Edge Security Extensions — FAIL**
- `user_roles` table exists (remote_schema.sql) with admin/super_admin/moderator enum
- Timeout logic exists in shared Gemini helper (30s AbortController)
- **Fatal:** `ai-chat` uses `SUPABASE_SERVICE_ROLE_KEY` for user-triggered requests — security violation. No RBAC check function exists in any edge function. `tasks/docs/jwt-verification-matrix.md` does not exist. DB query timeout not configured on Supabase client.

**13E Gemini G1-G5 Audit — FAIL**
- 7 functions call Gemini. Zero comply with G1-G5:
  - **G1 (JSON schema):** 0/7 use `responseMimeType: "application/json"` + `responseSchema`
  - **G2 (temperature):** `ai-search` uses `temperature: 0.1` — violates spec
  - **G3 (grounding):** 0/7 use Search Grounding API
  - **G4 (api-key auth):** Shared helper uses Bearer correctly, but `rentals` bypasses helper
  - **G5 (ai_runs logging):** `insertAiRun()` helper exists but only `ai-chat` calls it
- `tasks/audit/gemini-g1g5-matrix.md` does not exist

#### Pipeline (Tasks 5-11)

**02E Lead-to-Lease Pipeline — PARTIAL**

The pipeline journey today:

```
Lead Creation    ✅  p1-crm create_lead works (JWT + idempotency)
     ↓
Showing Schedule ✅  p1_schedule_tour_atomic() DB function works
     ↓
Show Reminders   ❌  No cron job, no reminder function
     ↓
Application      ✅  p1_start_rental_application_atomic() works
     ↓
AI Summary       ❌  Gemini integration for summaries not implemented
     ↓
Booking Create   ❌  E2-004 edge function does not exist
     ↓
Payment Webhook  ❌  E2-005 edge function does not exist
     ↓
Confirmation     ❌  No UI component; payment flow incomplete
```

**What works today:** Lead → Showing → Application (3 of 8 steps).
**What's missing:** Reminders, AI summaries, Booking, Payment, Confirmation (5 of 8 steps).
**Infra ready but untested:** `idempotency_keys` table, `payments.stripe_event_id UNIQUE` index, `notifications` table.

#### Frontend (Tasks 12-13)

**04E Frontend Rental Flow — FAIL**

| Component | Exists? | Notes |
|-----------|---------|-------|
| MapView (rental-focused) | NO | Only `ExploreMapView` and `places/MapView` exist — neither rental-specific |
| PricePin | NO | Component not found anywhere |
| NeighborhoodCard | NO | Empty `neighborhoods/` folder |
| LandlordDashboard | NO | No `/host/dashboard` page |
| RentalsListingDetail | YES | Exists, partially implements listing detail |
| RentalsSearchResults | YES | Exists with search/filter UI |
| RentalsIntakeWizard | YES | Exists with intake flow |
| ApartmentDetail | YES | Exists at `/apartments/:id` with rent actions |
| GoogleMapView | YES | Exists with `@types/google.maps` integration |

4 of 5 sub-tasks require components that don't exist.

**04A AI Search Wiring — PARTIAL**

Critical bug: `useAISearch.ts` line 45 calls `ai-chat` instead of `ai-search`:
```typescript
const { data, error } = await supabase.functions.invoke("ai-chat", {
  body: { messages: [...], tab: "explore", context: { searchMode: true, filters } },
});
```
Should be:
```typescript
const { data, error } = await supabase.functions.invoke("ai-search", {
  body: { query, domain, filters, limit },
});
```
Response parsing expects `data?.toolResults` (ai-chat format) but ai-search returns `{ results: SearchResult[] }`.

#### WhatsApp (Tasks 16-18)

All three WhatsApp tasks will fail. No Infobip integration exists:
- No `whatsapp-webhook` edge function
- No `wa-lead-capture` edge function
- No `wa-apartment-search` edge function
- No Infobip client library
- `INFOBIP_API_KEY` not referenced in any function code

These are greenfield implementations — the tasks are well-specified but nothing has been built.

#### Production & Cleanup (Tasks 14-15, 20)

**14A Chatbot Cleanup — YES** (already partially done)
- `routeMessage()` no longer called in useChat.ts
- No hardcoded Supabase URLs found (grep returns 0)
- No hardcoded JWT tokens found (grep returns 0)
- `useIntentRouter.ts` and `ChatRightPanel.tsx` already deleted in working tree
- Task is mostly pre-solved. Ship it.

**09E Production Readiness — PARTIAL**
- `ai_runs` table exists with full schema (agent_type enum, token counts, cost estimate)
- `insertAiRun()` helper exists in shared code
- Only `ai-chat` confirmed to call it — 6 other AI functions don't log
- Zero Playwright E2E tests exist (config present, no specs)

---

### User Journey End-to-End Verification

#### Journey 1: Renter searches → views listing → books apartment

| Step | Works? | Evidence |
|------|--------|----------|
| Open `/rentals` | YES | Route exists, RentalsSearchResults renders |
| Search by filters | PARTIAL | UI filters exist but call `ai-chat` instead of `ai-search` |
| View listing detail | YES | `/apartments/:id` renders ApartmentDetail |
| See neighborhood info | NO | NeighborhoodCard doesn't exist |
| See map with nearby | NO | Rental MapView doesn't exist |
| Schedule showing | YES | `Schedule tour` CTA → p1-crm works |
| Get reminder | NO | No cron, no notification system |
| Submit application | YES | `Start application` CTA → p1-crm works |
| Make payment | NO | No booking or payment edge function |
| Get confirmation | NO | No confirmation UI |

**Verdict: 4/10 steps work. Journey breaks at payment.**

#### Journey 2: Landlord manages listings

| Step | Works? | Evidence |
|------|--------|----------|
| View dashboard | NO | LandlordDashboard doesn't exist |
| See applications | NO | No host-facing application view |
| Approve/reject | NO | No host action functions |
| View payments | NO | No host payment view |

**Verdict: 0/4 steps work. Landlord journey completely unbuilt.**

#### Journey 3: WhatsApp lead capture

| Step | Works? | Evidence |
|------|--------|----------|
| User sends WA message | NO | No Infobip webhook |
| System captures lead | NO | No wa-lead-capture function |
| User searches apartments | NO | No wa-apartment-search function |
| User gets results | NO | No outbound Infobip sender |

**Verdict: 0/4 steps work. WhatsApp journey completely unbuilt.**

#### Journey 4: CRM agent manages pipeline

| Step | Works? | Evidence |
|------|--------|----------|
| View `/dashboard/rentals` | YES | DashboardRentals component renders |
| See leads pipeline | YES | useP1Pipeline hook queries leads |
| Schedule tour for lead | YES | ApartmentRentActions CTA works |
| Start application | YES | Atomic DB function works |
| Record payment | PARTIAL | p1-crm `record_payment` action exists, untested |

**Verdict: 4/5 steps work. Best-functioning journey.**

---

### Recommended Build Order (Based on Verification)

Tasks ordered by: (1) already working, (2) close to working, (3) greenfield.

| Priority | Task | Effort | Unblocks |
|----------|------|--------|----------|
| **Ship now** | 14A Chatbot Cleanup | 1 hour | Clean codebase |
| **Ship now** | 10C CRM Smoke Test | 2 hours | Verified deploy |
| **Fix first** | 04A AI Search Wiring | 2 hours | Fix `ai-chat` → `ai-search` call + response parsing |
| **Build next** | 13E G1-G5 Audit | 4 hours | Create compliance matrix, add JSON schema to functions |
| **Build next** | 01E remaining (indexes + types) | 2 hours | Complete data foundation |
| **Build next** | 03E remaining (Zod for 4 functions) | 3 hours | Complete validation |
| **Build next** | 13A RBAC + service role fix | 4 hours | Security baseline |
| **Build next** | 09E ai_runs logging (6 functions) | 3 hours | Cost tracking |
| **Build next** | 02E E2-004 booking-create | 6 hours | Unblocks payment flow |
| **Build next** | 02E E2-005 payment-webhook | 6 hours | Completes money path |
| **Build next** | 04E MapView + NeighborhoodCard | 8 hours | Core rental UX |
| **Build next** | 04E LandlordDashboard | 6 hours | Host journey |
| **Greenfield** | 08A Infobip webhook | 4 hours | WhatsApp foundation |
| **Greenfield** | 08C WA lead capture | 4 hours | WA leads |
| **Greenfield** | 08L WA apartment search | 4 hours | WA search |
| **Greenfield** | 02F Showing reminders cron | 3 hours | Notifications |
| **Defer** | 02H Merge into 02E | 30 min | Doc hygiene |
| **Defer** | 13B Rollback playbook | 2 hours | Ops readiness |
| **Defer** | 13C Docs hygiene | 1 hour | Link fixes |

---

*Verification conducted 2026-04-05 by Claude Opus 4.6. 3 parallel verification agents cross-referenced 20 CORE task prompts against actual codebase state (migrations, edge functions, components, hooks, config). 8 parallel agents total across audit + verification passes.*
