# Epic 3: Security Hardening — Task Prompts

### Real world — purpose & outcomes

**In one sentence:** Random scripts and browsers can’t call your Supabase edges as “admin”—only signed-in users and verified webhooks get through, and bad input is rejected before it hits the DB.

- **Who it’s for:** Every traveler and host; attackers who shouldn’t get free Gemini or DB writes.
- **Purpose:** Lock down edge functions: JWT, tight CORS, Zod validation, rate limits, no leaked service role in the client.
- **Goals:** 401 without a valid session; 400 on junk bodies; production origins only; predictable errors.
- **Features / deliverables:** `config.toml` + per-function fixes, shared `jsonResponse(req)`, validation schemas, rate-limit story, Stripe webhook exception documented.

> **Diagrams:** MERM-09 (edge functions), MERM-10 (deployment)
> **Phase:** CORE | **Outcome:** O9
> **Hypothesis:** Fixing the 8 CRITICAL security issues is prerequisite for any real user data or payments.
>
> **Extensions (service role, RBAC, timeouts, JWT story):** **[`13A-e3-edge-security-extensions.md`](13A-e3-edge-security-extensions.md)** — [`tasks/audit/06-tasks-audit.md`](../audit/06-tasks-audit.md) CORE table.

---

## Success criteria (tests · verify · production-ready)

| Track | Definition |
|-------|------------|
| **Tests** | Relevant automated checks pass: `npm run lint`, `npm run build`, `npm run test` (and `npm run verify:edge` when Supabase edge functions change). Add or update tests when behavior changes. |
| **Verify** | Manual smoke: confirm the user-visible or API outcome in dev/staging; for auth, CORS, payments, or idempotency, exercise the real path once. |
| **Production-ready** | No open security gaps for this change scope; deploy path documented or executed; rollback/monitoring understood if the change touches production data or money. Mark complete only when the rows above are satisfied. |

## Feature success (goals → shippable features)

Aligned with [`PROMPT-VERIFICATION.md`](../PROMPT-VERIFICATION.md) §6 (Goal · Workflow · Proof · Gates · Rollout), [`.claude/skills/mde-writing-plans/SKILL.md`](../../../.claude/skills/mde-writing-plans/SKILL.md) (user stories + observable proof), and optionally [`.agents/skills/tasks-generator/SKILL.md`](../../../.agents/skills/tasks-generator/SKILL.md) (PRD → tasks).

| Layer | Intent |
|-------|--------|
| **Goal** | Only authorized users invoke edges; inputs validated; CORS not `*` for production origins. |
| **Workflow** | Per-function JWT + Zod + `jsonResponse(req)` + rate limit story; re-deploy and spot-test. |
| **Proof** | 401 without Bearer; 400 on bad body; 200 on valid JWT; CORS allows app origin only. |
| **Gates** | No service role in browser; webhook paths documented if JWT skipped. |
| **Rollout** | Roll out per function; monitor 401/429 spikes after deploy. |

---

## E3-001: Add Auth Guards to All Edge Functions

```yaml
---
id: E3-001
diagram_id: MERM-09
prd_section: "7. Technical Specs — Security"
title: Add auth guards to all 9 existing edge functions
description: "Ships «Add auth guards to all 9 existing edge functions» for this epic—full scope in § Prompt below."
skill: edge-function
phase: CORE
priority: P0
status: Open
owner: Backend
dependencies: []
estimated_effort: M
percent_complete: 0
epic: E3
outcome: O9
---
```

### Prompt

Audit and fix authentication in all 9 existing edge functions. Several currently skip JWT validation or use inconsistent patterns.

**Read first:**
- `supabase/functions/` — all 9 edge function directories
- `.claude/rules/edge-function-patterns.md` — standard auth pattern
- `tasks/mermaid/09-edge-function-map.mmd` — which functions require auth vs public

**Known issues (from edge function audit):**
- Some functions check `Authorization` header but don't validate the JWT
- Some functions use `supabase.auth.getUser()` without handling the error
- ~~`config.toml` has `verify_jwt = false`~~ **UPDATE (2026-04-05):** `verify_jwt = true` now set for all 10 functions in config.toml. However, config-level JWT only rejects requests without a valid Supabase JWT — functions should still extract `user` for RLS and logging.

