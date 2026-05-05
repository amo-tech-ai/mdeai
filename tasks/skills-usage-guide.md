# How to use skills for mdeai development

> **BLUF:** mdeai has **two separate skill universes** that serve different runtimes. **Claude Code skills** (`.claude/skills/`) help the founder/dev write code, plan, and debug — they run *only* in Claude Code on your laptop. **Runtime agent skills** (agentskills.io for Hermes, ClawHub for OpenClaw, Paperclip company skills) help the production agents run automations against real users — they run *only* on the VPS in Phase 4. Both share format compatibility (agentskills.io spec) but have **different deployment, secrets, and observability paths**. Putting a Claude Code skill into a Hermes agent is occasionally smart and usually wrong.

This doc is the practical companion to [`skills-audit.md`](./skills-audit.md). The audit answered "do we have too many skills?" (yes). This one answers "how do we use the right ones at the right time?"

---

## 1. Two universes — pick the right one

| | **Claude Code skills** | **Runtime agent skills** |
|---|---|---|
| **Where they live** | `.claude/skills/` (this repo) | Hermes: `~/.hermes/skills/` on VPS · OpenClaw: `~/.openclaw/skills/` on VPS · Paperclip: per-company in DB |
| **Who uses them** | You + Claude Code (during dev/planning) | Production agents serving real users |
| **When they run** | Your laptop, while you're working | 24/7 on the VPS, triggered by cron / inbound message / Paperclip routine |
| **Secrets** | Your local env (or none) | Production secrets (Twilio token, Stripe key) — different blast radius |
| **Observability** | Console / Sentry per-dev | Per-tool logs piped to Sentry/Grafana + `trio.tool_runs` cost log |
| **Failure mode** | Annoying for you alone | User-facing — wrong WA broadcast, wrong sponsor billing |
| **Approval gate** | None — you trust the skill | Paperclip approval gate before any "send" or "charge" action |

**Rule of thumb.** A skill that *generates plans, writes docs, drafts code, audits config* is **dev-only**. A skill that *sends messages to real users, scrapes external sites at scale, charges Stripe, posts to social* is **runtime**.

---

## 2. Where each mdeai skill goes

### Dev-only (Claude Code) — never deploy to runtime

| Skill | Why dev-only |
|---|---|
| `mde-writing-plans`, `prd`, `roadmap`, `mermaid-diagrams` | Authoring docs / diagrams — not user-facing |
| `mdeai-project-gates`, `git-commit`, `gh-cli` | Pre-deploy / source-control workflows |
| `vitest-component-testing`, `webapp-testing`, `claude-preview-browser-testing` | Local test loops |
| `systematic-debugging`, `frontend-design`, `vercel-react-best-practices` | Code-quality reasoning |
| `supabase`, `supabase-edge-functions`, `supabase-postgres-best-practices`, `better-auth-best-practices` | Reference docs while writing migrations |
| `skill-creator`, `find-skills` | Skill maintenance for THIS folder |
| `mdeai-commerce.md`, `mdeai-freshness.md`, `mdeai-three-panel.md` | Project conventions for new code |
| `real-estate-mdeai`, `real-estate-tech` | Domain reference while writing code |
| `event-marketer`, `event-planner`, `event-briefs` | Reference frameworks while authoring `/host/event/new` wizard |

### Runtime-bound (deploy to Hermes/OpenClaw/Paperclip) — *should* live on the VPS

| Skill | Where it lives in production | Phase introduced |
|---|---|---|
| `open-claw` (the gateway itself) | OpenClaw VPS | Phase 1 |
| Workflow C broadcast skill (custom) | OpenClaw `~/.openclaw/skills/leaderboard-broadcast/` | Phase 1 |
| `twilio-whatsapp` patterns | OpenClaw skill calling Twilio API | Phase 1 |
| `firecrawl`, `firecrawl-agent`, `firecrawl-crawl` | OpenClaw skill (or Hermes MCP) for scraping enrichment | Phase 2 |
| Outreach send-loop (custom skill) | OpenClaw `~/.openclaw/skills/outreach-send/` | Phase 2 |
| `instagram-research` (Apify-based) | OpenClaw skill calling Apify actors | Phase 2 |
| `gemini` patterns (Edge fn integration) | Already in mdeai edge fns (not "skill" per se) | Phase 1 |
| `hermes` (the brain itself) | Hermes VPS | Phase 4 |
| Hermes reasoning skills (e.g. fraud anomaly) | Hermes `~/.hermes/skills/` | Phase 4 |
| `paper-clip` (the control plane itself) | Paperclip sidecar VPS | Phase 4 |
| Paperclip routines (A1 health review, A6 attendance, etc.) | Paperclip company skills | Phase 4 |

