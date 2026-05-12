# mdeAI Testing Plan — MVP Phase 1
> Last updated: 2026-05-12 · Status: active

---

## Executive Summary

Phase 1 has **0/5 QA gate items** complete (G1–G5). The core build is done. What's missing is **proof it works for real users** — a ticket buyer getting their QR, a staff member scanning it, a load test showing no oversell. This plan adds the minimum tests needed to pass that gate without over-engineering.

**Test count targets:**
- Vitest unit (main repo): 51 → ~60 (+9 new)
- Vitest unit (my-mastra-app): 8 passing
- Deno edge: 18 → ~25 (+7 new)
- Playwright smoke: 1 (MASTRA-038, written)
- Mastra Studio smoke: 1 browser pass per deploy
- Security audit: 1 full audit per sprint
- Manual QA checklists: 0 → 5 (G1–G5)

---

## Test Pyramid for mdeAI

```
                    ┌─────────────────────────────────┐
                    │  Manual QA (G1–G5)               │  ← Real person, real device
                    └──────────────┬──────────────────┘
              ┌─────────────────────┴────────────────────────┐
              │  Playwright smoke (1) + Mastra Studio (1)   │  ← Preview URL + Studio UI
              └───────────────────┬──────────────────────────┘
           ┌───────────────────────┴───────────────────────────────┐
           │  Deno edge tests (18→25) + Security audit             │  ← Auth/RLS/IDOR/envelopes
           └──────────────────────┬────────────────────────────────┘
      ┌──────────────────────────────┴──────────────────────────────────────┐
      │  Vitest unit (51 main + 8 mastra) + Chrome DevTools sweeps         │  ← Components, logic, perf
      └──────────────────────────────────────────────────────────────────────┘
```

---

## Layer 1 — Fast Checks (already in place)

| Command | What it proves | Gate |
|---|---|---|
| `npm run lint` | No TS errors, import order | ✅ blocks merge |
| `npm run build` | Vite bundle compiles | ✅ blocks merge |
| `npm run test` | 51 Vitest unit tests | ✅ blocks merge |
| `npm run verify:edge` | Deno type-check on edge fns | ✅ blocks merge |
| `npm run floor` | All four above in sequence | ✅ pre-push gate |
| `cd my-mastra-app && npm test` | 8 search-events logic tests | ✅ run on Mastra changes |

**Run time:** ~20 seconds total. Never skip.

---

## Layer 2 — Unit Tests / Vitest

### Existing (51 tests, 7 files — do not regress)

| File | What it covers |
|---|---|
| `src/lib/booking-pricing.test.ts` | Price calculation |
| `src/lib/google-maps-loader.test.ts` | Maps SDK loader |
| `src/lib/maps-telemetry.test.ts` | Auth-fail tracking |
| `src/lib/affiliate.test.ts` | Affiliate link logic |
| `src/lib/pending-prompt.test.ts` | Chat prompt queue |
| `src/components/chat/embedded/EventCardInline.test.tsx` | Event card render states |
| `my-mastra-app/.../search-events-logic.test.ts` | Bogota date windows + category mapping |

### ✅ DONE: `src/components/chat/embedded/EventCardInline.test.tsx` (10 tests)

Covers: title/venue render, category badge, paid/free/null price, link href, pointer-events-none,
Calendar SVG fallback on no imageUrl, Calendar SVG fallback on img error, date formatting.

### ✅ DONE: `my-mastra-app/src/mastra/tools/__tests__/search-events-logic.test.ts` (8 tests)

Covers: `mapCategory` known types, `mapCategory` null/unknown fallback, `extractNeighborhood`
comma-separated address, `extractNeighborhood` null address + null city fallbacks,
`dateWindow('any')` returns `{}`, `dateWindow('tonight')` bounds, `dateWindow('this_weekend')`
Friday/Sunday anchors, `dateWindow('this_week')` Monday/Sunday bounds.
Uses `vi.useFakeTimers()` pinned to Wed 2026-05-13 14:00 UTC.

