Smart move — landlord side first earns supply and proves the marketplace before payments matter. Here's the systematic plan, expanded beyond strict F1.

## 🏠 Phase F1 — Landlord Onboarding + Dashboard (no payments)

### Sprint sequencing (~3 weeks, sequential — each unblocks the next)

```
Week 1 — Identity + onboarding         Week 2 — Listings + moderation       Week 3 — Operations dashboard
─────────────────────                  ─────────────────────                ─────────────────────
F1.1 schema migration                  F1.4 property listing form           F1.7 landlord dashboard
F1.2 landlord signup branch            F1.5 photo upload + storage          F1.8 listing performance metrics
F1.3 onboarding wizard                 F1.6 admin moderation queue          F1.9 application inbox
                                                                            F1.10 host public profile
```

### F1.1 — Schema migration (~3 hrs)

**Files:**

- New `supabase/migrations/20260429_landlord_profiles.sql`
- Updates `database.types.ts`

**Changes:**

- New table `landlord_profiles` — `user_id` (FK auth.users), `business_name`, `rut_nit` (Colombian tax ID), `phone_e164`, `whatsapp_e164`, `verification_status` (pending/in_review/approved/rejected), `verification_docs` (jsonb: `{id_doc_url, ownership_proof_url, ...}`), `commission_rate` (default 0.12), `payout_bank_*` (nullable — defer until F3), `total_listings`, `created_at`, `updated_at`
- New enum `account_type` on `profiles` — `'renter' | 'landlord' | 'property_manager' | 'admin'`
- New columns on `apartments` — `landlord_id` (FK landlord_profiles), `moderation_status` (`pending | approved | rejected`), `rejection_reason`, `lease_status` (`available | showing | application | leased`), `current_tenant_id`
- RLS: landlords can SELECT/UPDATE their own `landlord_profiles` row + their own `apartments`. Admins can SELECT/UPDATE all. Public reads only `apartments` where `moderation_status = 'approved'`.
- Trigger: `landlord_profiles.INSERT` → set `profiles.account_type = 'landlord'`

**Acceptance:** migration applies idempotently; existing apartments backfilled with a system landlord row; RLS test confirms anon can't see pending listings.

### F1.2 — Landlord signup branch (~2 hrs)

**Files:**

- `src/pages/Signup.tsx` — add account-type toggle ("I'm a renter" / "I'm a host")
- `src/components/auth/AccountTypeStep.tsx` (new)
- `src/hooks/useAuth.tsx` — extend signup payload to set `account_type` after auth row exists

**UX:** Single signup page, but the toggle changes the post-signup redirect:

- renter → `/chat?send=pending` (existing flow)
- landlord → `/host/onboarding` (new)

**Acceptance:** signing up as a host creates a `landlord_profiles` row with `verification_status = 'pending'` + redirects to wizard.

### F1.3 — Onboarding wizard, 4 steps (~1 day)

**Files:**

- `src/pages/host/Onboarding.tsx` (new)
- `src/components/host/onboarding/Step1BasicInfo.tsx` — name, phone (E.164), WhatsApp number, languages spoken
- `src/components/host/onboarding/Step2BusinessInfo.tsx` — business name, RUT/NIT, # of properties, primary neighborhood
- `src/components/host/onboarding/Step3VerificationDocs.tsx` — ID upload + property ownership proof (drag-drop to Supabase Storage `identity-docs` bucket, private)
- `src/components/host/onboarding/Step4Welcome.tsx` — "We'll review your docs within 24h. Add your first listing now or wait."
- New skill: `src/hooks/useLandlordOnboarding.ts` — manages step state + persists progress to `landlord_profiles.session_data`

**Defer:** payout bank step (Step 5 in original spec) — it goes in F3 when payments ship.

**Acceptance:** abandonment-safe — closing the tab mid-flow restores progress on next visit. Final submit sets `verification_status = 'in_review'` + creates a notification for admins.

### F1.4 — Property listing form, 6 steps (~2 days)

**Files:**

