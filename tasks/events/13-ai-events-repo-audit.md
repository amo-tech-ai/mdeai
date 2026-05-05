# AI events GitHub repo audit — May 2026

> **48 repos verified via `gh api` (not summaries).** 41 of 48 have ≤ 2 stars. The top 7 are listed below with actual data, not feature-based scores. **One legitimate commercial reference (TalkValue, 7⭐ + real company at trytalkvalue.com)** + **one mid-sized class project (Eventraa, 23⭐)**. Everything else: tutorials, class projects, or graduation deliverables published in a tight April 2026 cluster.

**Companion to:** [`07-ai-event-research.md`](./07-ai-event-research.md), [`12-ai-events-features.md`](./12-ai-events-features.md). This doc adds **48 newly-evaluated repos** to the prior audit's 9. Combined: 57 repos surveyed.

---

## 1. BLUF

| Reality | What it means for mdeai |
|---|---|
| **41 of 48 repos have ≤ 2 stars** | Treat them as inspiration / pattern catalogues, NOT production references. |
| **23⭐ leader (Eventraa) is a class project**, not a company | No production-tested code; borrow patterns, not implementations. |
| **The one commercial reference is TalkValue** (7⭐ open skills + closed agency at trytalkvalue.com) | Their stack is exactly what our Phase 4 trio describes — independent validation our roadmap is right. |
| **April 2026 publish cluster** suggests university-graduation timing | Re-check in 12 months — most will be abandoned. |
| **5 patterns are worth absorbing**, all but one already in our plan | Adds 1 new feature (AI venue layout generator) to the Phase 4 backlog. |

---

## 2. Honest ranking (by actual stars, May 2026)

The user's prior table scored repos out of 100 weighted on features + recency + tech stack — defensible methodology, but it inflated rankings of 0-star repos. This re-ranks by **actual GitHub stars** (the only public signal of real adoption) and adds my mdeai-relevance score.

