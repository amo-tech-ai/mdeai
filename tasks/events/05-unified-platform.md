# Unified events + contests + sponsorship platform — implementation plan

> **BLUF:** A single product that adds an **event layer** (`event.*` — discovery, tickets, venues, schedule) on top of the existing voting (`vote.*`) and sponsorship (`sponsor.*`) layers. Events host contests; tickets unlock free votes; sponsors activate at event / contest / contestant levels with one schema. The integration is two columns and three foreign keys — not a rewrite. Every cross-module flow already works because `vote.*`, `growth.*`, and `sponsor.*` were designed to attach to a parent `event_id`.

**Goal.** Let organizers run real events (festivals, finals nights, restaurant weeks) where contests are part of the event, ticket holders vote with privileges, and sponsors buy across the whole bundle in one transaction.

**User stories.**

> *As a traveler, I open `/explore`, see "Feria de las Flores 2026" trending, buy a $40 GA ticket, and immediately get 5 free votes for "Best Silletero". On the festival day I scan a QR at the venue, cast my votes, see the live leaderboard on my phone, and get a "thanks for voting" Story sticker my friends can re-share.*

> *As an organizer, I create "Estéreo Picnic 2026" in `/host/event/new`, add 4 contests inside (Best DJ, Best Stage, Best Outfit, Crowd Favorite), define 3 ticket tiers with inventory, and approve 12 sponsors across event-level and contest-level placements — all from one dashboard.*

> *As Postobón's brand manager, I buy a Premium event-level sponsorship of "Feria de las Flores" for $25k. My logo lands on the event hero, the ticket-purchase email, every contest leaderboard inside the festival, and every WhatsApp broadcast OpenClaw fires during the 10-day window. ROI dashboard rolls up across all surfaces.*

**Approach.** Add `event.*` schema with 5 tables. Add nullable `event_id` columns to `vote.contests` and `sponsor.applications`. Reuse Stripe (`p1_payments`), Storage, Realtime, OpenClaw, and Gemini exactly as wired in the prior three plans. The integration is plumbing, not architecture.

**Stack.** Vite/React + Supabase (`event.*` + existing schemas) + Stripe Connect (organizer payouts) + Supabase Storage (QR codes, programs) + Gemini 3.x + OpenClaw (broadcasts now event-aware).

---

## 1. System overview — how the three modules connect

```
                ┌───────────────────────────────────────────┐
                │            event.events (NEW)              │
                │  Festival, Finals night, Restaurant Week    │
                └────────┬─────────────────────────┬────────┘
                         │ 1:N                     │ 1:N
                         ▼                         ▼
              ┌──────────────────┐      ┌──────────────────────┐
              │  vote.contests    │      │  sponsor.applications  │
              │  (event_id NEW)   │      │  (event_id NEW)        │
              └─────────┬─────────┘      └──────────┬─────────────┘
                        │ 1:N                       │ 1:N
                        ▼                           ▼
              ┌──────────────────┐      ┌──────────────────────┐
              │  vote.entities    │      │  sponsor.placements    │
              │  contestants/     │      │  surface=event_hero,   │
              │  restaurants      │      │  contest_header,       │
              └──────────────────┘      │  ticket_email, …       │
                                        └──────────────────────┘
                ▲
                │ 1:N
                │
         ┌─────────────────┐
         │ event.tickets   │  GA / VIP / Backstage
         └────────┬────────┘
                  │ N:1 → auth.users
                  ▼
         ┌─────────────────┐         ┌─────────────────────┐
         │ event.bookings  │ ──────→ │ unlocks free votes  │
         │ (with QR code)  │         │ in vote.contests    │
         └─────────────────┘         └─────────────────────┘
```

**The three rules of integration:**

1. **Events host contests** — a contest may belong to one event (`event_id NOT NULL`) or stand alone (`event_id NULL`). Both shapes work.
2. **Tickets unlock votes** — buying a ticket grants `bonus_votes` for that event's contests. Enforced by edge fn, not client.
3. **Sponsors attach at any level** — event, contest, category, contestant, venue. One `sponsor.applications` row, one Stripe charge.

**Value proposition:**

| For travelers | For organizers | For sponsors |
|---|---|---|
| One app to find it, attend it, vote in it, share it | Run end-to-end (tickets + contests + sponsors) without duct-taping Eventbrite + a voting plugin + a sponsor PDF | Buy across the whole bundle in one transaction with one ROI dashboard |

---

## 2. Core modules

### 2.1 Event system (NEW — this doc)

