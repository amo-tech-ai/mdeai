# mdeAI Testing Plan — MVP Phase 1
> Last updated: 2026-05-12 · Status: active

---

## Executive Summary

Phase 1 has **0/5 QA gate items** complete (G1–G5). The core build is done. What's missing is **proof it works for real users** — a ticket buyer getting their QR, a staff member scanning it, a load test showing no oversell. This plan adds the minimum tests needed to pass that gate without over-engineering.

**Test count targets:**
- Vitest unit: 41 → ~55 (+14 new)
- Deno edge: 18 → ~23 (+5 new)
- Playwright smoke: 0 → 1 (MASTRA-038, already written)
- Manual QA checklists: 0 → 5 (G1–G5)

---

## Test Pyramid for mdeAI

```
                  ┌─────────────────────────┐
                  │  Playwright smoke (1)   │  ← Preview URL only; Mastra routing
                  └──────────┬──────────────┘
               ┌─────────────┴──────────────────┐
               │  Deno edge tests (18→23)       │  ← Auth paths, DB errors, envelopes
               └──────────────┬─────────────────┘
          ┌────────────────────┴──────────────────────────┐
          │  Vitest unit (41→55)                         │  ← Components, hooks, pure logic
          └──────────────────────────────────────────────┘
```

---

## Layer 1 — Fast Checks (already in place)

| Command | What it proves | Gate |
|---|---|---|
| `npm run lint` | No TS errors, import order | ✅ blocks merge |
| `npm run build` | Vite bundle compiles | ✅ blocks merge |
| `npm run test` | 41 Vitest unit tests | ✅ blocks merge |
| `npm run verify:edge` | Deno type-check on edge fns | ✅ blocks merge |
| `npm run floor` | All four above in sequence | ✅ pre-push gate |

**Run time:** ~15 seconds total. Never skip.

---

## Layer 2 — Unit Tests / Vitest

### Existing (41 tests, 6 files — do not regress)

| File | What it covers |
|---|---|
| `src/lib/booking-pricing.test.ts` | Price calculation |
| `src/lib/google-maps-loader.test.ts` | Maps SDK loader |
| `src/lib/maps-telemetry.test.ts` | Auth-fail tracking |
| `src/lib/affiliate.test.ts` | Affiliate link logic |
| `src/lib/pending-prompt.test.ts` | Chat prompt queue |

### New — add these (targeted, high-ROI)

#### ✅ DONE: `src/components/chat/embedded/EventCardInline.test.tsx` (10 tests)

Covers:
- Renders title + combined venue·neighborhood text
- Category badge displays
- Paid price / Free price / null price (hidden)
- Link points to sourceUrl; pointer-events-none when null
- Calendar SVG fallback when no imageUrl
- Calendar SVG fallback on img load error
- Date formats to human-readable string

#### TODO: `src/lib/mastra/search-events-logic.test.ts` (8 tests)

**Prerequisite:** Export `dateWindow`, `mapCategory`, `extractNeighborhood` from
`my-mastra-app/src/mastra/tools/search-events.ts` (or move pure logic to a shared util).

Tests to write:
```ts
// dateWindow('tonight') — gte is now, lte is end of Bogota day
// dateWindow('this_weekend') on a Tuesday — gte is next Friday
// dateWindow('this_weekend') on a Saturday — gte is last Friday (current weekend)
// dateWindow('any') — returns {} (no bounds)
// mapCategory('Nightlife') → 'nightlife'
// mapCategory('Festival') → 'culture'
// mapCategory(null) → 'culture' (fallback)
// extractNeighborhood('El Poblado, Calle 9, Medellín', null) → 'El Poblado'
// extractNeighborhood(null, 'Medellín') → 'Medellín'
```

#### TODO: `my-mastra-app/src/mastra/lib/__tests__/ai-runs.test.ts` (3 tests)

Add vitest to `my-mastra-app/package.json` first:
```bash
cd my-mastra-app && npm add -D vitest @vitest/ui
```

Tests:
```ts
// recordMastraRun when SUPABASE_URL missing → returns without throwing
// recordMastraRun when insert resolves → resolves normally
// recordMastraRun when insert hangs > 500ms → times out silently (does not throw)
```

The timeout test uses `vi.useFakeTimers()` + `vi.advanceTimersByTimeAsync(600)`.

---

## Layer 3 — Edge / Deno Tests

### Existing (18 tests across 16 files — do not regress)

