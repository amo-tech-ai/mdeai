# Definition of Done (DoD) Template

> **Scope:** Every task/PR in the mdeai project must meet these criteria before being marked complete.
> **Owner:** TBD | **Last updated:** 2026-04-05

---

## Universal DoD (All Tasks)

- [ ] **Build passes:** `npm run build` completes with zero errors
- [ ] **Lint clean:** `npm run lint` has no new warnings or errors
- [ ] **Types clean:** No `any` types introduced (use `unknown` and narrow)
- [ ] **No secrets:** No API keys, tokens, or credentials in committed code
- [ ] **Tested locally:** Feature works in `npm run dev` (port 8080)

---

## By Task Type

### Frontend Component
- [ ] Universal DoD (above)
- [ ] Handles 4 states: loading (Skeleton), error (with retry), empty, success
- [ ] Uses shadcn/ui primitives (no custom form elements when primitive exists)
- [ ] Uses `cn()` for conditional classes, CSS variables for colors
- [ ] Responsive: works on mobile (375px) and desktop (1440px)
- [ ] WCAG 2.1 AA: keyboard navigable, sufficient contrast, semantic HTML
- [ ] Follows 3-panel layout pattern (if page-level component)
- [ ] Uses `@/` path alias for all imports

### Edge Function
- [ ] Universal DoD (above)
- [ ] Auth validated (JWT or webhook signature — documented which)
- [ ] Zod schema validates all inputs, 400 on invalid
- [ ] CORS headers include production URLs + localhost
- [ ] Structured response: `{ success, data }` or `{ success: false, error: { code, message } }`
- [ ] Timeouts: 30s for AI calls, 10s for DB queries
- [ ] Rate limiting applied (if AI or search endpoint)
- [ ] Idempotency-Key header supported (if mutating endpoint)
- [ ] AI calls logged to `ai_runs` table (if Gemini is called)
- [ ] Gemini calls follow G1-G5 rules (structured JSON, x-goog-api-key, citations)

### Database Migration
- [ ] Universal DoD (above)
- [ ] Migration file in `supabase/migrations/` with timestamp prefix
- [ ] RLS enabled on every new table
- [ ] RLS policies use `(select auth.uid())` subquery pattern
- [ ] Foreign keys with appropriate ON DELETE behavior
- [ ] Indexes on: foreign keys, filter columns, sort columns
- [ ] `created_at` and `updated_at` timestamps on all tables
- [ ] Idempotent: can run on fresh DB or after partial apply
- [ ] TypeScript types updated in `src/types/` if schema changes affect frontend

### Agent Configuration
- [ ] Universal DoD (above)
- [ ] Agent starts without errors
- [ ] Instructions file exists and provides mdeai context
- [ ] Timeout configured (30s for Hermes, 15min for heartbeat cycle)
- [ ] Actions logged to `agent_audit_log` table
- [ ] Approval gates enforced per MERM-07

### E2E / Integration Test
- [ ] Universal DoD (above)
- [ ] Test uses seed data (E1-001), not hardcoded IDs
- [ ] Stable selectors (data-testid, not CSS classes)
- [ ] No flaky waits (use Playwright's auto-waiting)
- [ ] Covers happy path + at least one error path
- [ ] Runs in CI: `npx playwright test` passes

---

## Per-Epic Security Checklist

Every epic completion must also verify:

- [ ] No new `VITE_` variables exposing private keys
- [ ] No raw SQL in frontend code (use Supabase client)
- [ ] No `supabase.auth.admin` calls outside edge functions
- [ ] Service role key not passed in any client-side request
- [ ] New RLS policies tested (try accessing as wrong user)

---

## Per-Epic Metric Checkpoint

Each epic should define at least one measurable outcome:

| Epic | Metric | Target |
|------|--------|--------|
| E1 | Tables with >0 rows | 28/28 |
| E2 | Pipeline steps functional | 5/5 (lead → showing → application → booking → payment) |
| E3 | Security issues remaining | 0 CRITICAL |
| E4 | Pages rendering correctly | All CORE pages load without error |
| E5 | Agent heartbeat completing | Daily cycle finishes in <15 min |
| E6 | Top-1 ranking accuracy | >=70% |
| E7 | Lease review completeness | >=90% of terms extracted |
| E8 | WhatsApp conversion | >=10% of conversations → lead |
| E9 | Uptime | >=99.5% |