- `src/pages/host/Listings.tsx` (new — index of own listings)
- `src/pages/host/ListingNew.tsx` (new)
- `src/pages/host/ListingEdit.tsx` (new — same form, edit mode)
- `src/components/host/listing/Step1Address.tsx` — address autocomplete (Google Places) + auto-geocode (lat/lng) + map preview pin
- `src/components/host/listing/Step2Specs.tsx` — bedrooms, bathrooms, sqm, furnished, type
- `src/components/host/listing/Step3Photos.tsx` — drag-drop, min 5, reorder, primary photo selector
- `src/components/host/listing/Step4Amenities.tsx` — checkboxes + WiFi speed (Mbps) input
- `src/components/host/listing/Step5Pricing.tsx` — monthly rate, deposit, minimum stay, available_from/to
- `src/components/host/listing/Step6Description.tsx` — manual text + "Generate AI description" button (Gemini call with photo + spec context)

**Edge function:**

- `supabase/functions/generate-listing-description/index.ts` — given `apartment_id`, fetches photos + specs, calls Gemini 3 Flash, returns suggested description

**Acceptance:** end-to-end create flow inserts an `apartments` row with `moderation_status = 'pending'`. Listing doesn't appear in public search until approved. Edit flow requires re-moderation if photos or address change.

### F1.5 — Photo upload + Storage lifecycle (~half-day)

**Files:**

- `src/lib/storage/upload-listing-photo.ts` — handles client-side resize (max 2400px width) + WebP conversion + upload to `property-images` bucket
- `src/components/host/listing/PhotoDropzone.tsx`

**Bucket policies:**

- `property-images` — public read, landlord-only write to `<landlord_id>/<apartment_id>/<uuid>.webp`
- File-size cap: 5 MB pre-resize (client throws before upload)

**Acceptance:** drop 5 photos, see thumbnails, reorder, set primary, all surface to detail page within 1 second.

### F1.6 — Admin moderation queue (~1 day)

**Files:**

- `src/pages/admin/Moderation.tsx` (new) — replaces or extends existing `/admin/apartments`
- `src/components/admin/ModerationCard.tsx` — listing summary + approve/reject/request-changes buttons
- New edge function: `supabase/functions/moderate-listing/index.ts` — admin-only (RBAC check via `user_roles`), updates `moderation_status` + sends notification to landlord

**Filtering:** `verification_status = 'in_review'` (landlords) and `moderation_status = 'pending'` (listings) feed the queue.

**Acceptance:** admin clicks approve → listing goes live in public search within 5 seconds (realtime); landlord receives in-app + email notification.

### F1.7 — Landlord dashboard overview (~1 day)

**Files:**

- `src/pages/host/Dashboard.tsx` (new) — replaces `/host/onboarding` after verification approved
- `src/components/host/dashboard/MetricsBar.tsx` — counts: active listings, pending applications, this-week showings, this-week views
- `src/components/host/dashboard/RecentActivityFeed.tsx` — last 10 events (new application, showing confirmed, listing approved/rejected, etc.)
- `src/components/host/dashboard/QuickActions.tsx` — "Add new listing", "Edit availability", "View applications"

**Layout:** 3-panel — left: nav (Listings / Applications / Showings / Earnings — Earnings disabled until F3) · center: metrics + activity · right: in-app notifications panel

**Acceptance:** Loads in under 600 ms (server-side aggregation via new `landlord_dashboard_summary` SQL view); empty states when no data.

### F1.8 — Listing performance metrics (~half-day)

**Files:**

- New SQL view `apartment_metrics` — joins `apartments` + `messages` + `leads` + `showings` + saved_places counts → returns per-listing: views_7d, inquiries_7d, showings_7d, applications_7d, conversion rate, avg time-to-first-inquiry
- `src/components/host/listing/ListingMetricsRow.tsx` — inline mini-row on each Listings index card

**Acceptance:** "12 views, 3 inquiries, 1 showing this week" visible per listing.

### F1.9 — Application inbox (~1 day)

**Files:**

- `src/pages/host/Applications.tsx`
- `src/components/host/applications/ApplicationCard.tsx` — applicant photo (if uploaded) + name + nationality + dates + budget + AI summary + match score
- Approve / reject / request-info actions wire to `application-review` edge function (new)
- `supabase/functions/application-review/index.ts` — host action, updates `rental_applications.status`, fires notification, creates `messages` thread between renter and host