Key files: `gemini_structured_test.ts`, `gemini_retry_test.ts`, `ai-search_test.ts`,
`ai-chat_test.ts`, `ai-router_test.ts`, `rentals_test.ts`.

Gemini failure modes (empty candidates, non-JSON text, network error) already covered in
`gemini_structured_test.ts` — **do not duplicate**.

### ✅ DONE: `supabase/functions/tests/sponsor-roi-explain_test.ts` (4 tests)

**NOTE: `supabase/functions/sponsor-roi-explain/index.ts` is missing from disk.**
It was present in commit `8a88166` but removed during the PR #38 squash merge. It must
be restored before these tests activate. Tests are correctly structured and will pass
once the function exists.

Tests (all gated on `EDGE_FUNCTIONS_AUDIT=1`):
- OPTIONS → 200/204
- POST no auth → 401
- POST missing `application_id` → 400
- POST valid auth + app ID → 200 `{ success: true, data: {...} }`

**To activate:** restore `supabase/functions/sponsor-roi-explain/index.ts`,
run `npm run verify:edge`, then `EDGE_FUNCTIONS_AUDIT=1 deno test supabase/functions/tests/sponsor-roi-explain_test.ts`.

---

## Layer 4 — Playwright / E2E Smoke (MASTRA-038)

### ✅ DONE: `tests/smoke/mastra-chat-events-weekend.spec.ts`

**Query:** `"major events in Medellín this summer"` (durable — hits real seeded anchor events)

**Run command:**
```bash
PLAYWRIGHT_BASE_URL=<vercel-preview-url> npx playwright test tests/smoke/mastra-chat-events-weekend.spec.ts
```

**What it proves:**
- Chat widget mounts on the Preview URL
- POST goes to Mastra server (not `/functions/v1/ai-chat`)
- At least one `[data-mdeai-card="event"]` appears within 30 seconds
- `[data-mdeai-embedded-listings][data-mdeai-action*="OPEN_EVENT_RESULTS"]` wrapper is attached
- `VITE_USE_MASTRA_CHAT=true` flag is active on the build

**Prerequisites:**
1. `PLAYWRIGHT_BASE_URL` set to the Vercel Preview URL for this branch
2. Preview has `VITE_USE_MASTRA_CHAT=true` and `VITE_MASTRA_SERVER_URL` set
3. `npx playwright install chromium` done locally or in CI

**What it does NOT prove (verify manually):**
- The right event names/dates in the card content
- Map pins render on the map panel
- `ai_runs` row is written to the DB (check via Supabase dashboard)

**To verify `ai_runs`:**
```sql
select agent_name, status, created_at, input_tokens, output_tokens
from public.ai_runs
order by created_at desc
limit 5;
```

---

## Layer 5 — Phase 1 QA Gate (G1–G5)

All five must pass before Phase 2 starts. None are automated yet — they are manual runs.

### G1 — Camila buys a ticket (buyer E2E)

**Who runs it:** Any team member with a real phone.

**Setup:**
- Use Stripe test card `4242 4242 4242 4242`, any future date, any CVV
- Use a real email address you can check
- Pick a published event with `ticket_price_min > 0`

**Steps:**
1. Navigate to event listing page → click "Buy Ticket"
2. Complete Stripe checkout with test card
3. Confirm redirect to `/tickets/<id>` with QR code displayed
4. Check email inbox — confirm email arrived within 2 minutes
5. Open email on mobile — confirm QR code is visible full-screen

**Pass criteria:**
- [ ] Stripe charge appears in test dashboard
- [ ] Confirmation email arrives in < 2 minutes
- [ ] QR code scans with a phone camera (standard QR reader app)
- [ ] Mobile rendering: QR is ≥ 200px, no overflow, no horizontal scroll

**Known blockers:** `INFOBIP_API_KEY` must be set for email delivery.

---

### G2 — Roberto validates + double-scan (staff E2E)

**Who runs it:** Any team member as "staff".

**Setup:**
- Generate a staff magic link from the host dashboard for the event used in G1
- Open link on a mobile browser (simulate staff role)
- Have the QR code from G1 ready on a second device

**Steps:**
1. Open staff magic link → confirm scanner PWA loads without login prompt
2. Click "Scan QR" → allow camera
3. Scan valid QR from G1 → confirm green ✓ + ticket holder name appears
4. Scan the same QR again immediately → confirm "ALREADY_USED" error state

**Pass criteria:**
- [ ] First scan: green ✓ response in < 3 seconds
- [ ] Second scan: `ALREADY_USED` state clearly shown (not a crash)
- [ ] Ticket `used_at` timestamp written to DB

