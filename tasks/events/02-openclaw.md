I need to do real research here, not guess. Let me load the deferred web tools and check the local OpenClaw skill in parallel.

OpenClaw confirmed real. Now let me verify the specific URLs the user gave + research outreach legality.

Research done. Below is the honest, verified design — including which of your 12 URLs are real and which to skip.

---

# 0. URL audit (your 12 sources)

|URL|Status|What it actually is|
|---|---|---|
|`lumadock.com/tutorials/automate-social-media-openclaw-scheduler`|✅ Real|Tutorial site; useful but SEO content, not authoritative|
|`github.com/VoltAgent/awesome-openclaw-skills`|✅ Real|**Authoritative** — curated index of 5,400+ skills (Marketing 103, Search/Scraping 352)|
|`genviral.io/openclaw-social-media`|✅ Real|Genviral Partner API — 42+ commands for posting/analytics across TikTok/IG/YT/FB/Pinterest/LinkedIn|
|`tencentcloud.com/techpedia/141366`|⚠️ Skip|Tencent has tech encyclopedia pages but this looks SEO-padding — not where I'd source|
|`post-bridge.com/openclaw`|✅ Real|Returned a rate limit during my fetch but confirmed in other sources — autonomous poster for TikTok/IG/YT/X/LinkedIn|
|`github.com/openclaw`|✅ Real|Official org|
|`github.com/pepicrft/openclaw-plugin-social`|⚠️ Unverified|I couldn't confirm this exact repo. Don't depend on it until you check — VoltAgent's index is the safer source|
|`github.com/mergisi/awesome-openclaw-agents/.../multi-account-social/SOUL.md`|✅ Real|"10+ account management, scheduling" template — production-ready agent SOUL|
|`github.com/HKUDS/MoChat`|⚠️ Off-topic|Real project, but **not social marketing** — it's an "agent-native chat" platform where AI agents are first-class users. Skip for this use case|
|`github.com/samehjarour/apify-openclaw-skills`|✅ Real|Apify wrapper skills: `apify-influencer-discovery`, `apify-lead-generation`, `apify-competitor-intelligence`, `apify-ultimate-scraper` — **no dedicated IG/TikTok scrapers**, only generic|
|`improvado.io/blog/openclaw-for-marketing`|✅ Real publisher|Improvado is a real marketing-data company; treat their post as opinion, not docs|
|`openclaw-hub.com/usecases/index.html`|⚠️ Unverified|Not from the official `openclaw.ai` domain — could be fan-run. Verify before trusting|

**Authoritative sources to anchor on**: `docs.openclaw.ai`, `github.com/openclaw/openclaw`, `github.com/VoltAgent/awesome-openclaw-skills`, `clawhub` registry. Treat everything else as ecosystem commentary.

---

# 1. Summary (plain English)

OpenClaw is a **self-hosted agent gateway** — it lives on a server you control and routes one (or many) AI agents across messaging channels (WhatsApp, Telegram, Discord, Slack, iMessage, Signal) plus a skills system that lets the agent call tools. It is **not** a social-media scraper or poster by itself. It becomes one by installing skills that wrap third-party SaaS (Post Bridge, PostFast, Genviral, Taisly, Mixpost) or scraping platforms (Apify, Firecrawl).

So the realistic marketing system for your voting platform is:

> **OpenClaw = the brain + the orchestrator.** **Apify / Firecrawl = the scrapers** (managed actors, not your IPs getting banned). **Post Bridge / PostFast / Mixpost = the poster** (they hold the official platform API tokens). **WhatsApp Business API + Email + Telegram = the outreach** (compliant + your channel of advantage in Medellín). **Supabase = the database** (already in mdeai). **Gemini = the content generator** (already in mdeai).

Direct, scripted DM blasts on IG/TikTok will get accounts banned within days. Don't do it. Use the layered approach above.

---

# 2. Top OpenClaw use cases (ranked by ROI for a voting platform)

