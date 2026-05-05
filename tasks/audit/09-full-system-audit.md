# 09 — Full System Forensic Audit

**Auditor:** Claude Opus 4.6 (Senior Software Architect + Supabase Expert)
**Date:** 2026-04-05
**Scope:** Database, Edge Functions, Frontend, Agents, Security, Pipelines
**Verdict:** DEPLOY BLOCKED — 8 CRITICAL security vulnerabilities, 0 rows in production tables

---

## 1. Executive Summary

mdeai.co is a well-designed frontend shell (~158 components, 33 pages) with a **hollow backend**. The UI is 95% complete but the system behind it is broken in ways that would cause real-world compromise, data loss, and pipeline failures if deployed.

**The brutal truth:**

1. **Secrets are committed to Git.** `.env` contains Shopify admin tokens, Gadget secrets, and Supabase keys in version history. These must be rotated immediately.
2. **Every edge function is unauthenticated.** 8 of 10 have `verify_jwt = false`. Wildcard CORS (`*`) on all. Any website can call your AI endpoints and rack up Gemini costs.
3. **Zero data exists.** All 28 tables have 0 production rows. Seed data creates 5 fake profiles with FK violations (no `auth.users` rows). Nothing works end-to-end.
4. **The agent system doesn't exist.** AGENTS.md describes Paperclip/Hermes/OpenClaw as a working trio. Reality: 0% implemented. No agent code runs. No orchestration. No WhatsApp integration.
5. **The lead-to-lease pipeline is broken.** Application approval workflow doesn't exist. No task in any epic handles `pending → approved`. Renters can never book.
6. **Frontend has hardcoded secrets.** Three hooks contain hardcoded JWT tokens. Supabase URLs are hardcoded instead of using env vars.

**This system cannot go to production.** It needs 2-3 weeks of security hardening, data seeding, and pipeline completion before any real user touches it.

---

## 2. Top 10 Critical Issues

### #1. Secrets Committed to Git Repository
**Severity:** CRITICAL | **Category:** Security
**Problem:** `.env` is committed with Shopify admin tokens (`shpat_*`), Gadget API secret (`gsk-*`), CLI tokens, and storefront keys. Git history preserves these permanently.
**Impact:** Full Shopify admin access, Gadget app compromise, customer data exposure.
**Fix:** Rotate ALL tokens immediately. `git rm --cached .env`. Add pre-commit hook to block secret commits.

### #2. JWT Verification Disabled on 8/10 Edge Functions
**Severity:** CRITICAL | **Category:** Auth
**Problem:** `supabase/config.toml` sets `verify_jwt = false` on ai-chat, ai-router, ai-search, ai-trip-planner, ai-optimize-route, ai-suggest-collections, google-directions, rentals, rules-engine. Only `p1-crm` has `verify_jwt = true`.
**Impact:** Any unauthenticated request can invoke AI functions. Gemini API costs are unbounded. Rate limiting falls back to spoofable IP addresses.
**Fix:** Set `verify_jwt = true` on ALL functions. Remove manual auth extraction code.

### #3. Wildcard CORS on All Edge Functions
**Severity:** CRITICAL | **Category:** Security
**Problem:** `supabase/functions/_shared/http.ts` line 4: `"Access-Control-Allow-Origin": "*"`. Every edge function accepts requests from any origin.
**Impact:** Any malicious website can call your AI endpoints from browser JavaScript. CSRF attacks. Unbounded API abuse.
**Fix:** Restrict to `https://mdeai.co`, `https://www.mdeai.co`, `http://localhost:8080`.

### #4. Service Role Key Leaked in Edge Function Calls
**Severity:** CRITICAL | **Category:** Security
**Problem:** ai-chat (line 604), ai-router (line 260), ai-search, ai-trip-planner all create Supabase clients with `SUPABASE_SERVICE_ROLE_KEY` then pass user auth headers. Service key bypasses all RLS.
**Impact:** If any error response leaks the key, attackers get full database admin access.
**Fix:** Use anon key + user JWT for user-scoped queries. Reserve service role for explicit admin operations only.