### TODO: `my-mastra-app/src/mastra/lib/__tests__/ai-runs.test.ts` (3 tests)

Tests:
```ts
// recordMastraRun when SUPABASE_URL missing → returns without throwing
// recordMastraRun when insert resolves → resolves normally
// recordMastraRun when insert hangs > 500ms → times out silently (does not throw)
```

The timeout test uses `vi.useFakeTimers()` + `vi.advanceTimersByTimeAsync(600)`.

### TODO: `src/components/chat/embedded/EmbeddedListings.test.tsx` (4 tests)

Tests the action router — given `ChatAction[]` of different types, the right card component
renders. Tests: `OPEN_RENTALS_RESULTS` → `RentalCardInline`, `OPEN_EVENT_RESULTS` →
`EventCardInline`, `OPEN_RESTAURANT_RESULTS` → `RestaurantCardInline`,
unknown action type → renders nothing.

---

## Layer 3 — Edge / Deno Tests

### Pattern (from `supabase-edge-functions` skill)

All Deno tests live in `supabase/functions/tests/<function-name>_test.ts`.

```bash
# Run all edge tests locally (requires EDGE_FUNCTIONS_AUDIT=1 + valid anon JWT)
EDGE_FUNCTIONS_AUDIT=1 deno test supabase/functions/tests/ --allow-env --allow-net

# Run one function's tests
EDGE_FUNCTIONS_AUDIT=1 deno test supabase/functions/tests/ai-chat_test.ts --allow-env --allow-net
```

**Standard test structure for every function:**
1. `OPTIONS` → 200/204 (CORS preflight)
2. POST without `Authorization` → 401
3. POST with invalid/expired JWT → 401
4. POST with anon JWT + bad input → 400 (Zod validation)
5. POST with valid auth + valid input → 200 `{ success: true, data: {...} }`
6. POST with valid auth → response envelope shape (`success`, `data`, `meta` keys present)

**Local test loop:**
```bash
supabase start
supabase functions serve        # or: supabase functions serve ai-chat
# In a second terminal:
EDGE_FUNCTIONS_AUDIT=1 SUPABASE_URL=http://127.0.0.1:54321 \
  deno test supabase/functions/tests/<fn>_test.ts --allow-env --allow-net
```

### Existing (18 tests across 16 files — do not regress)

Key files: `gemini_structured_test.ts`, `gemini_retry_test.ts`, `ai-search_test.ts`,
`ai-chat_test.ts`, `ai-router_test.ts`, `rentals_test.ts`, `audit_helpers.ts` (shared).

Gemini failure modes (empty candidates, non-JSON text, network error) already covered in
`gemini_structured_test.ts` — **do not duplicate**.

### ✅ DONE: `supabase/functions/tests/sponsor-roi-explain_test.ts` (4 tests, skeleton)

**NOTE: `supabase/functions/sponsor-roi-explain/index.ts` is missing from disk.**
Was in commit `8a88166`, removed during PR #38 squash merge. Must be restored before
these tests activate. Tests are correctly structured and will pass once the function exists.

Tests (all gated on `EDGE_FUNCTIONS_AUDIT=1`):
- OPTIONS → 200/204
- POST no auth → 401
- POST missing `application_id` → 400
- POST valid auth + app ID → 200 `{ success: true, data: {...} }`

### TODO: Additional Deno tests for Phase 3 functions

When sponsor-roi-explain is restored, add:
- `sponsor-audience-match_test.ts` (4 tests) — same auth contract
- `sponsor-creative-gen_test.ts` (4 tests) — same auth contract + input size validation

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

**To verify `ai_runs` row was written:**
```sql
select agent_name, status, created_at, input_tokens, output_tokens
from public.ai_runs
order by created_at desc
limit 5;
```

---

## Layer 4a — Mastra Studio Smoke

Run once per deploy when Mastra runtime changes. Uses the Studio browser UI at `http://localhost:4111`
or the deployed `projects.mastra.ai` URL.

