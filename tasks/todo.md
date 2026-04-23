# Next Steps — mdeai.co

> **Last updated:** 2026-04-23 (Week 2 Mon/Tue shipped + CORS fix + PR #1 merged — chat canvas now live on www.mdeai.co)
> Priority order. Work top-to-bottom.
> **Phase:** CORE → Chat-central MVP (Weeks 1-2 of `tasks/CHAT-CENTRAL-PLAN.md`)
> **Prompts:** `tasks/prompts/core/` (20 files), `tasks/prompts/INDEX.md`
> **Testing:** Run Gates 1-2 after every PR. See `tasks/progress.md` §10b.

## DONE 2026-04-23 — Week 2 Mon/Tue + CORS fix + production merge

### Shipped
- [x] **PR #1 merged** → `287b1cc` → **chat canvas live on `www.mdeai.co`** (was Index marketing page). Verified: 200 OK, production bundle contains ChatCanvas / apartment_save_counts RPC name / welcome headline. End-to-end POST from prod origin returns streaming SSE with 10 Laureles listings.
- [x] **CORS fix** → `_shared/http.ts` now emits `Access-Control-Allow-Methods: POST, GET, OPTIONS` + `x-anon-session-id` in `Allow-Headers` + `Max-Age: 86400` + `Vary: Origin`. Browsers were aborting POST after preflight (logs showed OPTIONS 204, no follow-up POST). All 10 edge fns redeployed.
- [x] **Week 2 Tue** — `saved_places` toggleSave (optimistic + rollback), `AddToTripModal` (pick-existing / create-new with NOT NULL date enforcement), `apartment_save_counts` RPC (SECURITY DEFINER, no user-id leakage) for "Saved by N nomads" social proof on `RentalCardInline`.
- [x] **Week 2 Mon** — `ChatContextChips` above the message list (📍 neighborhood · 📅 dates · 👥 travelers · 💰 budget) with write-through persistence to `conversations.session_data.chat_context` (authed) / in-memory (anon); `sessionData` on every ai-chat POST + new `sessionContextBlock` inlined in the system prompt so Gemini inherits chip values.

### Known issues
- [ ] **`npm run verify:edge` broken** — `p1-crm/index.ts` imports `@supabase/supabase-js` but the script no longer runs `deno install`. Pre-existing, not introduced this session. `deno check` passes on `ai-chat` + `_shared` individually.
- [ ] **Supabase Preview CI check failing** on `main` — pre-existing, separate preview-branch system, not blocking production (Vercel passed).

## Week 2 Remaining (on `fix/chat-production-hardening` or a fresh branch)

- [ ] **Wed — `ChatLeftNav`** — sidebar lists recent conversations (title from first user msg, sorted by `last_message_at`) + "Saved (N)" + "Trips (N)" sections. Click a row → `selectConversation` (already hydrates chips). `useChat.newChat()` helper added; reuse.
- [ ] **Thu — SEO page → chat handoff** — `/apartments/:id` "Ask mdeai about this →" CTA opens `/` with listing context pre-loaded (query param or router state). Polish email-gate modal UX (copy + spacing).
- [ ] **Fri — Affiliate attribution** — new migration `20260424XXXXXX_outbound_clicks.sql` (table: `user_id nullable, listing_id, source_url, affiliate_tag, ts`). Wrap `source_url` in `ApartmentCard` / `RentalCardInline` with affiliate-tag rewriter (Airbnb + Booking.com IDs via env). Edge fn or RPC to log clicks.

## Week 2 exit test (§5 of `tasks/CHAT-CENTRAL-PLAN.md`)

- [ ] Logged-in user searches rentals → saves 2 listings (`saved_places` rows exist) → adds 1 to a new trip (`trip_items` row exists) → clicks outbound to Airbnb → click logged to `outbound_clicks` with affiliate tag.

---

## DONE This Session (2026-04-05) — edge + rentals polish

- [x] **`tasks/notes/06-search.md`** — Rental search strategy + meta-search (links `03-realestate-search.md`)
- [x] **`02E` prompt** — Rental **payments off-platform** (landlord/owner); booking-create / E2-009 / INDEX aligned; E2-005 Stripe webhook deferred
- [x] **`CLAUDE.md`** — **Task completion & docs** section + `verify:edge` in quick commands / git workflow (aligned with `.cursor/rules/task-completion-and-docs.mdc`)
- [x] **`tasks/prompts/core`** — **Success criteria (tests · verify · production-ready)** section added to all **20** prompt files (before **Feature success**)
- [x] **`Deno.serve`** on all edge `index.ts` (removed `std/http` `serve`)
- [x] **Per-request CORS** — `getCorsHeaders(req)` + `jsonResponse(..., req)` / SSE headers on ai-chat, ai-router, ai-search, ai-trip-planner, google-directions, rentals, ai-optimize-route, ai-suggest-collections, rules-engine; **OPTIONS → 204** where applicable
- [x] **`ai-optimize-route`** — `insertAiRun` for Gemini path (when user JWT present); shared clients + `okJson`
- [x] **`rentals` API** — legacy body/response shapes (intake, listing `listing_id`, search flat fields, verify `freshness_status`, map pin coords)
- [x] **`ApartmentRentActions`** — idempotency key rotates via **`useEffect` when dialog opens** (fixes silent CRM no-op on reopen)

## DONE Earlier (2026-04-05) — security hardening

- [x] **verify_jwt = true** on all 10 edge functions → `supabase/config.toml`
- [x] **CORS locked down** → `_shared/http.ts` now uses `getCorsHeaders(req)` with allowed origins
- [x] **Service role fix** → `_shared/supabase-clients.ts` created; applied to ai-search + ai-router
- [x] **Gemini timeout helper** → `_shared/gemini.ts` with 30s AbortController
- [x] **Frontend hardcoded URLs removed** → All 7 files now use `import.meta.env.*`
- [x] **Frontend hardcoded JWT tokens removed** → 3 files fixed
- [x] **Dead code deleted** → useIntentRouter.ts + ChatRightPanel.tsx
- [x] **Wasted ai-router call removed** → useChat.ts no longer double-calls (saves ~50% Gemini cost/message)
- [x] **Core migration created** → `20260405120000_core_phase_corrections.sql` (idempotency_keys, notifications, agent_audit_log + indexes)
- [x] **Prompts audited + fixed** → 12 core prompts corrected (wrong schemas, missing tables, route mismatches, deletion errors)
- [x] **Roadmap updated** → Booking/landlord comms, planning dashboard, WA promoted to CORE
- [x] **Full system audit** → `tasks/audit/09-full-system-audit.md` (25/100 overall, 8 CRITICAL found)
- [x] **Prompts audit** → `tasks/audit/08-prompts-audit.md` (30/100, 13 CRITICAL found)

## Week 1 Remaining: Security Follow-Through

- [ ] **Apply service role fix to ai-chat + ai-trip-planner** → same pattern as ai-search/ai-router (use `_shared/supabase-clients.ts`) — *partial: optimize-route uses shared clients; chat/trip-planner still review*
- [ ] **Apply fetchGemini() to all 8 Gemini calls** → replace bare fetch() in ai-chat (3), ai-router (1), ai-search (2), ai-trip-planner (1), ai-optimize-route (1)
- [x] **Update OPTIONS + JSON CORS** → `getCorsHeaders(req)` across browser-invoked functions (**done 2026-04-05**)
- [ ] **Apply migration** → `supabase db reset` (local) then push to hosted
- [ ] **Rotate leaked secrets** → `.env` has Shopify/Gadget tokens in Git history — rotate in Shopify/Gadget dashboards
- [ ] **Fix Vercel env vars** → Change NEXT_PUBLIC_* to VITE_* in Vercel dashboard → `09E` E9-001
- [ ] **Deploy hardened functions** → `supabase functions deploy` for all functions with `_shared` changes

## Week 2: Pipeline + Approval Workflow

- [ ] **Build application-review edge function** → host approve/reject (the missing pipeline step) → `02E`
- [ ] **Build in-app messaging** → renter ↔ landlord thread per application → `02E`
- [ ] **Build booking-create edge function** → `02E` E2-004
- [ ] **Build payment-webhook edge function** → Stripe signature verify → `02E` E2-005
- [ ] **Stripe test mode setup** → register, get test keys, configure webhook endpoint
- [ ] **Add Zod schemas to remaining 3 functions** → ai-suggest-collections, google-directions, rules-engine
- [x] **insertAiRun on ai-optimize-route** → Gemini path (**done 2026-04-05**); ai-suggest-collections is heuristic-only; rentals has no LLM

## Week 3-4: Frontend + Planning Dashboard

- [ ] **Build Planning Dashboard** → saved favorites, compare, notes → `04E`
- [ ] **Build LandlordDashboard** → listings, applications, messages, earnings → `04E`
- [ ] **Build HostApplicationReview component** → approve/reject/request-info → `04E`
- [ ] **Build MapView + PricePin components** → Google Maps integration → `04E`
- [ ] **Build ShowingScheduler component** → `04E`
- [ ] **Wire ai-search to frontend** → replace ai-chat searchMode → `04A`
- [ ] **Wire intake wizard → pipeline** → `04E`
- [ ] **Build PaymentButton + BookingConfirmation** → `04E`

## Week 5-6: First Booking Milestone

- [ ] **End-to-end booking test** → browse → detail → schedule tour → apply → host approves → pay → confirmation
- [ ] **Showing reminders** → pg_cron T-24h + T-1h → `02F`
- [ ] **Payment idempotency tests** → duplicate POST returns cached response → `13B`
- [ ] **E2E Playwright tests** → critical path automation → `09E` E9-005
- [ ] **Admin RBAC** → server-side role checks in edge functions → `13A`
- [ ] **MILESTONE: First end-to-end booking with payment** (O1)

## Week 7-8: WhatsApp v1

- [ ] **Configure Infobip WhatsApp webhook** → `08A`
- [ ] **WA lead capture edge function** → text only, calls p1-crm → `08C`
- [ ] **WA apartment search** → calls ai-search, formats top 3 → `08L`
- [ ] **WA showing reminders** → T-24h/T-1h via Infobip outbound → `02F`
- [ ] **WA booking confirmations** → via Infobip outbound
- [ ] **MILESTONE: WhatsApp lead capture + search live** (O5)

## Later (Phase 2-3) — ADVANCED

- [ ] Paperclip CEO fix + workspace binding (E5)
- [ ] Hermes intelligence scoring (E6)
- [ ] Contract automation — lease PDF analysis (E7)
- [ ] WhatsApp v2 — AI routing via OpenClaw (E8v2)
- [ ] Trio integration contract (E12)

## Testing Strategy (run continuously)

| Gate | When | Command | Pass Criteria |
|------|------|---------|---------------|
| 1. Build + Lint | Every PR | `npm run build && npm run lint` | Zero errors |
| 2. Security Grep | Every PR touching src/ or supabase/ | See §10b in progress.md | Zero hardcoded secrets |
| 3. Edge Verification | PRs touching supabase/ | `npm run verify:edge` | All Deno tests pass |
| 4. Functional Smoke | Weekly | Manual browser test (6 steps) | No CORS/401 errors |
| 5. Pipeline E2E | Before milestones | Full lead→booking flow | No FK violations or duplicates |
| 6. Deploy Checklist | Before production | Pre/post deploy script | 401 without token, HTML with token |

## Open Decisions

| # | Decision | Options | Owner | Due |
|---|----------|---------|-------|-----|
| 1 | Primary PSP for COP | Stripe-only vs Wompi/local | TBD | Week 2 |
| 2 | Showing availability model | Calendar integration vs manual slots | TBD | Week 3 |
| 3 | Service fee % | 12% flat vs tiered | TBD | Week 2 |