**Current Zod validation status (verified 2026-04-05):**
- HAS Zod: `ai-chat`, `ai-router`, `ai-search`, `p1-crm`, `rentals` (5/10)
- NEEDS Zod: `ai-optimize-route`, `google-directions`, `ai-suggest-collections`, `rules-engine`, `ai-trip-planner` (5/10)

**Current CORS status:** `_shared/http.ts` has `getCorsHeaders(req)` with proper allowlist. **BUG:** `jsonResponse()` fallback uses static `https://mdeai.co` when `req` not passed — most functions don't pass `req`. Fix: ensure all functions pass `req` to `jsonResponse()`.

**Fix pattern for every function:**
```typescript
const authHeader = req.headers.get('Authorization');
if (!authHeader) return errorResponse(401, 'UNAUTHORIZED', 'Missing auth');
const token = authHeader.replace('Bearer ', '');
const { data: { user }, error } = await supabase.auth.getUser(token);
if (error || !user) return errorResponse(401, 'UNAUTHORIZED', 'Invalid token');
```

### Acceptance Criteria
- [ ] All 9 edge functions validate JWT on every request
- [ ] Consistent auth pattern across all functions
- [ ] 401 returned for missing/invalid tokens
- [ ] User ID extracted and used for subsequent queries
- [ ] Functions that should allow anonymous access (if any) explicitly document why
- [ ] `npm run build` passes

---

## E3-002: Add Zod Input Validation to All Edge Functions

```yaml
---
id: E3-002
diagram_id: MERM-09
prd_section: "7. Technical Specs — Security"
title: Add Zod input validation to all edge functions
description: "Ships «Add Zod input validation to all edge functions» for this epic—full scope in § Prompt below."
skill: edge-function
phase: CORE
priority: P0
status: Open
owner: Backend
dependencies: []
estimated_effort: M
percent_complete: 0
epic: E3
outcome: O9
---
```

### Prompt

Add Zod schema validation to all edge functions that accept request bodies.

**Read first:**
- `supabase/functions/` — all edge functions
- `supabase/functions/ai-chat/index.ts` — check if it already validates
- `supabase/functions/rentals/index.ts` — check existing validation

**For each edge function that accepts a POST body:**
1. Define a Zod schema for the expected input
2. Parse the body with `schema.safeParse(await req.json())`
3. Return 400 with clear error message if validation fails
4. Use the typed result for all subsequent logic

**Import Zod in Deno edge functions:**
```typescript
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";
```

### Acceptance Criteria
- [ ] Every POST edge function has a Zod schema
- [ ] Invalid input returns 400 with field-level error messages
- [ ] No raw `req.json()` without validation
- [ ] Zod schemas match the documented I/O specs in MERM-09
- [ ] All functions still work correctly with valid input

---

## E3-003: Fix CORS Configuration

```yaml
---
id: E3-003
diagram_id: MERM-09
prd_section: "7. Technical Specs — Security"
title: Fix CORS configuration across all edge functions
description: "Ships «Fix CORS configuration across all edge functions» for this epic—full scope in § Prompt below."
skill: edge-function
phase: CORE
priority: P0
status: Open
owner: Backend
dependencies: []
estimated_effort: S
percent_complete: 0
epic: E3
outcome: O9
---
```

### Prompt

Audit and standardize CORS headers across all edge functions. Currently some use `Access-Control-Allow-Origin: *` which is too permissive for production.

**Read first:**
- `supabase/functions/` — check each function's CORS headers
- Vercel deployment URL: `medell-n-connect.vercel.app` and custom domain `mdeai.co`

**Fix:**
- Create shared CORS headers constant
- Allow origins: `https://mdeai.co`, `https://www.mdeai.co`, `https://medell-n-connect.vercel.app`, `http://localhost:8080` (dev)
- Proper preflight handling (OPTIONS method)
- Allow headers: `Authorization, Content-Type, x-client-info, apikey`

### Acceptance Criteria
- [ ] No `Access-Control-Allow-Origin: *` in production
- [ ] Allowed origins include production URLs and localhost for dev
- [ ] Every function handles OPTIONS preflight correctly
- [ ] Consistent CORS constant shared or duplicated identically
- [ ] Frontend can still call all edge functions without CORS errors

---

## E3-004: Add Rate Limiting

