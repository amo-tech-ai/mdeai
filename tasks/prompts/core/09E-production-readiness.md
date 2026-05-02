# Epic 9: Production Readiness — Task Prompts

### Real world — purpose & outcomes

**In one sentence:** When something breaks in production, you can see **which** deploy, **which** env vars, and **how much** Gemini cost—instead of guessing from Vercel screenshots.

- **Who it’s for:** Travelers (uptime); DevOps and engineers on call; finance watching AI spend.
- **Purpose:** Hardening: correct `VITE_*` envs, monitoring, `ai_runs` logging, smoke tests, alerts.
- **Goals:** No `NEXT_PUBLIC_*` mistakes; token/cost visibility; basic E2E or smoke before marketing pushes.
- **Features / deliverables:** Checklist in this file; MERM-10 alignment; optional analytics/observability hooks.

> **Diagrams:** MERM-10 (deployment architecture)
> **Phase:** CORE | **Outcome:** O9
> **NOTE (corrected 2026-04-05):** This was previously marked `phase: PRODUCTION` but is listed in INDEX.md under CORE (ships first). Changed to CORE because env var fixes, ai_runs logging, and basic E2E smoke are prerequisites for any real user traffic, not post-launch polish.
> **Hypothesis:** Monitoring, observability, and deployment hardening enable >=99.5% uptime.
>
> **Gemini cost budget:** Set a monthly Gemini API spend cap and daily alert threshold. Current models:
> - `gemini-3-flash-preview` (ai-chat, ai-search, ai-optimize-route, ai-suggest-collections) — cheapest, high-volume
> - `gemini-3.1-flash-lite-preview` (ai-router) — cheapest for classification
> - `gemini-3.1-pro-preview` (ai-trip-planner, rentals) — expensive, low-volume
>
> E9-003 (ai_runs logging) enables cost tracking. E9-006 (monitoring alerts) should include a daily token budget alert. Recommended initial caps: $50/month total, alert at $30/month or 100k tokens/day.

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
| **Goal** | Production readiness: env, monitoring, `ai_runs`, E2E — deploy is observable. |
| **Workflow** | Checklist order in file; Vercel env fixed; alerts wired. |
| **Proof** | Smoke passes; `ai_runs` has rows for AI calls. |
| **Gates** | Secrets not in client bundle; MERM-10 alignment. |
| **Rollout** | Roll out monitoring before marketing push. |

---

## E9-001: Fix Vercel Environment Variables

```yaml
---
id: E9-001
diagram_id: MERM-10
prd_section: "7. Technical Specs — Deploy"
title: Fix env vars in Vercel (VITE_* not NEXT_PUBLIC_*)
description: "Ships «Fix env vars in Vercel (VITE_* not NEXT_PUBLIC_*)» for this epic—full scope in § Prompt below."
skill: devops
phase: PRODUCTION
priority: P0
status: Open
owner: DevOps
dependencies: []
estimated_effort: S
percent_complete: 0
epic: E9
outcome: O9
---
```

### Prompt

Audit and fix environment variables in the Vercel dashboard — some are using `NEXT_PUBLIC_*` prefix which is wrong for a Vite project.

**Read first:**
- `.claude/rules/env-management.md` — variable tiers and rules
- `.env` — current public environment variables
- Vercel dashboard → Project → Settings → Environment Variables
- `CLAUDE.md` — Known Issues section: "Wrong NEXT_PUBLIC_* env vars in Vercel dashboard"

**The fix:**
1. Audit all env vars in Vercel dashboard
2. Rename any `NEXT_PUBLIC_*` vars to `VITE_*`:
   - `NEXT_PUBLIC_SUPABASE_URL` → `VITE_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` → `VITE_SUPABASE_PUBLISHABLE_KEY`
   - Any others using wrong prefix