**When to run:** Any PR touching `my-mastra-app/src/mastra/` (agents, tools, workflows).

**Start server:**
```bash
cd my-mastra-app && npm run dev    # opens http://localhost:4111
```

**Browser checklist (chrome-devtools-mcp or Claude in Chrome):**

| Area | Route | Pass criteria |
|---|---|---|
| Studio shell | `/` or `/agents` | Sidebar visible, version shown, no crash overlay |
| Agents | `/agents` → mdeAI Events Agent | Agent appears in list; sending `"major events in Medellín this summer"` returns event cards |
| Tools | `/tools` → `search-events` | Tool list shows `search-events`; submitting `{ neighborhood: "El Poblado", limit: 3 }` returns JSON with `results` array |
| Workflows | `/workflows` | Any registered workflows appear; graph renders without error |
| Traces | `/observability` | Recent agent run traces listed after above tests |
| Scorers | `/scorers` | Page loads (empty state is a pass) |
| MCP | `/mcps` | Page loads (empty state is a pass) |

**Report template:**
```
## Mastra Studio Smoke — <date>

| Area         | Result | Evidence |
|--------------|--------|----------|
| Studio shell | PASS   | Loaded on port 4111; sidebar visible |
| Agents UI    | PASS   | Events Agent returned 3 El Poblado events |
| Tools UI     | PASS   | search-events returned { results: [...], total: 3 } |
| Workflows UI | N/A    | No workflows registered yet |
| Traces UI    | PASS   | 2 traces from above runs |
| Scorers UI   | PASS   | Empty state shown |
| MCP UI       | PASS   | Empty state shown |
```

**API curl alternative (headless):**
```bash
# Health check
curl -s http://localhost:4111/api/agents | jq '[.[] | .id]'

# Invoke agent directly
curl -s -X POST http://localhost:4111/api/agents/mdeai-events-agent/generate \
  -H "Content-Type: application/json" \
  -d '{"messages":[{"role":"user","content":"major events in Medellín this summer"}]}' \
  | jq '.text'
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
- That session must be "active" (scanner is loaded)

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
k6 run --vus 50 --iterations 50 scripts/load-test-checkout.js
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

**Run via chrome-devtools-mcp (interactive):**
```
lighthouse_audit --mode navigation --device mobile
```

**Run via chrome-devtools-cli (CI/headless):**
```bash
# After navigating to the page:
chrome-devtools navigate_page --url "https://www.mdeai.co/events"
chrome-devtools lighthouse_audit --mode navigation --device mobile --outputDirPath ./lighthouse-reports/
```

**Run via CLI (no chrome-devtools):**
```bash
npx lighthouse <url> --output=json --chrome-flags="--headless" \
  | jq '.categories.accessibility.score * 100'