### #5. Hardcoded JWT Tokens in Frontend Code
**Severity:** CRITICAL | **Category:** Security
**Problem:** `src/hooks/useGoogleDirections.ts:64` and `src/hooks/useCollectionSuggestions.ts:58` contain hardcoded JWT fallback tokens. `src/integrations/supabase/client.ts:6` hardcodes the publishable key.
**Impact:** Tokens visible in source code. Committed to Git. Must be rotated.
**Fix:** Remove hardcoded tokens. Use `import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY` consistently.

### #6. Zero Production Data
**Severity:** CRITICAL | **Category:** Data
**Problem:** All 28 tables have 0 rows. Seed script creates 5 profiles without corresponding `auth.users` rows (FK violation). Seed only runs with service_role bypassing constraints.
**Impact:** Nothing works. No apartments to browse. No leads to capture. No bookings to make. Every user-facing feature returns empty.
**Fix:** Fix seed data FK violations. Create auth.users entries or drop FK constraint. Populate with realistic Medellin data.

### #7. Agent System Is Vapor
**Severity:** CRITICAL | **Category:** Architecture
**Problem:** AGENTS.md describes Paperclip (CEO), Hermes (brain), OpenClaw (mouth) as a working trio. Reality: Epic 5 is 0% complete. No agent code runs. No Hermes ranking. No OpenClaw gateway. No WhatsApp integration. The `paperclip/` directory is a separate repo, not wired into mdeai.
**Impact:** All agent-powered features (AI concierge, property ranking, WhatsApp lead capture) are non-functional.
**Fix:** Acknowledge current state in documentation. Remove agent features from public-facing pages until E5 ships.

### #8. Application Approval Pipeline Missing
**Severity:** CRITICAL | **Category:** Pipeline
**Problem:** E2-003 creates rental applications with `status='pending'`. E2-004 creates bookings when `status='approved'`. No task, edge function, or UI handles the `pending → approved` transition. No host approval workflow exists.
**Impact:** The lead-to-lease pipeline is broken at step 3. No renter can ever get a booking approved.
**Fix:** Create E2-003b: host approval endpoint + LandlordDashboard approve/reject UI.

### #9. Missing Database Indexes on Critical Paths
**Severity:** HIGH | **Category:** Performance
**Problem:** `apartments.host_id` has no index but is used in RLS policies. `apartments.slug` has no UNIQUE constraint but is used for URL routing. Missing composite indexes on trips, bookings, user_roles.
**Impact:** Full table scans on every host query. Duplicate slugs break routing.
**Fix:** `CREATE INDEX idx_apartments_host_id ON apartments(host_id);` `ALTER TABLE apartments ADD CONSTRAINT apartments_slug_unique UNIQUE(slug);`

### #10. No Timeouts on AI API Calls
**Severity:** HIGH | **Category:** Reliability
**Problem:** ai-chat, ai-router, ai-search, ai-trip-planner, ai-optimize-route all call Gemini API via `fetch()` with no timeout. Only `google-directions` has a 10s timeout.
**Impact:** Slow/hanging Gemini responses block the function until Supabase's 600s hard timeout. Wastes compute credits. Poor UX.
**Fix:** Add 30s AbortController timeout to all external API calls.

---

## 3. Detailed Findings

### 3.1 Database Schema

**Tables:** 28 total, all with RLS enabled
**Migrations:** 7 files (1 main schema + 6 P1 tables)
**Seed:** 5 profiles, 12 neighborhoods, 24 apartments, 6 leads, 4 showings, 4 applications, 6 verifications, 3 bookings, 3 payments

| Finding | Severity | Detail |
|---------|----------|--------|
| Mixed FK targets (auth.users vs profiles) | CRITICAL | 14 tables FK to `auth.users`, 13 to `profiles`. Seed creates profiles without auth.users rows. |
| apartments.host_id missing index | CRITICAL | Used in RLS policy. Every host query = full table scan. |
| apartments.slug not UNIQUE | CRITICAL | Used for URL routing. Duplicates break the app. |
| whatsapp_messages no FK to conversations | HIGH | Messages linked by phone_number informally. No referential integrity. |
| 11 JSONB fields unvalidated | HIGH | budget_tracking.categories, ai_context.entities, messages.function_call — all free-form. |
| Coordinate precision inconsistent | MEDIUM | apartments: numeric(10,7), tourist_destinations: numeric(10,8). |
| Soft delete + CASCADE conflict | MEDIUM | `deleted_at` columns exist but `ON DELETE CASCADE` hard-deletes children. |
| Missing composite indexes | MEDIUM | trips(user_id,status,start_date), bookings(user_id,status), user_roles(user_id,expires_at) |
| Duplicate indexes on collections.user_id | LOW | Two overlapping indexes. Consolidate. |
| Missing UNIQUE constraints | HIGH | rental_listing_sources.source_key, restaurants.google_place_id, whatsapp_conversations.phone_number |