---

### G3 — Staff link revocation

**Who runs it:** Host (or any admin).

**Setup:**
- Have a second staff magic link (different from G2) open in a browser session
- That session must be "active" (i.e., scanner is loaded)

**Steps:**
1. Host dashboard → revoke the staff link
2. Wait up to 60 seconds
3. Attempt a scan from the already-open scanner session

**Pass criteria:**
- [ ] Scanner is denied (auth error or "link revoked" message) within 60 seconds of revocation
- [ ] No scan is recorded in DB after revocation

---

### G4 — Oversell load test (50 concurrent buyers)

**Who runs it:** Engineer.

**Command (k6 or similar):**
```bash
# Event must have total_capacity = 30
# Set BASE_URL to staging or prod
k6 run --vus 50 --iterations 50 scripts/load-test-checkout.js
```

If k6 is not installed, use `ab` (ApacheBench):
```bash
# This only tests HTTP layer, not full Stripe flow — use k6 for real load test
ab -n 50 -c 50 -p checkout_payload.json -T application/json \
  https://staging.mdeai.co/functions/v1/ticket-payment-webhook
```

**Pass criteria:**
- [ ] Exactly 30 tickets sold (tickets table has 30 rows with `status='confirmed'`)
- [ ] Exactly 20 rejections (HTTP 409 or `{ success: false, error: 'SOLD_OUT' }`)
- [ ] Zero duplicate tickets for the same `checkout_session_id`
- [ ] No 500 errors in edge function logs

---

### G5 — Lighthouse accessibility ≥ 90

**Who runs it:** Engineer or QA.

**Pages to test (in order of priority):**

| Page | URL pattern | Min score |
|---|---|---|
| Event listing | `/events` | 90 |
| Ticket buy flow | `/events/<slug>/buy` | 90 |
| Staff scanner PWA | `/staff/scan/<token>` | 90 |
| Host dashboard | `/host/events` | 90 |

**Run command (chrome-devtools-mcp):**
```
lighthouse_audit --url <page-url> --mode navigation --device mobile
```

Or via CLI:
```bash
npx lighthouse <url> --output=json --chrome-flags="--headless" | jq '.categories.accessibility.score * 100'
```

**Pass criteria:**
- [ ] All four pages score ≥ 90 on accessibility
- [ ] No critical contrast failures (WCAG AA)
- [ ] All form inputs have visible labels

---

## Layer 6 — 30-Minute Exploratory Dogfood Session

Run once before MASTRA-038 smoke and once before Phase 2 launch. Capture top 5 defects only.

### Session script

**Target:** https://www.mdeai.co (production) or Vercel Preview URL

**Time budget:** 30 minutes

| # | Area | What to do | Watch for |
|---|---|---|---|
| 1 | Events chat (5 min) | Type: "what's happening in Medellín this weekend?" | Event cards appear, map pins update, no JS errors |
| 2 | Events chat (3 min) | Type: "free events near El Poblado" | Category filter respected, no 500 in Network tab |
| 3 | Rentals chat (5 min) | Type: "furnished 2BR in Laureles under $1500" | Rental cards appear, lead-capture modal fires |
| 4 | Intent switch (3 min) | Start with events, switch to rentals in same convo | No state bleed between verticals |
| 5 | Map pins (3 min) | Click a chat result card | Map re-centers to correct lat/lng; pin is clickable |
| 6 | Empty state (2 min) | Type: "zzz nonsense query" | Shows graceful empty state, not blank screen |
| 7 | Auth flow (5 min) | Sign up with email → sign out → sign back in | Auth state persists; no redirect loops |
| 8 | Console sweep (4 min) | Open DevTools → Console → check for errors | Zero red errors on any page visited |

**Report template:**
```
Defect 1: [severity] [category] — [one-line description]
  Steps: …
  Expected: …
  Actual: …

(Repeat for top 5 only)
```

**Issue taxonomy:** Critical → High → Medium → Low (see `.claude/skills/testing/references/issue-taxonomy.md`).

---

## Layer 7 — CI Gating

### Current gate (block merges on failure)

```yaml
# .github/workflows/ci.yml — already exists or add this
- run: npm run lint
- run: npm run build
- run: npm run test
- run: npm run verify:edge
```

### Add: targeted Playwright smoke (add to CI for Mastra/event changes only)