```

**Pass criteria:**
- [ ] All four pages score ≥ 90 on accessibility
- [ ] No critical contrast failures (WCAG AA)
- [ ] All form inputs have visible labels

---

## Layer 6 — Gemini Contract Tests

The Gemini client helper in `supabase/functions/_shared/gemini.ts` handles structured output,
retry logic, and error normalization. These tests confirm the contract holds without hitting the
real API.

### Existing (covered — do not duplicate)

`supabase/functions/tests/gemini_structured_test.ts` already covers:
- Empty `candidates` array → throws `GeminiEmptyResponseError`
- Non-JSON text when JSON expected → throws parse error
- Retry on 503 → succeeds on second attempt
- Timeout after 30s → throws

### TODO: `supabase/functions/tests/gemini_contract_test.ts` (5 tests)

Test the **structured output envelope shape** that the Gemini Zod helper produces, using a
mock response that matches the v1beta `generateContent` REST shape:

```ts
// 1. Valid responseFormat.text.{mimeType, schema} produces parsed Zod object
// 2. Schema mismatch → Zod parse error (not a raw Gemini error)
// 3. `responseMimeType: "application/json"` legacy shape still accepted by helper
// 4. Gemini 3 series model ID format "gemini-3-flash-preview" is accepted (no rejection)
// 5. Helper injects `GEMINI_API_KEY` from env; missing key → throws before fetch
```

**Note on REST shape:** Per the `gemini/references/structured-outputs.md` skill, the correct
REST field path is `generationConfig.responseFormat.text` with `mimeType` + `schema` for v1beta
`generateContent`. The legacy `responseMimeType` + `responseSchema` shape also exists — test both.

### TODO: `supabase/functions/tests/gemini_function_calling_test.ts` (4 tests)

Verify the function-calling round-trip the mdeAI edge functions use (ai-chat, ai-trip-planner):

```ts
// 1. First response with functionCall → helper extracts { name, args } correctly
// 2. functionResponse injected in second call → final text response returned
// 3. Parallel tool calls → all extracted in array (Gemini 3 supports parallel FC)
// 4. Missing `id` field on functionCall → handled gracefully (Gemini 3 adds `id` field)
```

---

## Layer 7 — Chrome DevTools: Console Sweeps, Network Inspection, Performance

These are the three chrome-devtools-mcp/cli workflows that apply to mdeAI testing.

### 7a — Console error sweep (pre-commit gate)

Run before every PR targeting UI changes. Zero red errors is the bar.

**Via chrome-devtools-cli (integrates into the `/ship` command Step 3):**
```bash
# Navigate to the page you just changed
chrome-devtools navigate_page --url "http://localhost:8080/events"
chrome-devtools wait_for --text "Events" --timeout 5000

# Sweep for errors
chrome-devtools list_console_messages --types error --types warning
```

**Pass criteria:** No `error`-level messages. Warnings are permitted if they are known-framework
noise (React double-effect in dev mode, Radix aria warnings on modals).

### 7b — Network inspection for RLS / 403 debugging

When a UI feature shows an empty state or spinner that never resolves, use network inspection
to find the failing Supabase request before diving into code.

```bash
chrome-devtools navigate_page --url "http://localhost:8080/events"
chrome-devtools list_network_requests --resourceTypes Fetch
# Look for 403 on /rest/v1/ or /functions/v1/ responses
chrome-devtools get_network_request --reqid <id> --responseFilePath /tmp/rls-response.md
```

**Common RLS patterns to check:**
- 403 on `supabase.from('events').select()` → `SELECT` policy missing or wrong
- 401 on `/functions/v1/ai-chat` → JWT not forwarded from client
- Empty `data: []` with no error → RLS filters all rows (check `auth.uid()` in policy)

### 7c — Performance traces (LCP, Core Web Vitals)

Run for any change that affects above-the-fold rendering (hero, event listing cards, map init).

```bash
# Start trace
chrome-devtools navigate_page --url "https://www.mdeai.co/events"
chrome-devtools performance_start_trace true false

# Interact (simulate real user path)
chrome-devtools wait_for --text "Events" --timeout 10000