**Renter-side display:** the existing chat already surfaces application status; just need to teach the system prompt about it.

**Acceptance:** host approves an application → renter sees "Approved by host" message in their chat → notification fires → application status flips to `approved`.

### F1.10 — Host public profile page (~half-day)

**Files:**

- `src/pages/HostProfile.tsx` at `/hosts/:landlord_id`
- Surfaces: business name, photo, languages, total listings, response rate, response time, member since
- Listings carousel below (only `moderation_status = 'approved'`)

**Renter-side hook:** add "Hosted by [name] →" link on RentalCardInline + ApartmentDetail header. Builds trust before booking.

**Acceptance:** anon visitor can browse host profile + their listings without auth.

## ➕ "Etc" — adjacent features that complete the loop

||Feature|Why it matters here|
|---|---|---|
|F1.11|**Notifications system** (in-app bell + email)|Landlords need to know "new application", "listing approved", "showing requested" — without this, F1.9 is just a passive inbox|
|F1.12|**Realtime subscription on `applications` + `showings`**|Dashboard activity feed needs live updates, otherwise "this-week showings" requires manual refresh|
|F1.13|**Listing edit + soft-delete**|Hosts need to update price, photos, availability without re-uploading. Soft-delete (`moderation_status = 'archived'`) preserves audit trail|
|F1.14|**Bulk operations**|Hosts with 5+ listings need: bulk price adjustment, bulk publish/unpublish, bulk availability calendar|
|F1.15|**Landlord availability calendar**|`landlord_availability` table — defines weekly recurring slots when host can do showings. Required before F2 showing scheduler ships for renters|
|F1.16|**AI listing-quality coach**|After listing creation, Hermes scores: photo quality 8/10, description completeness 6/10, pricing competitiveness "12% above market" — gives actionable suggestions before moderation|
|F1.17|**Host response rate tracking**|Computed from `messages` timestamps — surfaces on listings + host profile. Drives quality|
|F1.18|**Host onboarding email sequence**|Day 1 welcome, Day 3 "complete your verification", Day 7 "add another listing" — drip campaign for activation|
|F1.19|**Property manager support**|One person managing 15+ listings for multiple owners. Future, but the schema (account_type + landlord_id chains) should anticipate it|
|F1.20|**Spanish-localized UX**|Most Medellín hosts speak Spanish. The whole F1 surface needs i18n from day 1, not retrofitted later|

## 🎯 Recommended starting point

**Ship in this order over 3 weeks:**

|Week|Sprint goal|Tasks|
|---|---|---|
|**W1**|Landlords can sign up + complete profile|F1.1 → F1.2 → F1.3 → F1.20 (i18n scaffold)|
|**W2**|Landlords can list properties (gated by moderation)|F1.4 → F1.5 → F1.6 → F1.13 (edit)|
|**W3**|Landlords can run their business|F1.7 → F1.8 → F1.9 → F1.11 (notifications) → F1.10 (public profile) → F1.15 (availability calendar) → F1.17 (response rate)|

**Defer to later:**

- F1.12 (realtime — start with polling, upgrade if W3 dashboard feels stale)
- F1.14 (bulk ops — until power users actually exist)
- F1.16 (AI coach — high value but bigger lift)
- F1.18 (email drip — nice-to-have, after activation problem is real)
- F1.19 (PM role — wait for first multi-property landlord)

## 🚦 What I'd do right now

Three options, ranked:

1. **Add Phase F1 to `todo.md`** (with all 20 tasks above as numbered items + acceptance criteria) — 5 min, gives you a tracked plan
2. **Ship F1.1 schema migration** — single-PR foundation, ~3 hrs, unblocks everything else. I can do this end-to-end (migration SQL + apply to remote via MCP + regen types + commit + push)
3. **Ship F1.1 + F1.2 together** — schema + signup branch in one PR. ~half-day. Lets you smoke-test "I can sign up as a landlord" by EOD

Which do you want — (1) plan-first, (2) start with foundation, or (3) get to a smoke-testable state in one sitting?