**Schema score: 55/100** — Solid structure with RLS everywhere, but data integrity gaps and missing indexes on critical paths.

### 3.2 Edge Functions

**Total:** 10 functions (11 directories including `_shared`)
**Auth enforced:** 1/10 (p1-crm only)
**Zod validation:** Present in most but inconsistently applied
**AI logging:** 0/6 AI functions log to ai_runs table

| Function | Auth | JWT Verify | CORS | Service Role | Rate Limit | Timeout | Used by Frontend |
|----------|------|-----------|------|-------------|-----------|---------|-----------------|
| ai-chat | Optional | false | `*` | LEAKED | IP-based | None | Yes |
| ai-router | Optional | false | `*` | LEAKED | User/IP | None | Yes (via useChat) |
| ai-search | Optional | false | `*` | LEAKED | User/IP | None | **NO** |
| ai-trip-planner | Optional | false | `*` | LEAKED | User/IP | None | **NO** |
| ai-optimize-route | None | false | `*` | N/A | IP-based | None | Yes |
| ai-suggest-collections | None | false | `*` | N/A | IP-based | None | Yes |
| google-directions | None | false | `*` | N/A | IP-based | 10s | Yes |
| p1-crm | Strict | **true** | `*` | Yes (needed) | User-based | None | Yes |
| rentals | Partial | false | `*` | LEAKED | Partial | None | **NO** |
| rules-engine | Cron secret | false | `*` | Service-only | N/A | None | N/A (cron) |

**Edge function score: 20/100** — Functional code but security posture is catastrophic. 3 functions deployed but never called.

### 3.3 Frontend Wiring

| Finding | Severity | Detail |
|---------|----------|--------|
| 3 hooks with hardcoded JWT tokens | CRITICAL | useGoogleDirections, useCollectionSuggestions, client.ts |
| Hardcoded Supabase URLs | MEDIUM | useChat, useGoogleDirections, useCollectionSuggestions use literal URLs instead of env vars |
| Missing env var VITE_SUPABASE_ANON_KEY | HIGH | useIntentRouter references it but it's not defined. Evaluates to `undefined` at runtime. |
| Confirmation codes generated client-side | MEDIUM | useBookings generates 8-char codes in browser. No uniqueness guarantee. |
| N+1 in useNeighborhoods | MEDIUM | Fetches ALL apartments to count by neighborhood. Should be SQL aggregation. |
| Auth flow correct | PASS | useAuth context, session listener, auto-refresh all work properly. |
| Protected routes correct | PASS | ProtectedRoute component redirects unauthenticated users. |
| RLS-scoped queries correct | PASS | All user-specific hooks filter by auth.uid(). |
| Error handling inconsistent | MEDIUM | Good in mutations, weak in queries. Silent failures in useIntentRouter, useAISearch. |
| 3 edge functions never called | HIGH | ai-search, ai-trip-planner, rentals exist but no frontend hook invokes them. |

**Frontend score: 55/100** — Good React patterns and auth flow, but hardcoded secrets and missing wiring to 3 deployed functions.

### 3.4 Security

| ID | Severity | Issue | Status |
|----|----------|-------|--------|
| S1 | CRITICAL | `.env` with production tokens committed to Git | ACTIVE — must rotate |
| S2 | CRITICAL | `verify_jwt = false` on 8/10 functions | ACTIVE |
| S3 | CRITICAL | Wildcard CORS `*` on all functions | ACTIVE |
| S4 | CRITICAL | Service role key in edge function client creation | ACTIVE |
| S5 | CRITICAL | Hardcoded JWT tokens in frontend source | ACTIVE |
| S6 | CRITICAL | Rate limiting bypassed via IP rotation | ACTIVE |
| S7 | CRITICAL | Rules-engine accessible without strong auth | ACTIVE |
| S8 | CRITICAL | Admin auth guard non-functional (no RBAC) | ACTIVE |
| S9 | HIGH | No timeouts on Gemini API calls | ACTIVE |
| S10 | HIGH | No AI run logging (cost tracking impossible) | ACTIVE |
| S11 | HIGH | No idempotency on payment operations | ACTIVE |
| S12 | HIGH | Error responses leak internal details (DB errors) | ACTIVE |
| S13 | MEDIUM | Rate limit source uses spoofable x-forwarded-for | ACTIVE |