3. Verify all required vars exist:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_PUBLISHABLE_KEY`
   - `VITE_SUPABASE_PROJECT_ID`
   - `VITE_GOOGLE_MAPS_API_KEY`
4. Remove any duplicates or orphaned variables
5. Trigger a redeploy to pick up changes

### Acceptance Criteria
- [ ] No `NEXT_PUBLIC_*` variables in Vercel dashboard
- [ ] All required `VITE_*` variables present and correct
- [ ] No sensitive keys exposed (service role, admin API tokens)
- [ ] Production deployment works after variable update
- [ ] `npm run build` passes locally with same variables

---

## E9-002: Set Up Vercel Analytics + Speed Insights

```yaml
---
id: E9-002
diagram_id: MERM-10
prd_section: "7. Technical Specs — Monitoring"
title: Set up Vercel Analytics and Speed Insights
description: "Ships «Set up Vercel Analytics and Speed Insights» for this epic—full scope in § Prompt below."
skill: devops
phase: PRODUCTION
priority: P1
status: Open
owner: DevOps
dependencies: []
estimated_effort: S
percent_complete: 0
epic: E9
outcome: O9
---
```

### Prompt

Enable Vercel Analytics and Speed Insights for production monitoring of mdeai.co.

**Read first:**
- `tasks/mermaid/10-deployment-architecture.mmd` — Monitoring section: Vercel Analytics
- `package.json` — check if `@vercel/analytics` or `@vercel/speed-insights` already installed

**The build:**
- Install `@vercel/analytics` and `@vercel/speed-insights`
- Add Analytics component to app root (`src/App.tsx` or layout)
- Add Speed Insights component for Core Web Vitals
- Enable in Vercel dashboard: Project → Analytics → Enable
- Verify data flows on next deployment

```tsx
// In App.tsx or root layout
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/react';

// Add as siblings to router at the root
<>
  <RouterProvider router={router} />
  <Analytics />
  <SpeedInsights />
