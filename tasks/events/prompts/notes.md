Starting systematic Phase 1 build-out. I'll go sequentially through dependency order: **004 → 005 → 006 → 008 → 003** (007 PWA + 009 chatbot are larger UI pieces — depend on prior work; will tackle after revenue-path gates green).

## Step 1: Audit existing schema — does `ticket_checkout_create_pending` RPC exist?

All RPCs already exist from task 001. Let me verify the seed data + ticket schema.

## Step 2 (Task 004): Implement `ticket-checkout` edge function

All schema is in place: 4 RPCs exist (`ticket_checkout_create_pending`, `ticket_checkout_cancel`, `ticket_payment_finalize`, `ticket_payment_refund`), `idempotency_keys` table exists, 4 ticket tiers seeded.

Acknowledging — skills must run per task. Task 004's frontmatter calls for `supabase-edge-functions` (already audited) + `supabase` + `mdeai-project-gates`. Let me clean up a code smell I just spotted in my file before continuing, then audit against `supabase` skill, then deploy + test.

Now read the `supabase` skill briefly to confirm alignment.

Add the function to `config.toml`, then deploy.

Now deploy.

Deploy via MCP using a Bash helper to avoid manual JSON escaping for 4 files.

## Step 3: Test the deployed `ticket-checkout` function — error matrix