**Security score: 10/100** — 8 CRITICAL vulnerabilities. System is trivially exploitable. Deploy blocked.

### 3.5 Agent System

| Component | Claimed State | Actual State |
|-----------|--------------|--------------|
| Paperclip (CEO) | "Orchestrates all agents, budget enforcement, approval gates" | 0% implemented. `paperclip/` exists as separate repo. Not wired into mdeai. |
| Hermes (Brain) | "7-factor ranking, taste profiles, market intelligence" | 0% implemented. No ranking edge function deployed. No taste profile table. |
| OpenClaw (Mouth) | "WhatsApp/Telegram/Discord gateway, AI routing" | 0% implemented. No messaging gateway. No WhatsApp integration. |
| Agent audit log | "All agent actions logged" | Table doesn't exist. No migration creates it. |
| ai_runs table | "All AI calls logged with tokens/duration" | Table exists in schema but 0 functions write to it. |

**Agent score: 5/100** — Ambitious architecture on paper. Zero implementation in code.

### 3.6 Execution Pipelines

**Lead → Booking Pipeline Analysis:**

```
Lead Capture → Search/Match → Showing → Application → [???] → Booking → Payment
                                                        ↑
                                                   PHANTOM STEP
                                               (no approval workflow)
```

| Step | Status | Issue |
|------|--------|-------|
| Lead Capture | Partial | p1-crm `create_lead` works. No WhatsApp source. |
| Search/Match | Broken | ai-search deployed but never called from frontend. |
| Showing | Partial | p1-crm `schedule_tour` works. No reminder cron. |
| Application | Partial | Table exists. No approval/rejection endpoint. |
| **Approval** | **MISSING** | No task handles `pending → approved`. Pipeline breaks here. |
| Booking | Blocked | Requires approved application. Can never trigger. |
| Payment | Blocked | p1-crm `record_payment` exists but bookings can't be created. |

**Pipeline score: 15/100** — Individual steps exist in isolation. The pipeline doesn't flow end-to-end.

---

## 4. Failure Points

### Silent Failures (things that "work" but are wrong)

1. **Rate limiting does nothing for anonymous users** — In-memory or IP-based counters reset per serverless invocation or are bypassed by changing IP.
2. **ai-search exists but is never called** — Frontend uses ai-chat with searchMode context instead.
3. **ai-trip-planner exists but is never called** — Frontend routes through ai-chat, not the dedicated function.
4. **Seed data passes only because service_role bypasses FK checks** — 5 profiles reference non-existent auth.users rows.
5. **useIntentRouter sends `undefined` as apikey header** — `VITE_SUPABASE_ANON_KEY` is not defined. Silent failure.
6. **Confirmation codes can collide** — Generated client-side with `Math.random()`. No uniqueness check.

### Blockers (things that prevent progress)

1. **Zero production data** — Every feature returns empty results.
2. **Approval workflow gap** — Pipeline broken at step 4.
3. **3 deployed functions are dead code** — ai-search, ai-trip-planner, rentals never invoked.
4. **Agent infrastructure at 0%** — All agent-powered features are non-functional.

### Brittle Areas (things that break under load)

1. **No Gemini timeouts** — A single slow API response blocks the function for up to 600s.
2. **apartments.host_id full table scan** — Every host query scans all apartments.
3. **JSONB fields unvalidated** — Bad data in 11 fields causes unpredictable behavior.
4. **Stripe webhook without dedup** — Retry storms create duplicate payment records.

---

## 5. Score Table

| Area | Score | Rationale |
|------|-------|-----------|
| Schema | 55/100 | RLS everywhere, good triggers. But mixed FK targets, missing indexes, JSONB unvalidated. |
| Indexing | 60/100 | 70+ indexes exist. Missing critical ones (host_id, slug UNIQUE, composites). |
| RLS / Security | 10/100 | 8 CRITICAL vulns. JWT disabled. Wildcard CORS. Secrets in Git. Service role leaked. |
| Edge Functions | 20/100 | Code is functional but auth is catastrophic. 3 functions are dead code. No AI logging. |
| Agents | 5/100 | 0% implemented. Documentation describes fantasy state. |
| Execution Pipelines | 15/100 | Individual steps exist but pipeline doesn't flow. Approval workflow missing. |
| Frontend | 55/100 | Good React patterns. Hardcoded secrets. 3 unused function integrations. |
| **Overall** | **25/100** | Beautiful frontend on a broken, insecure, empty backend. |

