# Events System Design — production-ready, AI-native, sponsor-attributable

> **Goal.** Design an events platform that beats Eventbrite + Luma combined for mdeai's specific market (Medellín-first, contests-bearing, sponsor-ROI-attributable). Not a feature-parity clone — a category-of-one play built around the gap both leaders left open.

**Companion to:** [`09-prd.md`](./09-prd.md), [`08-plan-audit-response.md`](./08-plan-audit-response.md), [`05-unified-platform.md`](./05-unified-platform.md). This doc supersedes the schema sketches in `05-unified-platform.md` with platform-grade details and a refined Phase 1 scope.

---

## 1. Summary

After the user's pivot from contests-first to **events-first**, this doc establishes the canonical events architecture. Three core insights from the research:

1. **Eventbrite + Luma each leave half the table empty.** Eventbrite has discovery + enterprise features but charges 15.5% effective on a $20 ticket and pays organizers only after the event. Luma is faster + cheaper + has built-in CRM/chat but has no sponsorship system, no seating, no on-site hardware.
2. **40% of event organizers in 2026 still can't prove sponsor ROI** ([Bizzabo 2026 sponsor playbook](https://www.bizzabo.com/blog/sponsor-roi-onsite-data-playbook)). This is the biggest unsolved problem in the category.
3. **Neither platform handles contests-inside-events** as a first-class architecture. mdeai already designed `vote.contests.event_id` as a nullable FK. That single column is the differentiator.

**mdeai's "10x" thesis:** **events host contests host sponsors, with end-to-end ROI attribution and AI orchestration**. Not a marketplace. Not a tool. A unified platform that gives organizers the speed of Luma, the depth of Eventbrite, the sponsor-ROI of Cvent, and the AI of nobody-yet — at one effective fee.