```yaml
---
id: E3-004
diagram_id: MERM-09
prd_section: "7. Technical Specs — Security"
title: Add rate limiting to AI and search endpoints
description: "Ships «Add rate limiting to AI and search endpoints» for this epic—full scope in § Prompt below."
skill: edge-function
phase: CORE
priority: P0
status: Open
owner: Backend
dependencies: []
estimated_effort: S
percent_complete: 0
epic: E3
outcome: O9
---
```

### Prompt

Implement rate limiting on AI and search edge functions to prevent abuse.

**Read first:**
- `.claude/rules/edge-function-patterns.md` — rate limit specs
- `supabase/functions/ai-chat/index.ts` — primary AI endpoint
- `supabase/functions/ai-search/index.ts` — search endpoint

**Limits:**
- AI endpoints (ai-chat, ai-router, ai-trip-planner, ai-suggest-collections, ai-optimize-route, rentals): 10 requests/min/user
- Search endpoints (ai-search): 30 requests/min/user
- Use the existing sliding window counter in `_shared/rate-limit.ts` (already implemented). **WARNING:** In-memory Map resets per edge function invocation (Deno Deploy is stateless). The current implementation works for per-request burst protection but does NOT persist across invocations. For durable rate limiting, use the `rate_limits` Supabase table or Upstash Redis. The in-memory approach is acceptable for CORE MVP but must be upgraded before production traffic.

**Implementation approach:**
- Check rate limit before processing request
- Return 429 Too Many Requests with `Retry-After` header if exceeded
- Rate limit by user_id (authenticated) or IP (anonymous)

### Acceptance Criteria
- [ ] AI endpoints limited to 10 req/min/user
- [ ] Search endpoint limited to 30 req/min/user
- [ ] 429 response with Retry-After header when exceeded
- [ ] Rate limit resets after window expires
- [ ] Authenticated users tracked by user_id, anonymous by IP
- [ ] Does not block legitimate usage patterns

---

## E3-005: Add Stripe Webhook Signature Verification

```yaml
---
id: E3-005
diagram_id: MERM-09
prd_section: "7. Technical Specs — Security"
title: Add Stripe webhook signature verification to payment-webhook
description: "Ships «Add Stripe webhook signature verification to payment-webhook» for this epic—full scope in § Prompt below."
skill: edge-function
phase: CORE
priority: P0
status: Open
owner: Backend
dependencies:
  - E2-005
estimated_effort: S
percent_complete: 0
epic: E3
outcome: O9
---
```

### Prompt

Add webhook signature verification to the payment-webhook edge function to prevent forged payment events.

**Read first:**
- `supabase/functions/payment-webhook/index.ts` — the webhook handler
- Stripe docs on webhook signature verification

**The build:**
- Read raw body as text (NOT parsed JSON — signature is computed on raw body)
- Get `stripe-signature` header
- Verify using Stripe's signing secret (`STRIPE_WEBHOOK_SECRET` in Supabase dashboard)
- Reject with 400 if signature is invalid
- Only process events that pass verification

**CRITICAL:** The webhook endpoint does NOT use JWT auth — it uses Stripe's signature instead. Do not add `Authorization` header checks to this endpoint.

### Acceptance Criteria
- [ ] Reads raw request body for signature verification
- [ ] Extracts `stripe-signature` header
- [ ] Verifies signature against `STRIPE_WEBHOOK_SECRET`
- [ ] Returns 400 for invalid signatures
- [ ] Does NOT require JWT auth (webhook has no Bearer token)
- [ ] Processes only verified events
- [ ] `STRIPE_WEBHOOK_SECRET` configured in Supabase dashboard (not in code)

---

## Gemini API Security Note (G4)

All edge functions calling Google Gemini use the `x-goog-api-key` header pattern (not `Authorization: Bearer`). The API key (`GEMINI_API_KEY`) is a Supabase edge function secret — never exposed to the frontend. When reviewing or hardening edge functions that call Gemini, verify:

- API key is read from `Deno.env.get("GEMINI_API_KEY")` — never hardcoded
- Requests use `x-goog-api-key: ${apiKey}` header (Gemini-specific, not standard Bearer)
- API key is not logged, not included in error responses, and not passed to the frontend
- Rate limiting (E3-004) applies to all AI endpoints to prevent key abuse