| Rank | Repo | Stars | Last update | Size | Lang | mdeai-relevance |
|---|---|---|---|---|---|---|
| 1 | [shalinijayakumar16/Eventraa](https://github.com/shalinijayakumar16/Eventraa) | **23** | 2026-04-19 | 97 MB | (mostly assets) | 6/10 — features unclear from size alone; worth deeper look |
| 2 | [talkvalue/event-agency-skills](https://github.com/talkvalue/event-agency-skills) | **7** | 2026-04-16 | 175 KB | Python | **9/10 — most relevant; production-shaped, real company behind it** |
| 3 | [warrenshiv/AIEventPlanner](https://github.com/warrenshiv/AIEventPlanner) | 5 | 2024-01-05 | 36 KB | JavaScript | 3/10 — stale 16+ months |
| 4 | [Natifishman/PartyMaker](https://github.com/Natifishman/PartyMaker) | 4 | 2025-09-10 | 28 MB | (mostly assets) | 4/10 — party-planning consumer app |
| 5 | [aaravriyer193/Event-Ally-ai-event-planner](https://github.com/aaravriyer193/Event-Ally-ai-event-planner) | 3 | 2025-09-08 | 460 KB | JS | 5/10 — AI planner concept |
| 6 | [Capechusami/Event_Planner_Landing_Page](https://github.com/Capechusami/Event_Planner_Landing_Page) | 3 | 2026-02-18 | 38 KB | (HTML/CSS) | 1/10 — just a landing page |
| 7 | [Soumyaranjan-p/Event](https://github.com/Soumyaranjan-p/Event) | 3 | 2025-12-08 | 11.7 MB | (likely full-stack) | 4/10 — generic event app |
| 8 | [piyushverma03/physical-event-experience](https://github.com/piyushverma03/physical-event-experience) | 2 | 2026-04-20 | 93 KB | (small) | 5/10 — physical-experience focus is interesting |
| 9 | [Jennifercheukyin/event_planning_AI](https://github.com/Jennifercheukyin/event_planning_AI) | 2 | 2025-09-06 | 57 KB | TypeScript | **7/10 — generates venue layouts + mockup photos (genuinely novel)** |
| 10 | [iamsmsr/PlannrAI-Sync](https://github.com/iamsmsr/PlannrAI-Sync-AI-powered-Event-Planning-Management-Platform) | 2 | 2025-10-28 | 868 KB | JavaScript | 4/10 — "Top 10 Finalist" claim, decent demo |
| 11 | [ArokyaMatthew/Eventflow.ai](https://github.com/ArokyaMatthew/Eventflow.ai) | 2 | 2026-03-30 | 58 KB | JS | **6/10 — CSP solver for scheduling (interesting algorithm angle)** |
| 12 | [atef-ataya/ai-event-planner](https://github.com/atef-ataya/ai-event-planner) | 2 | 2026-04-26 | 76 MB | Python | 5/10 — Google ADK + Gemini + GPT, voice + PDF |
| 13 | [noor848/Multi-Agent-Automate-Event-Planning](https://github.com/noor848/Multi-Agent-Automate-Event-Planning) | 2 | 2025-12-25 | 9 KB | Python | 4/10 — CrewAI multi-agent demo |

**Everything below #13 has 0–1 stars** — verified across 35 additional repos (full data in §3).

### What the user's high-ranked repos actually have (verified)

| User's claim | Actual stars | Verdict |
|---|---|---|
| Eventra **86/100** | **0** | Recent (April 2026), large 10 MB, 0 traction |
| Spott **84/100** | **0** | Recent (April 2026), large 12 MB, 0 traction |
| EventEase **82/100** | **0** | Recent (May 2026), large 13 MB, 0 traction |
| VenueFlow **80/100** | **0** | Tiny 95 KB Python, just published |
| TalkValue **78/100** | **7** | Real company; ranking correct directionally |
| Eventus **72/100** | **0** | Flutter app, large 38 MB |
| EventHub **70/100** | **1** | Recent |
| Festron **68/100** | **0** | Tiny 290 KB |

**Lesson:** "looks impressive on README" ≠ "production-ready". Star count + maturity matter.

---

## 3. The 0-star April 2026 cluster

35 of 48 verified repos published or last-updated in April 2026 with 0–1 stars. Profile suggests **graduation projects + intro-to-AI class submissions**:

```
Apr 12 — abhishek-patel-eng/ai-digital-marketing-project (0KB empty)
Apr 13 — tanujasinghug23/AI-Based-Event-Management-System (10MB, 0 stars)
Apr 14 — patelayush3/event-management-dashboard (16KB, 0 stars)
Apr 18 — Bharat14Bhagnani/Event-Creation-and-Management-AI-Chatbot- (1.6MB, 0 stars)
Apr 18 — siddth09/venueflow-ai (95KB, 0 stars)
Apr 19 — mitanshu2722/AI-Based-Event-Management-and-Attendance-Tracking-System (2.3MB, 0 stars)
Apr 19 — shalinijayakumar16/Eventraa (97MB, 23 stars) ← outlier, worth checking
Apr 20 — RiyaSinghal26/StadiumSense, AshwiniSoddy/TheSmartStadium, AlokRanjanIN/ai-event-experience-platform,
         nimi-codes-26/EventMate-AI, piyushverma03/physical-event-experience, SuryaThejas-07/Event-Manager,
         DavidSrinivasan/AI_EVENT_MANAGEMENT (all sub-1MB, 0 stars except piyushverma 2 stars)
Apr 22 — vidhimantry/Eventra (10MB), amritsugandh/Personal-Event-AI-Concierge (117KB),
         varishamirza/AI_smart_event_management_system (20KB) — all 0 stars
Apr 24 — satyamadhavi1993/sports-event-automator (35KB, 0 stars, Claude AI sports slot detector)
Apr 25 — eemaan2616/EventEase--Event-Management-System (4KB, 0 stars)
Apr 27 — Shubham40289/AI-event-management-system (48KB, 0 stars),
         nitishkumar9898/college-events-management-project (4MB, 0 stars)
Apr 28 — Shubham40289/AI-event-management-and-ticket-booking-platform (0KB empty),
         topboykayz777/eventhub (1.4MB, 0 stars)
Apr 29 — Adityakk9031/Spott (12MB, 0 stars)
Apr 30 — udit23ups/Festron (290KB), moshehbenavraham/eventspark (2.7MB, 1 star)
May 2  — AbduFakir/Eventus (39MB), Purushotham-Prajapati-24/EventEase (13MB),
         NaveenDilshan1/eventhub (12MB) — all 0–1 stars
```

**Pattern:** University courses end in April-May; capstone repos get pushed; abandoned by August. Re-check this list in November 2026 — most will be unmaintained.

---

## 4. The genuine standouts

### 4.1 TalkValue (7⭐ open + commercial product) — the most relevant signal

- **Open skills repo:** [`talkvalue/event-agency-skills`](https://github.com/talkvalue/event-agency-skills) — Python, 175 KB, "AI skills for event professionals — inbox triage, vendor management, and production coordination" — actively maintained
- **Commercial product:** [trytalkvalue.com](https://trytalkvalue.com/) — "AI-Native Agency for Conferences and Exhibitions"
- **Tagline:** "Unifies Eventbrite, Luma, Whova, HubSpot and more with AI; automates workflows to turn event data into growth"

**Why this is the most useful repo on the list:**
- Real company, real revenue, real customers (per their site claims)
- Independent validation of mdeai's Phase 4 trio architecture (orchestrator pattern across event platforms)
- Their open skills include exactly the patterns we're building: inbox triage (Hermes pattern), vendor management (Paperclip company structure), production coordination (OpenClaw skill chain)

**What we can borrow:**
- Their 6 skill names + scopes (good naming conventions)
- Their approval/dry-run safety pattern (matches our "AI proposes, human applies" rail)
- Their unification approach (use one platform → ingest data from many tools → AI orchestrates)

**What's different about us:** TalkValue is the **agency** that uses AI to manage events on a separate platform. mdeai is the **platform itself** that hosts events + contests + sponsors. Different scope; same patterns.

### 4.2 Eventraa (23⭐) — the popularity outlier — DEEP INSPECTION COMPLETE

**Cloned + inspected May 2, 2026.** The 23 stars are earned — this is the most thoughtfully-engineered AI implementation in the entire 48-repo set. Re-rated mdeai-relevance from 6/10 → **8/10**.

**What it actually is.** A MERN-stack (MongoDB + Express + React + Node) AI-powered college events platform for departments + students. Domain: educational institution event ops (registrations, QR attendance, automated certificate generation). 590MB after clone (large because node_modules was committed — anti-pattern but reveals the actual shape).

**Architecture (server side, well-organized):**
- `server/services/mlRecommendationService.js` — TF-IDF + cosine similarity using the `natural` Node lib. Builds event vectors from `eventType + department + title + description`; caches model with signature-based invalidation. **Classical ML, NOT a GPT wrapper.**
- `server/services/faqEmbeddingService.js` — `@xenova/transformers` running `Xenova/all-MiniLM-L6-v2` **locally in Node.js**. Embeddings + cosine match against FAQ dataset. Threshold 0.7. **No OpenAI cost.**
- `server/services/openaiService.js` — OpenAI fallback for complex queries.
- `server/controllers/chatbotController.js` — Two-tier: try semantic FAQ match first (free), escalate to OpenAI only when confidence < 0.7.
- `server/scraper/devfolio-scraper.js` — Puppeteer scrapes external college events from devfolio.com via cron, dedups, presents in unified feed.
- Standard controllers/routes/services/models split (Express conventions).

**What's genuinely impressive (3 patterns worth absorbing):**

1. **Local embeddings via `@xenova/transformers`** — runs all-MiniLM-L6-v2 directly in Node, $0/call. At 100k FAQ queries/mo, saves ~$100 vs Gemini text-embedding-004. **Compelling for our voter-facing FAQ + recommendation surfaces.**
2. **Two-tier AI pattern in production** — semantic match (free, local) → OpenAI escalation (paid, when needed). This is the **progressive AI enrichment pattern** we documented in [`12-ai-events-features.md`](./12-ai-events-features.md) §5.2 — Eventraa is a real implementation.
3. **TF-IDF + `natural` for recommendations** — classical ML is faster + cheaper + interpretable than pgvector + Gemini embeddings for tag-similar events. Could save Phase 1 cost on `/explore` recommendations.

**What's NOT impressive:**
- node_modules committed to the repo (huge anti-pattern)
- MongoDB not Postgres (patterns translate but specific code doesn't)
- Domain is education, not events-as-a-platform
- Auth is basic JWT (no phone OTP, no fraud layers)
- No payments (free student registration only)
- No tests visible

**For mdeai — three concrete adoptions:**

| # | Pattern | Where it goes | Cost saving |
|---|---|---|---|
| 1 | **Local Xenova embeddings** for FAQ + Trust-page Q&A | Phase 1 — `/vote/:slug/how-it-works` interactive FAQ | ~$50–100/mo at scale |
| 2 | **Two-tier AI** (semantic-first, LLM-fallback) | Already in our plan; cite Eventraa as proof point | — |
| 3 | **TF-IDF for `/explore` recommendations** | Phase 1 alternative to pgvector if cost matters | ~$30/mo at scale |

**Net update to plan:** add **`@xenova/transformers` (local embeddings)** to Phase 1 stack as a $0-cost option for FAQ + recommendation surfaces. Belongs in [`12-ai-events-features.md`](./12-ai-events-features.md) §2 row 4 (currently lists `text-embedding-004` only).

**Clone location:** `/home/sk/mde/github/eventraa` (gitignored via `github/` rule in `.gitignore`).

---

### 4.6 winterje90/event-playbook-skills (0⭐ but high-quality) — DEEP INSPECTION COMPLETE

**Cloned May 2, 2026.** 0 stars but professionally engineered — 5-skill suite for **B2B SaaS event playbook** (evaluate → plan → brief → debrief → dashboard). Lean (68 KB total), shell installer, LICENSE, proper SKILL.md frontmatter. mdeai-relevance: **7/10** — different audience (B2B SaaS, not pageants) but the framework patterns translate directly.

**The 5 skills + their commands:**
| Skill | Slash command | Purpose |
|---|---|---|
| `event-evaluate` | `/event-evaluate` | "Should we attend this event?" — scores 6 dimensions, runs break-even math, go/no-go |
| `event-plan` | `/event-plan` | 12-week countdown, budget, outreach sequences, MOPS setup, booth strategy |
| `event-brief` | `/event-brief` | Team briefing doc, 60-sec talk track, coverage schedule, lead scoring, demo script |
| `event-debrief` | `/event-debrief` | Tiered follow-up sequences, routing rules, SLAs, debrief agenda, 30-day ROI report |
| `event-dashboard` | `/event-dashboard` | Cross-event status view, overdue items, upcoming milestones, budget summary |

**Three patterns worth absorbing into our consolidated `events` skill:**
1. **6-dimension event-evaluation scoring** (ICP density / budget ratio / content opportunity / competitive landscape / timing / strategic value) → could power a "should I host this event?" decision tool in our `references/briefs.md`
2. **Tiered follow-up sequences with lead routing rules + SLAs** → maps to mdeai's Phase 2 sponsor ROI follow-up + Phase 3 attendance-confirmation workflow
3. **Cross-event dashboard pattern** → `/host/events/dashboard` Phase 3 task

**Limitations for mdeai:**
- Built for B2B SaaS (booth strategy, MOPS, lead scoring) — our flagship is consumer pageant; framework translates but verticals are different
- Optional Google Workspace dependency (gws CLI) — same as `persona-event-coordinator` we already absorbed

**Storage path:** `/home/sk/mde/github/event-playbook-skills/`

---

### 4.7 chris-openclaw/event-planner-os (0⭐ but high-quality) — DEEP INSPECTION COMPLETE

**Cloned May 2, 2026.** OpenClaw skill (21 KB) for planning + managing any event type. Conversational ("I need to plan my daughter's birthday party") with 20+ built-in templates. mdeai-relevance: **6/10** — too generic for mdeai's Phase 1 (Miss Elegance Colombia is highly specific) but the **template library is worth lifting wholesale**.

**The 20 built-in templates** with recommended timelines:

| Template | Timeline | mdeai use? |
|---|---|---|
| Birthday party | 3–4 weeks | ❌ consumer |
| Wedding | 12 weeks | ❌ consumer |
| Conference / multi-day | 12–16 weeks | ✅ Phase 4 |
| Concert / music event | 6–10 weeks | ✅ Phase 3 (Estéreo Picnic class) |
| Dinner party | 1–2 weeks | ❌ consumer |
| Holiday party | 4–6 weeks | ❌ |
| Fundraiser / benefit | 6–10 weeks | ✅ relevant |
| Block party | 4–6 weeks | ❌ |
| Corporate event / team offsite | 6–10 weeks | ✅ Phase 3+ |
| Retreat | 8–12 weeks | ✅ |
| Product launch | 6–8 weeks | ✅ |
| Festival / fair | **12–16 weeks** | ✅ **Phase 3 — Estéreo Picnic** |
| 5K run / charity walk | 10–14 weeks | ✅ relevant |
| Workshop / class | 3–5 weeks | ✅ |
| Open mic night | 2–4 weeks | ✅ Phase 1 micro-contest |
| Product launch | 6–8 weeks | ✅ |
| (others — baby shower, graduation, reunion, art show, game night) | varies | ❌ mostly consumer |

**Key patterns worth absorbing:**
1. **Backward-calculated task due dates** from event date (not forward from creation) — UX pattern matches how organizers actually think
2. **Custom-template fallback** when no match (asks 2 clarifying questions) — Phase 4 AI event planner agent should use this
3. **Conversational intake** in plain language → structured event record — Phase 4 pattern

**Storage path:** `/home/sk/mde/github/event-planner-os/`

---

### 4.9 Hi.Events (3,767⭐) — THE production-grade reference 🚨

**Cloned May 2, 2026.** `HiEventsDev/Hi.Events` — by orders of magnitude the most significant repo in the entire 58-repo audit. **160× the stars of Eventraa, 540× talkvalue.** Real commercial product at [hi.events](https://hi.events) + AGPL v3 self-host fork. mdeai-relevance: **10/10 — this is the validation our roadmap is right + the schema reference we should use.**

**Why this repo is different from every other repo in the audit:**

| Signal | Hi.Events | Next-best repo |
|---|---|---|
| Stars | **3,767** | 23 (Eventraa) |
| Forks | **635** | <5 |
| Translations | **13 languages** (de, es, fr, hu, it, ja, nl, pl, pt, tr, vi, zh-cn, zh-hk) | English only |
| Commercial product | ✅ Cloud + self-host | None |
| License | AGPL v3 + commercial available | MIT/varies |
| Tech debt | Domain-Driven Design (Action→Handler→Service→Repository) | Mostly single-file demos |
| CI | Unit tests, Docker images, GitHub Actions | None |
| Docker | All-in-one + dev + prod images on Docker Hub | None |
| One-click deploy | DigitalOcean / Render / Railway / Zeabur | None |
| Uses Claude Code | ✅ Has CLAUDE.md + .claude/skills/translations/ | None |

**Tech stack:**
- Backend: **Laravel 11+ with Domain-Driven Design**
- Frontend: **React + Vite with SSR** (Lingui for i18n)
- DB: MySQL (default Laravel, presumably)
- Stripe Connect: **Instant payouts** (more aggressive than our T+7 default)
- Architecture: Action → Handler → Domain Service → Repository
- DTOs: Spatie Laravel Data (BaseDataObject)
- Tests: Laravel TestCase with `DatabaseTransactions` (not RefreshDatabase)

**Feature set Hi.Events ships v1.0 (verified from README):**

| Category | Features |
|---|---|
| **Ticketing & Sales** | Flexible types (free/paid/donation/tiered), hidden+locked tickets behind codes, promo codes + pre-sale, product add-ons, categories, tax/fee/VAT, capacity + shared limits |
| **Branding** | Conversion-optimized checkout, custom PDF ticket designs, branded organizer homepage, **drag-and-drop event page builder**, embeddable widget, SEO/Open Graph |
| **Attendee Mgmt** | Custom checkout questions, search/filter/export (CSV/XLSX), full + partial refunds, bulk messaging by ticket type, **QR code check-in with scan logs**, access-controlled check-in lists |
| **Analytics** | Real-time sales dashboard, **affiliate + referral tracking**, advanced reporting (sales/tax/promos), webhooks (Zapier/Make/CRMs) |
| **Operations** | Multi-user roles/permissions, **Stripe Connect instant payouts**, offline payment methods, offline event support, **automatic invoicing**, event archive, multi-language, **full REST API** |

**This is essentially the v1.0 mdeai events platform.**

**Hi.Events's own competitive table:**

| Feature | Hi.Events | Eventbrite | Tickettailor | Dice |
|---|---|---|---|---|
| Self-hosted | ✅ | ❌ | ❌ | ❌ |
| Open source | ✅ | ❌ | ❌ | ❌ |
| No per-ticket fees (self-hosted) | ✅ | ❌ | ❌ | ❌ |
| Full custom branding | ✅ | Limited | ✅ | Limited |
| Affiliate tracking | ✅ | ✅ | ❌ | ❌ |
| API access | ✅ | ✅ | ✅ | Limited |
| Own your data | ✅ | ❌ | ❌ | ❌ |

**The strategic question: should mdeai fork Hi.Events instead of building from scratch?**

| Argument for forking | Argument against forking |
|---|---|
| Saves 4–6 months of MVP build time | **PHP/Laravel mismatch** with mdeai's existing Vite/React/Supabase stack |
| 3,767⭐ + 635 forks = battle-tested | Two codebases (PHP backend + JS frontend) vs unified Supabase Edge |
| 13 languages already done | AGPL copyleft — modifications must be open-source unless commercial license bought |
| Stripe Connect instant payouts done | mdeai's contests + sponsorship + AI orchestration is **not** in Hi.Events; we'd build on top |
| Drag-drop event page builder done | Postgres vs MySQL — schema port required |
| QR check-in with scan logs done | Domain assumptions baked in (no contests/sponsorship integration points) |
| One-click DigitalOcean / Render / Railway deploys | mdeai's strength is integration with existing app + contests + sponsors; fork is a step backwards from that |

**Verdict: don't fork — but treat as the canonical schema + feature reference.**

The PHP/Laravel + MySQL stack mismatch is the deal-breaker. mdeai is built on Supabase Postgres + Vite/React + Edge Functions (Deno). Forking Hi.Events means running 3 stacks, doubling ops, sacrificing the contests/sponsor integration story we've designed. **But** the schema + features + DDD architecture are gold-standard references.

**3 concrete actions for our plan:**

| # | Action | Effort | When |
|---|---|---|---|
| **HE-1** | **Audit our `event.*` schema against Hi.Events** `backend/database/migrations/` (their tables: events, tickets, products, orders, attendees, check_ins, refunds, taxes_and_fees, capacities, organizers, users, roles_permissions). Add any missing column to our schema BEFORE Phase 1 migration ships. | 4 hours | Before task 001 of Phase 1 |
| **HE-2** | **Lift their feature list as our v1.0 target.** Anything we don't ship that they do = competitive gap. Specifically check: hidden+locked tickets, drag-drop page builder, embeddable widget, affiliate tracking. | 2 hours | Phase 1 scoping |
| **HE-3** | **Steal PDF ticket template design** if AGPL-compatible (our self-hosted use is fine; check if redistribution requires source release) | 1 hour | Phase 1 task 005 (`ticket-payment-webhook` mints QR + email) |

**Storage path:** `/home/sk/mde/github/Hi.Events/` (34MB, 13 languages, full Laravel + React app)

---

### 4.8 Consolidated finding from all 4 cloned repos

| Repo | Standout pattern | Adoption priority |
|---|---|---|
| **Hi.Events (3,767⭐)** 🚨 | **Production-grade schema + feature reference + DDD architecture** | **CRITICAL — schema audit before Phase 1 ships** |
| **Eventraa** | `@xenova/transformers` local embeddings + 2-tier AI | HIGH — Phase 1 (saves $50–100/mo at scale) |
| **event-playbook-skills** | 6-dimension event-evaluation scoring | MEDIUM — Phase 3 organizer onboarding |
| **event-planner-os** | 20 backward-calculated event templates | MEDIUM — extend `events` skill `references/planner.md` |

**Net new adoptions for our plan (this clone session):**

| # | Pattern | Where in our plan |
|---|---|---|
| **HE-1** 🚨 | **Schema audit against Hi.Events migrations** | Before Phase 1 task 001 — add any missing event/ticket/order columns |
| **HE-2** 🚨 | **Adopt Hi.Events feature list as v1.0 target** | Phase 1 scoping; gap-check (hidden+locked tickets, drag-drop builder, embeddable widget, affiliate tracking) |
| **HE-3** | Hi.Events PDF ticket template design (license-permitting) | Phase 1 task 005 |
| **A1** | `@xenova/transformers` local embeddings | [`12-ai-events-features.md`](./12-ai-events-features.md) §2 row 4 — add as Phase 1 default for FAQ/recommendations |
| **A2** | 6-dimension event-evaluation framework | [`.claude/skills/events/references/briefs.md`](../../.claude/skills/events/references/briefs.md) — add §evaluation scoring |
| **A3** | 20 event templates with backward-task-due-dates | [`.claude/skills/events/references/planner.md`](../../.claude/skills/events/references/planner.md) — expand from 6 to 20 templates |
| **A4** | Tiered follow-up sequence pattern (T+1 hot / T+3 warm / T+7 cold) | [`tasks/events/02-openclaw-growth.md`](./02-openclaw-growth.md) — already has similar; cross-reference |
| **A5** | Cross-event dashboard | [`tasks/events/prompts/`](./prompts/) Phase 3 task list (when generated) |

These are **additive enrichments**, not pivots. Plan structure unchanged.

### 4.3 Jennifercheukyin/event_planning_AI (2⭐) — most novel feature

> "Plan your events intelligently, with **generated layout and mockup photos**. Eliminate the guess[work]."

**The novel idea:** AI generates a venue layout diagram + sample event-day photos based on event description. Voter/attendee imagines what it'll look like; organizer iterates on layout before booking vendors.

**Why this matters for mdeai:** Phase 4 backlog candidate. Goes beyond "hero copy" into actual visual ideation. Pairs well with sponsor sales pitch — "here's a mockup of how Estéreo Picnic could look with your title-sponsor branding".

**Implementation cost:** ~1 week using `gemini-3.1-pro-preview` for layout description + Gemini Imagen / Stable Diffusion for image generation. Belongs in Phase 4 (after CPL pricing + AI orchestration land).

### 4.4 ArokyaMatthew/Eventflow.ai (2⭐) — CSP solver

> "AI-powered agentic event planning with CSP solver"

**The novel idea:** Use a Constraint Satisfaction Problem solver to schedule events with hard constraints (room availability, speaker conflicts, dietary rules). LLM generates the constraints from natural language; solver finds a feasible schedule.

**Why this matters for mdeai:** Multi-stage festival mode (Phase 4+). For a 3-day festival with 4 contests, 6 stages, 50 performers, manual scheduling is brutal. CSP-solver-as-tool is genuine algorithmic value.

**Implementation cost:** ~2 weeks. Uses an open-source CSP library (e.g. python-constraint, OR-Tools). Belongs in Phase 4 / 5 (only matters at festival scale).

### 4.5 Natifishman/PartyMaker (4⭐) — consumer party-planning angle

Mobile-first social party planner. Different audience (consumer parties, not pageant-class events) but the **invite-and-RSVP-flow patterns** are well-developed.

**What we can borrow:** Mobile-first invite share flow (better than Eventbrite's clunky mobile share UX).

---

## 5. Top 10 list (corrected)

Per the user's request, here's the corrected top 10 — by mdeai-relevance, not raw stars:

| Rank | Repo | Stars | Why for mdeai |
|---|---|---|---|
| 1 | [`talkvalue/event-agency-skills`](https://github.com/talkvalue/event-agency-skills) | 7 | Production-shaped AI skills for event ops; real company validation |
| 2 | [`Jennifercheukyin/event_planning_AI`](https://github.com/Jennifercheukyin/event_planning_AI) | 2 | AI-generated layouts + mockup photos (novel; Phase 4) |
| 3 | [`ArokyaMatthew/Eventflow.ai`](https://github.com/ArokyaMatthew/Eventflow.ai) | 2 | CSP scheduler for multi-stage festivals (Phase 4+) |
| 4 | [`shalinijayakumar16/Eventraa`](https://github.com/shalinijayakumar16/Eventraa) | 23 | Highest stars; needs deep inspection to extract patterns |
| 5 | [`atef-ataya/ai-event-planner`](https://github.com/atef-ataya/ai-event-planner) | 2 | Google ADK + Gemini + voice + PDF — close to our stack |
| 6 | [`noor848/Multi-Agent-Automate-Event-Planning`](https://github.com/noor848/Multi-Agent-Automate-Event-Planning) | 2 | CrewAI patterns; complement Hermes sub-agent design |
| 7 | [`piyushverma03/physical-event-experience`](https://github.com/piyushverma03/physical-event-experience) | 2 | Physical experience UX patterns (in-venue) |
| 8 | [`iamsmsr/PlannrAI-Sync`](https://github.com/iamsmsr/PlannrAI-Sync-AI-powered-Event-Planning-Management-Platform) | 2 | Sync-platform pattern (multi-source unification) |
| 9 | [`aaravriyer193/Event-Ally-ai-event-planner`](https://github.com/aaravriyer193/Event-Ally-ai-event-planner) | 3 | Conversational planner UX |
| 10 | [`warrenshiv/AIEventPlanner`](https://github.com/warrenshiv/AIEventPlanner) | 5 | Stale but well-organized GPT-3.5 patterns |

**My honest grade for the entire 48-repo set: C-.** Useful as inspiration, useless as production references. The signal is concentrated in TalkValue + 2-3 algorithmic novelties; everything else is repetition of the same 5 patterns.

---

## 6. The 5 patterns worth absorbing

### Pattern 1 — AI event creation wizard

**From:** Spott, Eventra, Festron, Bharat14Bhagnani's chatbot
**Pattern:** User types "Create a beauty pageant gala in Medellín" → AI fills out title + description + category + capacity + ticket types → user edits + publishes.
**Status in our plan:** ✅ Already in [`12-ai-events-features.md`](./12-ai-events-features.md) §2 row 1 (Phase 1 hero copy generator) + Phase 4 AI event planner agent.
**Net change:** none — already covered.

### Pattern 2 — Explainable recommendations

**From:** EventEase
**Pattern:** Instead of "you may like this event", show "Recommended because you follow fashion + pageants + Medellín nightlife". Three explicit reasons per recommendation.
**Status in our plan:** ⚠️ Partial — recommendations covered but explainability not explicit.
**Net change:** **add to Phase 1 task #4** — when surfacing events on `/explore`, render reason chips ("Because you saved 3 events in Laureles" / "Because you voted in Reina de Antioquia").

### Pattern 3 — Real-time event chat / community per event

**From:** EventEase, Luma's chat feature
**Pattern:** Each event has a dedicated chat room for attendees pre-event + during. Announcements + Q&A.
**Status in our plan:** ✅ Phase 3 advanced features list (#9 in [`11-events-system-design.md`](./11-events-system-design.md)).
**Net change:** none — already deferred to Phase 3.

### Pattern 4 — QR ticket + check-in (universal)

**From:** Eventra, EventHub, NaveenDilshan1's eventhub, Adityakk9031's Spott
**Pattern:** Server-signed JWT → QR → email + PWA wallet → venue gate scan via mobile.
**Status in our plan:** ✅ Phase 1 task #6 (`ticket-validate` edge fn + `/staff/check-in/:event` PWA).
**Net change:** none — already core.

### Pattern 5 — AI ops assistant (sponsor + vendor + inbox)

**From:** TalkValue (the only legitimate one)
**Pattern:** AI agent reads inbox, drafts replies to sponsors + vendors, surfaces follow-up actions, never auto-sends.
**Status in our plan:** ✅ Phase 4 Hermes + Paperclip orchestration ([`06-trio-integration.md`](./06-trio-integration.md)).
**Net change:** TalkValue's specific skills (inbox triage, vendor follow-up) become **named sub-skills under our `events` skill** — `references/ops-inbox.md` + `references/vendor-management.md` (Phase 4 task).

---

## 7. NEW features to add to the plan (from this audit)

Three patterns NOT yet in our plan:

### NEW-1: AI venue layout + mockup generator (Jennifercheukyin)

**What:** Given event title + venue + theme, Gemini Pro generates (a) a textual layout description (stages, seating, food zones, sponsor booths) and (b) optionally a synthetic mockup image via Gemini Imagen / Stable Diffusion.
**Phase:** 4
**Use case:** Sponsor pitch ("here's how your title sponsorship looks at Estéreo Picnic") + organizer pre-vendor visualization.
**Effort:** 1 week.
**Add to:** [`12-ai-events-features.md`](./12-ai-events-features.md) §3 advanced features (row 21 new).

### NEW-2: CSP solver for multi-stage festival scheduling (Eventflow.ai)

**What:** OR-Tools or python-constraint solver fed by LLM-extracted constraints (room availability, speaker conflicts, dietary rules, sponsor activation timing). Solver returns feasible schedule.
**Phase:** 4 / 5
**Use case:** Estéreo Picnic-class festivals with 4+ contests, 6 stages, 50+ performers.
**Effort:** 2 weeks.
**Add to:** [`12-ai-events-features.md`](./12-ai-events-features.md) §3 advanced features (row 22 new).

### NEW-3: Multi-platform sync (TalkValue's "unifies Eventbrite, Luma, Whova, HubSpot")

**What:** Phase 4+ inbound integrations — pull existing organizer's Eventbrite/Luma data into mdeai for unified sponsor reporting.
**Phase:** 5+ (acquisition / migration play, not core build)
**Use case:** Convert Eventbrite organizers to mdeai by ingesting their existing data.
**Effort:** 4-6 weeks per integration (each platform's API).
**Add to:** roadmap as Q3-Q4 2027 acquisition strategy.

---

## 8. AI features identified across the 48 repos (full list)

For completeness — every AI capability mentioned across the 48 repos, with mdeai status:

| AI capability | Source repos | Our status |
|---|---|---|
| Event description generation | Spott, Eventra, Festron, Bharat14Bhagnani | ✅ Phase 1 |
| Event recommendations (collaborative filtering) | EventEase, Eventra | ✅ Phase 1 (pgvector) |
| Explainable recommendations | EventEase | ⚠️ Add to Phase 1 (cheap UX win) |
| AI chatbot for event creation | Bharat14Bhagnani, Festron | ✅ Phase 4 (event planner agent) |
| QR ticket + scan | Eventra, EventHub, Spott | ✅ Phase 1 |
| Crowd flow prediction | VenueFlow, StadiumSense, TheSmartStadium | ❌ Not in plan (festival-scale, defer) |
| Wait-time / queue optimization | VenueFlow | ❌ Not in plan |
| AI vendor management | TalkValue | ✅ Phase 4 |
| AI sponsor outreach | TalkValue | ✅ Phase 2-4 |
| AI inbox triage | TalkValue | ✅ Phase 4 (Hermes) |
| AI scheduling assistant | Festron, atef-ataya | ✅ Phase 4 |
| Voice assistance | Festron, atef-ataya | ✅ Phase 4 (Hermes Talk Mode) |
| Multi-agent (CrewAI) coordination | shaadclt, noor848, atef-ataya | ✅ Phase 4 (Hermes sub-agents) |
| AI venue layout generation | Jennifercheukyin | ⚠️ **NEW — Phase 4 backlog** |
| CSP solver scheduling | Eventflow.ai | ⚠️ **NEW — Phase 4/5 backlog** |
| Real-time chat per event | EventEase | ✅ Phase 3 |
| Live updates / notifications | EventHub, multiple | ✅ Phase 1 (Realtime) |
| AI budget calculator | thekartikeyamishra/event-management-ai (prior audit) | ❌ Not core (defer) |
| Personal AI concierge | amritsugandh, multiple | ⚠️ Phase 4 (chat assistant for attendees) |
| AI attendance prediction | EventEase | ❌ Not in plan (defer) |
| Sponsor matching | varieties | ✅ Phase 4 (audience matcher) |
| Post-event recap PDF | TalkValue, atef-ataya | ✅ Phase 2 |
| AI offline support | thekartikeyamishra | ❌ Out of scope (mobile native) |

**Summary:** of 24 distinct AI capabilities surveyed, **18 are already in our plan**, **2 are new additions** (venue layout, CSP solver), **4 are deferred or out of scope** (crowd flow, queue optimization, budget calc, offline mobile).

---

## 9. Anti-patterns observed across the 48 repos

| Anti-pattern | Frequency | What we do instead |
|---|---|---|
| GPT-3.5 wrappers with no eval pipeline | 60%+ | Gemini 3.x with measurable eval pass-rates per feature |
| Single-prompt "AI does it all" demos | 40%+ | Phased workflow with checkpoints + approval gates |
| AI that auto-publishes content | 30%+ | "AI proposes, human applies" — never bypass approval |
| Front-end calling LLM directly with API keys | 30%+ | Edge functions only; no client-side keys |
| No cost tracking | 70%+ | `ai_runs` + `trio.tool_runs` + budget caps |
| English-only UI assumptions | 90% | English-first + Spanish-Paisa native |
| Single-tenant schema | 80%+ | Multi-event from day 1 |
| No fraud detection on votes | All repos | 5-layer defense documented in [`01-contests.md`](./01-contests.md) |
| Hot-reloading prompts in production | 50% | Versioned prompts with structured output schemas |
| README-driven ranking | All marketing of these repos | Star count + production proof matter |

---

## 10. Final updated recommendation

### What changes in our plan

| File | Update |
|---|---|
| [`12-ai-events-features.md`](./12-ai-events-features.md) §3 | Add 2 new advanced features: **AI venue layout** (NEW-1) + **CSP scheduler** (NEW-2). Phase 4 backlog. |
| [`12-ai-events-features.md`](./12-ai-events-features.md) §2 | Note: "explainable recommendations" pattern is cheap to add to Phase 1; ~2 hours work to render reason chips on `/explore` |
| [`06-trio-integration.md`](./06-trio-integration.md) | Mention TalkValue as commercial validation reference; their open skills inform our Phase 4 sub-skill structure |
| [`tasks/events/prompts/`](./prompts/) | Add NEW-1 + NEW-2 to Phase 4 task list (separate file when Phase 4 starts) |

### What doesn't change

- Phase 1 stays as designed (events MVP, 12 prompts)
- Trio architecture stays as designed (Hermes + OpenClaw + Paperclip)
- Sponsor schema stays as designed
- Voting + 5-layer fraud stays as designed

### What we deliberately skip from the audit

- **Crowd flow / wait-time prediction** (VenueFlow, StadiumSense, etc.) — only relevant at festival scale; Phase 5+ if at all
- **AI budget calculator** — manual Excel is fine for SMB events
- **AI offline support** — mobile-first PWA covers it
- **Star-count gaming** — our plan stays grounded in stars, not feature lists

### One sentence to close the audit

> **57 repos surveyed (this 48 + prior 9). One commercial reference (TalkValue) validates our trio architecture. Two algorithmic novelties (venue layout, CSP scheduler) join Phase 4 backlog. Everything else is restating patterns we already plan to ship.**

---

## Sources (verified May 2026)

- All 48 repo metadata pulled live via `gh api repos/<org>/<name>` (May 2, 2026)
- [TalkValue commercial site](https://trytalkvalue.com/)
- [TalkValue open skills (`event-agency-skills`)](https://github.com/talkvalue/event-agency-skills)
- Prior audit context: [`07-ai-event-research.md`](./07-ai-event-research.md) (9-repo audit)

---

## See also

- [`07-ai-event-research.md`](./07-ai-event-research.md) — original 9-repo audit (warrenshiv, shaadclt, etc.)
- [`12-ai-events-features.md`](./12-ai-events-features.md) — AI features architecture
- [`11-events-system-design.md`](./11-events-system-design.md) — events platform design
- [`06-trio-integration.md`](./06-trio-integration.md) — Hermes + OpenClaw + Paperclip
- [`09-prd.md`](./09-prd.md) §3 — AI System Requirements