**Phase 1 launch event:** the gala finals night for [Miss Elegance Colombia 2026](https://misseleganceco.com/) — ticketed, hosted at a Medellín venue, contest-bearing.

---

## 2. Core features (must-have)

The non-negotiable set for v1.0. Every modern event platform has these; missing any one disqualifies us.

| # | Feature | Why it matters | Reference platform |
|---|---|---|---|
| 1 | **Event creation wizard** (basics → venue → tickets → schedule → review) | Organizer must publish in <30 min | Luma "<2 minutes"; Eventbrite event-page builder |
| 2 | **Public event page** with hero, description, schedule, tickets, share | First impression = conversion or not | Both |
| 3 | **Free + paid tickets** (multiple tiers, qty caps, sale windows) | Most events need ≥2 tiers (GA + VIP) | Both |
| 4 | **Stripe payments** (cards + Apple Pay + Google Pay) + atomic inventory | Overselling = refund disasters | Both |
| 5 | **Stripe Connect organizer payouts** with delayed transfer (T+7 default) | Without instant cash flow, organizers pick Luma | Luma instant via Stripe; Eventbrite holds until after event ❌ |
| 6 | **QR-code tickets** (server-signed JWT, single-use, sent via email + PWA) | Door staff need a frictionless scan | Both |
| 7 | **Check-in app** (`/staff/check-in/:event` PWA — works offline) | Door = the moment of truth | Eventbrite has dedicated app; Luma has web-based |
| 8 | **Event discovery on `/explore`** | Network effect of mdeai's existing traffic | Eventbrite marketplace; Luma's Discover (limited) |
| 9 | **Schedule / run-of-show** (per-day timetable) | Multi-day or multi-stage events impossible without it | Eventbrite (limited); Luma (limited) |
| 10 | **Attendee management** (export CSV, contact, segment) | Organizer's CRM minimum | Luma's guest CRM (better); Eventbrite (basic) |
| 11 | **Email + WhatsApp confirmations + reminders** (auto + manual blasts) | T-1d reminder lifts attendance 15-30% | Both have email; **WhatsApp is mdeai's edge in Medellín** |
| 12 | **Real-time analytics** (tickets sold, attendance, revenue) | Organizers check 50× during ticket sales | Both |
| 13 | **Refund handling** (organizer-initiated + Stripe webhook) | Cancellations + disputes happen | Both |
| 14 | **Mobile-first responsive** (Camila on iPhone SE on 3G) | 70%+ of voters are mobile in Medellín | Luma >> Eventbrite |
| 15 | **Spanish-Paisa localization** for voter-facing surfaces | Trust + voice quality | Neither has this for Medellín |

**These 15 are the floor**, not the ceiling. v1.0 ships all 15.

---

## 3. Advanced features (the competitive layer)

These separate "good enough" from "obviously better". Phase 2+.

| # | Feature | Where it shines | Eventbrite | Luma |
|---|---|---|---|---|
| 1 | **Reserved seating** (interactive seat map) | Theaters, gala dinners, pageants | ✅ | ❌ |
| 2 | **Timed-entry tickets** (prevents queue at door) | Museums, exhibitions, popular events | ✅ | ❌ |
| 3 | **Recurring events** (weekly DJ contests, monthly meetups) | Series builders | Limited | ✅ |
| 4 | **Community calendars** (followers subscribe, get notified) | Build audience over time | ❌ | ✅ |
| 5 | **Waitlists** (auto-promote when space opens) | Sold-out events | ✅ | ✅ |
| 6 | **Approval-based RSVPs** (curated guest lists) | High-value events | Manual | ✅ |
| 7 | **Promo codes** (% off, $ off, comp tickets) | Sponsor perks, group sales | ✅ | ✅ |
| 8 | **Referral tracking** (each invite has unique link) | Vote→Share viral loop | Limited | ✅ |
| 9 | **Built-in chat / comments** | Build community pre-event | ❌ | ✅ |
| 10 | **Memberships / subscriptions** (recurring access pass) | Monthly clubs, season passes | ❌ | ✅ |
| 11 | **Zoom / Google Meet integration** for virtual events | Link auto-attached to ticket | ✅ | ✅ |
| 12 | **CRM integration** (HubSpot, Salesforce, Mailchimp) | Enterprise organizers | ✅ Premium | Limited |
| 13 | **On-site hardware** (scanners, badge printers) | Conferences, festivals | ✅ | ❌ |
| 14 | **Multi-event dashboard** (organizer with portfolio) | Festival operators | ✅ | ✅ |
| 15 | **API + webhooks** | Custom workflows | ✅ Premium | ✅ Plus |
| 16 | **Multi-language event pages** | International events | ✅ | Partial |
| 17 | **Analytics export** (BI integration, custom reports) | Sponsor reporting | ✅ | Limited |
| 18 | **Privacy + compliance** (GDPR, Habeas Data, opt-in trails) | Required in Colombia + EU | ✅ | ✅ |
| 19 | **Sustainability reporting** (carbon footprint per event) | 2026 sponsor ask | ❌ | ❌ |
| 20 | **Live polling + Q&A during event** | Engagement boost | Add-ons | Add-ons |

**Phase 2 ships ~10 of these.** Phase 3+ ships the rest.

---

## 4. Sponsorship system (the category-of-one play)

This is where mdeai wins. Eventbrite has a sponsorship blog but no built-in sponsor system. Luma has nothing. Cvent has enterprise tools but at $3k+/yr and bolt-on rather than native.

### 4.1 Five activation types (per [`03-sponsorship-system.md`](./03-sponsorship-system.md))

| Activation | What sponsor gets | Where it appears |
|---|---|---|
| **Title naming** | "Miss Elegance Colombia 2026 **presented by Postobón**" | Hero banner + every email + every WA broadcast + every share card |
| **Category sponsor** | "Best Stage Design **powered by Águila**" | Category page + leaderboard for that category |
| **Contestant sponsor** | "**Patrocinada por Mi Sazón**" badge on contestant profile | Inside the contest, on the entity card |
| **Venue sponsor** | Branded QR voting station + on-screen logo at finals | Physical venue + voting QR landing |
| **Digital placement** | Banner / featured slot on `/explore` and event pages | Discovery surfaces |

### 4.2 Five tier types (any activation)

| Tier | Price (organizer-set) | What's guaranteed |
|---|---|---|
| Bronze | $500 | Logo on leaderboard footer + 1 social mention + ROI dashboard read access |
| Silver | $2,000 | + Category co-branding + 3 social mentions + push notif slot |
| Gold | $5,000 | + Featured contestant sponsor + 10 mentions + every-broadcast logo |
| Premium | $25,000 | + Title naming + every surface + custom creative + co-branded influencer campaign |
| Custom | negotiated | Anything the organizer + sponsor agree |

### 4.3 ROI tracking — the differentiator

| Metric | How tracked | Sponsor sees |
|---|---|---|
| **Impressions** | Every render of `<SponsoredSurface>` fires impression beacon | Tile updates within 5 min |
| **Clicks** | Click on logo → 302 redirect with UTM | Tile updates within 5 min |
| **Attribution to votes** (the killer metric) | Click within 24h → vote → linked in `sponsor.attributions` | Tile + cost-per-attributed-vote |
| **Attribution to ticket purchases** | Click → ticket purchase via UTM | Cost-per-acquisition |
| **Attribution to physical attendance** | QR sponsor scan at venue → attendance | Cost-per-engaged-attendee |
| **Brand-safety status** | Auto-pause if fraud spike or judge controversy | Trust |
| **AI insight (Phase 4)** | Daily Gemini-generated narrative explaining performance + recommendations | "CTR rose 41% Tuesday because…" |

### 4.4 Pricing models supported

- **Flat tier** (Phase 1) — sponsor pays $X, gets package, no performance variance
- **CPL** (Phase 4 — needs 30 days of attribution data first) — sponsor pays per attributed vote
- **CPA** (Phase 4) — sponsor pays per redemption (e.g. restaurant offer scan)
- **CPM** (Phase 4) — sponsor pays per 1000 impressions
- **Hybrid** — tier minimum + variable performance bonus

### 4.5 Real-world example — Postobón at Miss Elegance Colombia 2026

T-45: Postobón signs Premium Title sponsor at $25k via `/sponsor/apply`. Approved by Daniela in 4h.
T-30: Active. Logo on event hero. Logo on every ticket email. Logo watermark on every WA broadcast.
T-0: Finals night. 4,200 attendees scan QR at door (sponsor branding visible). Voting opens; sponsor logo on every leaderboard tile.
T+1: Postobón sees: 412k impressions, 84k clicks, 18k attributed votes, attendance correlation +22%.
T+7: Daily AI narrative: "Push notifications drove 22% lift in ticket sales — recommend doubling weight on push for next event."

**This level of granularity does not exist on Eventbrite or Luma.** It's mdeai's category-of-one.

---

## 5. Marketing system

Lifted from [`02-openclaw-growth.md`](./02-openclaw-growth.md), tuned for events.

### 5.1 Channels (priority-ordered for Medellín)

| Channel | Phase introduced | Volume | Compliance |
|---|---|---|---|
| **WhatsApp Community broadcasts** (every 4h during contest, daily otherwise) | Phase 1 | 5,000–10,000 members per Community | Twilio template messages, opt-in only |
| **WhatsApp 1:1 reminders** (T-7, T-1, T-1h before event) | Phase 1 | All ticket holders | Triggered by `event.bookings.status='paid'` |
| **Email** (ticket confirmation + 3 reminder cadence + post-event recap) | Phase 1 | All ticket holders | Auto-unsubscribe link mandatory |
| **Influencer outreach** (Apify discover → Hermes personalize → OpenClaw send) | Phase 2 | 50/day cap (compliance) | Top-50 hand-curated, never spray |
| **Social posting** (TikTok, IG, X) via Post Bridge | Phase 2 | 2-3/day during contest, 1/day otherwise | All FTC #ad disclosures |
| **In-venue** (QR codes, signage, MC scripts) | Phase 1 if applicable | Per attendee | n/a |
| **Push notifications (PWA)** | Phase 2 | All app-installed users | Opt-in, max 2/event |
| **Vote→Share modal** (referral loop, ?ref=) | Phase 2 | Every vote | Built-in |

### 5.2 Auto vs manual split

| Auto (no human in loop) | Semi-auto (human approves) | Manual only |
|---|---|---|
| Ticket confirmations + reminders | First 100 outreach drafts | Press releases |
| WhatsApp leaderboard broadcasts (Phase 1 with template) | Sponsor creative (Gemini-generated, approve before publish) | Influencer relationship management |
| Schedule reminder pushes | Post-event recap PDF | Crisis comms (fraud spike, controversy) |
| `?ref=` referral attribution | Audience targeting recommendations | Founder-led sponsor sales for first 5 |

**Anti-pattern.** Auto-DMing 200 IG/TikTok accounts cold gets accounts banned. We stay above 50/day total across compliant channels.

### 5.3 Viral loops (4 wired by Phase 2)

1. **Ticket purchase → share** — buy ticket, modal: "Tag 3 friends, get +5 bonus votes"
2. **Vote → share** — vote, modal: "I voted for Laura — vote with me [link]"
3. **Win → share** — your candidate wins → auto-generated congrats card with sponsor logo (FTC compliant)
4. **Influencer referral** — `?ref=` links pay 1% of paid-vote revenue via Stripe Connect

---

## 6. AI + Agents layer

**Three runtimes, three responsibilities** (per [`06-trio-integration.md`](./06-trio-integration.md)). Phase 4 introduces all three; Phase 1-3 use only Gemini direct + a single OpenClaw VPS.

```
HERMES   = reasoning  (planning + ranking + sub-agents + memory)
OPENCLAW = execution  (channels + scraping + posting + cron)
PAPERCLIP = control   (issues + approvals + budgets + audit)
SUPABASE = source-of-truth (data; never moves)
```

### 6.1 Phase 1 AI capabilities (Gemini direct, no Hermes/Paperclip yet)

| Capability | Model | When |
|---|---|---|
| Event hero copy generator | gemini-3.1-pro-preview | Organizer publishes; Gemini drafts 3 variants en+es-CO |
| Photo moderation (events + sponsor assets) | gemini-3-flash-preview | Every upload, <5s |
| Anti-fraud anomaly detection on votes | gemini-3-flash-preview | Cron every 60s |
| Personalized event recommendations | text-embedding-004 + cosine | `/explore` page, per-user re-rank |

### 6.2 Phase 4 AI capabilities (full trio)

| Capability | Runtime | Pattern |
|---|---|---|
| Event planning agent | Hermes + Paperclip | Organizer prompts "create restaurant week"; Hermes drafts schedule + tickets + sponsor pitches; Paperclip creates approval checkpoints |
| Marketing automation orchestrator | Paperclip routine → Hermes → OpenClaw | Daily review issue; Hermes computes deltas; OpenClaw broadcasts |
| Sponsor matchmaker | Hermes embeds | Top-5 contests for a brand based on `growth.contacts.embedding` × `vote.contests.embedding` |
| Fraud detection + auto-pause | Hermes + Paperclip approval | Suspicious cluster → admin one-tap shadow-block |
| Content + recap generator | Hermes + Gemini Pro | Post-event PDF + 3 social posts in <30s |
| Attendance confirmation agent (T-12h) | Paperclip routine → Hermes classify replies → OpenClaw send | Replaces manual "are you coming?" calls |

### 6.3 Anti-pattern guard: AI proposes, human applies

Per [`ai-interaction-patterns.md`](../../.claude/rules/ai-interaction-patterns.md). No AI auto-publishes a sponsor creative. No AI auto-charges a CPL. No AI auto-shadow-blocks without admin one-tap. Trust depends on this rail.

---

## 7. Database architecture

### 7.1 Schema overview

```
event.*       — events, venues, tickets, bookings, schedule_items, check_ins
vote.*        — contests, entities, votes, tally, judges (existing — Phase 2)
sponsor.*     — applications, placements, impressions, clicks, attributions, roi_daily
growth.*      — contacts, communications, marketing_assets, asset_distributions (existing — Phase 2)
trio.*        — tool_runs, handoffs, approval_requests (Phase 4)

public.events — KEEP AS-IS for Google/Ticketmaster discovery catalog (don't merge)
```

### 7.2 `event.*` minimum tables (Phase 1)

| Table | Purpose | Phase intro |
|---|---|---|
| **event.events** | Top-level event entity (festival, gala, conference, restaurant week) | 1 |
| **event.venues** | Where events happen (link to mdeai's existing `restaurants` for venue events) | 1 |
| **event.tickets** | Ticket types (GA, VIP, Backstage) with inventory | 1 |
| **event.bookings** | One row per ticket purchased; QR token; attendance tracking | 1 |
| **event.check_ins** | Each scan event at the venue gate (audit trail) | 1 |
| **event.schedule_items** | Per-day timetable (talks, performances, judging rounds) | 2 |
| **event.recurring_events** | Series patterns (weekly DJ contest) | 3 |
| **event.waitlists** | Sold-out queue with auto-promote | 3 |
| **event.promo_codes** | Discount codes (% / $ off / free) | 2 |

### 7.3 Schema (Phase 1 minimum — copy/paste-able)

```sql
CREATE SCHEMA IF NOT EXISTS event;

CREATE TABLE event.venues (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name            text NOT NULL,
  type            text NOT NULL CHECK (type IN ('restaurant','club','conference_center','park','stadium','street','virtual','other')),
  restaurant_id   uuid REFERENCES public.restaurants(id),  -- mdeai existing data
  address         text NOT NULL,
  lat             double precision,
  lng             double precision,
  capacity        int,
  amenities       text[],                                  -- ['parking','bar','accessible','wheelchair']
  hero_url        text,
  contact_email   text,
  contact_whatsapp text,
  created_at      timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ON event.venues (type);
CREATE INDEX ON event.venues (lat, lng) WHERE lat IS NOT NULL;

CREATE TABLE event.events (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug            text UNIQUE NOT NULL,
  organizer_id    uuid NOT NULL REFERENCES public.profiles(id),
  kind            text NOT NULL CHECK (kind IN ('festival','conference','nightlife','sports','restaurant_week','pageant_finals','virtual','hybrid','other')),
  title           text NOT NULL,
  description     text,
  hero_url        text,
  city            text NOT NULL DEFAULT 'Medellín',
  starts_at       timestamptz NOT NULL,
  ends_at         timestamptz NOT NULL,
  timezone        text NOT NULL DEFAULT 'America/Bogota',
  venue_id        uuid REFERENCES event.venues(id),
  virtual_url     text,                                    -- Zoom/Meet link for hybrid/virtual
  status          text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','published','live','closed','cancelled','archived')),
  embedding       vector(768),                             -- Gemini text-embedding-004
  total_capacity  int,
  cover_image_url text,
  brand_color     text,                                    -- hex code for theming
  share_image_url text,                                    -- OG image override
  approval_required bool NOT NULL DEFAULT false,            -- approval-based events
  privacy         text NOT NULL DEFAULT 'public' CHECK (privacy IN ('public','unlisted','private')),
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT events_dates_chk CHECK (ends_at >= starts_at)
);
CREATE INDEX ON event.events (status, starts_at) WHERE status IN ('published','live');
CREATE INDEX ON event.events (organizer_id);
CREATE INDEX ON event.events (city);
CREATE INDEX ON event.events USING ivfflat (embedding vector_cosine_ops);

CREATE TABLE event.tickets (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id            uuid NOT NULL REFERENCES event.events(id) ON DELETE CASCADE,
  name                text NOT NULL,                       -- 'GA','VIP','Backstage'
  description         text,
  price_cents         int NOT NULL CHECK (price_cents >= 0),
  currency            text NOT NULL DEFAULT 'COP',
  qty_total           int NOT NULL CHECK (qty_total > 0),
  qty_sold            int NOT NULL DEFAULT 0,
  bonus_votes         int NOT NULL DEFAULT 0,              -- Phase 2 contests integration
  sale_starts_at      timestamptz,
  sale_ends_at        timestamptz,
  is_active           bool NOT NULL DEFAULT true,
  position            int NOT NULL DEFAULT 0,
  metadata            jsonb DEFAULT '{}',                  -- e.g. { seat_section: 'orchestra' }
  CHECK (qty_sold <= qty_total)
);
CREATE INDEX ON event.tickets (event_id) WHERE is_active = true;

CREATE TABLE event.bookings (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id            uuid NOT NULL REFERENCES event.events(id),
  ticket_id           uuid NOT NULL REFERENCES event.tickets(id),
  user_id             uuid NOT NULL REFERENCES auth.users(id),
  qty                 int NOT NULL CHECK (qty > 0),
  amount_cents        int NOT NULL,
  currency            text NOT NULL DEFAULT 'COP',
  payment_id          uuid REFERENCES public.p1_payments(id),
  qr_token            text NOT NULL UNIQUE,                -- single-use server-signed JWT
  qr_used_at          timestamptz,
  bonus_votes_remaining int NOT NULL DEFAULT 0,            -- Phase 2 — decrement on vote-cast
  status              text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','paid','refunded','cancelled','attended')),
  attendee_email      text NOT NULL,
  attendee_name       text NOT NULL,
  attendee_phone_e164 text,
  approved_at         timestamptz,                          -- for approval-based events
  approved_by         uuid REFERENCES auth.users(id),
  metadata            jsonb DEFAULT '{}',                   -- dietary, accessibility, custom Qs
  created_at          timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX ON event.bookings (qr_token);
CREATE INDEX ON event.bookings (user_id, event_id);
CREATE INDEX ON event.bookings (event_id, status);
CREATE INDEX ON event.bookings (event_id) WHERE qr_used_at IS NOT NULL;

CREATE TABLE event.check_ins (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id      uuid NOT NULL REFERENCES event.bookings(id) ON DELETE CASCADE,
  scanned_by      uuid REFERENCES auth.users(id),  -- staff member
  scanner_device  text,
  ip_hash         text,
  created_at      timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ON event.check_ins (booking_id);

CREATE TABLE event.schedule_items (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id        uuid NOT NULL REFERENCES event.events(id) ON DELETE CASCADE,
  starts_at       timestamptz NOT NULL,
  ends_at         timestamptz NOT NULL,
  title           text NOT NULL,
  description     text,
  speakers        text[],
  location_in_venue text,
  kind            text NOT NULL CHECK (kind IN ('performance','judging','finale','meet_greet','meal','workshop','keynote','panel','networking','other')),
  contest_id      uuid,                                  -- Phase 2 — link to vote.contests
  position        int NOT NULL DEFAULT 0
);
CREATE INDEX ON event.schedule_items (event_id, starts_at);
```

**RLS (one-line summary):**

| Table | Public SELECT | Auth SELECT | INSERT/UPDATE | Service-role |
|---|---|---|---|---|
| `events` | published+live | own row | own row (organizer) | bypass |
| `venues` | all | all | own venues; admin moderation | bypass |
| `tickets` | active+published events | active | own event's | bypass |
| `bookings` | — | own only | edge fn writes only | bypass |
| `check_ins` | — | — | edge fn (ticket-validate) only | bypass |
| `schedule_items` | published events | published events | own event's | bypass |

### 7.4 Cross-schema FKs (the integration points)

```sql
-- Phase 2 — contests embed in events
ALTER TABLE vote.contests ADD COLUMN event_id uuid REFERENCES event.events(id);
ALTER TABLE event.schedule_items ADD CONSTRAINT schedule_contest_fk
  FOREIGN KEY (contest_id) REFERENCES vote.contests(id);

-- Phase 2 — sponsors at event level
ALTER TABLE sponsor.applications ADD COLUMN event_id uuid REFERENCES event.events(id);
```

All FKs are **nullable** so each schema works standalone.

---

## 8. Build plan — events-first phased

| Phase | Weeks | Theme | Acceptance gate |
|---|---|---|---|
| **Phase 1 — MVP Events** | 4 | One organizer publishes event, sells tickets, scans QR at venue | 1 event live, 100+ paid tickets, ≥80% attendance scan rate, $0 fraud, Stripe Connect payout settled |
| **Phase 2 — Sponsorship + Contests embedded** | 5 | `sponsor.*` schema + `vote.contests.event_id` FK + Trust page + 5-layer fraud + first paying sponsor | 1 event with 1 paying sponsor and embedded contest, 1k votes, $5k+ revenue |
| **Phase 3 — Marketing + Growth** | 4 | OpenClaw VPS, Workflow C broadcasts, compliant outreach, viral loops, attendance confirmation A6, intake chase A7 | K-factor > 1.0 over 7d, 0 social account bans, A6 hit ≥70% confirmation |
| **Phase 4 — AI Orchestration** | 6 | Hermes + Paperclip + AI sponsor tools + CPL pricing + white-label | 5+ concurrent contests, ≥1 CPL sponsor, 14d trio uptime |

**Total: ~19 weeks to v1.0.** First demo event (Miss Elegance Colombia 2026 Gala Finals) ships at end of Phase 1, even though contests don't run until Phase 2.

### Phase 1 task list (12 prompts to generate, replacing existing `tasks/events/prompts/`)

| # | Task | Skill | Effort |
|---|---|---|---|
| 1 | `event.*` migration (events + venues + tickets + bookings + check_ins) | supabase, supabase-postgres-best-practices | 1d |
| 2 | `/host/event/new` 6-step wizard | frontend-design, events | 3d |
| 3 | `/event/:slug` public detail page | frontend-design, vercel-react-best-practices | 2d |
| 4 | `ticket-checkout` edge fn (Stripe + advisory lock) | supabase-edge-functions | 2d |
| 5 | `ticket-payment-webhook` (mint QR + email) | supabase-edge-functions, twilio-whatsapp | 1d |
| 6 | `ticket-validate` edge fn + `/staff/check-in/:event` PWA | supabase-edge-functions, frontend-design | 1.5d |
| 7 | Stripe Connect organizer onboarding (T+7 delayed) | supabase, better-auth-best-practices | 2d |
| 8 | `/host/event/:id/dashboard` with Realtime tiles | frontend-design, supabase | 2d |
| 9 | Calendar export ICS edge fn | supabase-edge-functions | 0.5d |
| 10 | `/explore` extension surfaces mdeai-hosted + `public.events` together | frontend-design | 1d |
| 11 | `/admin/events` moderation queue | frontend-design, supabase | 1.5d |
| 12 | Event TOS + organizer agreement + Habeas Data + Colombian counsel review | mde-writing-plans, compliance | 2d |

**Total: ~19 dev-days = ~4 weeks at 1 dev** (matches Phase 1 envelope).

The 15 contest prompts already at `tasks/events/prompts/001-015` move to `tasks/events/prompts/phase-2-contests/` (renamed when Phase 2 starts).

---

## 9. Real-world walkthroughs

### 9.1 Miss Elegance Colombia 2026 — Gala Finals (Phase 1 launch)

**T-45.** Daniela publishes event "Miss Elegance Colombia 2026 — Coronation Night" via `/host/event/new`. 6 steps in 25 min. Venue: Pueblito Paisa park (linked to existing mdeai `restaurants` row via `event.venues.restaurant_id`). Tickets: GA $40 × 1,000, VIP $120 × 200, Backstage $400 × 30. Status: `published`.

**T-30.** Postobón applies for Premium title sponsorship at $25k via `/sponsor/apply` (Phase 2 capability — for now, manual config in `/admin`). Logo set as event hero overlay. Brand color theming applies.

**T-7.** WhatsApp broadcast goes out via OpenClaw Workflow C: "🌹 Faltan 7 días para Miss Elegance Colombia. Tickets: …". 5,200 Community members receive screenshot + UTM link.

**T-1.** Auto-reminder cadence: T-1d email + T-1h WhatsApp template to all paid bookings. Attendance prep agent fires confirmation pings (Phase 4).

**T-0 (gala night).** Door staff opens `/staff/check-in/coronation-night` PWA on iPad. Each attendee shows QR (from email or PWA wallet); staff scans; `event.check_ins` row inserted. Stage MC sees real-time attendance counter on `/host/event/:id/dashboard` (4,180 of 4,230 paid scanned by 8pm — 99% rate).

**Within event.** Phase 2: contest "Reina de Antioquia" embedded via `vote.contests.event_id`. Each ticket grants 5 bonus votes (Phase 2 — `bookings.bonus_votes_remaining` decrements on vote-cast).

**T+1.** Daniela sees recap dashboard: $73,000 ticket revenue (95% × Stripe fees), 99% attendance rate, +37 NPS. Postobón sees their dashboard: 412k impressions, 84k clicks, 18k attributed votes. AI insight: "Push notif drove 22% lift in late-buyer ticket sales; recommend boosting weight next event."

**T+7.** Stripe Connect payout settles to Daniela's connected account (T+7 delayed transfer per platform rules). Mdeai earns 5% ticket fee + 30% sponsor commission = ~$11k from this single event.

### 9.2 "Bandeja Paisa Week" — distributed restaurant week (Phase 2)

7-day citywide event. No central venue. 340 restaurants (linked from existing `restaurants` table) participate. Tickets: free RSVP "passport" — grants 7 free votes (one per day) for "Best Bandeja Paisa".

Daniela publishes once. Each restaurant claims their listing. Águila buys event-level Gold $10k. Each restaurant can buy contestant-Bronze $500 (28 do = $14k more). WhatsApp Community broadcasts daily top-5 at noon.

**Mdeai take:** $0 ticket revenue (free RSVPs) + $1,800 paid-vote take + $7,200 sponsor commission = $9k in 7 days.

### 9.3 Tech networking event ("AI Founders Medellín — monthly meetup")

Free, 60 RSVPs, recurring (Phase 3). Organizer is a founder building community. Luma's wheelhouse — but mdeai differentiates by:
- Recurring event template (every 1st Tuesday)
- Community calendar followers get auto-notified
- Built-in chat for pre-event introductions
- Sponsor (a job board) buys $500 Bronze for "Sponsored by [JobBoard]" badge → tracks 8 attributed signups in 30 days

### 9.4 Music festival — "Estéreo Picnic 2026" (Phase 3+)

3-day festival. 16,500 attendees. 4 embedded contests (Best DJ, Best Stage, Best Outfit, Crowd Favorite). 12 sponsors across all 5 activation types. Daily attendance confirmation agent (A6) checks in attendees the night before. Ticket scans record check-in time per gate (helps capacity planning).

**Mdeai take:** ~$30k from one festival. Run-rate cost ~$500/mo. Net margin > 95%.

---

## 10. Final strategic recommendation

### What Eventbrite does well (and we should match)

- **Discovery marketplace** — surfaces events to millions of active browsers
- **On-site hardware** — scanners, badge printers (Phase 3+ partnership, not core build)
- **Reserved seating** — Phase 3 add (low priority for Medellín)
- **Established trust** — 4M events/year track record
- **Eventbrite Ads** — paid promotion within marketplace

### What Luma does better (and we will replicate)

- **Speed to publish** — < 2 minutes (we target < 30 min including details, < 5 min for minimal)
- **Modern mobile UX** — clean, branded, fast (we already have shadcn + Tailwind)
- **Instant payouts** via Stripe Connect rolling schedule (Phase 1 release blocker)
- **Built-in chat/CRM/messaging** (Phase 2)
- **Community calendars + followers** (Phase 3 — recurring events)
- **Free tier with unlimited events** (we'll match — 0% on free events; 5% on paid)
- **Beautiful event pages out of the box** — branded with organizer's color

### What both are missing (mdeai's category-of-one)

| Gap | What mdeai builds |
|---|---|
| **Sponsor ROI attribution** to specific votes/conversions | `sponsor.attributions` schema with 24h click→vote window; CPL pricing |
| **Contests inside events** as first-class architecture | `vote.contests.event_id` nullable FK; Trust page; 5-layer fraud defense |
| **AI orchestration** (Hermes + OpenClaw + Paperclip) | Phase 4 — auto-marketing, sponsor optimization, fraud detection, recap generation |
| **Spanish-Paisa native** localization | English-first UI + voter-facing surfaces in Paisa Spanish; Trust page legal-counsel-approved |
| **WhatsApp-first reminders/comms** in Medellín | Twilio templates, Community broadcasts, reply-to-vote |
| **Compliant influencer marketing** (no IG/TikTok bans) | OpenClaw + Apify scraping liability; daily caps; suppression list |
| **Hybrid scoring** (audience + judges + engagement) for legitimate competitions | `vote.contests.scoring_formula` JSONB; configurable per contest |
| **Multi-tier sponsor packages** with guaranteed value (not just impressions) | `sponsor.applications` with flat/CPL/CPA/CPM/hybrid pricing |
| **Brand-safety auto-pause** on fraud spike or controversy | Phase 4 — Paperclip approval gate |
| **Sustainability + DEI + Habeas Data** reporting | Phase 3+ — sponsor ask is increasing |

### How mdeai is "10x better than Eventbrite + Luma combined"

| Dimension | Eventbrite | Luma | mdeai |
|---|---|---|---|
| Effective fee on $20 ticket | $3.11 (15.5%) | $1.88 (9.4% Free) / $0.88 (4.4% Plus) | **$1.50 (7.5% target — 5% platform + Stripe)** |
| Time to publish a basic event | ~30 min | <2 min | <5 min minimal, <30 min full |
| Organizer payout schedule | After event | Instant (Stripe rolling) | T+7 delayed (auto, configurable) |
| Built-in sponsor ROI tracking | ❌ | ❌ | ✅ Vote/click/conversion attribution |
| Contests embedded in events | ❌ | ❌ | ✅ First-class |
| AI orchestration | ❌ | ❌ | ✅ Trio (Phase 4) |
| WhatsApp comms native | ❌ | ❌ | ✅ Twilio + Community broadcasts |
| Spanish-Paisa native | ❌ | ❌ | ✅ |
| Compliance (Habeas Data, FTC) | Partial | Partial | ✅ Counsel-reviewed |
| Free tier | Yes (limited) | Unlimited free events | Match Luma + 0% on free |
| Discovery marketplace | ✅ Strong | Limited | Build via `/explore` + Medellín focus |

### Three things we deliberately don't build (Phase 1)

1. **On-site hardware** (scanners, printers) — partner with existing vendors; PWA scanner suffices.
2. **Reserved seating** — Phase 3+; not relevant for pageants/restaurant week.
3. **Enterprise multi-event dashboards** at Cvent scale — Phase 4+; not Phase 1 use case.

### One sentence of strategic clarity

> **mdeai is the events platform that pays organizers faster than Eventbrite, looks better than Luma, sells sponsors more effectively than Cvent, runs on AI nobody else has, and speaks Paisa Spanish — built first for Medellín, designed for LatAm.**

That's the bet. The 15 prompts in `tasks/events/prompts/` (currently for contests) will move to `tasks/events/prompts/phase-2-contests/` once Phase 1 gets its own 12 prompts. Phase 1 starts with `event.*` migration, ends with Miss Elegance Colombia 2026 Gala Finals running on the platform with paid tickets, real attendance, and Stripe Connect payout.

---

## Sources

Research conducted May 2026:

- [Eventbrite organizer overview](https://www.eventbrite.com/organizer/overview/)
- [Eventbrite organizer hub](https://www.eventbrite.com/organizer/hub/learn/how-to-use-eventbrite/)
- [Eventbrite sponsorship guide](https://www.eventbrite.com/blog/academy/essential-guide-sponsorship-for-events/)
- [Luma homepage](https://luma.com/)
- [Luma vs Eventbrite (official comparison)](https://help.luma.com/p/luma-vs-eventbrite)
- [Luma calendar memberships](https://help.luma.com/p/calendar-memberships)
- [25 best event management software 2026 (Guideflow)](https://www.guideflow.com/blog/best-event-management-software)
- [Eventbrite alternatives (lower fees, better features)](https://eventbritealternatives.com/blog/eventbrite-competitors)
- [Bizzabo sponsor ROI playbook](https://www.bizzabo.com/blog/sponsor-roi-onsite-data-playbook)
- [Anyroad event sponsorship packages 2026](https://blog.anyroad.com/post/event-sponsorship-packages)
- [Ticket Fairy proving sponsor ROI 2026](https://www.ticketfairy.com/blog/proving-sponsor-roi-in-2026-tech-tools-to-deliver-value-and-secure-partnerships)
- [Cvent alternatives 2026 (PromoTix)](https://blog.promotix.com/cvent-alternatives)

---

## See also

- [`09-prd.md`](./09-prd.md) — Product Requirements Document
- [`08-plan-audit-response.md`](./08-plan-audit-response.md) — Phase plan (will be updated to events-first)
- [`05-unified-platform.md`](./05-unified-platform.md) — original events + contests integration spec
- [`03-sponsorship-system.md`](./03-sponsorship-system.md) — sponsor schema source
- [`06-trio-integration.md`](./06-trio-integration.md) — AI orchestration runtime
- [`misseleganceco.com`](https://misseleganceco.com/) — Phase 1 launch event
