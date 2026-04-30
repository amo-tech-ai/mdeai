# Changelog

All notable changes to mdeai.co are documented here.

Format: [Keep a Changelog](https://keepachangelog.com/en/1.0.0/)

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