# Stop and analyze
chrome-devtools performance_stop_trace
chrome-devtools performance_analyze_insight "1" "LCPBreakdown"
```

**Targets (mdeAI):**

| Metric | Target | Fail threshold |
|---|---|---|
| LCP (mobile, 4G) | < 2.5s | > 4.0s blocks merge |
| FID / INP | < 200ms | > 500ms |
| CLS | < 0.1 | > 0.25 |

**G5 LCP check shortcut:**
```bash
chrome-devtools lighthouse_audit --mode navigation --device mobile --outputDirPath ./lighthouse-reports/
```

---

## Layer 8 — Security Audit (Edge Functions)

Run the `supabase-audit-functions` skill once per sprint and before any production release.
Documents findings in `.sb-pentest-context.json` and `.sb-pentest-evidence/07-functions-audit/`.

### Functions to audit (prioritized)

| Function | Auth mode | Key risk | Last audited |
|---|---|---|---|
| `ai-chat` | `verify_jwt=true` | Prompt injection via user message | — |
| `ai-router` | `verify_jwt=true` | Intent classification bypass | — |
| `ai-search` | `verify_jwt=true` | Cross-user data leak via pgvector | — |
| `ticket-payment-webhook` | `verify_jwt=false` (Stripe sig) | Stripe signature bypass, oversell | — |
| `rules-engine` | `verify_jwt=true` | IDOR on user_id param | — |
| `rentals` | `verify_jwt=true` | Unrestricted listing mutation | — |
| `google-directions` | `verify_jwt=true` | API key exposure via error body | — |
| `chat-lead-capture` | `verify_jwt=true` | Bulk lead harvesting without rate limit | — |

### Standard audit checks per function

| Test | Command pattern | Pass criteria |
|---|---|---|
| No auth → 401 | `curl -X POST /functions/v1/<fn>` (no header) | HTTP 401 |
| Anon key only → 401 | Add `apikey: <anon-key>` but no Bearer | HTTP 401 |
| IDOR: request other user's data | `user_id` param ≠ authenticated user | HTTP 403 |
| Role check: regular user → admin fn | Any JWT to admin-only endpoint | HTTP 403 |
| Input injection: oversized payload | `{ "input": "A".repeat(10000) }` | HTTP 400 or 413 |
| Error leaks: stack trace in body | Trigger known error path | No stack trace in response |
| CORS: unexpected origin | `Origin: https://evil.example.com` | `Access-Control-Allow-Origin` not `*` for write endpoints |

### Webhook-specific (ticket-payment-webhook, stripe-webhook)

```bash
# Valid signature test
stripe listen --forward-to localhost:54321/functions/v1/ticket-payment-webhook
stripe trigger payment_intent.succeeded

# Invalid signature test — must return 401
curl -X POST /functions/v1/ticket-payment-webhook \
  -H "stripe-signature: t=000,v1=invalid" \
  -d '{"type":"payment_intent.succeeded"}'
```

**Pass criteria:** Invalid signature → HTTP 401 with generic message (no expected hash exposed).

---

## Layer 9 — 30-Minute Exploratory Dogfood Session

Run once before MASTRA-038 smoke and once before Phase 2 launch. Capture top 5 defects only.

### Session script

**Target:** https://www.mdeai.co (production) or Vercel Preview URL

**Time budget:** 30 minutes

| # | Area | What to do | Watch for |
|---|---|---|---|
| 1 | Events chat (5 min) | Type: "what's happening in Medellín this summer?" | Event cards appear, map pins update, no JS errors |
| 2 | Events chat (3 min) | Type: "free events near El Poblado" | Category filter respected, no 500 in Network tab |
| 3 | Rentals chat (5 min) | Type: "furnished 2BR in Laureles under $1500" | Rental cards appear, lead-capture modal fires |
| 4 | Intent switch (3 min) | Start with events, switch to rentals in same convo | No state bleed between verticals |
| 5 | Map pins (3 min) | Click a chat result card | Map re-centers to correct lat/lng; pin is clickable |
| 6 | Empty state (2 min) | Type: "zzz nonsense query" | Shows graceful empty state, not blank screen |
| 7 | Auth flow (5 min) | Sign up with email → sign out → sign back in | Auth state persists; no redirect loops |
| 8 | Console sweep (4 min) | `chrome-devtools list_console_messages --types error` | Zero red errors on any page visited |

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

## Layer 10 — CI Gating

### Current gate (block merges on failure)

```yaml
# .github/workflows/ci.yml
- run: npm run lint
- run: npm run build
- run: npm run test
- run: npm run verify:edge
```

### Add: my-mastra-app tests (on Mastra changes)

```yaml
- name: Mastra unit tests
  if: contains(github.event.head_commit.message, 'mastra') || contains(github.event.head_commit.message, 'search-events')
  run: cd my-mastra-app && npm test
```

### Add: targeted Playwright smoke (on Mastra/event changes)