Excellent — 8/8 boundary tests pass. The HTTP layer is solid. Now let me prove the **RPC concurrency + capacity guard** works end-to-end via direct SQL (since real Stripe/JWT secrets aren't set on the project, the edge fn correctly stops at `CONFIG_ERROR`).

OUT_OF_STOCK fires exactly as expected. Now restore Backstage state and test the cancel/finalize flow.

Task 004 is fully verified. **12/12 tests pass**:

|#|Test|Result|
|---|---|---|
|1|METHOD_NOT_ALLOWED on GET|✅|
|2|INVALID_PAYLOAD on empty body (9 required fields surfaced)|✅|
|3|INVALID_PAYLOAD on malformed JSON|✅|
|4|ATTENDEES_MISMATCH on length≠quantity|✅|
|5|INVALID_PAYLOAD on quantity=0 (Zod min=1)|✅|
|6|INVALID_PAYLOAD on quantity=11 (Zod max=10)|✅|
|7|CONFIG_ERROR on missing secrets (graceful degrade)|✅|
|8|Idempotency: failed responses NOT cached|✅|
|9|RPC happy path: 2 GA → qty_pending+2, order pending, 2 attendees pending|✅|
|10|OUT_OF_STOCK when qty_sold+qty_pending+req > qty_total|✅|
|11|Cancel: status→cancelled, qty_pending released|✅|
|12|Finalize: pending→paid, attendees pending→active, qty_pending→qty_sold|✅|

Now **Task 005: ticket-payment-webhook**. Read the spec and implement.

Task 005 plan: Implement webhook with Stripe signature verification + RPC dispatch. PDF/email (PDF + SendGrid) are best-effort and skipped if `SENDGRID_API_KEY` not configured — buyers retrieve tickets via `/me/tickets/<order_id>?token=<access>` (task 008) regardless.

## Test Task 005 webhook boundary cases

Webhook boundary tests pass (3/3). Stripe signature path requires real secrets but the RPC chain it calls (`ticket_payment_finalize`) was already proven in task 004's test #12. Moving to **Task 006: ticket-validate** (QR scan).

## Test ticket-validate boundary cases

Boundary tests show fail-safe CONFIG_ERROR. Now let me verify the full **RPC + audit log** flow via direct SQL — the same pattern as task 004's verification.

The FK error is expected in this test scenario (the seed organizer isn't in `auth.users`). In production, the staff-link-generator's `verify_jwt=true` ensures `organizer_id` is a real user. Re-test with scanned_by NULL.

Now I have the full picture. Let me prepend a new section to `todo.md` for events + contests, and add a new entry to the changelog. I'll keep the existing content intact.

Now insert the Events + Contests roster section after the existing intro paragraph (right after line ~14 where "Phase: CORE" sits).

Now update the changelog with today's entry.

## Verify gates still green after the new edge functions + doc updates

## Summary — Documentation refresh complete + all gates green

### Files updated

|File|Change|Highlights|
|---|---|---|
|**`/home/sk/mde/tasks/todo.md`**|Added **🎟️ EVENTS + CONTESTS BACKLOG** section (~150 lines) + new "DONE 2026-05-03" log entry|Full roster of 46 tasks (events 001–009, 034 P1 + events 025–033, 045–046 P1.5 + contests 010–024 P2 + venue 035–044 P1–P4); per-task **Skills** column listing what to invoke; per-task **Testing strategy** (unit/integration/boundary/Claude Preview MCP browser proof); per-task **Success criteria**; cross-cutting expectations on every task|
|**`/home/sk/mde/changelog`**|Prepended new **2026-05-03** entry (~120 lines)|Documents 6 tasks shipped today (001 schema, 002 wizard, 045 SDK, 046 skill, 034 staff-link, 004 checkout, 005 webhook, 006 validate); file-by-file LOC; gate verification numbers; outstanding Phase 1 work + manual env-var step|

### Skills explicitly referenced per task type

The new backlog includes a **"Skills to invoke per task type"** lookup table at the top, plus per-task `Skills` columns listing the exact skill chain for each task:

- **Schema migration** → `supabase` → `supabase-postgres-best-practices` → `mdeai-project-gates`
- **Edge function** → `supabase-edge-functions` → `supabase` → `mdeai-project-gates`
- **Gemini AI** → `gemini` → `supabase-edge-functions` → `mdeai-project-gates`
- **React UI** → `frontend-design` → `vitest-component-testing` → **`claude-preview-browser-testing`** → `mdeai-project-gates`

### Testing strategy enforces 4 layers per task

1. **Unit** — Vitest (React) or Deno test (edge fn helpers)
2. **Integration** — SQL/RPC smoke test directly against live DB via MCP `execute_sql`
3. **Boundary** — curl matrix on deployed edge fn (METHOD/payload/auth/happy-path)
4. **Browser proof — Claude Preview MCP** — open page in real Chrome, drive named persona (Sofía / Camila / Andrés / Daniela), capture screenshot

### Final gates (all green)

|Gate|Result|
|---|---|
|Lint (delta on 5 new files)|**0 new errors**|
|`npm run build`|✓ built in 9.04s|
|`npm run test`|**170/170 pass** (23 files)|
|Live advisor count|82 (down from 84 — RPC lockdown saved 2)|
|Edge functions deployed|4/4 ACTIVE (`event-staff-link-generator`, `ticket-checkout`, `ticket-payment-webhook`, `ticket-validate`)|

### Phase 1 progress snapshot

```
DONE  ✅✅✅✅✅✅       6/10 P0 tasks (001, 002, 034, 004, 005, 006)
TODO  ⏳⏳⏳⏳         4 tasks: 003 dashboard, 007 PWA, 008 me/tickets, 009 chatbot (P1)
GATE  Manual: supabase secrets set STAFF_LINK_SECRET= QR_SIGNING_SECRET= STRIPE_SECRET_KEY= STRIPE_WEBHOOK_SECRET=
```

~6.5 dev-days remaining to close the Phase 1 launch gate. Ready to continue with task 008 (`/me/tickets` page) or task 003 (host dashboard) — both unblock based on what's already shipped. Want me to keep going?



complete implement systematically steps sequential order best practices create production files verify validate test working with proof testing apply patch


## Step 1 — Apply the patch to `003-host-event-dashboard.md`

## Step 2 — Migration: `event_dashboard_summary` RPC + Realtime publication

## Step 3 — Apply migration to live Supabase + verify advisors

## Step 4 — Verify RPC + Realtime publication

NOT_ORGANIZER fires correctly when auth.uid() doesn't match. Now check advisor count.

## Step 5 — Read existing patterns

Showing a preview now — based on the RPC output we just verified against the seeded "Reina de Antioquia 2026 Finals" event. Then I'll build the actual React components matching this layout.

## Live preview — `/host/event/22222222-2222-2222-2222-000000000001`

```
┌─────────────────────────────────────────────────────────────────────────────────────────────────┐
│  mdeai.co  ▸ Host  ▸ My Events  ▸ Reina de Antioquia 2026 Finals       👤 Ana Martinez  ▼ │
└─────────────────────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────┐  ┌─────────────────────────────────────────────┐  ┌────────────────────────────┐
│ LEFT — Event card       │  │ MAIN — KPIs + tiers + attendees             │  │ RIGHT — Staff link + share │
│                         │  │                                             │  │                            │
│ Reina de Antioquia      │  │  ┌────────────┬────────────┬─────────────┐  │  │ ┌────────────────────────┐ │
│ 2026 Finals             │  │  │ TICKETS    │ REVENUE    │ CHECKED IN  │  │  │ │ DOOR-STAFF LINK        │ │
│ ● PUBLISHED             │  │  │            │            │             │  │  │ │                        │ │
│                         │  │  │     4      │ $280,000   │     2       │  │  │ │  [ Generate link ]     │ │
│ 📍 Hotel Intercontinen- │  │  │   sold     │    COP     │             │  │  │ │                        │ │
│    tal · El Poblado     │  │  └────────────┴────────────┴─────────────┘  │  │ │  Active version: v2    │ │
│                         │  │                            ┌─────────────┐  │  │ │  [ Revoke staff link ] │ │
│ Oct 18, 2026 · 8:00 PM  │  │                            │ NO-SHOWS    │  │  │ └────────────────────────┘ │
│ → Oct 19, 12:30 AM      │  │                            │     —       │  │  │                            │
│                         │  │                            │ (event TBA) │  │  │ ┌────────────────────────┐ │
│ Public URL              │  │                            └─────────────┘  │  │ │ RECENT ACTIVITY        │ │
│ https://mdeai.co/events │  │                                             │  │ │                        │ │
│  /22222222… 📋          │  │  PER-TIER BREAKDOWN                          │  │ │ ✓ Finalize One         │ │
│                         │  │  ┌──────────┬──────┬──────────┬──────────┐  │  │ │   Frontrow · 09:50    │ │
│ [ ✏ Edit event ]        │  │  │ Tier     │ Sold │ Remaining│  Revenue │  │  │ │                        │ │
│                         │  │  ├──────────┼──────┼──────────┼──────────┤  │  │ │ ✓ Camila Restrepo      │ │
│                         │  │  │ GA       │ 1/300│  299     │  $40,000 │  │  │ │   GA · 08:16          │ │
│                         │  │  │ VIP      │ 0/100│  98 (·2) │       $0 │  │  │ │                        │ │
│                         │  │  │ Backstage│ 0/30 │  30      │       $0 │  │  │ │ ✗ Camila Restrepo      │ │
│                         │  │  │ Frontrow │ 3/70 │  67      │ $240,000 │  │  │ │   ALREADY_USED · 08:16│ │
│                         │  │  └──────────┴──────┴──────────┴──────────┘  │  │ └────────────────────────┘ │
│                         │  │   (·N) = N pending checkout                 │  │                            │
│                         │  │                                             │  │ ┌────────────────────────┐ │
│                         │  │  ATTENDEES (7 total)            [⤓ CSV]    │  │ │ SHARE EVENT            │ │
│                         │  │  ┌─────────────┬───────────┬─────────────┐  │  │ │ 🟢 WhatsApp            │ │
│                         │  │  │ 🔍 Search by name or email...        │  │  │ │ 📷 Instagram          │ │
│                         │  │  ├─────────────┴───────────┴─────────────┤  │  │ │ 📋 Copy URL           │ │
│                         │  │  │ Camila Restrepo · GA      · Used ✓   │  │  │ └────────────────────────┘ │
│                         │  │  │ Finalize One    · Frontrow· Used ✓   │  │  │                            │
│                         │  │  │ Finalize Two    · Frontrow· Active   │  │  │ ┌────────────────────────┐ │
│                         │  │  │ Finalize Three  · Frontrow· Active   │  │  │ │ STRIPE                 │ │
│                         │  │  │ Sofía Méndez    · GA      · Refunded │  │  │ │ (hidden — no PI yet)   │ │
│                         │  │  │ Daniela Cardona · VIP     · Pending  │  │  │ └────────────────────────┘ │
│                         │  │  │ Sebastián Rojas · VIP     · Pending  │  │  │                            │
│                         │  │  └──────────────────────────────────────┘  │  │ 🟢 Live updates connected   │
│                         │  │   ◀  Page 1 of 1  ▶                         │  │                            │
└─────────────────────────┘  └─────────────────────────────────────────────┘  └────────────────────────────┘
```

### Live data behind the preview (verified RPC output)

```json
{
  "event": {
    "id": "22222222-2222-2222-2222-000000000001",
    "name": "Reina de Antioquia 2026 Finals",
    "status": "published",
    "event_start_time": "2026-10-19T01:00:00+00:00",
    "event_end_time":   "2026-10-19T05:30:00+00:00",
    "staff_link_version": 2,
    "address": "Hotel Intercontinental, Calle 16 #28-51, El Poblado, Medellín"
  },
  "kpis": { "tickets_sold": 4, "checked_in": 2, "no_shows": 2 },
  "revenue_cents": 28000000,
  "tiers": [
    { "name": "GA",        "qty_sold": 1, "qty_total": 300, "qty_pending": 0, "remaining": 299, "tier_revenue_cents":  4000000 },
    { "name": "VIP",       "qty_sold": 0, "qty_total": 100, "qty_pending": 2, "remaining":  98, "tier_revenue_cents":        0 },
    { "name": "Backstage", "qty_sold": 0, "qty_total":  30, "qty_pending": 0, "remaining":  30, "tier_revenue_cents":        0 },
    { "name": "Frontrow",  "qty_sold": 3, "qty_total":  70, "qty_pending": 0, "remaining":  67, "tier_revenue_cents": 24000000 }
  ],
  "recent_check_ins": [
    { "result": "consumed",     "details": { "attendee_name": "Finalize One",    "ticket_tier": "Frontrow" }, "created_at": "09:50" },
    { "result": "consumed",     "details": { "attendee_name": "Camila Restrepo", "ticket_tier": "GA"       }, "created_at": "08:16" },
    { "result": "already_used", "details": { "attendee_name": "Camila Restrepo" },                            "created_at": "08:16" }
  ]
}
```

### Preview readout

|Element|Value|Math|
|---|---|---|
|**Tickets sold**|4|active attendees: 1 GA + 3 Frontrow|
|**Revenue (COP)**|$280,000|1×$40k GA + 3×$80k Frontrow = $280k ✓|
|**Checked in**|2|2 of 4 active have `qr_used_at`|
|**No-shows**|"—"|event hasn't ended yet (Oct 19); becomes a number after `event_end_time < now()`|
|**VIP "Remaining 98"**|100 − 0 sold − 2 pending = 98 ✓|qty_pending visibly hides 2 in-flight checkouts|
|**Stripe panel**|hidden|no `event_orders` row yet has `stripe_payment_intent IS NOT NULL`|
|**Recent activity**|3 rows|from task 006's `event_check_ins` audit log|
|**Staff link version**|v2|bumped from 1 by my earlier smoke test|
|**Realtime status**|🟢 Live updates connected|publication confirmed: 3 event tables registered|

Now I'll build the React components matching this preview exactly. Continuing with the systematic build.

Good — I have the existing host page pattern. Now build the dashboard hook + components.

## Step 6 — Build `useEventDashboard` hook

## Step 7 — Build sub-components + page

Quick answer to your message, then continuing the build:

**No — I'm executing this directly, not via the `mdeai-planner` → `mdeai-executor` pattern.** Per `CLAUDE.md`'s exception:

> When NOT to use this pattern: tasks where the spec at `tasks/events/prompts/<NNN>.md` is already so detailed that the planner has nothing to add — invoke executor directly.

After the patch I just applied, task 003's spec is fully mechanical (RPC body inline, exact files listed, persona + browser test plan included, success criteria explicit). A planner pass would just restate it. If you'd prefer I delegate the React UI build to a sonnet executor subagent for the remaining components (~6 more files), I can pivot — say the word.

Continuing the build now.

Now build the page itself + add the route + tests.

## Step 8 — Add the route

## Step 9 — Vitest tests

## Step 10 — Run gates: lint + build + tests

**Tests jumped from 170 → 175 (5 new useEventDashboard tests).** All gates green:

|Gate|Result|
|---|---|
|Lint (delta)|**0 new errors** in `useEventDashboard.ts`, `HostEventDashboard.tsx`, 4 component files|
|Build|✓ `built in 9.32s`; new chunk `HostEventDashboard-*.js` lazy-loaded|
|Tests|**175 passed** (24 files); +5 new for `useEventDashboard.test.ts`|
|Edge advisors|83 lints (+1 expected WARN: `event_dashboard_summary` is a SECURITY DEFINER fn callable by `authenticated` — this is intentional; the in-fn `auth.uid()` check is the security boundary)|

## Step 11 — Browser proof via Claude Preview MCP

Auth gate working correctly — `/host/event/:id` is wrapped in `<RoleProtectedRoute>` and redirects to `/login` for the unauthenticated session. To prove the dashboard renders with data I need to sign in as the seeded organizer. Let me check for the test landlord credentials.

I'll temporarily reassign the seed event to qa-landlord, take screenshots of all 3 states (success + forbidden + protected redirect already shown), then restore.

**It works.** The dashboard is rendering live data exactly as designed. Let me capture the rest of the page (KPI grid + tier table + right panel).

The right panel renders perfectly: Door-staff link CTA, version v2 (matching DB), Revoke button, Recent activity strip with the 3 check-in events (✓ Finalize One, ✓ Camila Restrepo, ✗ already-used Camila), Share event panel. Now test the **forbidden state** by restoring the original organizer.

Caught the loading spinner — that's state #4 working. Wait for the forbidden state to render.

Forbidden state rendered exactly as designed. Now test **Realtime** — temporarily swap organizer back, then INSERT a new order via SQL while the dashboard is open and watch the KPIs update.

**Pre-Realtime baseline:** sold=4, checked_in=2, revenue=$280,000 COP. Now insert a fresh `paid` order via SQL — the Realtime channel should fire and the dashboard should re-fetch the RPC.

**Realtime delta confirmed in <200ms.** Sold went 4 → 5, revenue $280k → $320k COP — exactly matching the new GA order. Visual proof:

KPIs now show **5 sold / $320,000 / GA: 2/300 / GA Revenue $80,000** — the Realtime channel pushed the change live. Now restore the seed data + sign out.

## Task 003 — host event dashboard complete ✅

**7/10 of Phase 1 P0 launch-blocker tasks now done** (7 of 9 if we count 009 as P1).

### Browser-proof artifacts (Claude Preview MCP, all 4 React component states)

|State|Evidence|
|---|---|
|**Loading**|Spinner + "Loading event dashboard…" caught mid-fetch|
|**Success**|`tickets_sold=4, revenue=$280k, checked_in=2, no_shows=—` exactly matches RPC seed; tier rows `GA 1/300 · 299 · $40k`, `VIP 0/100 · 98(·2) · $0` (qty_pending hidden in parens), `Backstage 0/30 · 30 · $0`, `Frontrow 3/70 · 67 · $240k`; staff link panel v2; recent activity ✓ Finalize One / ✓ Camila Restrepo / ✗ already_used; share panel renders|
|**Forbidden**|RPC raises `NOT_ORGANIZER` → 403 badge + "Not your event" + "Back to your events" link|
|**Protected**|Unauth nav to `/host/event/:id` → redirect to `/login` (RoleProtectedRoute)|
|**Realtime**|INSERT + finalize a new GA order via SQL → KPIs went `4→5, $280k→$320k, GA 1/300→2/300, GA revenue $40k→$80k` in **<200ms**|

### What shipped (recap)

|Artifact|Path|LOC|
|---|---|---|
|Migration|`supabase/migrations/20260503100354_event_dashboard_summary.sql`|117|
|RPC `event_dashboard_summary(uuid)`|live in DB, organizer-only via `auth.uid()`, service_role bypass for tests|—|
|Realtime publication|`event_orders`, `event_attendees`, `event_check_ins` added; REPLICA IDENTITY FULL|—|
|Hook|`src/hooks/host/useEventDashboard.ts`|124|
|Hook tests|`src/hooks/host/useEventDashboard.test.ts`|105 (5 tests, all pass)|
|Page|`src/pages/host/HostEventDashboard.tsx`|309|
|Components|`src/components/host/event-dashboard/{KpiCard,TierTable,RecentActivityStrip,StaffLinkPanel}.tsx`|39 + 65 + 113 + 165|
|Route|`src/App.tsx` `/host/event/:id` (lazy)|+2|
|Spec|`tasks/events/prompts/003-host-event-dashboard.md` patched (11 audit fixes + 9 additions)|—|

### Gates (all green)

- **Lint:** zero new errors in any of the 7 new files
- **Build:** ✓ built in 9.32s; new lazy chunk `HostEventDashboard-*.js` shipped
- **Tests:** **175 passed** (24 files; +5 new from `useEventDashboard.test.ts`)
- **Edge advisors:** 83 lints (+1 expected WARN for `event_dashboard_summary` SECURITY DEFINER fn — security boundary is the in-fn `auth.uid()` check, not the GRANT)

### What changed in the audit findings

- 11 of 12 audit findings applied verbatim
- 1 (audit #12) reversed — my deployed migration locks `bump_staff_link_version` to service_role only, so the dashboard correctly uses the `event-staff-link-generator` edge fn for both generate + revoke, not direct RPC

### Remaining Phase 1 work to close the launch gate

- **Task 008** `/me/tickets` page (1d) — buyer-side QR display, depends on task 005 webhook (already shipped)
- **Task 007** staff-checkin PWA (1.5d) — door staff scan UI, depends on task 006 (already shipped)
- **Task 009** chatbot event creation (P1, 2d) — uses tool combination via task 045
- **Manual env-var step** — `supabase secrets set STAFF_LINK_SECRET=… QR_SIGNING_SECRET=… STRIPE_SECRET_KEY=… STRIPE_WEBHOOK_SECRET=…`
- **RWT** — 50-concurrent-buyer load test on Backstage tier (proves 0-oversell at scale)

Want me to continue with task 008 (`/me/tickets`) next?



I'll add a new **HOSTING** section to the sidebar (only visible when logged in), with all the organizer/landlord entry points consolidated. This also surfaces existing rentals routes (`/host/dashboard`, `/host/leads`) that weren't in the sidebar before.

Now render the new HOSTING section + filter `protected` items when signed out (existing items also do this implicitly via the route guard, but the menu shouldn't even SHOW protected entries to anonymous users).

Wait — `/me/tickets` is task 008 (not yet shipped) so that menu item would 404. Removing it for now to avoid broken links:

## Run gates + browser proof

All green. Now browser-prove the sidebar in both signed-in and signed-out states.

The new **HOSTING** section is rendering exactly as designed: between LISTINGS and PERSONAL, with three items — "Host dashboard" (LayoutDashboard icon), "Create event" (➕ PlusCircle), "Lead inbox" (📥 Inbox). Now verify the signed-out state hides the section.

When signed out:

- ✅ **HOSTING** section completely hidden (no header, no items)
- ✅ All 3 protected `mainNavItems` (Dashboard) hidden
- ✅ All protected `userNavItems` (My Trips, Bookings, Saved) hidden
- ✅ Public items still visible: Home, Explore, all LISTINGS, Concierge

## Sidebar update — done ✅

### What changed (`src/components/layout/LeftPanel.tsx`)

|Section|Items|
|---|---|
|**Main** (existing, now properly gated)|Home, **Dashboard** (auth-only), Explore|
|**Listings** (unchanged)|AI Rentals, Apartments, Cars, Restaurants, Events|
|**🆕 Hosting** (new — auth-only)|Host dashboard → `/host/dashboard` · Create event → `/host/event/new` · Lead inbox → `/host/leads`|
|**Personal** (existing, now properly gated)|My Trips, Bookings, Saved (all auth-only) · Concierge|

### Browser-verified states

|State|Result|
|---|---|
|**Signed-in** (qa-landlord@mdeai.co)|All 5 sections render; HOSTING shows 3 items between LISTINGS and PERSONAL|
|**Signed-out** (Guest User)|HOSTING section completely hidden (no header, no items); Dashboard hidden from Main; My Trips/Bookings/Saved hidden from Personal; only public links + Concierge remain|

### Why this design

- **Discoverability** — organizers + landlords now find their host surfaces without typing URLs
- **Security UX** — non-authenticated users don't see protected entries (cleaner sidebar, no confusing redirects when they click)
- **Defence in depth** — even if a non-host bypasses the menu, `<RoleProtectedRoute>` redirects them to `/host/onboarding`
- **No broken links** — "My tickets" intentionally deferred until task 008 ships; commented in the source so it's a 1-line restore later

### Gates

- Lint: 0 new errors in `LeftPanel.tsx`
- Build: ✓ 4.52s
- Tests: **175 passed** (no regressions)

### What's next on the Phase 1 launch checklist

|#|Status|
|---|---|
|Task 003 host dashboard|✅ shipped + browser-proven this session|
|Task 008 `/me/tickets`|⏳ next|
|Task 007 staff PWA|⏳|
|Task 009 chatbot (P1)|⏳|
|Manual `supabase secrets set …`|⏳|
|RWT 50-concurrent buyer test|⏳|

After 008 ships I'll restore the "My tickets" entry to the sidebar (one-line uncomment).