|Rank|Use case|Why it wins|
|---|---|---|
|1|**Cron-driven leaderboard broadcasts** to WhatsApp/Telegram groups every 6h during a contest|Native channel, zero ban risk, drives re-votes. OpenClaw `automation` (cron) + `polls` are built-in|
|2|**Influencer discovery via Apify actors** → Supabase enrichment|Apify holds the scraping liability; you just consume structured JSON|
|3|**Personalized outbound to influencers** — WhatsApp Business + Email first, then social DM only after a reply elsewhere|Compliant, deliverable, traceable|
|4|**Auto-content generation** for top-3 contestants every day (Gemini → image+caption → Post Bridge)|Already half-built in mdeai|
|5|**Event ops bot** — answer voters/contestants in WhatsApp DM (rules, "did my vote count", verification)|Pure OpenClaw native strength|
|6|**Judge briefing assistant** (Telegram private bot) — gives judges contestant summaries and tracks their scoring|Same as above|
|7|**Fraud-spike alerts** to admin Signal/Telegram with one-tap "shadow-block all from this IP"|Closes the loop with the voting platform|
|8|**Referral attribution agent** — voter shares link, OpenClaw tracks UTM + WhatsApp click-through, credits the inviter|Drives the K-factor|

I would NOT use OpenClaw for: scraping IG/TikTok yourself (use Apify), running mass cold DMs on IG/TikTok (you'll get banned), or as a CDP/CRM (use Supabase + a real CRM if you outgrow it).

---

# 3. Influencer scraping + database system

## Discovery layer (Apify, called from OpenClaw)

|Actor|Cost-ish|Yields|
|---|---|---|
|`apify/instagram-scraper`|$$|Profile, follower count, bio, recent posts, engagement|
|`apify/tiktok-scraper`|$$|Profile, video stats, hashtag co-occurrence|
|`apify/google-maps-scraper`|$|For restaurant rankings — pull all restaurants in a polygon with reviews/photos|
|`apify/twitter-scraper`|$|Local micro-influencers, hashtag activity|
|`apify/facebook-pages-scraper`|$$|Group admins, page reach|

OpenClaw skill `apify-influencer-discovery` (real, in samehjarour repo) wraps these and returns JSON. Schedule it via OpenClaw cron weekly per niche.

## Database schema (extends `vote.*` from previous design)

```sql
-- People we want to talk to: influencers, journalists, group admins
CREATE TABLE growth.contacts (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source          text NOT NULL,          -- 'apify_ig','apify_tiktok','manual','referral'
  source_handle   text NOT NULL,          -- '@laurabotero'
  display_name    text,
  platform        text NOT NULL CHECK (platform IN ('instagram','tiktok','twitter','facebook','youtube','whatsapp','email','other')),
  bio             text,
  follower_count  int,
  engagement_rate numeric(5,4),
  niche_tags      text[],                  -- ['beauty','medellin','fashion']
  city            text,
  country         text,
  email           text,
  whatsapp_e164   text,
  embedding       vector(768),             -- for "find similar to" queries
  raw             jsonb NOT NULL,
  first_seen_at   timestamptz DEFAULT now(),
  last_refreshed  timestamptz DEFAULT now(),
  UNIQUE (platform, source_handle)
);

CREATE TABLE growth.segments (
  id     uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name   text UNIQUE,                                  -- 'medellin_beauty_micro'
  filter jsonb NOT NULL                                -- structured filter spec
);

CREATE TABLE growth.outreach_campaigns (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contest_id    uuid REFERENCES vote.contests(id),
  segment_id    uuid REFERENCES growth.segments(id),
  channel       text NOT NULL CHECK (channel IN ('whatsapp','email','telegram','ig_dm','tiktok_dm')),
  template_key  text NOT NULL,
  status        text NOT NULL DEFAULT 'draft',         -- draft, sending, paused, done
  daily_cap     int  NOT NULL DEFAULT 50,              -- compliance limit
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
  conversion_event text,                                -- 'voted','registered','shared'
  UNIQUE (campaign_id, contact_id)
);
```

**Enrichment loop** (OpenClaw cron, daily):

1. Pull new contacts from Apify run.
2. Gemini classifies niche + writes `niche_tags`.
3. Gemini embeds `display_name + bio + recent_post_text` → `embedding`.
4. Hunter.io / Apollo.io skill resolves email if missing.
5. Score = follower_count × engagement_rate × niche_match. Top 200 per segment.

---

# 4. Outreach automation plan

## Channel priority (compliance-ordered)

1. **Email** (cleanest) — SendGrid, double-opt-in, CAN-SPAM/CASL footer.
2. **WhatsApp Business API** (Twilio or 360dialog or Cloud API) — template messages for first contact, free-form once they reply. **Not** WhatsApp personal automation (that's bannable).
3. **Telegram** — fully API-supported, bot DMs allowed if user has interacted.
4. **IG / TikTok DM** — only **after** they've replied on email/WA. Manual or semi-manual via Post Bridge inbox features. **Never cold blast.**

## Templates (3-touch sequence)

```yaml
# Template 1 — first touch (T+0)
subject: "{{first_name}}, want to crown la próxima Reina de Antioquia?"
body: |
  Hola {{first_name}},
  Soy {{sender_name}} de mdeai.co. Estamos lanzando "{{contest_title}}" 
  en Medellín — votación pública con jurado.
  
  Vi tu trabajo en {{platform}} ({{follower_count_human}} seguidores) y eres 
  exactamente el tipo de creadora que nos encantaría tener cubriendo esto.
  
  ¿15 minutos esta semana? Tenemos paquete de partnership listo.
  
  {{tracking_link}}

# Template 2 — bump (T+3 if no reply)
body: |
  Hola {{first_name}}, ¿alcanzaste a ver mi mensaje del {{day_of_week}}?
  La votación abre el {{contest_starts}}; queremos cerrar partnerships antes.

# Template 3 — break-up (T+7)
body: |
  {{first_name}}, último mensaje. Si no es para ti, sin problema —
  ¿conoces a alguien que podría encajar? Gracias.
```

## Personalization logic (Gemini, in mdeai edge fn `outreach-personalize`)

Input: `contact.bio`, `contact.recent_posts[0:3]`, `contest.title`. Output: a single sentence to **replace** the second-to-last paragraph that references their actual content. Cap at 30 tokens. Reject if the model hallucinates a specific post URL.

## Compliance rails (hard-coded, not optional)

- Daily cap **50 messages per channel per sender account** (Spamhaus/Twilio threshold). `outreach_campaigns.daily_cap` enforces this.
- Suppression list: any reply containing "no", "stop", "unsubscribe", "remove" → `growth.contacts.opt_out=true`. OpenClaw hooks watch for this in WhatsApp/Telegram inbound.
- Track `bounce_rate` per sender; if >5% in a week, pause campaign.
- Keep a static unsubscribe link in every email.

---

# 5. Social media automation strategy

|Channel|Best content|Frequency|Automation level|Who builds it|
|---|---|---|---|---|
|**TikTok**|15s contestant intros + leaderboard updates as countdown overlays|2/day during contest, 0/day off-season|Post Bridge or Taisly (auto-post) + manual approval|OpenClaw cron generates → posts on approval|
|**Instagram Reels**|Same video repurposed from TikTok|2/day|Auto via Post Bridge|OpenClaw cron|
|**Instagram Stories**|"Vote now" links, hourly leaderboard, finalist Q&A|4–6/day|Auto via Post Bridge|OpenClaw cron|
|**Instagram Feed**|Carousel of top-5 + winners|1/day|Manual review, auto-post|Human + Gemini caption|
|**X / Twitter**|Threads on contest stories, live-tweet finals|1 thread/day, live-tweet during finals|Auto via Genviral|OpenClaw cron|
|**Facebook Groups**|Local Medellín community groups (Laureles vecinos, foodies, etc.)|1/week per group, native posts only|**Manual** — auto-posting to groups is the fastest way to get banned|Human community manager|
|**WhatsApp Status / Communities**|Daily leaderboard + 1-tap vote link|1/day|OpenClaw native + Twilio template|OpenClaw automation|
|**Telegram broadcast channels**|Same as WA + judge interviews|2/day|OpenClaw native|OpenClaw automation|
|**YouTube Shorts**|TikTok content reposted, then long-form recap|Shorts daily, recap weekly|Auto via Post Bridge for Shorts; manual for long|Mixed|

## Growth loops to wire

1. **Vote → Share** — after every vote, modal: "Comparte tu voto, gana 3 votos extra mañana." Shareable card with referrer's name.
2. **Influencer → Tracked link** — every influencer gets `?ref=ig_lauraB`. UTM logged in `growth.outreach_messages.conversion_event`. They earn 1% of paid-vote revenue from their link (Stripe Connect to handle payouts).
3. **Top-3 daily auto-post** — every 9pm, OpenClaw cron pulls top-3 from `vote.entity_tally`, Gemini writes captions in 3 languages, Post Bridge schedules across all channels.
4. **Reply-to-vote on WhatsApp** — voters DM "1", "2", "3" to a Twilio number; OpenClaw casts via `vote-cast`. (For free votes only — Twilio numbers are great for fraud protection because each WA number = unique identity.)

---

# 6. OpenClaw workflows (concrete, copy-pasteable)

## Workflow A: Daily influencer enrichment (cron, 02:00 ART)

```yaml
# ~/.openclaw/skills/influencer-enrich/SKILL.md
trigger: cron("0 2 * * *")
steps:
  - apify_run: actor=apify/instagram-hashtag-scraper, hashtag="medellin", limit=500
  - apify_run: actor=apify/tiktok-hashtag-scraper, hashtag="medellinpaisa", limit=500
  - llm_task:
      model: gemini-3-flash-preview
      prompt: "Classify niche tags from bio + last 3 captions. Return JSON {tags:[],city,is_personal_account:bool}"
      schema: {…}
  - supabase_upsert: table=growth.contacts, on_conflict=(platform,source_handle)
  - supabase_rpc: refresh_contact_embeddings()
  - message_send:
      channel: telegram
      to: admin
      body: "Enrichment: {new_count} new contacts, {refreshed_count} updated."
```

## Workflow B: Outreach send-loop (every 30 min, 09:00–18:00 ART)

```yaml
trigger: cron("*/30 9-18 * * *")
guards:
  - daily_cap_check: campaign_id from selected campaigns
  - timezone_check: contact.timezone within 09:00–20:00 local
steps:
  - supabase_query: |
      SELECT m.id, c.email, c.whatsapp_e164, m.body, m.channel
      FROM growth.outreach_messages m
      JOIN growth.contacts c ON c.id = m.contact_id
      WHERE m.sent_at IS NULL AND c.opt_out = false
      LIMIT 25
  - foreach: row in result
      branch: row.channel == 'email' → sendgrid.send
      branch: row.channel == 'whatsapp' → twilio.wa.send_template
      branch: row.channel == 'telegram' → openclaw.message_send
  - supabase_update: m.sent_at = now()
```

## Workflow C: Leaderboard broadcast (every 4h during contest)

```yaml
trigger: cron("0 */4 * * *")
guard: vote.contests.status = 'live'
steps:
  - supabase_query: top 5 from vote.entity_tally where contest_id = $current
  - llm_task:
      model: gemini-3-flash-preview
      prompt: "Compose WhatsApp broadcast in Spanish, Paisa-friendly tone, ≤300 chars, with vote CTA."
  - browser_screenshot: url=https://mdeai.co/vote/{slug}/leaderboard, viewport=mobile
  - message_send:
      channel: whatsapp_community
      to: contest.community_id
      text: $llm_output
      media: $screenshot
  - parallel:
      - postbridge.schedule(platforms=[ig_story, x, tiktok], asset=$screenshot, caption=$llm_output)
```

## Workflow D: Fraud-spike alert (event-driven via Postgres NOTIFY)

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

---

# 7. Tech architecture

```
                        ┌─────────────────────────────────┐
                        │  OpenClaw Gateway (self-hosted) │
                        │  ~/.openclaw on a $20/mo VPS    │
                        └──────────────┬──────────────────┘
                                       │
        ┌────────────────┬─────────────┼─────────────┬────────────────┐
        ▼                ▼             ▼             ▼                ▼
   ┌─────────┐      ┌────────┐   ┌────────┐    ┌──────────┐     ┌─────────┐
   │WhatsApp │      │Telegram│   │ Email  │    │  Apify   │     │PostBridge│
   │Business │      │  Bot   │   │SendGrid│    │ (scrape) │     │ (post)  │
   │ (Twilio)│      └────────┘   └────────┘    └──────────┘     └─────────┘
   └─────────┘                                       │                │
                                                     │                │
                                                     ▼                ▼
                                       ┌─────────────────────────────────┐
                                       │  Supabase (mdeai project)       │
                                       │  vote.* + growth.* schemas     │
                                       │  pgvector + Realtime + cron    │
                                       └──────────────┬──────────────────┘
                                                      │
                                              ┌───────▼────────┐
                                              │ Gemini 3.x     │
                                              │ classify/embed │
                                              │ /personalize   │
                                              └────────────────┘
```

**Where OpenClaw runs**: dedicated $20/mo VPS (Hetzner CX22, Linode 4GB) — _not_ on Vercel (it's a long-running daemon). One Gateway, one agent for now.

**Auth model**:

- OpenClaw → Supabase: service-role JWT in `~/.openclaw/.env`, scoped by RLS to `growth.*` only.
- OpenClaw → Apify: API token via `secrets` (OpenClaw native vault).
- OpenClaw → Twilio/SendGrid/Post Bridge: per-skill API keys, also via `secrets`.

**Observability**: OpenClaw 2026 ships OpenTelemetry — pipe to Sentry or Grafana Cloud free tier.

---

# 8. Risks + mitigation

|Risk|Likelihood|Mitigation|
|---|---|---|
|**IG/TikTok ban for mass DM**|Very high if you do it|Don't. Outreach via WA + email; social DM only after first reply elsewhere|
|**WhatsApp Business template rejection**|Medium|Submit templates ahead of time; template-only for first message; free-form unlocks after their reply (24h window)|
|**Apify costs spiraling**|Medium|Set monthly budget cap in Apify dashboard; cache results 7 days in Supabase before re-running|
|**OpenClaw VPS goes down → no broadcasts**|Low|Cron uses `pg_cron` on Supabase as **backup** — if OpenClaw misses a tick, the next OpenClaw tick reconciles via "what's the last broadcast time"|
|**Twilio number flagged as spam**|Medium|Warm up gradually (10/day → 50/day over 2 weeks); rotate sender if delivery drops|
|**Privacy complaint (GDPR / Colombia Habeas Data)**|Medium|Public-source-only scraping; suppression list honored within 24h; DPA with Apify; clear PII deletion path|
|**Influencer claims fraud (their followers' votes counted)**|Medium|Tracked links per influencer; show them their conversion dashboard so they don't need to claim|
|**Gemini hallucinates personalization**|Medium|Reject any output containing URLs the model invented; manual review for first 100 sends per campaign|
|**Vendor lock-in (Post Bridge / Genviral)**|Low|Abstract behind one OpenClaw skill `social-publish` — swap providers without rewriting workflows|
|**Self-hosted gateway = ops burden**|Medium|Use OpenClaw's `gateway install` (systemd unit) + `openclaw doctor --fix` cron + heartbeat to your Telegram|

---

# 9. MVP → Scale roadmap

**MVP — Week 1–2**

- VPS provisioned, OpenClaw installed, paired to admin Signal/Telegram for ops
- Skills installed: `apify-influencer-discovery`, `sendgrid`, `twilio-wa`, `postbridge`
- `growth.*` schema migrated
- Workflow A (enrichment) running nightly
- Workflow B (outreach) sending to a hand-curated list of 50 influencers
- Workflow C wired but pointed at a test contest

**Growth — Week 3–6**

- Apify hashtag scrapers running for 5 niches
- Outreach scaled to 200 contacts/day across email + WA
- Workflow C live for first real contest (e.g. "Reina de Antioquia")
- Post Bridge generating IG Stories + TikTok every 4h
- Referral attribution wired with Stripe Connect (1% to influencer)

**Scale — Month 2–3**

- Multi-tenant: each contest organizer gets their own OpenClaw agent (multi-agent routing) + Twilio number
- Vector search "find me 50 more influencers like @x" via pgvector kNN on `growth.contacts.embedding`
- AI judge briefing bot (Telegram private)
- Fraud-spike alert → admin one-tap block
- Genviral analytics dashboard plugged into the admin UI

**Advanced — Month 4+**

- Auto-A/B testing of outreach templates (Thompson sampling, 4 variants per segment)
- Voice/Talk Mode to let organizers run contests verbally ("OpenClaw, broadcast top 5 to WA")
- White-label gateway-per-customer (one OpenClaw VPS per organizer they pay for)

---

# 10. Real-world walkthroughs

## A. Beauty pageant — "Reina de Antioquia 2026"

**T-30 days**: Apify `instagram-hashtag-scraper` runs nightly on `#medellin`, `#paisa`, `#reinaantioquia`, `#beauty`. After 3 nights → 1,800 contacts in `growth.contacts`. Gemini tags niches; top 200 by engagement_rate × follower_match scored.

**T-21**: OpenClaw fires Workflow B. 50/day email + 50/day WA template. Personalized line per contact ("vi tu cobertura de Colombiamoda…"). Reply rate 18% (much higher than cold IG DM).

**T-14**: 36 influencers signed partnerships via Stripe Connect. Each gets a `?ref=` link.

**T-7**: Workflow C activated. Every 4h, OpenClaw posts a leaderboard screenshot to WhatsApp Community (5,200 members), plus IG Story, plus TikTok.

**T-0 (finals night)**: Live X thread auto-posted via Genviral, one tweet per contestant intro. Workflow D fires twice (fraud spikes from 2 VPN ranges) — admin one-taps block in Signal. Winner announced; Gemini writes 3 winner social posts in <60s, Post Bridge schedules them.

**Result modeling**: 36 influencers × 4% conversion × avg 5 votes/converter = ~7,200 votes. Plus organic 25k. K-factor 1.4 from referral loop.

## B. Restaurant ranking — "Best Bandeja Paisa Medellín"

Restaurants pulled via `apify/google-maps-scraper` on a Medellín polygon — 340 restaurants seeded into `vote.entities`. No influencer outreach needed; OpenClaw's job is purely **engagement**.

WhatsApp Community (foodie group, 2,800 members) gets a daily leaderboard at noon. Voters reply "1", "2", "3" to vote — OpenClaw `incoming_message` hook calls `vote-cast` edge fn. Twilio number = unique identity, so duplicate-vote protection is free.

Top 3 each week get a `🏆` badge auto-applied to their existing `/restaurants/:id` page (already wired in mdeai). Restaurant owner gets a WA notification + "promote your win" link to a generated IG Story they can repost.

**Engine cost**: Apify $30/mo, Twilio $50/mo, Post Bridge $29/mo, OpenClaw VPS $20/mo, Gemini ~$15/mo, Supabase already paid. **Total <$150/mo to run growth for an entire pageant or ranking** — vs. $5–10k/mo for an agency.

---

## What I would build first (one paragraph)

A single OpenClaw VPS with **only Workflow C** (leaderboard broadcast to WhatsApp Community) wired to one test contest. No outreach, no Apify, no Post Bridge yet. That proves the OpenClaw → Supabase → WhatsApp pipeline end-to-end in **2 days** with one moving part. Once that ticks reliably for 7 days, layer Workflow A (Apify enrichment) and B (outreach send-loop). Most "marketing automation" projects fail because they try to wire 8 channels at once; the VoltAgent skills index has 5,400 to choose from and every one looks good — discipline is to pick three.

---

## Sources

- [OpenClaw Docs](https://docs.openclaw.ai/)
- [openclaw/openclaw on GitHub](https://github.com/openclaw/openclaw)
- [VoltAgent/awesome-openclaw-skills](https://github.com/VoltAgent/awesome-openclaw-skills) — 5,400+ skills, authoritative index
- [mergisi/awesome-openclaw-agents — multi-account-social](https://github.com/mergisi/awesome-openclaw-agents)
- [samehjarour/apify-openclaw-skills](https://github.com/samehjarour/apify-openclaw-skills) — generic scraping; no dedicated IG/TikTok actors
- [Post Bridge × OpenClaw](https://www.post-bridge.com/openclaw)
- [Genviral Partner API](https://www.genviral.io/openclaw-social-media)
- [Composio Instagram MCP for OpenClaw](https://composio.dev/toolkits/instagram/framework/openclaw)
- [DigitalOcean — What is OpenClaw](https://www.digitalocean.com/resources/articles/what-is-openclaw)
- [TikTok Community Guidelines (DM enforcement)](https://www.tiktok.com/community-guidelines)
- [HKUDS/MoChat](https://github.com/HKUDS/MoChat) — _not_ social marketing; agent-native chat platform (skip for this use case)

Want me to scaffold the `growth.*` migration + the three OpenClaw skill SKILL.md files (enrichment, outreach send-loop, leaderboard broadcast) as a tracer-bullet PR? That's the smallest move that proves the architecture works end-to-end.