`event.*` schema, covered in §8 below. Capabilities:
- Organizer creates events from `/host/event/new` (PWA-friendly wizard).
- Public discovery on `/explore` — already exists in mdeai; extend to surface `event.events`.
- Ticketing: GA/VIP/Backstage tiers with inventory, Stripe Checkout, QR-code emails.
- Venues: reuse mdeai's existing `restaurants` / `apartments` / new `event.venues` for non-mdeai locations.
- Schedule: per-day timetable rendered on event detail page.
- Calendar export: ICS via edge fn.

### 2.2 Contest / voting system (EXISTING — `01-contests.md`)

No changes to behavior. One additive column: `vote.contests.event_id`. Multi-category contests, free + paid + judge votes, real-time leaderboard, anti-fraud — all unchanged. See [`01-contests.md`](./01-contests.md).

### 2.3 Sponsorship system (EXISTING — `03-sponsorship-system.md`)

No changes to behavior. Two additive columns: `sponsor.applications.event_id`, `sponsor.placements.surface` enum gains `event_hero`, `event_ticket_email`, `event_program_pdf`, `event_qr_station`. Pricing tiers gain "event-level" packages. See [`03-sponsorship-system.md`](./03-sponsorship-system.md).

---

## 3. Integration (the 90% that already works for free)

| Integration point | How it works | Where it lives |
|---|---|---|
| **Events host contests** | `vote.contests.event_id` FK. Detail page renders a `<ContestsAtEvent />` component reading by `event_id` | `src/pages/events/EventDetail.tsx` |
| **Sponsors attach to events** | `sponsor.applications.event_id` + new placement surfaces | `src/pages/sponsor/Apply.tsx` step 2 picker |
| **Sponsors attach to contests embedded in events** | Existing `sponsor.applications.contest_id` works — show parent event in admin UI | `src/pages/admin/Sponsorships.tsx` |
| **Sponsors attach to contestants** | Existing `sponsor.applications.entity_id` — unchanged | unchanged |
| **Tickets grant bonus votes** | `event.bookings.bonus_votes_remaining` decrements on each `vote-cast` from that user for an `event_id` contest | `vote-cast` edge fn extension |
| **Voting drives sponsor exposure** | Every contest page already renders `<SponsoredSurface>`; in event mode, also renders the event-level sponsor strip | `<EventSponsorStrip />` |
| **Events amplify contests** | OpenClaw broadcasts now carry event context + countdown ("3 days left at Feria de las Flores") | Workflow C extension in [`02-openclaw-growth.md`](./02-openclaw-growth.md) |
| **Ticket emails carry sponsor logo** | `sponsor.placements.surface='event_ticket_email'` rendered in the React Email template | edge fn `send-ticket-email` |
| **Venue is the QR station** | If `event.events.venue_id` matches a `sponsor.placements.surface='event_qr_station'`, the QR station landing page co-brands | `/v/:placementId` route extends |
| **Trending events on /explore** | Same pgvector + behavior re-rank used for contests; type filter `kind='event'` | `useExplorePlaces` extension |

The whole point of this design: **integration is configuration, not engineering**. After the migration, an organizer can attach a contest to an event in one click; a sponsor can buy across the whole event in one Stripe Checkout.

---

## 4. User flows

### 4.1 Traveler / voter

```
1. /explore              → sees "Feria de las Flores 2026" trending card
2. /event/feria-2026     → reads bio, buys $40 GA ticket via Stripe Checkout
3. confirmation email     → carries QR code + Postobón logo + "5 free votes"
4. mobile PWA install     → one-tap home screen icon
5. festival day           → scans QR at venue → unlocks event mode
6. /event/feria-2026/vote → 4 contests visible, 1-tap voting per category
7. realtime leaderboard   → ticks live as friends vote
8. share modal            → "I voted in Best Silletero — get 3 bonus votes"
9. push notif             → "Voting closes in 1 hour"
10. winner reveal          → gemini-generated congrats card auto-shared to user's IG Story (with sponsor logo)
```

### 4.2 Organizer

```
1. /host/event/new        → 6-step wizard (basics → venue → tickets → schedule → contests → sponsors)
2. add contests             → reuses /host/contest/new flow with event_id pre-filled
3. ticket inventory         → set GA $40 × 1000, VIP $120 × 200, Backstage $400 × 30
4. invite judges            → magic-link email to scoring panel for each contest
5. publish                   → status flips to live; sponsors can apply
6. /host/event/:id/dashboard → real-time tiles: tickets sold, votes cast, sponsor revenue, attendance scans
7. settle payouts           → Stripe Connect transfers organizer share weekly
8. post-event              → AI-generated recap PDF + social posts
```