```yaml
- name: Playwright smoke — Mastra events
  if: |
    contains(github.event.commits[0].message, 'mastra') ||
    contains(github.event.commits[0].message, 'ai-chat') ||
    contains(github.event.commits[0].message, 'search-events')
  env:
    PLAYWRIGHT_BASE_URL: ${{ secrets.VERCEL_PREVIEW_URL }}
  run: npx playwright test tests/smoke/mastra-chat-events-weekend.spec.ts
```

**Do NOT gate on full E2E yet** — no Playwright auth flow tests exist and they'd be brittle.

### Merge gate recommendation

| Check | Gate type |
|---|---|
| lint | Hard block — zero tolerance |
| build | Hard block |
| npm run test (41 → 55 unit) | Hard block |
| verify:edge (Deno type-check) | Hard block |
| Playwright smoke | Soft block — run on Mastra/events PRs only |
| G1–G5 | Manual gate — required before Phase 2 kickoff, not per-PR |

---

## Layer 8 — Testing Backlog

### Must-have before production rollout

- [ ] `search-events-logic.test.ts` — date window + category mapping (export pure functions first)
- [ ] `ai-runs.test.ts` — timeout guard (add vitest to `my-mastra-app/`)
- [ ] Restore `sponsor-roi-explain/index.ts` → activate `sponsor-roi-explain_test.ts`
- [ ] G1–G5 all five manual QA gates
- [ ] `ai_runs` observability check in MASTRA-038 smoke (add SQL query to runbook)

### Should-have after MVP (Phase 1 ship)

- [ ] `EmbeddedListings.test.tsx` — routing to correct inline card by action type
- [ ] `useChat.test.ts` — SSE parser handles `__mdeai_actions__` sidecar + delta text
- [ ] Load test script (k6) for ticket checkout idempotency (G4)
- [ ] Lighthouse CI step that auto-fails if score < 90 (currently manual)
- [ ] Playwright auth flow: sign up → sign in → sign out

### Defer until Phase 2

- [ ] Contest voting flow tests (Phase 2 feature)
- [ ] Sponsor audience-match, creative-gen, moderate, optimize edge tests
- [ ] WhatsApp OTP delivery tests
- [ ] AI response quality evals (LLM-as-judge with golden set)
- [ ] Visual regression baseline screenshots
- [ ] Mobile-specific Playwright suite (Playwright device emulation)

---

## What NOT to Test

- **Framework code** — shadcn components, React router internals, Supabase client constructor
- **Gemini API contract** — already covered in `gemini_structured_test.ts` / `gemini_retry_test.ts`
- **Trivial getters** — color maps, static config objects, enum values
- **Features not yet built** — contests, voting, WhatsApp, sponsor-optimize, etc.
- **Network-gated tests as the only proof** — a test that only asserts HTTP 200 tells you nothing about content

---

## Risks and Flake Sources to Avoid

| Risk | Mitigation |
|---|---|
| Playwright smoke depends on Vercel Preview URL being alive | Skip gracefully if `PLAYWRIGHT_BASE_URL` not set |
| Event card renders correctly only when Mastra server responds | Smoke has 30s timeout; add retry in CI |
| `ai_runs` insert fails silently (500ms timeout) | Promise.race guard already in place; test it with fake timers |
| `getByText` on combined text nodes causes multiple-match errors | Use full `Venue · Neighborhood` string, not partial |
| `ON CONFLICT DO NOTHING` seeds wrong-date events | Fixed: UPDATE approach for Salsa Night, not re-insert |
| Deno tests with `EDGE_FUNCTIONS_AUDIT=1` hit real prod | Use `auditIgnore()` guard; never run against prod without intent |

---

## Exact Commands to Run

```bash
# Layer 1 — fast checks (run before every push)
npm run floor

# Layer 2 — unit tests only
npm run test -- --run

# Layer 2 — single file
npm run test -- --run src/components/chat/embedded/EventCardInline.test.tsx

# Layer 3 — Deno edge tests (requires EDGE_FUNCTIONS_AUDIT=1 + anon JWT)
EDGE_FUNCTIONS_AUDIT=1 deno test supabase/functions/tests/ --allow-env --allow-net

# Layer 4 — Playwright smoke (requires Preview URL)
PLAYWRIGHT_BASE_URL=<url> npx playwright test tests/smoke/mastra-chat-events-weekend.spec.ts

# Precheck: confirm ≥1 event in summer window before smoke
supabase db query --linked -f scripts/precheck-weekend-events.sql

# G5 — Lighthouse accessibility
npx lighthouse <url> --output=json --chrome-flags="--headless" | jq '.categories.accessibility.score * 100'
```
