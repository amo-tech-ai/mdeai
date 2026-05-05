# OpenClaw growth engine — implementation plan

> **BLUF:** A self-hosted OpenClaw gateway orchestrates compliant influencer discovery (Apify), outreach (WhatsApp Business + Email + Telegram), social posting (Post Bridge / PostFast), and 4-hourly leaderboard broadcasts during a live contest. Supabase (`growth.*` schema) is the system of record; Gemini personalizes copy and classifies contacts; OpenClaw runs cron + hooks. Designed to drive ~25k votes per pageant at <$150/mo in tooling cost.

**Goal.** Replace the agency-style "$5–10k/mo + 4 humans" growth motion with one OpenClaw VPS, three Workflows, and one community manager — without getting any social account banned.

**User story.**
> *As a contest organizer launching "Reina de Antioquia 2026", I want OpenClaw to nightly enrich an influencer database, send compliant outreach to the top 200, and broadcast leaderboard updates every 4 hours to my WhatsApp Community, so I hit 25k votes in 30 days without breaching IG/TikTok ToS or burning out my Twilio number.*

**Approach.** OpenClaw is **the orchestrator, not the scraper**. Apify holds the scraping liability and serves structured JSON. Post Bridge / PostFast hold the platform API tokens. Twilio + SendGrid handle outbound where compliance is well-defined. Supabase + Gemini do the data and personalization. OpenClaw cron + hooks tie them together with daily caps, suppression lists, and idempotent sends.

**Stack.**
- OpenClaw (self-hosted, $20/mo VPS — Hetzner CX22 / Linode 4GB)
- Apify (scraping actors)
- Post Bridge or PostFast (social posting via official platform APIs)
- Twilio WhatsApp Business API + SendGrid (outreach)
- Supabase (`growth.*` schema, pgvector, Realtime, pg_cron as cron backstop)
- Gemini 3.x (Flash for classification, Pro for content gen) — already wired in mdeai

---

## What OpenClaw is — and is NOT

**Verified from `docs.openclaw.ai` + `github.com/openclaw/openclaw` + `github.com/VoltAgent/awesome-openclaw-skills` (May 2026):**

OpenClaw is a self-hosted, open-source (MIT) **agent gateway** that routes one or many AI agents across messaging channels (WhatsApp, Telegram, Discord, Slack, iMessage, Signal, Matrix, MS Teams, Google Chat) plus a skills system that gives the agent tool access. As of May 2026, ClawHub hosts 5,400+ skills (Marketing 103, Search/Scraping 352).

**It IS:** a brain + scheduler + multi-channel messenger + skill runner.

**It is NOT:** a social-media scraper (use Apify), a posting platform (use Post Bridge / PostFast / Mixpost), a CRM (use Supabase), or a way to bypass platform anti-bot.

The single biggest mistake teams make: trying to script raw Instagram/TikTok DMs through OpenClaw. That gets accounts banned in days. The compliant pattern is: OpenClaw → Twilio WhatsApp Business API + SendGrid → human-quality reply rate, zero ban risk.

---

## URL audit (sources verified May 2026)

