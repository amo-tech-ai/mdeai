# Changelog

All notable changes to mdeai.co are documented here.

Format: [Keep a Changelog](https://keepachangelog.com/en/1.0.0/)

---

## [2026-05-01] - Landlord V1 Day 12: dashboard performance KPIs

`/host/dashboard` now shows a "Tu desempeño" KPI strip above the listings list — turning the timestamps captured by D9/D10 (`viewed_at`, `first_reply_at`, `archived_at`) into landlord-facing performance metrics.

### Frontend
- **`hooks/host/useLandlordMetrics.ts` (new)** — pure `computeLandlordMetrics(leads, windowDays, nowMs)` function + `useLandlordMetrics()` hook reusing the `useLeads()` cache (no new round-trip). Returns `{ total, active, replied, archived, newCount, replyRatePct, medianTtfrMs, windowDays }`. `formatDuration()` helper formats ms as `<1 min` / `14 min` / `1h 14m` / `1d 3h`. Filters out negative TTFRs (clock skew) and >30d outliers from the median.
- **`components/host/dashboard/LandlordPerformanceCard.tsx` (new)** — 4-KPI strip in Spanish:
  1. **Leads · últimos 30d** — total + "X sin ver" / "todos vistos" sub.
  2. **Activos** — `new` + `viewed`.
  3. **% respondidos** — green ≥ 40% (stretch), amber ≥ 25% (acceptable), red below.
  4. **Tiempo mediano** — green ≤ 6h, amber ≤ 12h, red over.
  Targets sourced from plan §8 cohort goals (acceptable / stretch).
- **`pages/host/Dashboard.tsx` (modified)** — renders `<LandlordPerformanceCard />` above listings when `metrics.total > 0`. Hides for new landlords with 0 leads (avoids a "0 / —/ —/ —" empty state).

### Tests
- **`useLandlordMetrics.test.ts` (new, 13 tests)** — empty input, status counts, integer reply rate, odd + even median, windowDays filter (incl. 0 = all-time), negative-TTFR + 30d-outlier filtering, all 5 `formatDuration` paths.
- **`LandlordPerformanceCard.test.tsx` (new, 10 tests)** — 4 KPI values render, "X sin ver" sub, null-state "—", reply-rate tone matrix (3 cases), TTFR tone matrix (3 cases). Both tests mock `@/integrations/supabase/client` to suppress side-effect import noise.
- **vitest count: 150 → 173** (+23 D12).

### Browser proof
- Created 4 form-channel leads with varied statuses + back-dated TTFRs:
  - Sofia: replied, TTFR 5 min
  - Camila: replied, TTFR 30 min
  - Alejandra: viewed (active)
  - Maria: new (active + new)
- Reloaded `/host/dashboard` → "Tu desempeño" strip rendered:
  - Leads · últimos 30d: **5** ("2 sin ver" — incl. 1 leftover from earlier sessions)
  - Activos: **3** ("esperan respuesta")
  - % respondidos: **40%** ("excelente" — green tone)
  - Tiempo mediano: **18 min** ("súper rápido" — green tone, matches median([5min, 30min]) = 17.5 → 18)
- Cleaned up demo data after.

### Gates
- lint: D12 files clean; baseline 468 unchanged
- vitest 173/173
- deno 47/47 unchanged
- build 13.93s; entry 95.78 KB gzip (within 100 KB budget)
- check:bundle 10/10 within budget

### Why client-side aggregation (not a SQL view)
- V1 cohort: max ~100 leads per landlord, 200-row pagination on `useLeads()`. Math is cheap on the client.
- No new edge fn / migration / RPC = smaller blast radius for the change.
- When we hit >200 leads/landlord we revisit with a `landlord_metrics_daily` view + pg_cron aggregator (queued in `analytics_events_daily` per plan §5.2 D14).

---

## [2026-05-01] - Landlord V1 Day 10: lead detail + status transitions + WhatsApp reply

Closes the read+act loop on the landlord side. `/host/leads/:id` now renders a single lead with renter info, full message, structured profile, and action buttons: WhatsApp reply (phone-aware), Mark replied, Archive, Reopen.

### Frontend
- **`pages/host/LeadDetail.tsx` (new)** — `RoleProtectedRoute + HostShell`. 4 states (loading / error / not-found / data). Spanish UI throughout ("Volver al inbox", "Mensaje", "Responder", "Marcar como respondido", "Archivar", "Reabrir"). Auto-marks-replied on WhatsApp button click (optimistic — landlord can Reopen if they didn't actually reply).
- **`components/host/leads/WhatsAppReplyButton.tsx` (new)** — phone-aware. With renter phone (chat-channel future): opens `wa.me/<phone>?text=<es-CO greeting>`. Without phone (form-channel from D7.5): opens bare `wa.me/` + shows hint *"Sofia ya te escribió desde su número, revisa tus chats recientes"*.
- **`components/host/leads/LeadStatusActions.tsx` (new)** — visibility matrix: `new`/`viewed` → [Mark replied, Archive]; `replied` → [Archive only]; `archived` → [Reopen]. Toast on success/error in Spanish.
- **`hooks/host/useLeadDetail.ts` (new)** — TanStack Query single-row fetch with apartment join. RLS gates by `acting_landlord_ids()`.
- **`hooks/host/useLeadActions.ts` (new)** — `useMarkReplied`, `useArchive`, `useReopen` mutations. Each invalidates both list (`host_inbox_leads`) + detail caches. Mark-replied uses COALESCE-style logic on `first_reply_at` so toggling replied → archived → reopened → replied preserves the original timestamp (response-time analytics).
- **`pages/host/Leads.tsx` (modified)** — LeadCard onClick now also navigates to `/host/leads/:id` (was just `markViewed` in D9).
- **`App.tsx` (modified)** — lazy `/host/leads/:id` route.
- **`lib/posthog.ts` (modified)** — extended `AppEvent` union with D7.5 `contact_host_*` events (drift fix — they were `trackEvent()` callers without typing) + new D10 `lead_marked_replied` / `lead_archived` / `lead_reopened`.

### Migration regression fix
- **`20260430224605_landlord_v1_rls_acting_grant_back.sql` (new)** — restores `GRANT EXECUTE ON acting_landlord_ids() TO authenticated`. The D9.6 security sweep migration revoked it on the (incorrect) assumption that SECURITY DEFINER functions can always be called from RLS policies. They CAN'T — SECURITY DEFINER changes the body's privileges but the CALL still requires EXECUTE for the caller's role. Caught during D10 browser proof when `landlord_inbox` SELECT failed with `permission denied for function acting_landlord_ids`. `auto_create_landlord_inbox_from_message` stays revoked (trigger fn, no policy dependency).

### Tests
- **`WhatsAppReplyButton.test.tsx` (new, 7 tests)** — with-phone vs without-phone rendering, prefilled message format, onSent callback, disabled prop, short-phone fallback.
- **`LeadStatusActions.test.tsx` (new, 8 tests)** — full visibility matrix, mutation payload shape (first_reply_at COALESCE, archived_at, reopen clears).
- **vitest count: 135 → 150** (+15 D10).

### Browser proof
- Created listing + form-channel lead via `lead-from-form`.
- Clicked card on `/host/leads` → navigated to `/host/leads/:id`.
- Status auto-flipped `new → viewed` (D9 mark-viewed still works).
- Page rendered: renter name, apartment context, full message, channel pill, move-when card, "Abrir WhatsApp" button + hint.
- Clicked "Marcar como respondido" → status → `replied`, actions → [Archivar only], DB shows `first_reply_at` stamped.
- Clicked "Archivar" → status → `archived`, actions → [Reabrir only], DB shows `archived_at` stamped.
- Clicked "Reabrir" → status → `viewed`, actions → [Marcar + Archivar], `archived_at` NULL, **`first_reply_at` PRESERVED** through the cycle.
- WhatsApp button click → opens bare `wa.me/` (form lead has no renter phone, as expected).

### Gates
- lint: D10 files + posthog.ts clean; baseline 468 unchanged
- vitest 150/150
- deno 47/47 unchanged
- build 5.20s; entry 95.78 KB gzip (within 100 KB budget)
- check:bundle 10/10 within budget

---

## [2026-05-01] - Landlord V1 Day 11.5: Twilio Sandbox WhatsApp lead pings + 30-min reminder

Replaces the original D11 email plan with WhatsApp via Twilio Sandbox — better channel for Colombian landlords (~95 % WhatsApp penetration), zero Meta approval lag for the dev/cohort phase.

### Database
- **`20260430220540_landlord_v1_whatsapp_notify.sql` (new)** — installs `pg_cron` + `pg_net`. Adds `landlord_inbox.whatsapp_sent_at` + `landlord_inbox.reminder_sent_at`. Partial index `landlord_inbox_pending_reminder_idx` for the reminder query path. Schedules pg_cron job `mdeai_lead_reminder_tick` every 5 min calling `lead-reminder-tick` via `pg_net.http_post` with `X-Cron-Secret` header.

### Edge functions
- **`_shared/twilio-whatsapp.ts` (new)** — direct REST POST to Twilio Messages API. Auth precedence: API Key + Secret > Account SID + Auth Token (matches Twilio CLI). Returns `{ ok, sid, errorCode }`. No SDK dependency.
- **`_shared/lead-notify-templates.ts` (new)** — Spanish (es-CO) message bodies for new-lead + 30-min reminder. Pure functions; deno-tested.
- **`lead-from-form/index.ts` (extended)** — fires `fireWhatsAppNotification(...)` AFTER landlord_inbox INSERT, fire-and-forget. Failures logged only. Stamps `whatsapp_sent_at` on success.
- **`lead-reminder-tick/index.ts` (new)** — `verify_jwt:false`, `X-Cron-Secret` header auth. UPDATE-RETURNINGs `reminder_sent_at` FIRST so parallel ticks can't double-fire. Sends to all rows where `status='new' AND reminder_sent_at IS NULL AND created_at < now() - 30 min`, capped at 25/tick.

### Secrets pushed to Supabase
- `TWILIO_API_KEY` (`SK…`, recommended)
- `TWILIO_API_SECRET`
- `TWILIO_SANDBOX_NUMBER` (`+14155238886`)
- `CRON_SECRET` (32-byte random)
- Existing `TWILIO_ACCOUNT_SID` + `TWILIO_AUTH_TOKEN` retained as fallback.

### Tests
- **`lead_notify_templates_test.ts` (new, 10 deno tests)** — message rendering for both templates, Spanish locale move_when labels (3 cases), truncation rules, fallback names, length cap < 500 chars.
- **deno count: 37 → 47** (+10 D11.5).

### Browser smoke proof
- Initial Twilio call returned `20003 Authenticate` with the legacy SID + auth_token combo (env file had stale token). Switched to API Key + Secret path (matches Twilio CLI behavior).
- Re-ran end-to-end:
  - `POST /functions/v1/lead-from-form` → 201; `whatsapp_sent_at` stamped 232 ms after row insert.
  - Manual cron tick (back-dated lead) → claimed=1, sent=1; `reminder_sent_at` stamped.
  - Re-tick → claimed=0 (idempotency).
  - `messages.list` shows both sends queued; both fail with `err=63015` ("Channel not opted in") because the test recipient `+14168003103` hasn't sent `join <code>` to the sandbox yet — **expected sandbox behavior**, not a bug. Real phones that have joined the sandbox receive the message instantly.

### Per-user scope explicitly skipped
- No status callback webhooks (deferred until volume justifies it).
- No retry on Twilio failures (one-shot; lead still in inbox as fallback).
- No detailed delivery tracking (just two timestamps).

### Cost projection (Colombia rates, 2026)
- Sandbox: $0 forever during dev/cohort.
- Production utility template (Phase 2): ~$0.006/message. 20 landlords × 10 leads/month = ~$1.20/month.

### Migration to production WhatsApp (Phase 2, after first 10 landlords)
- Twilio Self-Signup → Meta Business verification (1-3 days).
- Submit `mdeai_nuevo_lead_v1` UTILITY template (24-48h Meta approval).
- Swap `TWILIO_SANDBOX_NUMBER` → branded WA number.
- Switch to `contentSid` + `contentVariables` for outside-24h-window sends.

---

## [2026-04-30] - Landlord V1 Day 9.5/9.6: post-D9 verification sweep + security sweep migration

Two follow-up commits triggered by the post-D9 verification sweep.

### D9.5 — honeypot leak fix (commit `4414cc8`)
- `lead-from-form` Zod schema for the honeypot `website` field was `z.string().max(0).optional()` — rejects non-empty values with **400 INVALID_PAYLOAD** instead of silent **200 + suppressed:true**. Bots could probe for the rejection signal to discover the trap.
- Fix: `z.string().optional()` + downstream suppress check. Verified post-deploy: bot-filled honeypot now returns 200 silently.

### D9.6 — security sweep migration (commit `7d98d74`)
- **`20260430172404_landlord_v1_security_sweep.sql` (new)** — 4 fixes from advisor scan:
  - **R-RLS-1**: dropped `authenticated_can_view_all_apartments` (any signed-in user could read every apartments row including rejected/archived). Added `apartments_select_own_landlord` (landlord sees own rows regardless of moderation_status) + `apartments_select_admin` (`is_admin()` gate).
  - **R-RPC-1**: revoked EXECUTE on `acting_landlord_ids()` from anon/authenticated. *Fixed in D10 — this revoke broke RLS policies that depend on the function. Re-granted to authenticated.*
  - **R-RPC-2**: revoked EXECUTE on `auto_create_landlord_inbox_from_message()` from PUBLIC + anon + authenticated. Trigger fn; no policy dependency. **Stays revoked.**
  - **R-STORAGE-1**: dropped `listing_photos_select_public` policy on `storage.objects`. Bucket stays public (URLs serve files), but cross-tenant filename enumeration via `.list()` is blocked.
- Verified via SQL probes + sentinel-row cross-tenant test.

### Verification sweep (commit `4414cc8`)
- 5 gates green: lint baseline 468 unchanged, vitest 135/135, build 4.4s, 10/10 chunks within budget, deno 37/37.
- 10 API boundary tests (401/400/404/405/409/422/429) all returned expected codes.
- Cross-tenant RLS verified with sentinel insert: 0 rows leaked, 0 cross-tenant updates.
- Browser E2E: anon → /host/dashboard → /login redirect with returnTo; signed-in landlord sees own listings; no React errors after fresh reload.

---

## [2026-04-30] - Landlord V1 Day 7.5: WhatsApp tap-to-chat lead capture (cleanup entry)

Already documented in detail in the D7.5 entry below — this consolidation entry confirms it shipped (commit `3758e60`) before D9 with: `lead-from-form` edge fn (verify_jwt:false, honeypot, IP+session rate limit), `WhatsAppContactModal` (3 fields → modal → wa.me opens → "did you send it?" confirm), `whatsapp-deeplink` util, `useContactHost` hook. 18 vitest tests added (5 modal + 13 util).

---

## [2026-04-30] - Landlord V1 Day 9: leads inbox UI

The closing piece of the renter→landlord loop. Leads written by D7.5 (form channel) and the D1 chat trigger (chat channel) now have a UI: `/host/leads` shows the inbox with status filters, a per-row click that auto-marks-viewed, and a "new" count badge on the host nav.

### Frontend
- **`pages/host/Leads.tsx` (new)** — `/host/leads` page using the same `RoleProtectedRoute` + `HostShell` pattern as D7. Four states (loading / error / filtered-empty / data); filtered-empty distinguishes "no leads at all" from "no leads in this filter".
- **`components/host/leads/LeadCard.tsx` (new)** — one row. Renter name, joined apartment title (with `structured_profile` fallback for chat-channel rows where the apartment was deleted), 140-char message snippet, channel pill (Form/Chat/WhatsApp), move-when pill (when `structured_profile.move_when` set), relative timestamp, status pill (New/Viewed/Replied/Archived). Status='new' rows get a primary accent stripe + bold name. Clickable + keyboard-navigable (Enter / Space).
- **`components/host/leads/LeadStatusFilter.tsx` (new)** — 5 segmented tabs (All / New / Viewed / Replied / Archived) with live counts. ARIA `role="tablist"` + `aria-selected`. Counts come from the parent so list + filter share one round-trip.
- **`hooks/host/useLeads.ts` (new)** — `useLeads()` fetches `landlord_inbox` with a Supabase nested select pulling apartment context. RLS policy `landlord_inbox_select` already gates by `acting_landlord_ids()`. Returns leads + memo'd counts. `useMarkLeadViewed()` UPDATEs status='new'→'viewed' (idempotent — `eq("status", "new")` so re-clicking already-viewed cards is a no-op).
- **`components/host/layout/HostLeftNav.tsx` (modified)** — flipped Leads from "Soon" to active. Badge with new-leads count (`useLeads().counts.new`); shows "99+" past 99. Reuses the same query cache as the leads page so flipping pages doesn't re-fetch.
- **`App.tsx` (modified)** — `/host/leads` route, lazy-imported.

### Tests
- **`LeadCard.test.tsx` (new, 18 tests)** — 4 status pills, 3 channels, joined apartment vs structured_profile fallback vs unknown-listing fallback, Anonymous fallback, move_when pill (present + missing), 140-char truncation, relative timestamp, click + Enter + Space, non-interactive when no onClick.
- **`LeadStatusFilter.test.tsx` (new, 4 tests)** — 5 segments + counts render, aria-selected on active, onChange fires with the clicked value, zero-counts don't crash.
- **vitest count: 113 → 135**.

### Browser proof
- Created a V1 listing + 3 form-channel leads (Sofia/Now, Camila/Soon, Alejandra/Later) via direct fetch (legacy "Sofia" lead from D7.5 cleanup also remained — 4 total).
- Navigated to `/host/leads` → all 4 cards rendered, nav badge "4", filter pills All 4 / New 4.
- Clicked Replied filter → empty state "No replied leads" with helpful copy.
- Switched back to All, clicked first card (Alejandra) → background mutation flipped status='new'→'viewed' → counts updated to New 3 / Viewed 1, nav badge "3". Card now shows amber "Viewed" pill.
- Cleaned up demo rows after.

### Gates
- lint: D9 files clean (`npx eslint <D9 files>` exit 0); baseline 468 unchanged
- test: 135/135 vitest passing (was 113)
- build: 4.44s; entry 95.72 KB gzip (within 100 KB budget)
- check:bundle: 10/10 within budget
- verify:edge: 37/37 deno tests still green (no edge-fn changes)

### What's next (D10/D11/D8 ordering rationale)
- **D11** (email notify on new lead) — bumped ahead because email is what drives a landlord to *come back*. Without it the inbox UI is invisible until the next dashboard visit.
- **D10** (lead detail page + WhatsApp reply button + status transition buttons) — the "click into a card" target. D9 marks-viewed passively; D10 adds Mark replied / Archive.
- **D8** (lead-classify Gemini Flash for chat-channel rows) — last priority because form-channel rows are already structured by D7.5; classification is a chat-channel polish, not the foundation.

---

## [2026-04-30] - Landlord V1 Day 7.5: WhatsApp tap-to-chat lead capture

The "Contact Host" flow on `/apartments/:id` now uses a 3-field modal that POSTs to a new `lead-from-form` edge fn, inserts a `landlord_inbox` row, and opens `wa.me/<host-phone>?text=<prefilled>` in a new tab. Verification signal = "user actually opened WhatsApp" — no SMS OTP, no Infobip, no friction.

### Why D7.5 (not waiting for D10)
Renters land on apartment detail pages today; the existing `ContactHostDialog` writes to the legacy P1-CRM `leads` table and forces sign-in. For the V1 cohort (landlords with `landlord_id` set), we need: anonymous-friendly, WhatsApp-first, lead captured server-side BEFORE the popup opens (so a popup-blocked user is still a captured lead). 1 day to ship; unblocks D9 inbox UI work.

### Frontend
- **`lib/whatsapp-deeplink.ts` (new)** — pure utilities: `buildWhatsAppMessage()`, `buildWhatsAppUrl()` (E.164 → digits-only), `buildWhatsAppDeepLink()`. Throws on phones <8 digits so the caller can never open a broken `wa.me` URL.
- **`hooks/useContactHost.ts` (new)** — TanStack Query mutation hitting `lead-from-form`. Reads structured rejection reasons from `FunctionsHttpError.context.json()` so the modal can surface specific messages (RATE_LIMITED, LANDLORD_NO_WHATSAPP, etc.). Honeypot suppression returns SUPPRESSED-coded error so the UI doesn't reveal the trap to bots.
- **`components/apartments/WhatsAppContactModal.tsx` (new)** — 3 fields (name, when-moving radio group, optional message) + visually-hidden honeypot `website` field. Three steps: form → redirecting (1.5s spinner so user can switch to WhatsApp) → confirm ("Yes — I sent it" / "Reopen WhatsApp"). Tracks `contact_host_submitted`, `contact_host_whatsapp_confirmed`, `contact_host_whatsapp_retry` PostHog events. Lead is captured BEFORE `window.open` fires — popup-blocked users are still a captured lead.
- **`pages/ApartmentDetail.tsx` (modified)** — branch at render: if `apartment.landlord_id` exists → `WhatsAppContactModal`; else → legacy `ContactHostDialog` (seeded apartments without a V1 landlord still work).
- **`types/listings.ts` (modified)** — added `landlord_id`, `moderation_status`, `source` to `Apartment` so TS knows about D1+ schema.

### Edge function
- **`supabase/functions/lead-from-form/index.ts` (new, verify_jwt:false)** — POST. Zod-validated payload (apartment_id UUID, name 1-60, move_when enum, message ≤1000, optional honeypot, optional anon_session_id). Honeypot match → 200 with `{suppressed:true}` (silent so bots don't probe). IP rate limit 5/15 min via durable Postgres limiter; per-anon-session limit 20/hour. Apartments lookup → landlord lookup → must have `whatsapp_e164` (else 409 LANDLORD_NO_WHATSAPP). Inserts `landlord_inbox(channel='form', structured_profile={source,move_when,renter_name,…})`. Returns `{lead_id, whatsapp_e164, landlord_display_name, apartment{id,title,neighborhood}}` so the client builds the wa.me URL.
- **`supabase/config.toml` (modified)** — registered with `verify_jwt = false`.

### Tests
- **`whatsapp-deeplink.test.ts` (new, 13 tests)** — message includes greeting + place + move-when + signature + URL; optional message trimming; neighborhood fallback; move_when label table (3 cases); URL strips parens/dashes/spaces; throws on short phone; encodes newlines as %0A; convenience function.
- **`WhatsAppContactModal.test.tsx` (new, 5 tests)** — form fields render; send disabled until name typed; success path POSTs payload + opens wa.me; rate-limit error surfaces in the alert; honeypot suppression doesn't open wa.me.
- **vitest count: 95 → 113**.

### Browser proof
- Created a V1 listing (auto_approved) → navigated to `/apartments/<id>` → clicked "Contact Host" → modal opens with title "Contact the host" (the demo apartment has no `host_name`, fallback works).
- Filled name="Sofia", clicked "Now", typed "Is parking included?" → clicked "Send via WhatsApp".
- POST `/functions/v1/lead-from-form` succeeded → wa.me URL generated: `https://wa.me/14168003103?text=Hi!%20I'm%20interested%20in%20D7.5%20demo…(El%20Poblado).%0A%0AMove-in%3A%20moving-in%20soon…%0A%0AIs%20parking%20included%3F%0A%0A%E2%80%94%20Sofia%20(via%20mdeai)%0Ahttp%3A%2F%2Flocalhost%3A8080%2Fapartments%2F<id>`. Modal advanced to "Did your message send on WhatsApp?" with two buttons.
- DB verified: `landlord_inbox` row inserted with `channel='form'`, `renter_name='Sofia'`, `raw_message='Is parking included?'`, `structured_profile={source,move_when,renter_name,apartment_title,apartment_neighborhood}`, `status='new'`, `apartment_id` set.
- Cleaned up demo data after.

### Anti-spam (no OTP needed)
- IP rate limit: 5 / 15 min (durable Postgres limiter)
- Per-anon-session limit: 20 / hour
- Honeypot: hidden `website` field; bots fill it → server returns `{success:true,suppressed:true}` (no DB write, no leaked rejection signal)
- Phone capture: NOT taken from renter (the landlord's phone is already on `landlord_profiles`; the renter's number reaches the landlord when they actually message via WhatsApp)
- WhatsApp Business OTP / Infobip: deferred to V2 — only if real-world spam pressure shows up

### Gates
- lint: D7.5 files clean (`npx eslint <files>` exit 0); baseline 468 unchanged
- test: 113/113 vitest passing (was 95)
- build: 4.41s; entry 95.63 KB gzip (within 100 KB budget)
- check:bundle: 10/10 within budget
- verify:edge: 37/37 deno tests still green (no new edge tests this PR — the lead-from-form deno test lands as part of D9 inbox work)

---

## [2026-04-30] - Landlord V1 Day 7: host dashboard shell + listings list

The end-to-end signup → onboard → list → moderation → dashboard loop now closes. After D2-D6 built the writes, D7 builds the read view: a landlord lands on `/host/dashboard` and sees their own listings with Live / In review / Rejected status pills.

### Frontend
- **`pages/host/Dashboard.tsx` (new)** — `/host/dashboard` page. Greeting + display name + Create-listing CTA + listings grid. Four states all handled: loading (spinner), error (retry button), empty (prominent "Create your first listing"), data (list of `ListingCard`).
- **`components/host/layout/RoleProtectedRoute.tsx` (new)** — extracted role gate used by every `/host/*` page going forward. Decision tree: anon → `/login?returnTo=<path>` (deep-link preserved); non-landlord → `/dashboard`; landlord without profile → `/host/onboarding`; landlord with profile → render children.
- **`components/host/layout/HostShell.tsx` (new)** — page chrome (header + left nav + main). Pages own their own internal headers/widths.
- **`components/host/layout/HostLeftNav.tsx` (new)** — sidebar nav with Listings active; Leads/Profile/Settings show "Soon" badges (lands D9/D15/D17). Hidden on mobile (`hidden md:flex`).
- **`components/host/listing/ListingCard.tsx` (new)** — one row in the dashboard grid. Status precedence: rejected > archived > pending > approved+active=Live > approved+booked=Booked > approved+inactive=Hidden > else=Draft. Public-page link only when truly public (`approved` AND `active`). Rejection reason copy under the card. "— leads" placeholder ready for D9. es-CO COP / en-US USD price formatting.
- **`hooks/host/useListings.ts` (new)** — TanStack Query for `apartments WHERE landlord_id = profile.id`. Defense in depth filter on `landlord_id` because existing RLS (`authenticated_can_view_all_apartments`) is overly permissive (see follow-up R-RLS-1).

### Routing
- `App.tsx` — added lazy `HostDashboard` import, `/host/dashboard` route, and `/host` → `/host/dashboard` redirect alias. `Navigate` added to react-router-dom imports.
- `Step3Welcome.tsx` "Go to dashboard" CTA now points at `/host/dashboard` instead of renter `/dashboard`.
- `Step4Description.tsx` post-create redirect now lands on `/host/dashboard` instead of renter `/dashboard` — the landlord sees their newly-created listing with status pill.

### Tests
- **`ListingCard.test.tsx` (new, 9 tests)** — Live + public-link, In review (no public link), Rejected + reason copy, Booked, Hidden, COP es-CO format, USD en-US format, broken-image fallback, leads placeholder.
- Updated `Step3Welcome.test.tsx` to assert the new `/host/dashboard` href.
- **vitest count: 86 → 95**.

### Browser proof
- `/host/dashboard` while signed in as `qa-landlord@mdeai.co` → renders empty state ("No listings yet" + "Create your first listing" CTA).
- Created 2 listings via direct fetch (auto_approved + needs_review). Reload → both render in the grid:
  - Live listing: green "Live" pill + "View public page" link to `/apartments/<id>`.
  - In review listing: yellow "In review" pill + tooltip "Founder reviews flagged listings within 24 hours" + no public link.
- Both cards expose "— leads" (D9 placeholder) and "Edit (soon)" (D17 placeholder).
- Desktop view shows the left nav with active Listings, "Soon" pills on Leads/Profile/Settings.
- Cleaned up demo rows after.

### Gates
- lint: D7 files clean (`npx eslint <D7 files>` exit 0); baseline 468 unchanged
- test: 95/95 passing (was 86)
- build: 4.35s; entry chunk 95.64 KB gzip (+0.57 KB from D6, within 100 KB budget)
- check:bundle: 10/10 within budget
- verify:edge: 37/37 deno tests still green (no edge-fn changes)

### Follow-up: R-RLS-1 (logged in todo, NOT shipped this PR)
- Existing `authenticated_can_view_all_apartments` policy lets any signed-in user (renters too) read every apartments row including rejected/archived. The dashboard works around this with a defensive `landlord_id =` filter, but the policy itself should be replaced with `apartments_select_own_landlord` (`landlord_id IN (SELECT id FROM landlord_profiles WHERE user_id = auth.uid())`) so the data is properly compartmentalised. Tracked as a sweep-up migration after D7 ship.

---

## [2026-04-30] - Landlord V1 Day 6: founder-side moderation via email magic-links

End-to-end moderation flow — listing-create fires a founder email when a listing lands in `needs_review`; the email contains two HMAC-signed magic links that hit `listing-moderate` to flip the row to `approved` or `rejected`. No UI, no admin login — the signed token IS the auth.

### Edge functions
- **`listing-moderate/index.ts` (new)** — `verify_jwt: false` (set in config.toml). GET-only. Verifies token via `verifyModerationToken()`, looks up apartments row via service role, and either UPDATEs `moderation_status` (and `status` + `rejection_reason` for reject) or returns idempotent 200 if already in target state. Returns HTML success page so the click-from-email UX is "open URL → see confirmation."
- **`listing-create/index.ts` (extended)** — after a `needs_review` insert, fires `sendFounderEmail()` fire-and-forget with rendered email body containing both `approve` + `reject` magic-link URLs. Failure to dispatch email never fails the listing-create request (the row is already in DB; founder can moderate via direct SQL as a fallback).

### Shared modules
- **`_shared/moderation-token.ts` (new)** — HMAC-SHA256 sign + verify for a compact `<payload-b64u>.<sig-b64u>` format. Payload: `{ lid, act, iat, exp }`. Constant-time signature comparison. Rejects malformed strings, bad signatures, expired tokens, and tokens issued >60s in the future. Default TTL 7 days. `buildModerationUrl()` helper assembles the click URL.
- **`_shared/founder-email.ts` (new)** — V1 stub that always logs to stdout (`[founder-email] subject=…`) and optionally POSTs to a Slack/Discord webhook if `FOUNDER_NOTIFY_WEBHOOK` is set. Contract stays the same when D11 swaps in real Resend. Errors swallowed so a webhook outage can't fail the listing insert.
- **`listing-moderate/email-template.ts` (new)** — pure function `renderNeedsReviewEmail(listing, approveUrl, rejectUrl) → { subject, text }`. Uses es-CO locale for COP price formatting, en-US for USD.

### Secrets provisioned
- `FOUNDER_MODERATION_SECRET` (48 random bytes via `openssl rand -base64 48`) — HMAC key for moderation tokens. Set via `supabase secrets set --project-ref zkwcbyxiwklihegjhuql`.
- `FOUNDER_EMAIL` — recipient address for stub email log + future Resend dispatch.

### Tests
- **`moderation_token_test.ts` (new, 9 tests)** — round-trip success, wrong-secret BAD_SIGNATURE, EXPIRED, NOT_YET_VALID (forward clock skew), MALFORMED, tampered-payload-with-original-sig forgery rejection, short-secret throws, `buildModerationUrl` shape, TTL constant.
- **`listing_moderate_email_test.ts` (new, 3 tests)** — rendered email contains both URLs + listing details, COP price formatted with es-CO dot-thousands, USD formatted with en-US comma-thousands.
- **deno test count: 25 → 37**.

### Browser proof
- Created needs_review listing via `listing-create` → 201 with verdict `needs_review`.
- Synthesized HMAC token in-page (Web Crypto, same secret), GET listing-moderate → 200 HTML success page → DB row flipped to `moderation_status='approved'`.
- Re-clicked same magic link → 200 idempotent (no-op UPDATE).
- Bogus token → 401 `TOKEN_MALFORMED`. Missing token → 400 `MISSING_TOKEN`.
- Reject path: created another needs_review listing, signed reject token → 200 → DB shows `moderation_status='rejected'`, `status='inactive'`, `rejection_reason='Rejected by founder review'`.
- Cleaned up both test rows after.

### Bug caught + fixed during browser proof
- First reject attempt returned 500. Diagnosed by reading `pg_constraint` → `apartments.status` CHECK is `IN ('active','inactive','booked','pending')`; my edge fn was setting `status='hidden'` (not allowed). Switched to `'inactive'`. **Lesson:** read the schema before assuming column-value enums.
- HTML title for reject said "rejectd" — the `${action}d` string trick worked for `approve→approved` but broke for `reject→rejectd`. Replaced with explicit `actionPastTense()` helper.

### Gates
- lint: D6 files clean (no src/ delta), baseline 468 unchanged
- test: 86/86 vitest passing
- build: 4.38s
- check:bundle: 10/10 within budget
- verify:edge: 37 deno tests passing (incl. 9 token + 3 email)

### What still ships in later days
- D11 — swap `founder-email.ts` stub for real Resend.
- D17 — `listing-update` edge fn re-runs auto-moderation if photos/address change. Same token scheme can be reused.
- D19 — verified-host badge approve flow uses the same `listing-moderate`-style magic-link approach (token type discriminator added then).

---

## [2026-04-30] - Landlord V1 Day 5: listing creation pipeline live

End-to-end listing creation — wizard 1→4 → `listing-create` edge function → auto-moderation → apartments row → dashboard redirect. Verified in browser against deployed edge fn (id `bda85444-117c-4ffa-bc75-72579ce4e650`, version 1, ACTIVE) and live Supabase project.

### Frontend
- `src/components/host/listing/ListingForm/Step4Description.tsx` — title (8-100 chars) + description (80-4000 chars) form. Char counters flip to destructive color when invalid. Renders `step4-rejection` alert with `prettyReason()` mapping (photos_lt_5, outside_medellin_metro, contact_info_in_description, price_out_of_range_cop, price_out_of_range_usd, description_too_short) when 422 AUTO_REJECTED returns. On auto_approved/needs_review, fires `listing_create_step` event, shows toast, navigates to /dashboard.
- `src/hooks/host/useListingCreate.ts` — TanStack Query mutation invoking `listing-create`. Returns discriminated union `{ ok: true, data } | { ok: false, rejection }` so the component branches cleanly without parsing error shapes. Reads 422 body from `FunctionsHttpError.context.json()` to surface the rejection reasons (supabase-js wraps non-2xx responses in `error`).
- `src/pages/host/ListingNew.tsx` — replaced D5Placeholder with `<Step4Description>`. Wired `clearDraft` to `onSuccess` so the wizard mount can be reused for a follow-up listing.
- `src/components/host/listing/ListingForm/Step1Address.tsx` — fallback path now allows Continue without lat/lng. When Maps key fails (`gm_authFailure` fires) or load errors, gate becomes `(!fallback && (latitude === null || longitude === null))`. Server-side geocoding (or needs_review verdict) takes over from there. Without this fix, Vercel previews without Maps key whitelisting blocked the wizard at Step 1.

### Edge function
- `supabase/functions/listing-create/index.ts` — Zod-validated payload (PayloadSchema covers all wizard fields: address, lat/lng, bedrooms, price, photos, title, description). Auth via `verify_jwt: true` + `getUserId()`. Rate limit: 10 listings/hour/user via `check_rate_limit` RPC. Looks up `landlord_profiles` (must exist; 403 PROFILE_REQUIRED otherwise). Runs `autoModerationVerdict` pure fn, then service-role INSERT to `apartments` with verdict-derived `moderation_status` (`auto_approved`→`approved`, `needs_review`→`pending`). Returns 422 AUTO_REJECTED for rejected verdict (NO row inserted), 201 with verdict for the others.
- `supabase/functions/listing-create/auto-moderation.ts` — pure function `autoModerationVerdict(listing) → { verdict, reasons }` with 5 rules. MEDELLIN_BBOX (lat 6.05–6.45, lng -75.75–-75.4); PRICE_RANGE COP 200k–15M / USD 50–5k; description ≥80 chars; photo count ≥5; phone/email regex on description. Tested by 14 deno tests in `supabase/functions/tests/listing_create_auto_moderation_test.ts`.

### Browser proof
1. **Happy path** — Signed in as `qa-landlord@mdeai.co`, navigated to `/host/listings/new`, walked Steps 1→4, uploaded 5 synthesized JPEGs to the `listing-photos` bucket, submitted with valid title + 251-char description. POST `/functions/v1/listing-create` returned **201** with `{ verdict: "needs_review", reasons: ["outside_medellin_metro"] }` (lat/lng=0/0 in fallback mode, as expected). Apartments row `c1c5f8a3-…` confirmed live with `moderation_status='pending'`, `status='active'`, `landlord_id` set, `images[]` length 5. Toast shown, redirected to /dashboard.
2. **Rejected path** — Direct fetch to `listing-create` with 100k COP price + 5-char description + lat/lng=0 → POST returned **422** with `{ error: { code: "AUTO_REJECTED", details: { reasons: ["outside_medellin_metro", "price_out_of_range_cop", "description_too_short"] } } }`. `SELECT count(*) FROM apartments WHERE title='Bad listing test'` returned 0 — server correctly skipped the INSERT for 2+ violations.
3. Cleanup: deleted test apartments row + 5 storage objects from the test draft folder.

### Gates
All five green: lint (D5 files clean, baseline 468 unchanged), tests 86/86, build 4.31s, check:bundle 10/10 within budget (index 92.97 KB ≤ 100 KB), verify:edge 25 deno tests passing.

---

## [2026-04-30] - Landlord V1 D4 audit follow-up: 2 missing FK indexes

Caught by a post-D4 schema audit (`SELECT … FROM information_schema.table_constraints WHERE constraint_type='FOREIGN KEY'…`). Two FK columns from D1 had no covering index, in violation of the existing "schema-foreign-key-indexes" convention used by the P1-CRM tables.

### Fixed
- New migration `20260430130000_landlord_v1_fk_indexes.sql` — partial indexes on `landlord_inbox_events.actor_user_id WHERE actor_user_id IS NOT NULL` and `verification_requests.reviewed_by WHERE reviewed_by IS NOT NULL`. `WHERE … IS NOT NULL` keeps the indexes tiny while still serving the founder-side queries (e.g. "show me docs I reviewed").
- Applied via Supabase MCP `execute_sql` + registered to `supabase_migrations.schema_migrations` history. `CREATE INDEX IF NOT EXISTS` is online-safe; no data backfill needed.
- Verified live: both indexes present in `pg_indexes` (`landlord_inbox_events_actor_idx`, `verification_requests_reviewed_by_idx`).

### Why this slipped past D1
The original D1 migration index list was column-driven (the schema designer added indexes for the obvious filter columns) rather than constraint-driven (every FK gets an index by default). The convention is documented; we just didn't enforce it programmatically. **Follow-up for D5+:** add an FK-index check to `npm run check:bundle` or a separate `npm run check:schema` step so this can't regress silently.

### Audit findings — clean (no action required this PR)
- Zero `TODO/FIXME/XXX` in D1-D4 code
- Zero `console.log` in shipped files
- Zero `as any` / `: any` casts
- Throws limited to RLS-violation passthroughs and explicit guards in mutations (the right pattern — TanStack Query catches + surfaces)

### Commit
`3111cb9 fix(db): backfill 2 missing FK indexes (D4 audit follow-up)`

---

## [2026-04-29] - Landlord V1 Day 4: listing wizard steps 1-3 + bundle-size budget gate

### Database / Storage
- New `listing-photos` PUBLIC Storage bucket — 5 MB limit per image, JPEG/PNG/WebP only. Path convention `<auth.uid()>/<draftId>/<filename>` so a single user can hold multiple in-progress drafts without filename collisions
- 5 RLS policies: `listing_photos_insert_own` / `_select_public` / `_update_own` / `_delete_own` / `_service_role`. Renters anywhere can SELECT (the listings are eventually public anyway); only the owning landlord can INSERT/UPDATE/DELETE inside their own folder
- Migration `20260430120000_landlord_v1_listing_photos_bucket.sql` registered to schema_migrations history

### Frontend — wizard scaffold (steps 1-3 of 4; step 4 lands D5)
- `src/pages/host/ListingNew.tsx` — wizard state machine at `/host/listings/new`. 4-step stepper, Back navigation, "Save + go to dashboard" escape hatch, D5 placeholder for Step 4. Auth gate: anon → /login; renter → /dashboard; landlord-without-profile → /host/onboarding; landlord → wizard
- `src/components/host/listing/ListingForm/Step1Address.tsx` — Google Places Autocomplete (CO bias) bound to a controlled input. Auto-fills address + neighborhood + city + lat/lng from the picked place. Maps-auth-failure aware: falls back to a free-form text input if the API key is bad/missing so the wizard isn't blocked
- `src/components/host/listing/ListingForm/Step2Specs.tsx` — bedrooms / bathrooms (number steppers w/ bounds), size_sqm, monthly price + currency (COP / USD), minimum stay days, furnished switch, 10 apartment-amenity chips + 8 building-amenity chips
- `src/components/host/listing/ListingForm/Step3Photos.tsx` — multi-image upload to `listing-photos` bucket. Sequential uploads (one progress indicator at a time), 5+ photo minimum (matches D5 auto-moderation threshold), cover-image badge, click-to-promote, remove-with-storage-cleanup
- `src/hooks/host/useListingDraft.ts` — wizard form state with sessionStorage persistence keyed by draftId. UUID-shaped draftId stable across re-renders. `clearDraft` properly skips the next persist via `skipNextPersistRef` (caught + fixed in this commit's vitest cycle)
- `src/lib/storage/upload-listing-photo.ts` — typed upload helper with named error classes (`ListingPhotoTooLargeError` / `ListingPhotoUnsupportedTypeError`), public-URL resolution, best-effort orphan cleanup. Cache-Control set to 1 year (immutable URLs via timestamp)
- `src/App.tsx` — `/host/listings/new` route registered + lazy `HostListingNew` chunk

### Telemetry
- 2 new PostHog event arms added (events 6 + 7 of 12 V1 taxonomy): `listing_create_step` (`step: 1|2|3|4`, `durationSec`), `listing_photo_uploaded` (`sizeBytes`, `totalCount`)

### Testing — proof of working real-world (per plan §13)
- 21 new Vitest tests added (61 → 83 total): Step1Address (5), Step2Specs (7), Step3Photos covered via wizard integration + the upload helper's 5 tests, useListingDraft (5), upload-listing-photo (5)
- `src/lib/storage/upload-listing-photo.test.ts` — bug fix in this PR: tests now `vi.mock('@/integrations/supabase/client')` BEFORE importing the module under test, fixing an unhandled rejection where the real client tried to load a JSDOM-incompatible session at import time
- Browser proofs via Claude Preview MCP (live Supabase project zkwcbyxiwklihegjhuql):
  1. Anon `/host/listings/new` → `/login?returnTo=%2Fhost%2Flistings%2Fnew` ✓ (screenshot in PR)
  2. SQL state — `listing-photos` bucket exists, public=true, file_size_limit=5242880, allowed_mime_types matches, all 5 RLS policies installed ✓
  3. RLS proof — anon attempt to upload to `listing-photos` rejected with HTTP 403 "new row violates row-level security policy" ✓
- Live wizard render walkthrough was deferred — Supabase project hit the per-hour email-signup rate limit during this session (we created a test landlord in D3). Same wizard internals are exercised by the 21 new vitest tests + the auth-gate + bucket-RLS proofs above

### Tooling — improvements landed in this PR (CT-2 + a runtime hook bug)
- New `scripts/check-bundle-size.mjs` + `npm run check:bundle` — gzips each entry-relevant chunk in dist/assets and fails (exit 1) if over its budget. 10 chunks tracked: `index` (100 KB), `radix` (100 KB), `posthog` (70 KB), `supabase` (60 KB), `gadget` (60 KB), `sentry` (35 KB), `forms` (30 KB), `dates` (25 KB), `icons` (20 KB), `tanstack` (20 KB). All within budget today (entry: 92.96 KB / 100 KB)
- `useListingDraft.ts` skipNextPersistRef pattern — caught a real bug where `clearDraft` was being instantly re-overwritten by the persist `useEffect`. The vitest cycle surfaced this; the fix is a single ref that gates the next persist.

### Gates
- `npm run lint` exit 0 (zero new issues; 444 pre-existing unchanged)
- `npm run test` 83/83 (14 files)
- `npm run build` clean (4.33s)
- `npm run check:bundle` 10/10 within budget (NEW gate)

---

## [2026-04-29] - Landlord V1 Day 3: onboarding 3-step wizard

### Database / Storage
- New `identity-docs` private Storage bucket — 10 MB limit, JPEG/PNG/WebP/PDF only. Path convention `<auth.uid()>/<filename>` so uploads work even before `landlord_profiles` row exists
- 5 RLS policies on `storage.objects` for the bucket: `identity_docs_insert_own` / `_select_own` / `_update_own` / `_delete_own` / `_service_role`. Landlords gated to their own folder via `(storage.foldername(name))[1] = auth.uid()::text`; admin reads all
- Migration `20260430000000_landlord_v1_identity_docs_bucket.sql` registered to schema_migrations history. Apply via execute_sql, not apply_migration (the MCP role lacks ownership of `storage.objects`; documented in the migration's comment)

### Frontend
- `src/pages/host/Onboarding.tsx` — replaces D2 stub. 3-step state machine with stepper, per-step duration timers (PostHog), Back navigation, "Finish later" escape hatch. Auth gate kept (anon → /login, renter → /dashboard, landlord → wizard). Re-entry: if `landlord_profiles` row already exists, Step 1 pre-fills from it
- `src/components/host/onboarding/Step1Basics.tsx` — react-hook-form + zod. Fields: display_name (2–80 chars), kind (individual/agent/property_manager), whatsapp_e164 (E.164 regex `^\+[1-9]\d{7,14}$`), primary_neighborhood (Select with 11 curated Medellín options + optional). Default `+57` prefix on WhatsApp
- `src/components/host/onboarding/Step2Verification.tsx` — optional ID upload. doc_kind Select (national_id / passport / rut / property_deed / utility_bill), drag-n-drop area with 10 MB + MIME validation, "Skip for now" + "Submit & continue" buttons
- `src/components/host/onboarding/Step3Welcome.tsx` — first-name greeting, Profile/Verification status cards, CTAs to `/host/listings/new` (D5) + `/dashboard`, founder WhatsApp link
- `src/hooks/host/useLandlordOnboarding.ts` — 3 TanStack Query hooks: `useOwnLandlordProfile` (gated by RLS `landlord_profiles_select_own`), `useSubmitStep1Basics` (UPSERT with onConflict=user_id), `useSubmitVerification` (storage upload + INSERT verification_requests with orphan-cleanup on DB error)

### Telemetry
- 3 PostHog event arms added: `onboarding_step_completed` (`step: 1|2|3`, `durationSec`), `onboarding_completed` (`totalDurationSec`), `verification_doc_uploaded` (`docKind`). Plan §7.2 V1 events 3–5 of 12

### Testing — proof of working real-world
- Vitest: 13 new tests across `Step1Basics.test.tsx` (6), `Step2Verification.test.tsx` (5 — file-size + MIME guards real `File` objects), `Step3Welcome.test.tsx` (5). Total 48 → 61
- `src/test/setup.ts` extended: ResizeObserver polyfill + scrollIntoView/pointer-capture mocks so Radix Select renders in JSDOM
- Browser-verified end-to-end via Claude Preview MCP against live Supabase (project zkwcbyxiwklihegjhuql):
  1. Anon `/host/onboarding` → `/login?returnTo=%2Fhost%2Fonboarding` ✓
  2. Authed landlord (test user with `account_type='landlord'`) → wizard Step 1 renders with stepper ✓
  3. Step 1 form submission → `landlord_profiles` row created via RLS (verified via SQL: id=`da688800-…`, user_id matches, whatsapp_e164=`+573001112233`, kind=`individual`, verification_status=`pending`) ✓
  4. Step 1 → Step 2 advance with stepper progressing ✓
  5. Skip → Step 3 "Welcome aboard, D3." with both CTAs verified ✓
  6. Storage upload + verification_requests INSERT path (`identity-docs/<user_id>/national_id_<stamp>_test-id.pdf`) verified — both rows + storage object confirmed via SQL `count(*)` joins
  7. Test user + landlord row + verification + storage object all cleaned up; live DB has 0 leftover D3 test data
- 2 React-bug fixes caught + landed in this session: (a) Rules-of-Hooks violation (useRef after early returns) → moved all hooks above conditional returns, (b) ResizeObserver missing in JSDOM → polyfilled in setup

### Tooling
- Gates: `npm run lint` exit 0 · `npm run test` 61/61 · `npm run build` 4.64s. Bundle entry chunk gzip: 94.99 KB (under 100 KB budget)

---

## [2026-04-29] - Landlord V1 Day 2: signup branch + per-day testing block

### Frontend
- New `src/components/auth/AccountTypeStep.tsx` — full-screen radiogroup gating signup with two options ("I'm looking for a place" vs "I'm a landlord or agent"). Renders before email/password form. Brand-aligned: BrandLogo, emerald primary on hover, focus-ring, 44px+ tap targets, `data-account-type` selectors for tests
- Extended `src/pages/Signup.tsx` — two-step flow: AccountTypeStep first, then existing form. Form copy adapts (badge "LANDLORD / AGENT" vs "Renter", Founding-Beta hero blurb for landlords). "Change account type" back button replaces "Back to home" once a choice is made
- Extended `src/hooks/useAuth.tsx` — `signUp` and `signInWithGoogle` accept optional `{ accountType }`. Landlords get `emailRedirectTo: window.location.origin + '/host/onboarding'`; renters get `/`. Account type persisted to `auth.users.raw_user_meta_data.account_type` so it survives email confirmation + OAuth round-trips. Exported `AccountType` type
- New `src/pages/host/Onboarding.tsx` — D2 stub. Anon → `/login?returnTo=/host/onboarding`. Renter → `/dashboard`. Landlord → welcome screen with founder WhatsApp link + dashboard CTA. D3 fleshes out the 3-step wizard
- Modified `src/App.tsx` — lazy `HostOnboarding` route + `/host/onboarding` registration

### Telemetry
- Added 2 PostHog event arms to `AppEvent` union: `landlord_signup_started` (`from: 'signup_page' | 'host_redirect'`) and `landlord_signup_completed` (`method: 'email' | 'google'`). Per plan §7.2 — first 2 of the 12 V1 events

### Testing
- New `src/components/auth/AccountTypeStep.test.tsx` — 4 Vitest tests: both options render as radios, each click fires onSelect with the correct literal, no auto-fire on mount
- Browser-verified via Claude Preview MCP — `/signup` AccountTypeStep, landlord branch form, renter branch form, `/host/onboarding` anon redirect to `/login?returnTo=/host/onboarding` (all clean console)

### Continuous testing — codified
- New `tasks/plan/06-landlord-v1-30day.md` §13 — **Per-day testing block.** Every V1-day PR D2-D30 must include 4 artifacts: (1) Vitest unit tests for non-trivial logic, (2) Claude Preview MCP browser verification with screenshot in PR, (3) PostHog event smoke test, (4) deno test for any edge fn change. RWT scenarios remain the cross-cutting layer (RWT-23 through RWT-27 added for landlord V1)
- New `tasks/todo.md` CT-12 (landlord critical-path Playwright specs, sequenced with V1 days) + CT-13 (per-V1-day testing block)
- New RWT scenarios: RWT-23 (landlord signup happy path), RWT-24 (renter signup regression guard), RWT-25 (landlord OAuth via Google), RWT-26 (end-to-end loop renter→landlord inbox), RWT-27 (RLS isolation between landlords)

### Tooling
- Gates: lint exit 0 · 48/48 unit tests (44 prior + 4 AccountTypeStep) · 11/11 deno tests · build green

---

## [2026-04-29] - Landlord V1 Day 1: schema migration

Per `tasks/plan/06-landlord-v1-30day.md` — first commit of the 30-day landlord build.

### Database
- New migration `20260429000000_landlord_v1.sql` — 5 new tables, 1 view, 4 apartment columns, 14 RLS policies, 2 functions, 3 triggers
- New tables: `landlord_profiles`, `landlord_inbox`, `landlord_inbox_events`, `verification_requests`, `analytics_events_daily`
- New view: `landlord_profiles_public` (security_invoker, safe public read of name/avatar/response stats)
- `apartments` extensions: `landlord_id` FK + `moderation_status` + `rejection_reason` + `source` (43 seeded rows backfilled to `moderation_status='approved'`, `source='seed'`)
- New RLS helper `acting_landlord_ids()` — used by 5 policies
- New trigger `auto_create_landlord_inbox_from_message` — fires on first user-role message in a conversation, creates a `landlord_inbox` row with apartment/landlord derived from `conversations.session_data`
- Reuses existing `update_updated_at()` and `is_admin()` helpers
- Applied via Supabase MCP `apply_migration` to project `zkwcbyxiwklihegjhuql`
- Existing P1-CRM `leads` table (6 rows) + `showings`/`rental_applications` FKs untouched

### Naming divergence (locked Option C)
- Plan §2.3 `leads` → table `landlord_inbox` (avoids clash with existing P1-CRM leads)
- Plan §2.4 `lead_events` → table `landlord_inbox_events`
- UX/URL/event names (`/host/leads`, `useLeads`, PostHog `leads_viewed`) keep the "leads" mental model — only physical tables renamed

### Plan refinements (external review feedback)
- Reframed `Why no billing yet` → "Founding Beta — free for first 100 landlords, permanently"
- D30 success criteria split into Acceptable + Stretch bands (avoids brittle absolute targets)
- Daily scorecard reorders quality-first (reply rate, time-to-reply, active landlords) above count metrics
- Added weekly renter-side conversation-volume check (alert if -25% from D1 baseline)
- §9.4 verification flow: signed JWT + 24h expiry + single-use (replaces naked magic-link)
- Trigger SQL in plan §2.8 corrected to use real schema (`messages.content`, JOIN to `conversations.user_id`)

### Tooling
- `database.types.ts` regenerated: 3940 → 4326 lines (+386 for new tables)
- Gates: lint exit 0 · 44/44 unit tests · 11/11 deno tests · build 4.04s

---

## [2026-04-05] - Epic 1 data foundation, P1 CRM, Supabase CLI workflow

### Database & seed
- Applied six P1 table migrations to linked Supabase project (`db push`)
- Added `supabase/seed.sql` with neighborhoods, profiles, 28 apartments, P1 pipeline demo rows, bookings, payments; wired `[db.seed]` in `supabase/config.toml`
- Regenerated app `database.types.ts` from linked schema

### Edge functions
- New `p1-crm` function: authenticated `create_lead` and `record_payment` with Zod validation; `verify_jwt: true` in config
- Deployed with `supabase functions deploy p1-crm --use-api`

### Tooling & docs
- Cursor rule `supabase-cli.mdc` aligned with [Supabase CLI](https://supabase.com/docs/reference/cli/introduction) / [local dev](https://supabase.com/docs/guides/local-development) docs
- `tasks/notes/01-supa.md` updated with linked-project command checklist

---

## [2026-04-04] - Full Audit, Diagrams, Gemini Migration, DB Sync

### Audits
- **Database Schema Audit** — 28 tables verified, all RLS enabled, FK chain analysis, missing tables identified
- **Edge Function Deep Audit** — 9 functions, 3,706 LOC, 20 issues found (5 P0, 5 P1, 5 P2, 5 P3)
- **TypeScript types generated** — 3,451 lines from live Supabase schema
- **Edge function inventory** — cleaned up 5 orphan functions (ai-booking-chat, ai-orchestrator, ai-suggestions, make-server-fd8c4bf7, server)
- **Identified 3 deployed-but-never-called functions** (ai-search, ai-trip-planner, rules-engine)

### AI Migration
- Migrated ALL 6 AI edge functions from Lovable gateway to Google Gemini direct API
- Fixed ai-router bug: was using SUPABASE_URL as Bearer token
- Updated models: ai-router → gemini-3.1-flash-lite-preview, ai-trip-planner/rentals → gemini-3.1-pro-preview
- Deployed all 6 updated functions to Supabase

### Infrastructure
- Migration history repaired (78 entries marked as reverted)
- Fresh schema pulled from remote (baseline migration: 9,975 lines)
- Vercel build fixed (legacy-peer-deps in .npmrc for @gadgetinc/react)
- All 34 routes verified returning 200 on live site
- Google Maps API key configured
- Supabase CLI linked to project

### Documentation
- Created `docs/architecture-diagrams.md` — 8 Mermaid diagrams (system context, frontend, ERD, edge functions, AI chat flow, commerce flow, tourist journey, deployment pipeline)
- Created `docs/audits/database-schema-audit.md`
- Created `docs/audits/edge-function-audit.md` — with 5-sprint implementation plan
- Created `NEXT-STEPS.md` at project root (replaces outdated docs/NEXT-STEPS.md)
- Created `.claude/plans/edge-function-hardening.md` — 18-step security + performance plan

### Plugins Installed
- commit-commands, code-review, feature-dev, claude-md-management, claude-code-setup, frontend-design, security-guidance

---

## [2026-04-03] - Full Codebase Audit + Commerce Integration

### Audit Results — Live Site vs Codebase
- **mdeai.co IS deployed and working** — Vercel at medell-n-connect.vercel.app, domain www.mdeai.co linked
- **Local codebase is 95%+ complete** — 25+ features working with REAL Supabase data (not mock)
- **Zero mock-only features** — every page queries live Supabase PostgreSQL
- **AI system fully wired** — ai-chat, ai-router, ai-search, ai-trip-planner all call real edge functions with Claude
- **Admin panel complete** — CRUD for all 4 listing types + user management
- **Auth working** — Supabase email/password + Google OAuth configured
- **Realtime active** — chat messages, trip items, conversations use Supabase Realtime subscriptions
- **Critical blocker: app needs Vercel deployment to go live**

### Feature Status (all WORKING with real data)
| Feature | Data Source | Status |
|---------|------------|--------|
| Homepage (hero, categories, featured) | Supabase | Working |
| Explore (multi-category, AI search) | Supabase + ai-search edge fn | Working |
| Apartments (list, detail, filters) | Supabase apartments table | Working |
| Cars (list, detail, filters) | Supabase car_rentals table | Working |
| Restaurants (list, detail, filters) | Supabase restaurants table | Working |
| Events (list, detail, calendar view) | Supabase events table | Working |
| Rentals (unified AI intake wizard) | Supabase + rentals edge fn | Working |
| Concierge (6-tab AI chat) | Supabase + ai-chat edge fn | Working |
| Trips (list, detail, create, itinerary) | Supabase trips/trip_items | Working |
| Bookings (multi-type, status filters) | Supabase bookings table | Working |
| Dashboard (stats, featured, AI picks) | Supabase (multiple tables) | Working |
| Saved/Collections (CRUD) | Supabase saved_places/collections | Working |
| Auth (email + Google OAuth) | Supabase Auth | Working |
| AI Chat (streaming, tool-calling) | ai-chat edge fn (Claude) | Working |
| AI Search (semantic) | ai-search edge fn | Working |
| Intent Router | ai-router edge fn | Working |
| Admin Panel (5 pages) | Supabase (admin queries) | Working |
| 3-Panel Layout | All pages | Working |
| Mobile Responsive | Bottom nav + overlays | Working |

### Chat System Architecture (Fully Built)
- 7 agent types: concierge, booking_assistant, budget_guardian, dining_orchestrator, event_curator, itinerary_optimizer, local_scout
- 6 chat tabs: concierge, bookings, dining, trips, events, local
- Tool-calling: rentals_search, rentals_intake, restaurant search, event discovery, trip planning
- Message streaming with AbortController
- Conversation persistence + archive in Supabase
- Realtime updates via Supabase subscriptions
- FloatingChatWidget on all pages
- Full AI concierge page at /concierge

### Added — Commerce Integration (Shopify + Gadget + /coffee Route)

### Added
- **Shopify headless commerce** — Connected dev store `mdeaidev.myshopify.com` via Gadget.dev
- **Gadget integration** — Installed `@gadget-client/mdeai` + `@gadgetinc/react@0.21.4`
  - `.npmrc` configured for Gadget npm registry
  - `MdeaiClient` initialized with anonymous auth for public product browsing
  - `GadgetProvider` wraps the entire app in `App.tsx`
- **`/coffee` route** — New product listing page with 3-panel layout
  - `useCoffeeProducts()` hook using Gadget `useFindMany` for Shopify product queries
  - `useCoffeeByHandle()` for single product detail
  - `CoffeeCard` component with image placeholder, price, vendor, tasting notes
  - `FreshnessBadge` — "Roasted Xh ago" badge (green/yellow/red)
  - `CoffeeFilters` — Roast level and processing method filters
- **`/coffee/:handle` route** — Product detail page with knowledge graph (farm, altitude, cupping score)
- **`useShopifyCart` hook** — Shopify Storefront API cart management
  - Cart create, add lines, restore from localStorage
  - Checkout redirect to Shopify hosted payment
- **Coffee types** — `CoffeeProduct`, `CoffeeFilters`, `getFreshnessInfo()` utility

### Added — Developer Infrastructure
- **CLAUDE.md** — Project-level AI assistant configuration
- **claude.local.md** — Personal overrides (git-ignored)
- **`.claude/` architecture:**
  - `rules/` — 4 modular rule files (style-guide, supabase-patterns, edge-function-patterns, ai-interaction-patterns)
  - `commands/` — `/process-task` and `/deploy-check` slash commands
  - `skills/` — mdeai-freshness, mdeai-commerce, mdeai-three-panel
  - `agents/` — security-auditor and performance-reviewer specialist agents
- **`docs/gadget-best-practices.md`** — 1,500+ line Gadget integration guide
- **`.claude/plans/coffee-route-gadget.md`** — Implementation plan

### Added — Shopify App
- Scaffolded `~/mdeai-development/` Shopify React Router app
- Connected to Gadget backend at `mdeai--development.gadget.app`
- Released app version `mdeai-2` to Shopify Partner Dashboard
- Installed on dev store `mdeaidev`

### Changed
- `.env.local` — Added Shopify, Gadget, and VITE_SHOPIFY_* credentials
- `.env.local` — Fixed leading whitespace on SHOPIFY_CATALOG_API_KEY
- `.env.local` — Updated `PUBLIC_STOREFRONT_API_VERSION` from 2024-04 to 2026-01
- `.gitignore` — Added `.env` and `.env.*` patterns (was previously missing)
- `package.json` — Added @gadgetinc/react, @gadget-client/mdeai dependencies

### Tools Installed
- Node.js v25.8.2 (via nvm), Gadget CLI (ggt) 3.0.0, Shopify CLI 3.93.0, Yarn 1.22.22

---

## [2026-01-29] - Unified Rentals MVP

### Added
- Rentals page with unified apartment + car search
- Rentals API edge function
- Rentals UI wizard flow

---

## [2026-01-23] - Premium Booking Wizards Wired to Detail Pages

### Added
- **CarBookingWizardPremium Integration** - Wired to `/cars/:id` detail page
  - Opens in Dialog modal on "Book Now" click
  - 3-panel layout with dates, pickup location, insurance tiers (Basic/Standard/Premium)
  - Weekly discount logic for 7+ day rentals
  - Delivery fee calculator ($25 for apartment/hotel delivery)
  - Real-time price breakdown in right panel
  
- **EventBookingWizardPremium Integration** - Wired to `/events/:id` detail page
  - Opens in Dialog modal on "Get Tickets" click
  - 3-panel layout with ticket type selection (General/VIP)
  - Quantity selector (1-10 tickets)
  - VIP perks display (priority entry, reserved seating, etc.)
  - Group booking acknowledgment (4+ tickets)

### Changed
- Updated CarDetail right panel with "Book Now" action button
- Updated EventDetail right panel with "Get Tickets" action button
- Added Dialog + DialogContent imports to both detail pages

### Verified
- RLS policies on bookings table: user_id = auth.uid() for SELECT/UPDATE
- All 4 booking wizards (Apartment, Restaurant, Car, Event) now functional
- Progress tracker updated to 85% overall completion

---

## [2026-01-23] - Progress Tracker Audit & Bug Fixes

### Fixed
- **PlaceCard forwardRef warning** - Fixed console warning on Index page
- **Progress Tracker accuracy** - Complete rewrite with verified percentages and proof of completion

### Added
- **Comprehensive Progress Tracker** - New format with:
  - Executive summary with completion percentages
  - Critical issues table (RLS, OAuth status)
  - Phase-by-phase breakdown with verification
  - Database table inventory (24 tables)
  - Edge function inventory (4 functions)
  - Metrics dashboard

### Verified
- 23 routes functional
- 8 protected routes with auth
- All 5 listing types (apartments, cars, restaurants, events, explore)
- AI chat with tool calling
- Booking wizards (apartment, restaurant)
- Trip management (list, detail, create, itinerary builder)

---

## [2026-01-22] - AI Concierge & Bookings Dashboard

### Added
- **AI Concierge Page** (`/concierge`) - Full-page 3-panel chat experience
  - 4-tab architecture (Concierge, Trips, Explore, Bookings)
  - Real-time streaming from ai-chat edge function
  - Active trip context awareness
  - Quick action buttons
- **Bookings Dashboard** (`/bookings`) - 3-panel booking management
  - Status filters (upcoming, past, cancelled)
  - Type filters (all, apartment, car, restaurant, event)
  - Statistics panel (total, upcoming, this month)
  - Detail panel with cancel action

### Changed
- Updated LeftPanel navigation with Concierge link
- Enhanced Index footer with multi-column layout

---

## [2026-01-21] - Google Maps Integration for Itinerary Builder

### Added
- **GoogleMapView** component - Interactive Google Maps with street-level tiles, zoom/pan, and custom markers
- **google-directions** edge function - Secure Google Routes API calls for real routing data
- **useGoogleDirections** hook - Client-side hook for fetching directions
- Polyline decoding and rendering for actual road routes
- Real travel times from Google's traffic-aware routing
- Auto-fetch directions when day selection changes
- "Get Directions" button for manual routing requests
- VITE_GOOGLE_MAPS_API_KEY environment variable support
- Seamless fallback to placeholder view when API key not configured

### Changed
- VisualItineraryBuilder now uses GoogleMapView instead of placeholder ItineraryMapView
- Travel time indicators now display real Google-calculated durations when available
- Haversine calculation remains as fallback when Google API unavailable
- AI route optimization integrates with Google routing for validated travel times

### Technical
- Google Routes API v2 (computeRoutes) with traffic-aware preference
- Advanced Marker Element API for custom styled pins
- Encoded polyline decoding for route visualization
- CORS-enabled edge function with proper error handling

---

## [2026-01-21] - Map Visualization for Itinerary Builder

### Added
- **ItineraryMapView** component - Visual route map with positioned pins and dashed route lines
- **TravelTimeIndicator** component - Shows travel time/distance between activities with mode suggestion (walk/taxi/drive)
- Haversine formula for accurate distance calculation between coordinates
- Travel time estimation based on 25 km/h average city speed
- Split view mode in VisualItineraryBuilder (List + Map side-by-side)
- Map/List toggle in TripDetail page toolbar
- SVG route lines with arrow markers connecting activity pins
- Total travel time badge per selected day
- Activity pins show step number, icon, and title

### Changed
- Updated VisualItineraryBuilder to support `showMapView` prop
- TripDetail now includes map toggle for builder view
- Travel time indicators appear between items when map view is active

---

## [2026-01-21] - Collections, Itinerary Builder, Events Enhancement

### Added
- **Collections Page** (`/collections`) - Grid view of user collections with preview thumbnails
- **CollectionCard** component with image grid, edit/delete/share actions
- **VisualItineraryBuilder** - Drag-and-drop itinerary planning with @dnd-kit
- **EventsCalendar** - Month view calendar for event discovery
- **EnhancedEventFilters** - Date presets, category/neighborhood/price filters, view mode toggle
- `useCollectionPreviews` hook for fetching collection thumbnail images
- `useReorderTripItem` hook for drag-and-drop item reordering
- Extended `EventFilters` type with category, neighborhood, priceRange, dateRange

### Changed
- Updated Events page with calendar view and enhanced filtering
- Updated TripDetail page with tabbed Builder/Timeline views
- Added Collections route to App.tsx

---

## [2026-01-20] - 3-Panel System Rebuild

### Added
- **ThreePanelContext** - Global state for selectedItem, rightPanelOpen, URL sync
- **ThreePanelLayout** - Responsive shell (Desktop/Tablet/Mobile)
- **RightDetailPanel** - Slide-in detail view with hero, AI pitch, actions
- Desktop: 280px Left | Flex Center | 500px slide-in Right
- Tablet: Collapsible Left | Right overlay
- Mobile: Full-screen Right overlay with bottom nav
- ESC key closes panel, URL sync with `?detail=id`
- Card selection highlighting across all types

### Changed
- All listing pages now use unified `ThreePanelLayout`
- Removed duplicate Sheet/drawer on desktop
- Fixed panel leaking between breakpoints
- LeftPanel now includes "My Trips" navigation link

### Cards Updated (isSelected prop)
- RestaurantCard
- ApartmentCard
- CarCard
- EventCard
- ExploreCard

---

## [2026-01-20] - Trips Module

### Added
- `/trips` - Trip list page with filters (draft, active, completed)
- `/trips/:id` - Trip detail with day-by-day timeline
- `/trips/new` - Trip creation wizard (4 steps)
- `TripCard` component with status badges
- `DayTimeline` component for itinerary view
- `TripWizard` with date picker and budget
- `AddToTripDialog` - Add any listing to a trip
- `useTrips`, `useTripItems` hooks for data management
- Protected routes requiring authentication

---

## [0.2.0] - 2026-01-19

### Added
- Supabase authentication (email/password, Google OAuth)
- Protected routes for `/saved` and `/concierge`
- Login, Signup, Forgot Password, Reset Password pages
- Session persistence across refresh
- User state in Sidebar and MobileNav

### Changed
- Updated Index page header with auth state
- Sidebar shows user email when logged in

### Security
- Passwords validated (min 6 chars)
- Password reset via email link

---

## [0.1.0] - 2026-01-19

### Added
- Initial project setup (Vite + React + TypeScript)
- Supabase connection (project: `medellin`)
- Design system with emerald/cream palette
- Custom typography (DM Sans, Playfair Display)
- 3-panel layout components (Sidebar, MobileNav, AppLayout)
- Home page with hero section
- Explore page with filters and mock data
- Place detail page
- Saved places page (basic)
- Concierge page (placeholder)
- PlaceCard, CategoryFilter, NeighborhoodSelector components
- Mock data for testing

### Database
- Connected to existing Supabase schema
- Tables available: profiles, apartments, restaurants, events, car_rentals, saved_places, collections, trips, bookings

---

## Version Format

- **Major (X.0.0)**: Breaking changes, major features
- **Minor (0.X.0)**: New features, backward compatible
- **Patch (0.0.X)**: Bug fixes, small improvements

---

## Related

- [Progress Tracker](./progress-tracker/progress.md) — Task status
- [Next Steps](./NEXT-STEPS.md) — Implementation guide