### 4.3 Sponsor

```
1. /sponsor/apply         → wizard step 1: pick event OR contest (NEW: event option)
2. tier picker             → event-level ($25k Premium / $10k Gold / $4k Silver / $1k Bronze)
                                          OR
                            contest-level (existing tiers from 03-sponsorship-system.md)
3. asset upload            → logo, video, color, UTM destination
4. pay via Stripe          → instant on Bronze/Silver; sales call on Gold/Premium
5. admin approval          → 24h SLA
6. assets go live          → at start_at across all configured surfaces
7. /sponsor/dashboard/:id → live ROI tiles + Gemini insight + creative gallery
8. post-event              → PDF + CSV + invoice + "promote your win" social asset
```

---

## 5. AI system (unified across modules)

All five capabilities call existing Gemini infrastructure. Every call logs to `ai_runs`. **Gemini-only** — adding Claude doubles secrets and observability with no quality gain (see CLAUDE.md `ai-chat` model assignments).

| Capability | Models | Pattern |
|---|---|---|
| **Recommendation engine** | `text-embedding-004` + behavior re-rank | Single endpoint `POST /recommend?type=event|contest|entity`. Embed events/contests/entities once; embed user's last-N actions; cosine search; re-rank by recency, diversity, and city match. |
| **Engagement engine** | `gemini-3-flash-preview` | "Trending now" computed every 5 min from `event.bookings`, `vote.votes`, `sponsor.clicks` deltas. Smart notifications: Gemini decides what + when (caps 2/day/user, never during sleep hours). |
| **Fraud detection** | `gemini-3-flash-preview` | Two scopes: vote fraud (existing — see `01-contests.md`) and ticket fraud (NEW — duplicate QR scans, mismatched device fingerprints). Same `fraud-scan` cron extended with ticket signals. |
| **Sponsor optimizer** | `gemini-3.1-pro-preview` | Now scopes across events + contests — "shift weight from ticket_email to leaderboard_footer; expected +12% CTR." Reasoning model because trade-offs are non-obvious. |
| **Content generator** | `gemini-3.1-pro-preview` | Event promos, contestant highlights, ticket copy, sponsor creatives, recap reels — all behind one `POST /content-gen` edge fn with a `kind` param. |

### One critical AI rule

**AI proposes, never auto-applies** — per [`ai-interaction-patterns.md`](../../.claude/rules/ai-interaction-patterns.md). Every recommendation surfaces in an admin/sponsor/organizer UI as a one-click apply. Never silent.

---

## 6. Monetization system

### Revenue streams