| URL | Status | Notes |
|---|---|---|
| [docs.openclaw.ai](https://docs.openclaw.ai/) | ✅ Authoritative | Source of truth |
| [github.com/openclaw/openclaw](https://github.com/openclaw/openclaw) | ✅ Authoritative | Main project |
| [VoltAgent/awesome-openclaw-skills](https://github.com/VoltAgent/awesome-openclaw-skills) | ✅ Authoritative | 5,400+ skill index |
| [mergisi/awesome-openclaw-agents](https://github.com/mergisi/awesome-openclaw-agents) | ✅ Real | `multi-account-social` template; 10+ accounts |
| [samehjarour/apify-openclaw-skills](https://github.com/samehjarour/apify-openclaw-skills) | ✅ Real | `apify-influencer-discovery`, `apify-lead-generation`, etc. **No dedicated IG/TikTok actors** — only generic |
| [post-bridge.com/openclaw](https://www.post-bridge.com/openclaw) | ✅ Real | Posts to TikTok / IG / YT / X / LinkedIn |
| [genviral.io/openclaw-social-media](https://www.genviral.io/openclaw-social-media) | ✅ Real | Partner API, 42+ commands |
| [composio.dev/toolkits/instagram/framework/openclaw](https://composio.dev/toolkits/instagram/framework/openclaw) | ✅ Real | Instagram MCP for OpenClaw |
| [improvado.io/blog/openclaw-for-marketing](https://improvado.io/) | ✅ Real publisher | Treat as opinion, not docs |
| [HKUDS/MoChat](https://github.com/HKUDS/MoChat) | ⚠️ Off-topic | Agent-native networking, NOT marketing — skip |
| `github.com/pepicrft/openclaw-plugin-social` | ⚠️ Unverified | Could not confirm; use VoltAgent index instead |
| `lumadock.com/tutorials/...` | ✅ Real | SEO content, not authoritative |
| `tencentcloud.com/techpedia/141366` | ⚠️ Skip | SEO padding |
| `openclaw-hub.com/usecases/index.html` | ⚠️ Unverified | Not from `openclaw.ai` domain |

---

## Top OpenClaw use cases (ranked by ROI for a contest)

1. **Cron-driven leaderboard broadcasts** to WhatsApp Communities every 6h. Native channel, zero ban risk, drives re-votes.
2. **Influencer discovery via Apify** → Gemini classification → Supabase. Apify holds the scraping risk.
3. **Personalized outbound** (WhatsApp Business + Email first; social DM **only after a reply elsewhere**).
4. **Auto-content generation** for top-3 contestants daily (Gemini → Post Bridge).
5. **Event-ops bot** answering voters in WhatsApp DM ("did my vote count", "how do I vote").
6. **Judge briefing assistant** — Telegram private bot summarizing contestant profiles for judges.
7. **Fraud-spike alerts** to admin Signal/Telegram with one-tap shadow-block.
8. **Referral attribution** — voter shares link, OpenClaw tracks UTM + click-through, credits inviter.

What I would **not** use OpenClaw for: scraping IG/TikTok directly (use Apify), mass cold IG/TikTok DMs (you will get banned), being a CRM (use Supabase + a real CRM if you outgrow it).

---

## `growth.*` schema (Postgres)

```sql
-- Influencers, journalists, group admins — anyone we want to talk to
CREATE TABLE growth.contacts (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source          text NOT NULL,                    -- 'apify_ig','apify_tiktok','manual','referral'
  source_handle   text NOT NULL,                    -- '@laurabotero'
  display_name    text,
  platform        text NOT NULL CHECK (platform IN ('instagram','tiktok','twitter','facebook','youtube','whatsapp','email','other')),
  bio             text,
  follower_count  int,
  engagement_rate numeric(5,4),
  niche_tags      text[],                            -- ['beauty','medellin','fashion']
  city            text,
  country         text,
  email           text,
  whatsapp_e164   text,
  embedding       vector(768),                       -- Gemini text-embedding-004
  raw             jsonb NOT NULL,
  opt_out         bool NOT NULL DEFAULT false,
  first_seen_at   timestamptz DEFAULT now(),
  last_refreshed  timestamptz DEFAULT now(),
  UNIQUE (platform, source_handle)
);
CREATE INDEX ON growth.contacts USING ivfflat (embedding vector_cosine_ops);
CREATE INDEX ON growth.contacts (city, platform) WHERE opt_out = false;

-- Saved filter spec for re-use
CREATE TABLE growth.segments (
  id     uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name   text UNIQUE,                                -- 'medellin_beauty_micro'
  filter jsonb NOT NULL                              -- {city:'Medellín',followers:'5k-50k',niche:'beauty'}
);

CREATE TABLE growth.outreach_campaigns (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contest_id    uuid REFERENCES vote.contests(id),
  segment_id    uuid REFERENCES growth.segments(id),
  channel       text NOT NULL CHECK (channel IN ('whatsapp','email','telegram','ig_dm','tiktok_dm')),
  template_key  text NOT NULL,
  status        text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','sending','paused','done')),
  daily_cap     int  NOT NULL DEFAULT 50,            -- compliance limit per channel/account
  created_at    timestamptz DEFAULT now()
);

CREATE TABLE growth.outreach_messages (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id     uuid REFERENCES growth.outreach_campaigns(id),
  contact_id      uuid REFERENCES growth.contacts(id),
  channel         text NOT NULL,
  body            text NOT NULL,
  sent_at         timestamptz,
  delivered_at    timestamptz,
  opened_at       timestamptz,
  replied_at      timestamptz,
  conversion_event text,                              -- 'voted','registered','shared'
  utm_campaign    text,
  ref_token       text,                               -- ?ref=xxx for tracked links
  UNIQUE (campaign_id, contact_id)
);
CREATE INDEX ON growth.outreach_messages (campaign_id, sent_at);
CREATE INDEX ON growth.outreach_messages (ref_token) WHERE ref_token IS NOT NULL;

-- Influencer payouts (1% of paid-vote revenue from their ?ref= link)
CREATE TABLE growth.referral_payouts (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id  uuid REFERENCES growth.contacts(id),
  contest_id  uuid REFERENCES vote.contests(id),
  ref_token   text NOT NULL,
  votes_attributed int NOT NULL DEFAULT 0,
  paid_vote_revenue_cents int NOT NULL DEFAULT 0,
  payout_cents int NOT NULL DEFAULT 0,
  paid_at     timestamptz
);
```

**RLS one-liners:**
- `contacts` — service role only (PII).
- `outreach_*` — service role only.
- `referral_payouts` — SELECT for the contact's owner if they sign up; service role for writes.

---

## Outreach compliance rails (NOT optional)

| Rail | Hard rule |
|---|---|
| Daily cap | 50 sends/day/channel/sender (Twilio + SendGrid threshold). Enforced in `growth.outreach_campaigns.daily_cap`. |
| Suppression list | Any reply containing "no", "stop", "unsubscribe", "remove" → `growth.contacts.opt_out=true` within 24h. OpenClaw inbound hooks watch for this. |
| Bounce monitor | Pause campaign if `bounce_rate > 5%` over a week. |
| Email footer | Static unsubscribe link in every email (CAN-SPAM / Colombia Habeas Data). |
| WhatsApp | Template messages only for first contact. Free-form unlocks for 24h after their reply. |
| IG/TikTok DM | **Never cold.** Only after they replied on email/WA first. |
| Personalization | Reject any Gemini output containing URLs the model invented (regex `https?://` validation). Manual review for first 100 sends per campaign. |

---

## Channel strategy

| Channel | Best content | Frequency | Automation level | Owner |
|---|---|---|---|---|
| **TikTok** | 15s contestant intros + leaderboard countdown overlays | 2/day during contest | Post Bridge auto-post w/ approval | OpenClaw cron + Gemini |
| **Instagram Reels** | TikTok content reposted | 2/day | Auto via Post Bridge | OpenClaw cron |
| **Instagram Stories** | "Vote now" + hourly leaderboard + finalist Q&A | 4–6/day | Auto via Post Bridge | OpenClaw cron |
| **Instagram Feed** | Daily top-5 carousel | 1/day | Manual review, auto-post | Human + Gemini |
| **X / Twitter** | Daily threads + live-tweet finals | 1/day + finals night | Auto via Genviral | OpenClaw cron |
| **Facebook Groups** | Local Medellín community groups | 1/week per group, **native posts only** | **Manual** — auto-posting bans accounts | Community manager |
| **WhatsApp Status / Communities** | Daily leaderboard + 1-tap vote link | 1/day during contest | OpenClaw native + Twilio template | OpenClaw |
| **Telegram broadcast channels** | Same as WA + judge interviews | 2/day | OpenClaw native | OpenClaw |
| **YouTube Shorts** | TikTok content reposted, weekly recap | Daily Shorts, weekly recap | Auto for Shorts; manual for recap | Mixed |

**Growth loops we wire on day one:**

1. **Vote → Share** modal: "Comparte tu voto, gana 3 votos extra mañana." Card with referrer's name.
2. **Influencer → Tracked link** — every influencer gets `?ref=ig_lauraB`. UTM logged in `growth.outreach_messages.conversion_event`. Earn 1% of paid-vote revenue (Stripe Connect).
3. **Top-3 daily auto-post** — every 9pm ART, OpenClaw cron pulls top-3 from `vote.entity_tally`, Gemini writes captions in **en + es-CO** (English first, then Spanish-Paisa), Post Bridge schedules across all channels.
4. **Reply-to-vote on WhatsApp** — voters DM "1", "2", "3" to a Twilio number; OpenClaw `incoming_message` hook calls `vote-cast` edge fn. Twilio number = unique identity → free duplicate-vote protection.

---

## OpenClaw workflows (concrete)

### Workflow A — daily influencer enrichment (cron 02:00 ART)

```yaml
# ~/.openclaw/skills/influencer-enrich/SKILL.md
trigger: cron("0 2 * * *")
steps:
  - apify_run: actor=apify/instagram-hashtag-scraper, hashtag="medellin", limit=500
  - apify_run: actor=apify/tiktok-hashtag-scraper, hashtag="medellinpaisa", limit=500
  - llm_task:
      model: gemini-3-flash-preview
      prompt: |
        Classify niche tags from bio + last 3 captions.
        Return JSON {tags:[],city,is_personal_account:bool,influence_score:0..1}
      schema: {…}
  - supabase_upsert: table=growth.contacts, on_conflict=(platform,source_handle)
  - supabase_rpc: refresh_contact_embeddings()  # Gemini text-embedding-004
  - message_send:
      channel: telegram
      to: admin
      body: "Enrichment: {new_count} new contacts, {refreshed_count} updated."
```

**Verify.** Next morning, `growth.contacts` row count is up by ~500 with non-null `embedding`. Telegram receives the summary.

### Workflow B — outreach send-loop (cron every 30 min, 09:00–18:00 ART)

```yaml
trigger: cron("*/30 9-18 * * *")
guards:
  - daily_cap_check: per (campaign_id, channel)
  - timezone_check: contact local time within 09:00–20:00
steps:
  - supabase_query: |
      SELECT m.id, c.email, c.whatsapp_e164, m.body, m.channel
      FROM growth.outreach_messages m
      JOIN growth.contacts c ON c.id = m.contact_id
      WHERE m.sent_at IS NULL AND c.opt_out = false
      LIMIT 25
  - foreach: row in result
      branch: row.channel == 'email'    → sendgrid.send
      branch: row.channel == 'whatsapp' → twilio.wa.send_template
      branch: row.channel == 'telegram' → openclaw.message_send
  - supabase_update: m.sent_at = now()
```

**Verify.** `growth.outreach_messages.sent_at` is filled within 5 min of run. Twilio/SendGrid dashboards show matching deliveries.

### Workflow C — leaderboard broadcast (cron every 4h during contest)

```yaml
trigger: cron("0 */4 * * *")
guard: vote.contests.status = 'live'
steps:
  - supabase_query: top 5 from vote.entity_tally where contest_id = $current
  - llm_task:
      model: gemini-3-flash-preview
      prompt: "Compose WA broadcast in es-CO Paisa-friendly tone, ≤300 chars, with vote CTA."
  - browser_screenshot: url=https://mdeai.co/vote/{slug}/leaderboard, viewport=mobile
  - message_send:
      channel: whatsapp_community
      to: contest.community_id
      text: $llm_output
      media: $screenshot
  - parallel:
      - postbridge.schedule(platforms=[ig_story, x, tiktok], asset=$screenshot, caption=$llm_output)
```

**Verify.** WhatsApp Community shows the broadcast. Post Bridge dashboard shows scheduled posts.

### Workflow D — fraud-spike alert (event-driven via Postgres NOTIFY)

```yaml
trigger: webhook("/hooks/fraud-spike")  # fired by fraud-scan edge fn
steps:
  - message_send:
      channel: signal
      to: admin
      body: "🚨 {n_votes} suspicious votes from IP cluster {cluster}. Auto-shadow-blocked. /admin/fraud/{batch_id}"
  - poll_create:
      channel: signal
      question: "Confirm shadow-block?"
      options: ["Yes, keep blocked","No, restore","Investigate"]
```

**Verify.** Sending 50 votes from a single IP within 60s triggers a Signal alert with poll.

---

## Architecture (where each thing runs)

```
                        ┌─────────────────────────────────┐
                        │  OpenClaw Gateway (self-hosted) │
                        │  ~/.openclaw on a $20/mo VPS    │
                        └──────────────┬──────────────────┘
                                       │
        ┌────────────────┬─────────────┼─────────────┬────────────────┐
        ▼                ▼             ▼             ▼                ▼
   ┌─────────┐      ┌────────┐   ┌────────┐    ┌──────────┐     ┌──────────┐
   │WhatsApp │      │Telegram│   │ Email  │    │  Apify   │     │PostBridge│
   │Business │      │  Bot   │   │SendGrid│    │ (scrape) │     │ (post)  │
   │ (Twilio)│      └────────┘   └────────┘    └──────────┘     └──────────┘
   └─────────┘                                       │                │
                                                     ▼                ▼
                                       ┌─────────────────────────────────┐
                                       │  Supabase (mdeai project)       │
                                       │  vote.* + growth.* + sponsor.* │
                                       │  pgvector + Realtime + cron    │
                                       └──────────────┬──────────────────┘
                                                      │
                                              ┌───────▼────────┐
                                              │ Gemini 3.x     │
                                              │ classify/embed │
                                              │ /personalize   │
                                              └────────────────┘
```

**Where OpenClaw runs.** Dedicated $20/mo VPS — *not* on Vercel (long-running daemon). One Gateway, one agent for now; multi-agent when each contest organizer gets their own (later).

**Auth model.** OpenClaw → Supabase: service-role JWT in `~/.openclaw/.env`, scoped by RLS to `growth.*` only. OpenClaw → Apify / Twilio / SendGrid / Post Bridge: per-skill API keys in OpenClaw's native `secrets` vault.

**Backstop.** `pg_cron` on Supabase runs Workflow C every 4h *as well*. If OpenClaw is down, the next OpenClaw tick reconciles via "what's the last broadcast time?" — never duplicates, never misses.

**Observability.** OpenClaw 2026 ships OpenTelemetry — pipe to Sentry or Grafana Cloud free tier. Heartbeat to admin Telegram every 6h.

---

## Risks + mitigation

| Risk | Likelihood | Mitigation |
|---|---|---|
| **IG/TikTok ban for mass DM** | Very high if attempted | Don't. Outreach via WA + email; social DM only after first reply elsewhere |
| **WhatsApp template rejection** | Medium | Submit templates 7 days ahead. Template-only first message; free-form after their reply (24h window) |
| **Apify costs spiraling** | Medium | Monthly budget cap in Apify dashboard. Cache results 7 days in Supabase before re-running |
| **OpenClaw VPS down → no broadcasts** | Low | `pg_cron` backstop runs the same Workflow C; reconcile on next tick |
| **Twilio number flagged as spam** | Medium | Warm up gradually (10/day → 50/day over 2 weeks). Rotate sender if delivery drops |
| **Privacy complaint (GDPR / Colombia Habeas Data)** | Medium | Public-source-only scraping. Suppression honored within 24h. DPA with Apify. Clear PII deletion path |
| **Gemini hallucinates personalization** | Medium | Reject any output containing invented URLs. Manual review for first 100 sends per campaign |
| **Vendor lock-in (Post Bridge / Genviral)** | Low | Abstract behind one OpenClaw skill `social-publish` — swap providers without rewriting workflows |
| **Self-hosted gateway = ops burden** | Medium | Use OpenClaw's `gateway install` (systemd) + `openclaw doctor --fix` cron + heartbeat to admin Telegram |

---

## Tasks (executable, in dependency order)

- [ ] **T1.** Provision Hetzner CX22 VPS, install OpenClaw via `curl -fsSL https://openclaw.ai/install.sh | bash`, pair to admin Signal/Telegram. → **Verify:** `openclaw status` clean; `openclaw doctor` passes; heartbeat received.
- [ ] **T2.** Create `growth.*` migration in [`supabase/migrations/`](../../supabase/migrations) with all six tables + RLS policies + FK indexes. → **Verify:** `supabase db push` succeeds; `mcp__ed3787fc-...__get_advisors` returns no security errors.
- [ ] **T3.** Install OpenClaw skills: `apify-influencer-discovery` (samehjarour), `sendgrid`, `twilio-wa`, `postbridge` (or `mixpost` self-hosted). → **Verify:** `openclaw skills list` shows all four; test runs return 200.
- [ ] **T4.** Author SKILL.md for Workflow A (`influencer-enrich`) at `~/.openclaw/skills/influencer-enrich/`. → **Verify:** Manual `openclaw agent --message "run influencer-enrich"` upserts ≥10 rows.
- [ ] **T5.** Author SKILL.md for Workflow B (`outreach-send-loop`). Hard-code the daily cap of 50/channel/sender. → **Verify:** Insert 100 test rows in `growth.outreach_messages`; cron run sends exactly 25; second run blocked by daily cap.
- [ ] **T6.** Author SKILL.md for Workflow C (`leaderboard-broadcast`). → **Verify:** Test contest in `vote.contests` with status='live' triggers a WA broadcast within 5 min of cron tick.
- [ ] **T7.** Wire `pg_cron` backstop for Workflow C as a Supabase scheduled function. → **Verify:** Stop OpenClaw VPS; next 4h boundary still produces a broadcast (via pg_cron).
- [ ] **T8.** Author SKILL.md for Workflow D (`fraud-spike-alert`). Wire to the existing `fraud-scan` edge fn from `01-contests.md`. → **Verify:** Synthetic burst of 50 votes/min triggers Signal poll.
- [ ] **T9.** Build the Vote→Share modal in [`src/pages/Contest.tsx`](../../src/pages) with `?ref=` UTM. → **Verify:** A vote → share click → second user vote with `ref_token` lands in `growth.outreach_messages.ref_token`.
- [ ] **T10.** Build the WhatsApp reply-to-vote pathway via OpenClaw inbound hook → `vote-cast` edge fn. → **Verify:** Send "1" to the Twilio number → vote appears for entity #1 in `vote.votes`.

---

## Cost model

| Line item | Monthly |
|---|---|
| Hetzner CX22 VPS (OpenClaw) | $20 |
| Twilio WhatsApp Business (50/day × 30) | ~$50 |
| SendGrid (200/day × 30) | ~$20 |
| Apify (5 actors, weekly) | ~$30 |
| Post Bridge or Mixpost Pro | ~$29 |
| Gemini API (~10k calls) | ~$15 |
| Supabase | already paid |
| **Total** | **~$165/mo** |

Versus a typical agency engagement at **$5–10k/mo + 4 humans**. The system pays for itself with one $200 sponsor activation.

---

## Real-world walkthroughs

### Beauty pageant — "Reina de Antioquia 2026"

**T-30.** Apify `instagram-hashtag-scraper` runs nightly on `#medellin`, `#paisa`, `#reinaantioquia`, `#beauty`. After 3 nights → 1,800 contacts in `growth.contacts`. Gemini tags niches; top 200 by `engagement_rate × follower_match` scored.

**T-21.** OpenClaw fires Workflow B. 50/day email + 50/day WA template. Personalized line per contact ("vi tu cobertura de Colombiamoda…"). Reply rate **18%** — much higher than cold IG DM would yield.

**T-14.** 36 influencers signed partnerships via Stripe Connect. Each gets `?ref=` link.

**T-7.** Workflow C activated. Every 4h, OpenClaw posts a leaderboard screenshot to WhatsApp Community (5,200 members), plus IG Story + TikTok via Post Bridge.

**T-0 (finals night).** Live X thread auto-posted via Genviral, one tweet per contestant intro. Workflow D fires twice (fraud spikes from 2 VPN ranges) — admin one-taps block in Signal. Winner announced; Gemini writes 3 winner social posts in <60s, Post Bridge schedules.

**Result modeling.** 36 influencers × 4% conversion × 5 votes/converter ≈ 7,200 votes. Plus organic 25k. K-factor 1.4 from referral loop.

### Restaurant ranking — "Best Bandeja Paisa Medellín"

`apify/google-maps-scraper` pulls 340 restaurants in a Medellín polygon → seeded into `vote.entities`. No outreach campaign — OpenClaw's job is purely **engagement**.

WhatsApp Community (foodie group, 2,800 members) gets a daily leaderboard at noon. Voters reply "1", "2", "3" to vote — OpenClaw `incoming_message` hook calls `vote-cast`. Twilio number = unique identity → duplicate-vote protection free.

Top 3 each week get a `🏆` badge auto-applied to their existing `/restaurants/:id` page (already wired in mdeai). Restaurant owner gets a WA notification + "promote your win" link to a Gemini-generated IG Story they can repost.

---

## What I would build first (smallest viable proof)

A single OpenClaw VPS with **only Workflow C** wired to one test contest. No outreach, no Apify, no Post Bridge. That proves OpenClaw → Supabase → WhatsApp end-to-end in **2 days** with one moving part. Once it ticks reliably for 7 days, layer Workflow A (Apify enrichment) then B (outreach send-loop) then D (fraud alerts).

Most marketing-automation projects fail because they wire 8 channels at once. The VoltAgent skills index has 5,400 to choose from — discipline is to pick three.

---

## See also

- [`01-contests.md`](./01-contests.md) — voting engine the broadcasts pull from
- [`03-sponsorship-system.md`](./03-sponsorship-system.md) — sponsor logos that ride along on every broadcast
- [`tasks/openclaw/links.md`](../openclaw/links.md) — OpenClaw doc index