---

## 6. Fix Plan (Prioritized)

### Week 1: Security Emergency (DEPLOY BLOCKER)

| # | Fix | Effort | Impact |
|---|-----|--------|--------|
| 1 | Rotate ALL leaked tokens (Shopify, Gadget, Supabase) | 2 hr | Prevents active compromise |
| 2 | `git rm --cached .env` + add pre-commit hook | 30 min | Prevents future leaks |
| 3 | Set `verify_jwt = true` on all 10 functions in config.toml | 15 min | Blocks unauthenticated access |
| 4 | Replace wildcard CORS with allowed origins list | 30 min | Blocks cross-site abuse |
| 5 | Remove hardcoded JWT tokens from 3 frontend files | 15 min | Removes exposed credentials |
| 6 | Replace service role key usage with anon key + user JWT | 2 hr | Eliminates admin key exposure |
| 7 | Add 30s timeout to all Gemini API calls | 1 hr | Prevents resource exhaustion |

### Week 2: Data Foundation

| # | Fix | Effort | Impact |
|---|-----|--------|--------|
| 8 | Fix seed data FK violations (create auth.users or drop FK) | 1 hr | Seed actually works |
| 9 | Populate seed with 50+ realistic Medellin apartments | 4 hr | App shows real content |
| 10 | Add missing indexes (host_id, slug UNIQUE, composites) | 1 hr | Eliminates full table scans |
| 11 | Add UNIQUE constraints (source_key, phone_number, google_place_id) | 30 min | Prevents duplicates |
| 12 | Create ai_runs table migration | 30 min | Enables AI cost tracking |

### Week 3: Pipeline Completion

| # | Fix | Effort | Impact |
|---|-----|--------|--------|
| 13 | Build approval workflow (E2-003b) | 4 hr | Unblocks entire pipeline |
| 14 | Wire ai-search to frontend (replace ai-chat searchMode) | 2 hr | Activates deployed function |
| 15 | Wire ai-trip-planner to frontend | 2 hr | Activates deployed function |
| 16 | Add AI run logging to all 6 AI functions | 3 hr | Enables cost monitoring |
| 17 | Add idempotency keys to p1-crm payment operations | 2 hr | Prevents double-charges |
| 18 | Fix useIntentRouter missing env var | 15 min | Fixes silent failure |
| 19 | Move confirmation code generation to server | 1 hr | Guarantees uniqueness |

### Week 4: Production Hardening

| # | Fix | Effort | Impact |
|---|-----|--------|--------|
| 20 | Implement admin RBAC (role checks in edge functions + frontend) | 4 hr | Prevents unauthorized admin access |
| 21 | Add Zod schemas to remaining 6 edge functions | 3 hr | Prevents injection/type confusion |
| 22 | Fix error responses to not leak DB details | 1 hr | Prevents information disclosure |
| 23 | Add JSONB CHECK constraints on critical fields | 2 hr | Prevents data corruption |
| 24 | Remove or document 3 dead edge functions | 1 hr | Reduces attack surface |
| 25 | Update AGENTS.md to reflect actual state (0% implemented) | 30 min | Prevents confusion |

---

## 7. Improvements & Simplification

### What Should Be Simplified

1. **Remove dead edge functions** — ai-search, ai-trip-planner, and rentals are deployed but unused. Either wire them to the frontend or delete them. Dead code is attack surface.
2. **Consolidate auth patterns** — Some hooks use `fetch()` with manual headers, others use `supabase.functions.invoke()`. Pick one pattern.
3. **Standardize FK targets** — Pick either `auth.users` or `profiles` as the canonical user reference. Not both.
4. **Remove agent features from public UI** — Don't show AI concierge, WhatsApp integration, or property ranking features when the backend doesn't support them.

### What Should Be Removed