```yaml
- name: Playwright smoke — Mastra events
  if: |
    contains(github.event.head_commit.message, 'mastra') ||
    contains(github.event.head_commit.message, 'ai-chat') ||
    contains(github.event.head_commit.message, 'search-events')
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
| npm run test (51 unit) | Hard block |
| verify:edge (Deno type-check) | Hard block |
| my-mastra-app npm test (8 tests) | Hard block on Mastra PRs |
| Playwright smoke | Soft block — Mastra/events PRs only |
| Mastra Studio smoke | Manual — run per deploy, not per PR |
| Security audit | Manual — once per sprint |
| G1–G5 | Manual gate — required before Phase 2 kickoff |

---

## Layer 11 — Testing Backlog

### Must-have before production rollout

- [x] `EventCardInline.test.tsx` — 10 tests passing
- [x] `search-events-logic.test.ts` — 8 tests passing (in my-mastra-app)
- [ ] `ai-runs.test.ts` — timeout guard (3 tests, add to my-mastra-app vitest)
- [ ] `EmbeddedListings.test.tsx` — action router to inline card components (4 tests)
- [ ] Restore `sponsor-roi-explain/index.ts` → activate `sponsor-roi-explain_test.ts`
- [ ] G1–G5 all five manual QA gates
- [ ] `ai_runs` observability check in MASTRA-038 smoke (add SQL query to runbook)

### Gemini tests (Phase 3 prep)

- [ ] `gemini_contract_test.ts` — structured output envelope, REST shape, key check (5 tests)
- [ ] `gemini_function_calling_test.ts` — FC round-trip, parallel calls, `id` field (4 tests)
- [ ] `gemini_live_api_test.ts` — WebSocket session open/close, VAD, ephemeral token rotation (defer to if Live API is used)

### Chrome DevTools / perf gates (Should-have)

- [ ] Automate console sweep in `/ship` command Step 3 via `chrome-devtools-cli`
- [ ] Add Lighthouse CI step that auto-fails if a11y score < 90 (currently manual for G5)
- [ ] LCP trace baseline for `/events` page — store in `lighthouse-reports/` and diff on PRs
- [ ] INP check on mobile viewport for chat input (type-to-response latency)

### Mastra Studio smoke (Should-have)

- [ ] Add `scripts/mastra-studio-smoke.sh` that curls the Studio API instead of needing a browser
- [ ] Verify `search-events` tool returns ≥ 1 result for `{ neighborhood: "El Poblado", limit: 3 }`
- [ ] Verify agent traces appear in `/observability` after a tool call

### Security audit (Should-have)

- [ ] Run first full `supabase-audit-functions` audit against staging
- [ ] Document findings in `.sb-pentest-evidence/07-functions-audit/`
- [ ] Fix any P0 (IDOR, privilege escalation, missing auth) before Phase 2

### Should-have after MVP (Phase 1 ship)

- [ ] `useChat.test.ts` — SSE parser handles `__mdeai_actions__` sidecar + delta text
- [ ] Load test script (k6) for ticket checkout idempotency (G4)
- [ ] Playwright auth flow: sign up → sign in → sign out

### Defer until Phase 2

- [ ] Contest voting flow tests (Phase 2 feature)
- [ ] Sponsor audience-match, creative-gen, moderate, optimize edge tests
- [ ] WhatsApp OTP delivery tests
- [ ] AI response quality evals (LLM-as-judge with golden set)
- [ ] Visual regression baseline screenshots
- [ ] Mobile-specific Playwright suite (Playwright device emulation)
- [ ] Gemini Live API WebSocket tests (only if Live API is adopted)

---

## What NOT to Test

- **Framework code** — shadcn components, React router internals, Supabase client constructor
- **Gemini API contract itself** — that's Google's responsibility; test our wrapper only
- **Trivial getters** — color maps, static config objects, enum values
- **Features not yet built** — contests, voting, WhatsApp, sponsor-optimize, etc.
- **Network-gated tests as the only proof** — HTTP 200 tells you nothing about content shape
- **The Mastra Studio UI per-PR** — Studio smoke is per-deploy, not per-commit

---

## Risks and Flake Sources to Avoid

| Risk | Mitigation |
|---|---|
| Playwright smoke depends on Vercel Preview URL being alive | Skip gracefully if `PLAYWRIGHT_BASE_URL` not set |
| Event card renders correctly only when Mastra server responds | Smoke has 30s timeout; add retry in CI |
| `ai_runs` insert fails silently (500ms timeout) | Promise.race guard already in place; test with fake timers |
| `getByText` on combined text nodes causes multiple-match errors | Use full `Venue · Neighborhood` string, not partial |
| `ON CONFLICT DO NOTHING` seeds wrong-date events | Fixed: UPDATE approach for Salsa Night, not re-insert |
| Deno tests with `EDGE_FUNCTIONS_AUDIT=1` hit real prod | Use `auditIgnore()` guard; never run against prod without intent |
| Mastra Studio smoke port 4111 already in use | `lsof -i :4111` before starting; kill stale process first |
| Security audit IDOR test creates real side effects | Always use test accounts; never against prod user data |
| Gemini API key missing in edge test env | `auditIgnore()` guard skips tests when env is missing |
| Chrome DevTools MCP not installed | Fall back to `npx lighthouse` CLI for G5; install once with `npx chrome-devtools-mcp@latest` |

---

## Exact Commands to Run

```bash
# Layer 1 — fast checks (run before every push)
npm run floor