</>
```

### Acceptance Criteria
- [ ] `@vercel/analytics` installed and rendering
- [ ] `@vercel/speed-insights` installed and rendering
- [ ] Analytics enabled in Vercel dashboard
- [ ] First data point visible after deployment
- [ ] No performance impact (both are <1KB, async)
- [ ] `npm run build` passes

---

## E9-003: Implement ai_runs Logging in All AI Edge Functions

```yaml
---
id: E9-003
diagram_id: MERM-10
prd_section: "7. Technical Specs — Observability"
title: Implement ai_runs logging in all AI edge functions
description: "Ships «Implement ai_runs logging in all AI edge functions» for this epic—full scope in § Prompt below."
skill: edge-function
phase: PRODUCTION
priority: P1
status: Open
owner: Backend
dependencies: []
estimated_effort: M
percent_complete: 0
epic: E9
outcome: O9
---
```

### Prompt

Audit all AI edge functions and ensure every Gemini API call is logged to the `ai_runs` table.

**Read first:**
- `supabase/functions/ai-chat/index.ts` — check existing logging
- `supabase/functions/ai-search/index.ts`
- `supabase/functions/ai-router/index.ts`
- `supabase/functions/ai-trip-planner/index.ts`
- `supabase/functions/ai-optimize-route/index.ts`
- `supabase/functions/ai-suggest-collections/index.ts`
- `supabase/functions/rentals/index.ts` — also calls Gemini
- `.claude/rules/edge-function-patterns.md` — AI logging requirements

**For each AI call, log:**
```typescript
// IMPORTANT: Use ACTUAL column names from the ai_runs table (check database.types.ts)
// The table uses: agent_name, agent_type (Enum), model_name, input_data, output_data,
// input_tokens, output_tokens, duration_ms, status, error_message, user_id,
// conversation_id, metadata, temperature, estimated_cost_usd, total_tokens, completed_at
// NOTE: There is NO `prompt_type` column — use `agent_type` instead (Enum values in DB)
await supabase.from('ai_runs').insert({
  agent_name: 'ai-chat',
  agent_type: 'chat',              // Enum — check valid values in database.types.ts
  model_name: 'gemini-3-flash-preview',
  input_tokens: usage.prompt_tokens,
  output_tokens: usage.completion_tokens,
  total_tokens: usage.total_tokens,
  duration_ms: endTime - startTime,
  status: 'success',               // or 'error'
  error_message: null,
  user_id: user?.id || null,
  conversation_id: conversationId || null,
  metadata: { intent, tool_calls_count },
  estimated_cost_usd: calculateCost(model, tokens),
});
```

**Known gaps (from edge function audit):**
- Some functions call Gemini but don't log to ai_runs
- Some log tokens but not duration
- Some log success but not failures
- Missing: conversation_id linkage, intent classification logging

### Acceptance Criteria
- [ ] All 7 AI edge functions log every Gemini call to ai_runs
- [ ] Logged fields match ACTUAL schema: agent_name, agent_type, model_name, input_tokens, output_tokens, total_tokens, duration_ms, status (verify against database.types.ts — do NOT use `prompt_type` which doesn't exist)
- [ ] Error cases logged with error_message
- [ ] user_id attached when available
- [ ] No logging call blocks the response (use fire-and-forget or catch errors)
- [ ] Total token usage queryable per day/user/agent
- [ ] Existing ai_runs table schema supports all fields (add columns if needed)

---

## E9-004: Add agent_audit_log Table + Logging

```yaml
---
id: E9-004
diagram_id: MERM-10
prd_section: "7. Technical Specs — Observability"
title: Add agent_audit_log table and logging for Paperclip agents
description: "Ships «Add agent_audit_log table and logging for Paperclip agents» for this epic—full scope in § Prompt below."
skill: migration
phase: PRODUCTION
priority: P1
status: Open
owner: Backend
dependencies: []
estimated_effort: M
percent_complete: 0
epic: E9
outcome: O9
---
```

### Prompt

**CRITICAL:** The `agent_audit_log` table does NOT exist in any migration. This task must CREATE the table first. Do NOT assume E5-001 or any other task creates it — it's this task's responsibility.

Create the `agent_audit_log` table and wire logging for all Paperclip agent actions.

**Read first:**
- `tasks/mermaid/10-deployment-architecture.mmd` — agent_audit_log in Monitoring section
- `tasks/mermaid/07-agent-architecture.mmd` — task lifecycle, approval gates, heartbeats
- `supabase/migrations/` — existing migration patterns

**The build:**
- Migration: create `agent_audit_log` table
  - `id` (uuid, PK)
  - `agent_name` (text) — CEO, CMO, CTO, OpsManager, hermes_local, openclaw_gateway
  - `action_type` (text) — heartbeat, delegation, approval_gate, task_state_change, error
  - `action_detail` (jsonb) — structured details of what happened
  - `target_entity` (text, nullable) — lead_id, apartment_id, etc.
  - `target_entity_type` (text, nullable) — 'lead', 'apartment', 'booking', etc.
  - `result` (text) — 'success', 'failure', 'pending_approval', 'blocked'
  - `duration_ms` (integer, nullable)
  - `triggered_by` (text, nullable) — 'heartbeat', 'manual', 'escalation'
  - `created_at` (timestamptz)
- RLS: service_role write, admin read, no public access
- Indexes: agent_name, action_type, created_at, target_entity
- Create helper edge function or utility for logging: `supabase/functions/agent-log/index.ts`
  - Accept: `{ agent_name, action_type, action_detail, target_entity?, result }`
  - Insert into agent_audit_log
  - Return: `{ log_id }`

### Acceptance Criteria
- [ ] Migration creates agent_audit_log table
- [ ] RLS: service_role write, admin read
- [ ] Indexes on: agent_name, action_type, created_at
- [ ] Logging utility callable from Paperclip agents
- [ ] All 7 approval gate triggers logged
- [ ] Heartbeat runs logged with duration
- [ ] Delegation events logged (which agent delegated to which adapter)
- [ ] Queryable: "show me all CEO actions in the last 24h"

---

## E9-005: Write E2E Tests for Critical Paths

```yaml
---
id: E9-005
diagram_id: MERM-10
prd_section: "7. Technical Specs — Testing"
title: Write e2e tests (Playwright) for critical user paths
description: "Ships «Write e2e tests (Playwright) for critical user paths» for this epic—full scope in § Prompt below."
skill: testing
phase: PRODUCTION
priority: P1
status: Open
owner: QA
dependencies:
  - E1-001