1. **In-memory rate limiting option** from security specs — Broken in serverless.
2. **Triple-scheduler pattern** from market snapshots — Pick one scheduler.
3. **Hermes CLI spawning approach** — Fragile process spawning. Use HTTP API.
4. **AGENTS.md fantasy state** — Rewrite to reflect 0% implementation.

### What Should Be Added

1. **Pre-commit secret scanning** — `git-secrets` or similar to prevent future leaks.
2. **Health check endpoint** — Simple `/health` function for monitoring.
3. **Error tracking** — Sentry or similar for production error visibility.
4. **Cost monitoring** — AI run logging + Gemini API budget alerts.
5. **E2E test** — Even one Playwright test for the critical path (browse → detail → book).
6. **Webhook deduplication** — `webhook_events` table for Stripe replay protection.

---

## 8. Final Verdict

**mdeai.co is a well-crafted demo that is not a product.**

The frontend is genuinely impressive — 158 components, consistent design system, proper React patterns, accessible UI. The Supabase schema is thoughtfully designed with RLS on every table and sensible constraints.

But beneath the surface:

- **Security is catastrophic.** 8 CRITICAL vulnerabilities. Secrets in Git. No auth on AI endpoints. Wildcard CORS. Service role keys leaked. This is not "needs hardening" — it's "actively exploitable."
- **Data doesn't exist.** 28 empty tables. Seed data has FK violations. Every page shows empty states.
- **The pipeline doesn't work.** Lead-to-lease is broken at the approval step. Nobody can complete a booking.
- **Agents are vaporware.** AGENTS.md describes a sophisticated multi-agent system. Zero lines of agent code run in production.
- **3 edge functions are dead code.** Deployed, consuming resources, expanding attack surface, never called.

**What this system needs is not more features — it needs fewer features that actually work.** Strip the agent system from the UI. Fix the 8 security vulns. Seed real data. Complete the approval pipeline. Then you have an MVP.

**Estimated time to production-ready MVP:** 4-6 weeks of focused work on security + data + pipeline. Not new features.

---

## 9. Supabase CORE Phase Readiness Addendum (2026-04-05)

### 9.1 config.toml — JWT Verification

**Status: FAILING** — 9 of 10 functions have `verify_jwt = false`.

| Function | Current | Required | Notes |
|----------|---------|----------|-------|
| ai-chat | false | **true** | Has manual auth extraction but allows anonymous |
| ai-router | false | **true** | Same pattern |
| ai-search | false | **true** | Same pattern |
| ai-trip-planner | false | **true** | Same pattern |
| ai-optimize-route | false | **true** | No auth at all — IP rate limit only |
| ai-suggest-collections | false | **true** | No auth at all |
| google-directions | false | **true** | No auth at all |
| rentals | false | **true** | Conditional auth |
| rules-engine | false | **true** | Uses cron secret (acceptable) |
| p1-crm | **true** | true | Only correct function |

**Fix:** Set all to `verify_jwt = true` in `supabase/config.toml`.

### 9.2 Service Role Key Misuse Pattern

**Status: CRITICAL** — 4 functions create Supabase client with service role key but pass user auth header conditionally.

**Affected:** ai-chat, ai-router, ai-search, ai-trip-planner

**Pattern found in all 4:**
```typescript
function getSupabaseClient(authHeader: string | null) {
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  return createClient(supabaseUrl, supabaseServiceKey, {
    global: { headers: authHeader ? { Authorization: authHeader } : {} },
  });
}
```

**Problem:** If `authHeader` is null, client runs with full service role permissions — bypasses all RLS.

**Correct pattern (from p1-crm):**
```typescript
// User context — use anon key
const userClient = createClient(supabaseUrl, anonKey, {
  global: { headers: { Authorization: authHeader } },
});
// Admin operations only — use service role
const serviceClient = createClient(supabaseUrl, serviceKey);
```

### 9.3 Missing Gemini Timeouts

**Status: FAILING** — 6 of 7 Gemini-calling functions have no timeout.

| Function | Has Timeout | Fix |
|----------|------------|-----|
| ai-chat | No | Add 30s AbortController |
| ai-router | No | Add 15s AbortController (classification is fast) |
| ai-search | No | Add 20s AbortController |
| ai-trip-planner | No | Add 45s AbortController (complex generation) |
| ai-optimize-route | No | Add 20s AbortController |
| rentals | No (on Gemini call) | Add 30s AbortController |
| google-directions | **Yes** (10s) | Already correct |