| Stream | Who pays | Platform take | Organizer take |
|---|---|---|---|
| **Ticket sales** | Attendees | 5% + Stripe fees | 95% via Stripe Connect |
| **Paid voter votes** | Voters | 20% | 80% |
| **Sponsorship — flat tiers** | Sponsors | 30% (50% if mdeai sourced the sponsor) | 70% |
| **Sponsorship — performance (CPL/CPA)** | Sponsors | 30% on top of CPL spend | 70% |
| **Featured event placement on /explore** | Organizers (self-service) | $50/day flat | n/a |
| **AI add-ons (recap reel, creative gen quotas)** | Organizers (optional) | $99/contest, $299/event, $999/festival | n/a |
| **Affiliate (mdeai's existing restaurant/apartment partners)** | Brands | 10% of conversions | n/a |

### Pricing strategy

- **Tickets**: organizer sets price; platform fee transparent at checkout ("$2 service fee" under $40 GA).
- **Free votes**: 1/day/contest baseline; ticket holders +5 bonus per ticket; share-modal +3 bonus.
- **Paid votes**: $1/vote default; organizer can configure per contest.
- **Sponsorships**: $500–$25k+ flat; CPL $0.10–$0.50/vote; CPA negotiated.
- **Featured**: $50/day on /explore — capped 3 slots/day to preserve organic discovery.

**Break-even per event:**
- Small contest (1k votes, no event): organizer earnings ~$200, mdeai ~$50.
- Mid event (500 tickets × $40, 5k votes, $5k sponsorship): organizer ~$24k, mdeai ~$2.6k.
- Festival (5k tickets × $50, 50k votes, $50k sponsorship): organizer ~$280k, mdeai ~$25k.

---

## 7. Multi-channel strategy

| Channel | Event | Contest | Sponsor exposure |
|---|---|---|---|
| **Web** | `/explore` + `/event/:slug` + `/event/:slug/vote` | Embedded contest pages | All `<SponsoredSurface>` rules |
| **Mobile (PWA)** | Push: "Tickets dropping in 1h", "Doors open" | Push: "Voting closes" | "Sponsored by X — vote now" |
| **Instagram / TikTok** | Event flyers via Post Bridge; ticket-link in bio | Daily contestant Reels | Sponsor logo bug bottom-right (FTC #ad) |
| **WhatsApp Communities** | Daily countdown + ticket link | Leaderboard every 4h | Watermark on every screenshot |
| **WhatsApp DM (Twilio)** | Ticket QR code + reminders | Reply "1/2/3" to vote | Footer "Patrocinado por X" |
| **Email** | Ticket confirmations + post-event recap | Voting reminders | Hero strip in every email |
| **Influencer** | Event partnerships via `growth.*` | Tracked `?ref=` votes | Co-branded campaigns (Premium tier) |
| **In-venue physical** | Wristbands, signage, MC scripts | QR voting stations | Branded QR landing pages |

### Viral loops we wire on day one

1. **Ticket → Share** — buy a ticket → share modal "Tag 3 friends, get 5 bonus votes."
2. **Vote → Share** — cast a vote → "I voted for Laura — vote with me [link]."
3. **Win → Share** — your candidate wins → auto-generated congrats Story w/ sponsor logo (FTC compliant).
4. **Influencer → Tracked link** — partner gets `?ref=` link, Stripe Connect 1% of paid-vote revenue.
5. **Referral leaderboard** — top 10 referrers get free Premium tickets to next event.

---

## 8. Tech architecture — `event.*` schema

```sql
CREATE SCHEMA IF NOT EXISTS event;

-- Top-level event entity. May or may not contain contests.
CREATE TABLE event.events (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug            text UNIQUE NOT NULL,
  organizer_id    uuid NOT NULL REFERENCES public.profiles(id),
  kind            text NOT NULL CHECK (kind IN ('festival','conference','nightlife','sports','restaurant_week','pageant_finals','other')),
  title           text NOT NULL,
  description     text,
  hero_url        text,
  city            text NOT NULL DEFAULT 'Medellín',
  starts_at       timestamptz NOT NULL,
  ends_at         timestamptz NOT NULL,
  timezone        text NOT NULL DEFAULT 'America/Bogota',
  venue_id        uuid REFERENCES event.venues(id),
  status          text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','published','live','closed','cancelled','archived')),
  embedding       vector(768),                     -- for /explore recommendations
  total_capacity  int,                              -- nullable; computed from sum(tickets.qty) if null
  created_at      timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ON event.events (status, starts_at) WHERE status IN ('published','live');
CREATE INDEX ON event.events USING ivfflat (embedding vector_cosine_ops);

-- Venues — separate from mdeai's apartments/restaurants because some venues are
-- external (clubs, parks, convention centers). Reuse via type='restaurant' + restaurant_id link.
CREATE TABLE event.venues (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name            text NOT NULL,
  type            text NOT NULL CHECK (type IN ('restaurant','club','conference_center','park','stadium','street','other')),
  restaurant_id   uuid REFERENCES public.restaurants(id),  -- nullable: link to mdeai restaurants
  address         text NOT NULL,
  lat             double precision,
  lng             double precision,
  capacity        int,
  contact_email   text,
  contact_whatsapp text,
  amenities       text[],                                  -- ['parking','bar','accessible']
  hero_url        text,
  created_at      timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ON event.venues (type);

-- Ticket types per event (GA, VIP, Backstage, etc.)
CREATE TABLE event.tickets (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id            uuid NOT NULL REFERENCES event.events(id) ON DELETE CASCADE,
  name                text NOT NULL,                       -- 'GA','VIP','Backstage'
  description         text,
  price_cents         int NOT NULL CHECK (price_cents >= 0),
  qty_total           int NOT NULL CHECK (qty_total > 0),
  qty_sold            int NOT NULL DEFAULT 0,
  bonus_votes         int NOT NULL DEFAULT 0,              -- free votes granted per ticket
  sale_starts_at      timestamptz,
  sale_ends_at        timestamptz,
  is_active           bool NOT NULL DEFAULT true,
  position            int NOT NULL DEFAULT 0,
  CHECK (qty_sold <= qty_total)
);
CREATE INDEX ON event.tickets (event_id) WHERE is_active = true;

-- One row per ticket purchased
CREATE TABLE event.bookings (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id            uuid NOT NULL REFERENCES event.events(id),
  ticket_id           uuid NOT NULL REFERENCES event.tickets(id),
  user_id             uuid NOT NULL REFERENCES auth.users(id),
  qty                 int NOT NULL CHECK (qty > 0),
  amount_cents        int NOT NULL,
  payment_id          uuid REFERENCES public.p1_payments(id),
  qr_token            text NOT NULL UNIQUE,                -- single-use server-signed token
  qr_used_at          timestamptz,                          -- nullable until first scan
  bonus_votes_remaining int NOT NULL DEFAULT 0,             -- decrements per vote
  status              text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','paid','refunded','cancelled','attended')),
  created_at          timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX ON event.bookings (qr_token);
CREATE INDEX ON event.bookings (user_id, event_id);
CREATE INDEX ON event.bookings (event_id, status);

-- Per-day schedule (concert sets, judging rounds, finale, etc.)
CREATE TABLE event.schedule_items (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id        uuid NOT NULL REFERENCES event.events(id) ON DELETE CASCADE,
  starts_at       timestamptz NOT NULL,
  ends_at         timestamptz NOT NULL,
  title           text NOT NULL,
  description     text,
  location_in_venue text,                              -- 'Main Stage','Side Hall'
  kind            text NOT NULL CHECK (kind IN ('performance','judging','finale','meet_greet','meal','workshop','other')),
  contest_id      uuid REFERENCES vote.contests(id),    -- nullable: when this slot IS a contest moment
  position        int NOT NULL DEFAULT 0
);
CREATE INDEX ON event.schedule_items (event_id, starts_at);
```

### Cross-schema additive columns

```sql
ALTER TABLE vote.contests ADD COLUMN event_id uuid REFERENCES event.events(id);
CREATE INDEX ON vote.contests (event_id) WHERE event_id IS NOT NULL;

ALTER TABLE sponsor.applications ADD COLUMN event_id uuid REFERENCES event.events(id);
ALTER TABLE sponsor.applications ADD CONSTRAINT applications_target_chk
  CHECK (
    (activation_type IN ('title_naming','category_powered_by','contestant_sponsor','digital') AND contest_id IS NOT NULL) OR
    (activation_type = 'venue_sponsor' AND event_id IS NOT NULL)
  );
ALTER TABLE sponsor.placements
  ADD CONSTRAINT placements_surface_chk CHECK (surface IN (
    'contest_header','category_header','leaderboard_footer','contestant_profile',
    'wa_broadcast','qr_station','push_notif','social_post','digital_banner',
    'event_hero','event_ticket_email','event_program_pdf','event_qr_station'  -- NEW
  ));
```

### RLS one-liners (event.*)

| Table | Public SELECT | Authenticated INSERT/UPDATE | Service-role |
|---|---|---|---|
| `events` | published+live | own row (organizer) | admin actions |
| `venues` | all | own venues; admin moderation | reseed |
| `tickets` | active+published | own event's | reconcile |
| `bookings` | — | own bookings; SELECT own | edge fn writes |
| `schedule_items` | published events | own event's | — |

### Edge functions (events module)

| Endpoint | Purpose | Rate limit |
|---|---|---|
| `POST /event-create` | Organizer creates event | 6/min/user |
| `POST /event-publish` | Flip status `draft → published` after validation | 6/min/user |
| `POST /ticket-checkout` | Stripe Checkout for ticket purchase, atomic qty decrement | 30/min/IP |
| `POST /ticket-payment-webhook` | Stripe webhook → mark booking paid → mint QR token → email | n/a |
| `GET  /ticket-validate?token=…` | Venue gate scan: validates + marks `qr_used_at` | 60/min/scanner |
| `POST /vote-cast` (extended) | Existing voting fn — now decrements `bonus_votes_remaining` if event ticket exists | 10/min/user |
| `GET  /event-recap?event=…` | Generate post-event PDF + social posts (Gemini) | 6/hour/event |
| `POST /event-share` | Generate IG Story sticker for event/contest share | 30/min/user |

### Real-time updates

Three Supabase Realtime channels per event:
- `event:<slug>:tickets` — qty_sold deltas (countdown urgency UX)
- `event:<slug>:leaderboard` — fan-out from existing `vote.entity_tally`
- `event:<slug>:sponsor_metrics` — for organizer dashboard tiles

---

## 9. Analytics & ROI

### Organizer dashboard at `/host/event/:id/dashboard`

Real-time tiles (Realtime channel `event:<slug>:dashboard`):

| Tile | Source |
|---|---|
| Tickets sold today / 7d / total / capacity | `event.bookings WHERE status='paid'` |
| Revenue gross / net (after fees) | `event.bookings.amount_cents` × split |
| Attendance % | `count(qr_used_at IS NOT NULL) / count(*)` |
| Votes cast today / total | `vote.votes` joined via `vote.contests.event_id` |
| Sponsor revenue | `sum(sponsor.invoices.amount_cents WHERE event_id)` |
| Top contests by engagement | `vote.entity_tally GROUP BY contest_id ORDER BY weighted_total` |
| Geographic split of attendees | `event.bookings.user_id` joined to `profiles.city` |
| Push notif opens / shares | `notifications` table |
| AI insight (today) | `gemini` `event-insight` cron output |

**Export:** PDF + CSV via `react-pdf` to Storage. Post-event auto-generated recap deck (16:9 PDF, ready to share with sponsors).

### Sponsor dashboard (extended from `03-sponsorship-system.md`)

The existing dashboard already aggregates per `application_id`. For event-level sponsorships, we add:
- **Cross-surface rollup** — single CTR across all 5+ placement surfaces.
- **Per-contest breakdown** — which contest inside the festival drove the most attribution.
- **Attendance correlation** — did sponsored push notifs lift ticket sales? (`event.bookings` joined to `sponsor.attributions`).
- **Audience overlap** — Gemini computes which sponsor audience overlapped the most with which contest's voters; useful for next-festival planning.

---

## 10. Risks + solutions

| Risk | Likelihood | Mitigation |
|---|---|---|
| **Vote manipulation (existing risk amplified by event-scale traffic)** | High during finals nights | Existing 5-layer fraud strategy from `01-contests.md` + ticket-bound voter identity (event mode trusts ticket-holder votes more) |
| **Ticket fraud (duplicate QR scans, screenshots)** | Medium | Server-signed single-use tokens; `qr_used_at` flips on first valid scan; second scan returns "already used"; physical wristband as second factor for VIP |
| **Low engagement (event published, nobody votes)** | Medium | OpenClaw cron auto-broadcasts countdown; AI-recommended push notifs; ticket holders get +5 bonus votes (vote-loss aversion) |
| **Sponsor ROI underdelivers** | Medium | CPL pricing as default for new sponsors (they pay for outcomes); brand-safety auto-pause; daily Gemini insight + one-click apply recommendations |
| **Stripe payout disputes (organizer claims more than they earned)** | Low | Stripe Connect with delayed transfer (T+7 after event); dispute window before payout |
| **Platform scaling at finals night (1M req/min)** | Medium | Materialized `vote.entity_tally` (already designed); Realtime channel fan-out; Vercel edge for static; Supabase read replicas for tally reads (Phase 3) |
| **GDPR / Habeas Data — ticket emails + voter PII** | Medium | RLS strict on all PII tables; clear deletion path in `/account/data`; DPA on file with all third parties |
| **Organizer cancels event → refund storm** | Low | Stripe refund automation per `event.events.status = 'cancelled'`; full refund minus 1% processing |
| **Sponsor logo next to controversial contestant** | Medium | Brand-safety guardrail (auto-pause near fraud spike or judge controversy); contract clause |
| **Ticket scalping** | Low–Medium | Resale only via platform marketplace (Phase 3); face-value cap; one ticket per user for hyper-demand events |

---

## 11. MVP → Scale roadmap (events-specific — see [`04-roadmap.md`](./04-roadmap.md) for combined)

### MVP — Week 1–3

- [ ] `event.*` migration with all 5 tables + RLS + FK indexes.
- [ ] Cross-schema `ALTER` adding `event_id` to `vote.contests` and `sponsor.applications`.
- [ ] `/host/event/new` 6-step wizard.
- [ ] `/event/:slug` public detail page.
- [ ] Stripe Checkout for tickets via `ticket-checkout` edge fn + atomic qty decrement.
- [ ] `ticket-payment-webhook` mints QR token + sends email (reuse mdeai email templates).
- [ ] `ticket-validate` endpoint for venue gate scans.
- [ ] `/explore` extended to surface events alongside places.

**Done when:** One real organizer creates one event, sells 50 tickets, scans them at the door, and the event mode unlocks bonus votes for one embedded contest.

### Growth — Week 4–8

- [ ] `event.schedule_items` + per-day timetable UI.
- [ ] Stripe Connect for organizer payouts (T+7 delayed transfer).
- [ ] OpenClaw broadcast extension (event-aware countdown + leaderboard).
- [ ] Sponsor event-level placements (`event_hero`, `event_ticket_email`, `event_program_pdf`, `event_qr_station`).
- [ ] Organizer dashboard with Realtime tiles.
- [ ] Featured events on `/explore` (paid placement).
- [ ] Calendar export (ICS).
- [ ] AI recap generator (post-event PDF + social posts).

**Done when:** One festival with 3 contests + 5 sponsors runs end-to-end with no engineering hand-holding; organizer sees daily ROI tiles; sponsors see cross-surface attribution.

### Scale — Month 3+

- [ ] Recurring events (weekly restaurant nights, monthly pageants).
- [ ] Ticket marketplace (resale at face-value cap).
- [ ] Multi-day festival mode with parallel contests in different categories.
- [ ] Live-stream integration (HLS player + chat).
- [ ] AR-aware QR voting (camera scan → AR overlay shows current leaderboard at venue).
- [ ] Multi-organizer revenue sharing (co-hosted events).
- [ ] AI-powered event recommendations across cities (when mdeai expands).

---

## 12. Real-world walkthroughs

### 12.1 Beauty pageant — "Reina de Antioquia 2026" inside "Feria de las Flores"

**Setup.** Organizer creates `event:feria-flores-2026` with `kind='festival'`, 10-day window, venue = "Pueblito Paisa park". Inside the event, 4 contests: Reina de Antioquia, Best Silletero, Best Float, Best Caballero. Tickets: GA $40 × 5,000, VIP $120 × 500 (each grants 5/15 bonus votes).

**Sponsorship.** Postobón buys event-level Premium ($25k) — title naming on the festival, logo on every ticket email, every WhatsApp broadcast, and every leaderboard inside all 4 contests. Águila buys "Best Silletero" category-level Gold ($5k) on top.

**Day-of.** 4,200 tickets sold. Attendees scan QR at park entrance → bonus votes unlock. Voting peaks 19:00–22:00. OpenClaw broadcasts to 12k-member WhatsApp Community every 4h. Gemini auto-generates winner Story for "Reina de Antioquia" with both Postobón + Águila logos.

**Post-event.** Postobón ROI dashboard: `impressions=1.2M, clicks=84k, attributed_votes=18k, attendance_correlation=+22%` (their push notifs lifted ticket sales). Águila ROI: localized to "Best Silletero" — `attributed_votes=4,800` at $1.04 cost-per-vote.

**Mdeai take.** $2,000 ticket fee (5%) + $1,400 paid-vote take (20%) + $9,000 sponsorship take (30%) = ~**$12,400 revenue from one event**. Run-rate cost ~$300. Net contribution ~$12k.

### 12.2 Restaurant ranking — city-wide "Bandeja Paisa Week 2026"

**Setup.** Organizer creates `event:bandeja-week-2026` with `kind='restaurant_week'`, 7-day window, no central venue (multi-venue). All 340 Medellín bandeja-serving restaurants seeded as `vote.entities` for one contest "Best Bandeja Paisa". Tickets are free "passport" RSVPs that grant 7 free votes (one per day).

**Sponsorship.** Águila buys event-level Gold ($10k). Each participating restaurant can buy contestant-level Bronze ($500) → "powered by" badge on their listing.

**Activation.** OpenClaw broadcasts daily "Today's Top 5" to a 2,800-member foodies WhatsApp Community at noon. Voters reply "1/2/3" via Twilio number. Each restaurant also gets a printed QR at their table linking to `/v/<placementId>` → `/event/bandeja-week/vote/<entity>`.

**Result.** 14,200 votes cast over 7 days. 28 restaurants bought Bronze sponsorship ($14k total). Águila got 412k cross-surface impressions for $10k.

**Mdeai take.** $0 ticket fee (free RSVP) + $1,800 paid-votes + $7,200 sponsorship take = ~**$9k from one weeklong campaign**. Almost zero ops involvement.

### 12.3 Festival with multiple contests — "Estéreo Picnic 2026"

**Setup.** 3-day music festival, `kind='festival'`, venue = "Parque 80". 4 contests embedded: Best DJ (audience vote), Best Stage Design (judges only), Best Outfit (audience + 30% judge), Crowd Favorite (audience only). Tickets: 3-day pass $180 × 15,000, VIP $450 × 1,500 (each grants 30/100 bonus votes).

**Sponsorship.** 12 brands across 3 tiers:
- Premium title sponsor: Bavaria ($40k) — festival name, every surface
- Gold contest sponsors: 4 brands at $5k each ($20k total) — one per contest
- Silver category sponsors: 3 brands at $2k each ($6k total)
- Bronze contestant sponsors: 4 brands at $500 each — backing specific DJs

**Activation.** OpenClaw runs in event mode for 3 days: 4-hour broadcasts × 4 contests × 3 days = 36 broadcasts each carrying watermarked sponsor logos (rotated by weight). Live leaderboard visible on the venue's main screens between sets.

**Result.** ~120k votes cast. Attendance scans 14,800/16,500 = 90%. Bavaria ROI: 3.2M impressions, 240k clicks, 38k attributed votes. 4 of 12 sponsors upgrade for next festival.

**Mdeai take.** ~$135k tickets × 5% = $6,750 + ~$24k paid-votes × 20% = $4,800 + $66k sponsorships × 30% = $19,800 = ~**$31k from one festival**. Run-rate cost ~$500.

---

## What I would build first (smallest viable proof)

A minimal `event.*` migration + `/event/:slug` public page + `ticket-checkout` flow — **without** sponsorship integration, **without** organizer dashboard, **without** AI. Just: organizer creates → user buys ticket → email arrives with QR → venue scans QR → bonus votes unlock for one existing test contest.

That proves the integration in **3 days** with one moving part. After that, layer sponsor event-level placements (1 week), then organizer dashboard (1 week), then AI tools (2 weeks).

The whole point of this design: **the integration is plumbing, not architecture**. Everything we built in `01-contests.md` and `03-sponsorship-system.md` already supports `event_id` because we put nullable foreign keys on day one. Adding events does not require rewriting voting or sponsorship.

---

## Tasks (executable, in dependency order)

- [ ] **U1.** `event.*` migration (5 tables + RLS + FK indexes) + cross-schema `ALTER` on `vote.contests` and `sponsor.applications`. → **Verify:** `supabase db push` passes; advisors clean.
- [ ] **U2.** Event creation wizard at [`src/pages/host/EventNew.tsx`](../../src/pages) (6 steps). → **Verify:** A draft event row persists across refresh; publish flips status.
- [ ] **U3.** Public event detail at [`src/pages/events/EventDetail.tsx`](../../src/pages) showing schedule + contests + sponsors. → **Verify:** A published event renders end-to-end with embedded contest leaderboard.
- [ ] **U4.** `ticket-checkout` edge fn with atomic `qty_sold` increment (advisory lock pattern, see `p1_application_atomic`). → **Verify:** 1,000 concurrent buyers for 100-ticket inventory result in exactly 100 paid bookings, 900 "sold out" responses.
- [ ] **U5.** `ticket-payment-webhook` mints QR token + dispatches email via existing template. → **Verify:** Successful Stripe payment → booking row → email received with QR within 30s.
- [ ] **U6.** `ticket-validate` endpoint for venue scans. → **Verify:** First scan returns `valid=true` and flips `qr_used_at`; second scan returns `valid=false`.
- [ ] **U7.** Extend `vote-cast` to decrement `bonus_votes_remaining` when an event ticket exists. → **Verify:** Buying a 5-bonus ticket then casting 6 votes results in 5 bonus + 1 free vote (or rejection if free quota exhausted).
- [ ] **U8.** Extend `<SponsoredSurface>` to render new event surfaces (`event_hero`, `event_ticket_email`, `event_program_pdf`, `event_qr_station`). → **Verify:** Test sponsor placement appears on event hero with click-tracking.
- [ ] **U9.** OpenClaw Workflow C extension: include event countdown + multi-contest leaderboard in broadcasts. → **Verify:** Broadcast for an event with 3 contests includes top-3 from each.
- [ ] **U10.** Organizer dashboard at [`src/pages/host/EventDashboard.tsx`](../../src/pages) with Realtime tiles. → **Verify:** Live ticket sale + vote insertions tick within 2s.
- [ ] **U11.** Stripe Connect onboarding for organizers + delayed transfer (T+7). → **Verify:** Test event payout lands in connected account exactly 7 days post-event close.
- [ ] **U12.** Recap generator (Gemini) → PDF + 3 social posts. → **Verify:** Post-event endpoint returns valid PDF + 3 captions in <30s.

---

## See also

- [`00-overview.md`](./00-overview.md) — initiative index
- [`01-contests.md`](./01-contests.md) — voting engine (now with `event_id`)
- [`02-openclaw-growth.md`](./02-openclaw-growth.md) — broadcasts now event-aware
- [`03-sponsorship-system.md`](./03-sponsorship-system.md) — sponsorship now event-level too
- [`04-roadmap.md`](./04-roadmap.md) — combined timeline (this doc adds events to Phase 1–3)
