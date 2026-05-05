I'll review the existing mdeai setup first, then design the voting platform on top of (or alongside) it.

Reviewed the stack. Below is a production-ready voting platform design that **extends the existing mdeai infrastructure** (don't fork — almost every piece you need already exists).

---

# A. What's already in place that you can reuse

|Need for voting platform|Already in mdeai|Status|
|---|---|---|
|Auth (email + OAuth + anon)|Supabase Auth + [useAuth.tsx](https://claude.ai/epitaxy/src/hooks/useAuth.tsx) + [useAnonSession.ts](https://claude.ai/epitaxy/src/hooks/useAnonSession.ts)|✅ reuse|
|Real-time leaderboard|Supabase Realtime + [useRealtimeChannel](https://claude.ai/epitaxy/src/hooks/useRealtimeChannel.ts)|✅ reuse|
|Durable rate limiter|[rate_limit_hits + check_rate_limit RPC](https://claude.ai/epitaxy/supabase/migrations/20260423120000_durable_rate_limiter.sql)|✅ reuse|
|AI inference|6 edge fns on `gemini-3-flash-preview` / `gemini-3.1-pro-preview`|✅ reuse|
|Vector search|pgvector enabled, `ai-search` template|✅ reuse|
|AI cost/quality logging|`ai_runs` table|✅ reuse|
|Idempotency / atomic ops|`p1_crm_idempotency_atomic.sql` pattern|✅ reuse|
|Storage (photos/video)|Supabase Storage buckets (`listing_photos`, `identity_docs`)|✅ reuse|
|Stripe scaffold|`p1_payments` migration|✅ reuse|
|WhatsApp / push|`landlord_v1_whatsapp_notify` + `useNotifications`|✅ reuse|
|Admin shell|`/admin/*` routes + `useAdminAuth` (audit needed)|⚠️ harden first|

**Recommendation:** ship the voting platform as a `vote.*` schema + `/vote/*` routes inside this repo. New product, same Supabase project, same Vercel deploy, same edge runtime. Zero new infra cost.

The user spec mentions Claude+Gemini — **stay on Gemini only**. mdeai's edge stack is Gemini-native and `ai_runs` is already wired for it. Adding Claude doubles secrets, billing, and observability surface for no quality gain.

---

# 1. System overview (plain English)

A user logs in → sees contestants/restaurants in a category → taps Vote (1-click). The vote is signed by their session, deduped on `(user_id, entity_id, day)`, written atomically, and broadcast to a Realtime channel so every viewer sees the leaderboard tick up. Judges see a separate scoring panel. Behind the scenes a fraud worker scores every vote (rule + AI), and a recommender suggests "who you might like" using pgvector embeddings of contestant profiles + user behavior.

Single product, three audiences: **voters**, **contestants/owners**, **judges/admins**.

---

# 2. Architecture diagram

```
┌──────────────────────────────────────────────────────────────────┐
│ CLIENT (Vite/React/shadcn) — same SPA, new /vote routes          │
│   useVoteCast │ useLeaderboard │ useJudgeScore │ useRecommend    │
└──────────┬─────────────────────┬─────────────────────────────────┘
           │ HTTPS               │ WebSocket (Realtime)
┌──────────▼─────────┐ ┌─────────▼──────────┐
│ Vercel Edge        │ │ Supabase Realtime  │ ← postgres_changes on
│ (static + SSR)     │ │ (leaderboard tick) │   vote.entity_tally
└──────────┬─────────┘ └─────────▲──────────┘
           │                     │
┌──────────▼─────────────────────┴──────────────────────────────────┐
│ SUPABASE EDGE FUNCTIONS (Deno)                                    │
│  vote-cast        — auth + rate-limit + dedupe + nonce check      │
│  vote-tally-cron  — refresh leaderboard mat-view every 5s         │
│  judge-score      — weighted score insert, judge-only RLS         │
│  fraud-scan       — Gemini anomaly detector (cron + on-spike)     │
│  content-gen      — Gemini highlight reels, social posts          │
│  recommend        — pgvector kNN + user-behavior re-rank          │
└──────────┬────────────────────────────────────────────────────────┘
           │ pg_net / direct
┌──────────▼────────────────────────────────────────────────────────┐
│ POSTGRES (Supabase) + pgvector + pg_cron                          │
│ vote.* schema · RLS on every table · advisory locks for atomic   │
│ counters · idempotency table · rate_limit_hits (existing)         │
└────────────────────────────────────────────────────────────────────┘
           │
┌──────────▼─────────────────────┐  ┌────────────────────────────┐
│ Gemini (3-flash + 3.1-pro)     │  │ Stripe (paid votes)         │
│ scoring · fraud · content      │  │ via existing p1_payments    │
└────────────────────────────────┘  └────────────────────────────┘
```

---

# 3. Database schema (`vote.*` schema)

Polymorphic, but typed views per domain for indexing.

```sql
-- Top-level container: a single competition / ranking session
CREATE TABLE vote.contests (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug            text UNIQUE NOT NULL,
  kind            text NOT NULL CHECK (kind IN ('pageant','restaurant','event','generic')),
  title           text NOT NULL,
  description     text,
  cover_url       text,
  starts_at       timestamptz NOT NULL,
  ends_at         timestamptz NOT NULL,
  status          text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','live','closed','archived')),
  free_votes_per_user_per_day  int NOT NULL DEFAULT 1,
  paid_votes_enabled           bool NOT NULL DEFAULT false,
  judge_weight_pct             int  NOT NULL DEFAULT 50 CHECK (judge_weight_pct BETWEEN 0 AND 100),
  org_id          uuid NOT NULL REFERENCES public.profiles(id),
  created_at      timestamptz NOT NULL DEFAULT now()
);

-- Sub-buckets within a contest (e.g., "Best Latin Dish", "Talent Round")
CREATE TABLE vote.categories (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contest_id  uuid NOT NULL REFERENCES vote.contests(id) ON DELETE CASCADE,
  slug        text NOT NULL,
  title       text NOT NULL,
  position    int  NOT NULL DEFAULT 0,
  UNIQUE (contest_id, slug)
);

-- The thing being voted on (contestant, restaurant, dish, …)
CREATE TABLE vote.entities (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contest_id   uuid NOT NULL REFERENCES vote.contests(id) ON DELETE CASCADE,
  category_id  uuid REFERENCES vote.categories(id) ON DELETE SET NULL,
  slug         text NOT NULL,
  display_name text NOT NULL,
  bio          text,
  hero_url     text,
  media        jsonb NOT NULL DEFAULT '[]',         -- [{type,url,alt}]
  socials      jsonb NOT NULL DEFAULT '{}',         -- {ig,tiktok,…}
  embedding    vector(768),                          -- Gemini text-embedding-004
  approved     bool NOT NULL DEFAULT false,
  UNIQUE (contest_id, slug)
);
CREATE INDEX ON vote.entities USING ivfflat (embedding vector_cosine_ops);

-- The append-only fact table. NEVER updated.
CREATE TABLE vote.votes (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contest_id      uuid NOT NULL REFERENCES vote.contests(id) ON DELETE CASCADE,
  entity_id       uuid NOT NULL REFERENCES vote.entities(id) ON DELETE CASCADE,
  voter_user_id   uuid REFERENCES auth.users(id),     -- null = anon (still allowed, lower weight)
  voter_anon_id   text,                                -- from useAnonSession
  weight          numeric(6,3) NOT NULL DEFAULT 1.000, -- audience=1, judge=N, paid=M
  source          text NOT NULL CHECK (source IN ('audience','judge','paid')),
  ip_hash         text NOT NULL,                       -- sha256(ip + daily_salt)
  device_hash     text,                                -- fingerprintjs hash
  user_agent      text,
  country         text,
  fraud_score     numeric(4,3),                        -- 0..1, filled by fraud-scan
  fraud_status    text NOT NULL DEFAULT 'pending'
                  CHECK (fraud_status IN ('pending','clean','suspicious','blocked')),
  idempotency_key text NOT NULL,
  created_at      timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX ON vote.votes (idempotency_key);
CREATE INDEX ON vote.votes (contest_id, entity_id, created_at DESC);
CREATE INDEX ON vote.votes (voter_user_id, contest_id, created_at);
CREATE INDEX ON vote.votes (ip_hash, contest_id, created_at);   -- fraud lookups

-- Live counter — updated atomically by a trigger; what the leaderboard reads
CREATE TABLE vote.entity_tally (
  entity_id       uuid PRIMARY KEY REFERENCES vote.entities(id) ON DELETE CASCADE,
  contest_id      uuid NOT NULL REFERENCES vote.contests(id) ON DELETE CASCADE,
  audience_votes  bigint NOT NULL DEFAULT 0,
  paid_votes      bigint NOT NULL DEFAULT 0,
  judge_score     numeric(8,3) NOT NULL DEFAULT 0,
  weighted_total  numeric(12,3) NOT NULL DEFAULT 0,    -- recomputed in trigger
  rank            int,
  trend_24h       numeric(8,3) NOT NULL DEFAULT 0,
  updated_at      timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ON vote.entity_tally (contest_id, weighted_total DESC);

-- Judge layer
CREATE TABLE vote.judges (
  contest_id  uuid REFERENCES vote.contests(id) ON DELETE CASCADE,
  user_id     uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  weight      numeric(4,2) NOT NULL DEFAULT 1.0,
  PRIMARY KEY (contest_id, user_id)
);

CREATE TABLE vote.scoring_criteria (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contest_id  uuid NOT NULL REFERENCES vote.contests(id) ON DELETE CASCADE,
  key         text NOT NULL,                  -- 'beauty','talent','quality',…
  label       text NOT NULL,
  weight_pct  int  NOT NULL CHECK (weight_pct BETWEEN 0 AND 100),
  max_score   int  NOT NULL DEFAULT 10,
  UNIQUE (contest_id, key)
);

CREATE TABLE vote.judge_scores (
  contest_id  uuid REFERENCES vote.contests(id) ON DELETE CASCADE,
  entity_id   uuid REFERENCES vote.entities(id) ON DELETE CASCADE,
  judge_id    uuid REFERENCES auth.users(id),
  criterion_id uuid REFERENCES vote.scoring_criteria(id),
  score       numeric(5,2) NOT NULL,
  comment     text,
  ai_assist_score numeric(5,2),                -- Gemini suggestion side-by-side
  created_at  timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (contest_id, entity_id, judge_id, criterion_id)
);

-- Anti-fraud signals (one row per vote, optional)
CREATE TABLE vote.fraud_signals (
  vote_id     uuid PRIMARY KEY REFERENCES vote.votes(id) ON DELETE CASCADE,
  rules_hit   text[] NOT NULL DEFAULT '{}',     -- ['ip_burst','device_reuse',…]
  ai_label    text,                              -- 'bot','collusion','clean'
  ai_reason   text,
  reviewed_by uuid,
  reviewed_at timestamptz
);

-- Paid votes ledger (delegate to existing p1_payments)
CREATE TABLE vote.paid_vote_orders (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id      uuid REFERENCES public.p1_payments(id),
  contest_id      uuid REFERENCES vote.contests(id),
  entity_id       uuid REFERENCES vote.entities(id),
  buyer_user_id   uuid REFERENCES auth.users(id),
  votes_purchased int NOT NULL,
  votes_credited  int NOT NULL DEFAULT 0,
  created_at      timestamptz NOT NULL DEFAULT now()
);
```

**RLS policies (one-line summary per table):**

- `contests` / `categories` / `entities` — public SELECT where `status='live'`; INSERT/UPDATE only by `org_id = (select auth.uid())` or admin.
- `votes` — INSERT only via `vote-cast` edge fn (service role); SELECT only your own row (`voter_user_id = (select auth.uid())`).
- `entity_tally` — public SELECT; INSERT/UPDATE only by trigger (service role).
- `judges` / `judge_scores` — SELECT/INSERT/UPDATE only by judges of that contest (`exists (select 1 from vote.judges where user_id=(select auth.uid()) and contest_id=…)`).
- `fraud_signals` — service role + admin only.

---

# 4. API design (Supabase Edge Functions)

All follow the existing template at [edge-function-patterns.md](https://claude.ai/epitaxy/.claude/rules/edge-function-patterns.md): CORS → Auth → Zod → logic → `{success,data}`.

|Endpoint|Method|Purpose|Rate limit|
|---|---|---|---|
|`POST /vote-cast`|auth or anon|Cast a free or paid vote|10/min/user, 30/min/IP|
|`GET /leaderboard?contest=…`|public|Top-N for a contest/category (cached 2s edge)|60/min/IP|
|`POST /judge-score`|judge JWT|Submit/update a single criterion score|30/min/judge|
|`POST /paid-vote-checkout`|auth|Create Stripe session, returns redirect URL|6/min/user|
|`POST /paid-vote-webhook`|Stripe sig|Credit votes after payment|n/a|
|`POST /fraud-scan`|cron|Score last 5 min of votes|every 60s|
|`POST /vote-tally-refresh`|cron|Refresh `entity_tally` ranks + 24h trend|every 5s|
|`GET /recommend?user=…`|auth|Personalized "who to vote for"|30/min/user|
|`POST /content-gen`|admin|Generate highlight + social post for entity|10/min/admin|

**Vote cast — request shape:**

```json
POST /vote-cast
{
  "contest_id": "uuid",
  "entity_id":  "uuid",
  "nonce":      "signed JWT from /vote-token",
  "fingerprint":"fpjs visitor id",
  "idempotency_key": "uuid-v4 from client"
}
```

The nonce is a short-lived (60s) JWT issued on page load — kills replay/scripted casts that don't render the page.

---

# 5. AI system design (Gemini-only)

|Capability|Model|Pattern|
|---|---|---|
|**Recommendations**|`text-embedding-004` + behavior re-rank|Embed entity bio+title once on approval. Embed user's last-N voted entities → average → kNN search via pgvector. Re-rank by recency + diversity. Cache per user 10 min.|
|**AI scoring (vision)**|`gemini-3.1-pro-preview`|On entity media upload, call multimodal with a rubric prompt (presentation, composition, expression). Store as `judge_scores` row with `judge_id = system_ai_user`, weight set by contest config. Always shown next to the human judge's score, never replaces it.|
|**Fraud anomaly**|`gemini-3-flash-preview`|Every 60s, build a feature vector per recent voter (vote velocity, IP entropy, device reuse, country mismatch, share-of-burst). Pass to Gemini with a JSON schema → returns `{label, reason, confidence}`. Persist to `fraud_signals`. Hard rules (see §6) run first; AI is the second layer.|
|**Content gen**|`gemini-3.1-pro-preview`|Templated prompts: "highlight reel script", "Instagram caption", "judge briefing". Structured output with Gemini's `responseSchema`.|
|**Recommendation explanation**|`gemini-3-flash-preview`|One sentence per recommendation: "Because you voted for 3 contestants from Antioquia and she's a Medellín native."|

All calls log to `ai_runs(agent_name, input_tokens, output_tokens, duration_ms, status)` — same pattern as the rest of mdeai.

---

# 6. Anti-fraud strategy (5 layers — defense in depth)

|Layer|Where|What it catches|
|---|---|---|
|**L1 — Network**|Vercel WAF + Cloudflare Turnstile on `/vote-cast`|DDoS, headless browsers, datacenter IPs|
|**L2 — Token nonce**|JWT signed by edge fn, 60s TTL, single-use|curl scripts that skip the page render|
|**L3 — Hard DB rules**|Postgres unique indexes + CHECK constraints|Idempotency replay, daily quota, judge double-scoring. Enforced via `CREATE UNIQUE INDEX ON vote.votes (voter_user_id, contest_id, date_trunc('day', created_at))` for free votes|
|**L4 — Behavioral rules**|`vote-cast` checks (synchronous, <30ms)|IP burst > 5/min, device hash reuse across >3 accounts, country/IP mismatch, vote during a known burst window. Each rule appends to `fraud_signals.rules_hit`.|
|**L5 — AI anomaly**|`fraud-scan` cron (async)|Coordinated bot rings, slow-burn collusion, statistically improbable patterns. Updates `fraud_status='suspicious'`; admin reviews in dashboard. Weighted out of leaderboard automatically.|

Plus: **rotating daily IP salt** (so `ip_hash` rotates daily — privacy-preserving fingerprint), **honeypot voter field** in the form (filled = bot), and **shadow-block** for confirmed fraud accounts (their votes are stored but `weight=0`, so they don't realize they've been caught).

The existing [check_rate_limit RPC](https://claude.ai/epitaxy/supabase/migrations/20260423120000_durable_rate_limiter.sql) is what powers L1/L4 server-side limits.

---

# 7. Roadmap (MVP → Advanced)

**MVP — 2 weeks (1 dev)**

- `vote.*` schema + RLS + tally trigger
- `/vote/:contest_slug` page (mobile-first, 1-tap vote)
- `vote-cast` edge fn (Turnstile + nonce + rate limit + L3 hard rules)
- Realtime leaderboard
- Basic admin: create contest, approve entities
- One contest seeded end-to-end

**Growth — weeks 3–6**

- Judge dashboard + `judge-score` + weighted formula
- Stripe paid votes (reuse `p1_payments`)
- Push/email notifications (reuse `useNotifications`)
- Analytics dashboard (votes/entity, revenue, demographics)
- Auth: phone OTP (Supabase) + Google + Apple

**AI layer — weeks 7–10**

- pgvector embeddings + recommendation endpoint
- `fraud-scan` cron with Gemini
- Vision scoring side-panel for judges
- Content generator for organizers
- "Trending now" + smart notifications

**Advanced — beyond**

- White-label per organizer (tenant_id column, subdomain routing)
- iOS/Android via Capacitor wrapping the existing PWA
- Sponsorship placements + ad slots
- Replay-mode video voting (TikTok-style swipe)

---

# 8. Real-world walkthroughs

**Beauty pageant — "Reina de Antioquia 2026"**

1. Organizer creates `contests` row (`kind='pageant'`, free votes = 1/day, paid = $1/vote, judge weight = 60%).
2. 30 contestants uploaded with photos+bio → embeddings generated → `approved=true`.
3. 5 judges invited via email magic link → see judge dashboard with criteria (beauty 30%, talent 30%, Q&A 40%).
4. Public votes open. Mobile share link → tap → Turnstile → 1 vote/day enforced by unique index. Live leaderboard ticks via Realtime.
5. Vote spike at 9pm (TV broadcast). `fraud-scan` flags 200 votes from one VPN range as suspicious — `weight=0`, leaderboard self-corrects.
6. Final score = `0.4 × audience_score + 0.6 × judge_score`. AI generates winner social post + highlight reel.

**Restaurant ranking — "Best Bandeja Paisa Medellín"**

1. `kind='restaurant'`, no judges, audience-only, 3 free votes/week, paid disabled.
2. Restaurants pulled from existing `restaurants` table → `vote.entities` row references it via `external_ref`.
3. Voters open `/vote/best-bandeja` → see cards with photo, distance (reuse `useGoogleDirections`), 1-tap vote.
4. Recommendation panel: "Based on your saved places, you might vote for…" (pgvector + saved_places embedding).
5. Weekly leaderboard email via existing notification system. Winner gets a "Voted #1" badge on their `/restaurants/:id` page.

---

## What I would build first (one paragraph)

A single edge function `vote-cast` + the `vote.contests/categories/entities/votes/entity_tally` tables + a single `/vote/:slug` page wired to Realtime. Nothing else. That gets you a working pageant-grade voting app on the mdeai stack in **3 days**, with rate-limiting, idempotency, and RLS already correct because you reused them. Everything else (judges, paid, AI, fraud) layers on cleanly because the schema separates `source` and `weight` from the start.

---

Want me to start with the `vote.*` migration + `vote-cast` edge function as a tracer-bullet PR? Or expand any section (e.g., full RLS policies, fraud-scan prompt, or the React leaderboard component)?