### 9.4 Missing Tables for CORE

| Table | Status | Migration Needed |
|-------|--------|-----------------|
| neighborhoods | Exists | — |
| leads | Exists | — |
| showings | Exists | — |
| rental_applications | Exists | — |
| property_verifications | Exists | — |
| payments | Exists | — |
| ai_runs | Exists | — |
| **idempotency_keys** | **MISSING** | Create migration |
| **notifications** | **MISSING** | Create migration |
| **agent_audit_log** | **MISSING** | Create migration |

### 9.5 Missing Indexes

| Table | Index | Status |
|-------|-------|--------|
| apartments.host_id | idx_apartments_host_id | **MISSING** — used in RLS, causes full scan |
| apartments.slug | UNIQUE constraint | **EXISTS** (apartments_slug_key) |
| showings (lead_id, apartment_id, date) | Dedup unique index | **MISSING** |
| rental_applications (lead_id, apartment_id) | Dedup unique index | **MISSING** |
| payments.stripe_event_id | UNIQUE for webhook dedup | **MISSING** |

### 9.6 CORS Headers

**Status: FAILING** — `_shared/http.ts` uses wildcard `*`.

```typescript
"Access-Control-Allow-Origin": "*",
```

**Fix:** Dynamic origin check against allowed list:
```typescript
const ALLOWED_ORIGINS = [
  "https://mdeai.co",
  "https://www.mdeai.co",
  "https://medell-n-connect.vercel.app",
  "http://localhost:8080",
];
```

### 9.7 Rate Limiting

**Status: PARTIAL** — In-memory `Map<string, number[]>` resets on cold start. Provides some protection but is trivially bypassed by waiting for a new instance.

**Acceptable for CORE** if combined with `verify_jwt = true` (rate limit by user_id, not spoofable IP). Full persistent rate limiting (Redis/DB) can defer to ADVANCED.

### 9.8 Edge Function Readiness Matrix

| Function | Auth | Svc Role | Timeout | ai_runs | Zod | Rate Limit | CORE Ready |
|----------|:----:|:--------:|:-------:|:-------:|:---:|:----------:|:----------:|
| ai-chat | Opt | BUG | No | Yes | Yes | Yes | **NO** |
| ai-router | Opt | BUG | No | Yes | Yes | Yes | **NO** |
| ai-search | Opt | BUG | No | Yes | Yes | Yes | **NO** |
| ai-trip-planner | Opt | BUG | No | Yes | Yes | Yes | **NO** |
| ai-optimize-route | None | N/A | No | No | Yes | IP | **NO** |
| ai-suggest-collections | None | N/A | N/A | No | Yes | IP | **NO** |
| google-directions | None | N/A | Yes | No | Yes | IP | **NO** |
| p1-crm | Yes | OK | N/A | No | Yes | User | **PASS** |
| rentals | Cond | OK | Partial | No | Yes | Action | **NO** |
| rules-engine | Cron | OK | No | No | N/A | N/A | **PASS** |

### 9.9 Corrective Actions for CORE

**Priority 1 — Security (do first, 2-3 hours):**
1. Set `verify_jwt = true` on all functions in config.toml
2. Fix service role key pattern in ai-chat, ai-router, ai-search, ai-trip-planner (use anon key for user client)
3. Replace wildcard CORS with allowed origins list
4. Add 30s AbortController timeout to all Gemini fetch calls

**Priority 2 — Schema (create migration, 1 hour):**
5. Create `idempotency_keys` table
6. Create `notifications` table with RLS
7. Create `agent_audit_log` table with RLS
8. Add `apartments.host_id` index
9. Add showing/application dedup unique indexes
10. Add `payments.stripe_event_id` unique column

**Priority 3 — Logging (2 hours):**
11. Add `insertAiRun()` calls to: ai-optimize-route, ai-suggest-collections, rentals, google-directions
12. Add `insertAiRun()` error logging (currently only logs success in most functions)

### 9.10 Seed Data FK Issue

**Status: KNOWN** — Seed creates 5 profiles referencing UUIDs that don't exist in `auth.users`. This works because seed runs with service_role bypassing FK checks.

**Acceptable for CORE** — seed data is demo-only. Real users will have auth.users rows from Supabase Auth signup flow. Document this in seed.sql comments.