# Layer 2 — unit tests only
npm run test -- --run

# Layer 2 — single file
npm run test -- --run src/components/chat/embedded/EventCardInline.test.tsx

# Layer 2 — my-mastra-app pure logic tests
cd my-mastra-app && npm test

# Layer 3 — Deno edge tests (requires EDGE_FUNCTIONS_AUDIT=1 + anon JWT)
EDGE_FUNCTIONS_AUDIT=1 deno test supabase/functions/tests/ --allow-env --allow-net

# Layer 4 — Playwright smoke (requires Preview URL)
PLAYWRIGHT_BASE_URL=<url> npx playwright test tests/smoke/mastra-chat-events-weekend.spec.ts

# Layer 4a — Mastra Studio API smoke (headless alternative to browser)
curl -s http://localhost:4111/api/agents | jq '[.[] | .id]'
curl -s -X POST http://localhost:4111/api/agents/mdeai-events-agent/generate \
  -H "Content-Type: application/json" \
  -d '{"messages":[{"role":"user","content":"major events in Medellín this summer"}]}' \
  | jq '.text'

# Precheck: confirm ≥1 event in summer window before smoke
supabase db query --linked -f scripts/precheck-weekend-events.sql

# Layer 7a — Chrome DevTools console sweep
chrome-devtools navigate_page --url "http://localhost:8080/events"
chrome-devtools list_console_messages --types error

# Layer 7c — Lighthouse (G5)
chrome-devtools lighthouse_audit --mode navigation --device mobile
# or:
npx lighthouse <url> --output=json --chrome-flags="--headless" | jq '.categories.accessibility.score * 100'
```

---

## Skill Cross-Reference

| Layer | Skill to invoke |
|---|---|
| Layer 2 — Vitest unit | `testing` → `vitest.md` |
| Layer 3 — Deno edge | `supabase-edge-functions` → `references/testing.md` |
| Layer 4 — Playwright | `testing` → `playwright.md` |
| Layer 4a — Mastra Studio | `mastra-smoke-test` (local/cloud, agents/tools/workflows/traces) |
| Layer 5 — G5 Lighthouse | `chrome-devtools` or `chrome-devtools-cli` |
| Layer 6 — Gemini contracts | `gemini` → `references/structured-outputs.md` + `function-calling.md` |
| Layer 7 — Chrome DevTools | `chrome-devtools-cli` (CI/shell) or `chrome-devtools` (interactive) |
| Layer 8 — Security audit | `supabase-audit-functions` |
| G1-G4 — Manual QA | `testing` → `exploratory.md` |