estimated_effort: L
percent_complete: 0
epic: E9
outcome: O9
---
```

### Prompt

Write Playwright e2e tests covering the critical user paths through the rental flow.

**Read first:**
- `playwright.config.ts` — existing Playwright configuration
- `tasks/mermaid/01-user-journeys.mmd` — renter satisfaction journey steps
- `src/App.tsx` — all routes
- `src/pages/` — page components

**The build:**
- Test files in `tests/e2e/`:
  - `tests/e2e/rental-search.spec.ts` — search flow
  - `tests/e2e/listing-detail.spec.ts` — detail page
  - `tests/e2e/auth.spec.ts` — login/signup/logout
  - `tests/e2e/booking-flow.spec.ts` — full booking pipeline
  - `tests/e2e/navigation.spec.ts` — nav, routing, 404s

**Critical paths to test:**

1. **Rental Search:** Homepage → /rentals → apply filters → see results → click listing
2. **Listing Detail:** /rentals/:id loads → photo carousel works → amenities displayed → action buttons visible
3. **Auth Flow:** /signup → create account → redirect to dashboard → /login → login → dashboard
4. **Booking Pipeline:** Search → select listing → schedule showing → fill application → payment button
5. **Navigation:** All nav links work → protected routes redirect to login → 404 for invalid routes

**Test data:** Use seed data from E1-001. Configure Playwright to use dev server with seeded database.

### Acceptance Criteria
- [ ] 5+ test files covering critical paths
- [ ] Rental search: filters work, results display, listing clickable
- [ ] Listing detail: page loads, photos/amenities/actions render
- [ ] Auth: signup, login, logout, protected route redirect
- [ ] Navigation: all main routes accessible, 404 handled
- [ ] Tests run against dev server: `npx playwright test`
- [ ] Tests pass in CI (or instructions for CI setup)
- [ ] No flaky tests (stable selectors, proper waits)

---

## E9-006: Configure Monitoring Alerts

```yaml
---
id: E9-006
diagram_id: MERM-10
prd_section: "7. Technical Specs — Monitoring"
title: Configure monitoring alerts for error rate and latency
description: "Ships «Configure monitoring alerts for error rate and latency» for this epic—full scope in § Prompt below."
skill: devops
phase: PRODUCTION
priority: P2
status: Open
owner: DevOps
dependencies:
  - E9-002
estimated_effort: M
percent_complete: 0
epic: E9
outcome: O9
---
```

### Prompt

Set up monitoring alerts for production issues: error rates, latency spikes, and AI cost tracking.

**Read first:**
- `tasks/mermaid/10-deployment-architecture.mmd` — Monitoring section
- Vercel dashboard → Project → Monitoring
- Supabase dashboard → Logs

**The build:**
- **Vercel alerts:**
  - Error rate > 5% → email notification
  - p95 latency > 3s → email notification
  - Deploy failure → email notification
  - Configure via Vercel dashboard or API

- **Supabase monitoring:**
  - Edge function error rate tracking via Supabase logs
  - Database connection pool monitoring
  - Storage usage alerts

- **AI cost monitoring (custom):**
  - Create `src/pages/admin/AIMonitoring.tsx` — admin page showing ai_runs aggregates
  - Daily token usage chart (by agent)
  - Cost estimate (based on Gemini pricing)
  - Alert if daily token usage exceeds threshold
  - Route: `/admin/ai-monitoring` (protected, admin only)

- **Agent monitoring:**
  - Query `agent_audit_log` for failed actions
  - Alert if heartbeat hasn't run in >24h
  - Alert if approval gate queue has items >2h old

### Acceptance Criteria
- [ ] Vercel error rate and latency alerts configured
- [ ] Deploy failure notifications enabled
- [ ] AI monitoring admin page shows token usage and costs
- [ ] Agent heartbeat health check (alert on missed heartbeats)
- [ ] Approval gate queue age monitoring
- [ ] All alerts have clear escalation path (email → who)
- [ ] Admin page handles 4 states
- [ ] `npm run build` passes