### Hybrid — useful in both universes

| Skill | Dev usage | Runtime usage |
|---|---|---|
| `lead-qualifier-agent` (BANT-R) | Reference while building lead-scoring code | Hermes skill running on inbound leads |
| `property-description-generator` | Reference while building admin UI | Hermes skill generating sponsor descriptions |
| `neighborhood-guide-creator` | Reference for content templates | OpenClaw skill running per-event recap |
| `event-marketer` EPIC checklist | Founder uses to evaluate sponsor proposals | Could power Hermes' sponsor-optimizer reasoning prompt |

**For hybrid skills, the rule is: install in dev first, prove the value, port to runtime later.** Phase 1 hybrid skills stay dev-only. Phase 4 ports the proven ones to Hermes/OpenClaw with hardened prompts + budget caps.

---

## 3. Skills you'll touch each day / week / per-event (Phase 1)

### Daily (every dev session)

```
mdeai-project-gates     # before commit/push
git-commit              # the commit itself
systematic-debugging    # when something doesn't work
supabase                # any DB work
mde-writing-plans       # any markdown updates
```

### Weekly

```
mermaid-diagrams        # update diagram if behavior changed
prd                     # if scope changed
mdeai-commerce/freshness/three-panel.md   # quick reference for project conventions
```

### Per Phase 1 milestone (Miss Elegance Colombia 2026)

```
real-estate-mdeai       # pattern reference (mdeai's existing voting precedent — landlord 'tour booking' has similar shape)
event-planner           # build the contestant intake checklist from this skill's framework
event-briefs            # generate the brief PDF on Phase 1 demo contest publish
event-marketer          # plan sponsor pitch sequencing (Phase 2 prep)
twilio-whatsapp         # writing the OpenClaw template messages
firecrawl-agent         # only if scraping Miss Elegance's existing site for contestant seed
mermaid-diagrams        # add new diagrams as new behaviors emerge
```

### Per sponsor pitch (when Phase 2 starts)

```
event-marketer          # build the package proposal from EPIC framework
prd                     # if the sponsor wants a custom activation, write a mini-PRD
```

### Per fraud incident review (post-Phase 1 launch)

```
systematic-debugging    # hypothesis-first triage
supabase                # look at vote.fraud_signals + vote.votes manually
```

---

## 4. Anti-patterns (what NOT to do)

### ❌ Don't deploy `mde-writing-plans` to Hermes

It's a writing reference. Hermes generating internal-style plan docs makes no sense for production users.

### ❌ Don't use `instagram-scraper` directly from Claude Code on production accounts

Apify scraping run from your laptop hits Apify quotas with your dev API key. Run scrapers from OpenClaw/Hermes on the VPS with production keys + monitoring + budget caps.

### ❌ Don't install `firecrawl-scraper` (US real-estate-specific) into mdeai's Hermes

It assumes Zillow/Redfin schemas. mdeai's Medellín listings have different shapes. Use `firecrawl-agent` with a custom schema instead.

### ❌ Don't skip Paperclip approval gates by calling skills directly

Phase 4's whole point is that any "send" or "charge" action goes through Paperclip first. If you call OpenClaw's outreach-send skill bypassing Paperclip, you've defeated the budget cap and audit trail.

### ❌ Don't keep both `instagram-marketing` and `instagram-content-generation` triggering on the same prompts

`-marketing` is strategy + Reels-first + Graph API. `-content-generation` is each::sense AI for visuals. Different prompts trigger each — but if both fire on "create an Instagram post", neither's skill description is doing its job. Tune descriptions or archive one.

### ❌ Don't let skill descriptions overlap

When 8 Instagram skills compete for the same trigger words, Claude Code picks one based on description quality and you don't know which. The audit trims this for clarity.

---

## 5. Concrete workflow — Phase 1 first 7 days

| Day | Activity | Skills you'd reach for |
|---|---|---|
| 1 | Phase 0: contact Miss Elegance Colombia, draft partnership proposal | `mde-writing-plans`, `prd`, `event-marketer` |
| 2 | `vote.*` migration | `supabase`, `supabase-postgres-best-practices`, `mdeai-project-gates` |
| 3 | `vote-cast` edge function (Turnstile + nonce + idempotency) | `supabase-edge-functions`, `gemini` (for inline fraud signal), `vitest-component-testing` |
| 4 | `/vote/:slug` page + Realtime leaderboard | `frontend-design`, `vercel-react-best-practices`, `mdeai-three-panel.md` |
| 5 | Phone OTP + Trust page + hybrid scoring formula | `better-auth-best-practices`, `mde-writing-plans`, `mermaid-diagrams` (update 02-hybrid-scoring) |
| 6 | OpenClaw VPS install + Workflow C wiring | `open-claw`, `twilio-whatsapp` (reference for template format) |
| 7 | Identity verification flow + admin moderation UI | `gemini` (moderation), `frontend-design`, `claude-preview-browser-testing` |

Each day ends with `git-commit` (using its skill for proper commit message format).

---

## 6. How to actually use a skill while coding

### Pattern A — passive reference (most common)

You're writing a Supabase migration. The `supabase-postgres-best-practices` skill is in your skill list. Claude Code pulls relevant patterns when it sees you typing migration SQL — nothing you do explicitly.

### Pattern B — explicit invocation

You want to ship to-day. You type **`/deploy-check quick`** and the `deploy-check` skill runs the pre-deploy verification checklist. You see green/red for each gate.

### Pattern C — referenced in a prompt

You ask Claude Code: "Help me write the Trust page using `mde-writing-plans` style and `mdeai-freshness.md` voice." Claude Code pulls both into context and writes accordingly.

### Pattern D — runtime deployment

You write a Hermes skill at `~/.hermes/skills/sponsor-roi-explainer/SKILL.md`. The Hermes daemon picks it up. When Paperclip wakes Hermes for a sponsor's daily review, Hermes runs the skill against `sponsor.roi_daily` and posts a comment.

**Patterns A–C are dev-time. Pattern D is runtime.** Don't conflate.

---

## 7. The migration path: dev skill → runtime skill

When a dev-only skill becomes a candidate for runtime deployment:

1. **Prove value in dev for ≥ 30 days.** If the skill isn't useful for the founder while coding, it's not useful for an agent.
2. **Harden the prompt.** Dev skill descriptions are tolerant; runtime prompts must be defensive (reject hallucinated URLs, enforce JSON schema, refuse out-of-policy actions).
3. **Add evals.** Per [`09-prd.md`](./events/09-prd.md) §3.3, every runtime AI capability needs a measurable pass-rate (≥80% F1 / ≥95% URL-clean / etc.).
4. **Add Paperclip approval gate.** Runtime skills that send messages or charge money go through Paperclip approvals. The Phase 4 trio integration was designed for this.
5. **Add `trio.tool_runs` logging.** Every runtime invocation logs cost, duration, status, error. Dev skills don't need this.
6. **Add budget cap.** `growth.outreach_campaigns.daily_cap` for outreach; per-day cost cap in Paperclip for inference. Dev skills are bounded by your patience; runtime skills aren't.
7. **Add manual fallback.** If the skill goes wrong in production, what's the manual override? Document this in the skill's SKILL.md.

A typical promotion timeline:
- **Week 1–4:** dev-only, founder uses it 5–10 times to prove value.
- **Week 5–8:** add evals, dry-run against historical data, tune prompts.
- **Week 9+:** wire into Paperclip routine with approval gate, deploy to Hermes/OpenClaw, monitor for 7 days, then enable for real users.

---

## 8. The simplest answer to "how do we use skills?"

> **Phase 1 (now → June):** use 10–15 dev-only skills to ship the Contest Engine. None deployed to runtime yet — except the one OpenClaw VPS running Workflow C.
>
> **Phase 2 (Jul–Aug):** add ~5 runtime skills to OpenClaw (outreach send, Apify enrichment, attribution beacon). All others stay dev-only.
>
> **Phase 3 (Sep–Oct):** add ~3 runtime skills to OpenClaw (ticket validation, attendance confirmation, intake chase). Still no Hermes/Paperclip.
>
> **Phase 4 (Nov–Dec):** Hermes installed; ~10 reasoning skills deployed. Paperclip orchestrates everything. Now we have **two skill universes in active use**.

You don't need 70 skills today. You need the 10 right ones for Phase 1, and a clear plan for which graduate to runtime in Phase 4.

---

## See also

- [`skills-audit.md`](./skills-audit.md) — what to keep, archive, fix
- [`events/06-trio-integration.md`](./events/06-trio-integration.md) — runtime architecture for Phase 4
- [`events/08-plan-audit-response.md`](./events/08-plan-audit-response.md) — phase plan
- [`CLAUDE.md` §Skills protection](../CLAUDE.md) — never-delete rules
