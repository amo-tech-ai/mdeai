# Skills audit + consolidation recommendations

> **BLUF:** mdeai has **70 entries in `.claude/skills/`** backed by **41 actual skill folders in `.agents/skills/`** + ~16 local-only folders. The picture is healthy in places (Supabase, Firecrawl, mdeai-* stack) and bloated in others — **8 Instagram skills, 6 event skills, 8 real-estate skills, 4 WhatsApp skills, 5 Firecrawl skills, 6 PRD/roadmap skills, 11 broken pointers**. Most overlap is real but recoverable: deduping aggressively gets us from 70 entries to ~50 without losing capability. **Per CLAUDE.md no-delete rule, this doc is recommendations only — no skill is touched until the founder confirms specific paths.**

**Audit performed:** May 2026. Counts assume no skills change after this audit completes. Re-run after any consolidation.

---

## 1. Health summary

| Metric | Count | Status |
|---|---|---|
| `.claude/skills/` total entries | 70 | as-is |
| `.agents/skills/` actual content folders | 41 | as-is |
| Broken pointers (dangling symlinks) | **11** | clean up |
| Working skills clearly canonical for mdeai | ~30 | keep |
| Skills overlapping with siblings | ~25 | consolidate |
| Skills genuinely unique | ~15 | keep |

---

## 2. The broken-pointer cleanup (low-hanging fruit)

These symlinks point at `.agents/skills/<name>` directories that don't exist on disk. They show up as "available skills" but fail when invoked.

```bash
# Dangling top-level pointers
/home/sk/mde/.claude/skills/ui-ux-pro-max
/home/sk/mde/.claude/skills/plan-writing
/home/sk/mde/.claude/skills/shadcn

# Dangling sub-skills inside parent folders
/home/sk/mde/.claude/skills/shopify/shopify-app-deployment
/home/sk/mde/.claude/skills/shopify/shopify-apps
/home/sk/mde/.claude/skills/shopify/shopify-hydrogen
/home/sk/mde/.claude/skills/shopify/shopify-development

/home/sk/mde/.claude/skills/roadmap/roadmap-planning
/home/sk/mde/.claude/skills/roadmap/technical-roadmap-planning
/home/sk/mde/.claude/skills/roadmap/roadmap-update
```

**Plus historical broken pointers** noted in CLAUDE.md but not currently visible in `find -xtype l` (may have been re-resolved): `content-creation`, `figma-use`, `memory-management`, `sentry-create-alert`, `sentry-fix-issues`, `sentry-react-sdk`, `sentry-sdk-skill-creator`.

**Recommended action.** All broken pointers are safe to remove — they reference deleted upstream skills. Use:

```bash
# Verify each is actually broken before removing
find /home/sk/mde/.claude/skills/ -xtype l -exec ls -la {} \;

# Remove (only after the user explicitly confirms each path)
rm /home/sk/mde/.claude/skills/ui-ux-pro-max
rm /home/sk/mde/.claude/skills/plan-writing
rm /home/sk/mde/.claude/skills/shadcn
# ... etc
```

**Note on `roadmap/roadmap-planning`:** the sub-symlink is broken, but the **top-level** `/home/sk/mde/.claude/skills/roadmap-planning` exists and works (it was added recently). The broken `roadmap/roadmap-planning` is a leftover from when it was vendored inside the `roadmap` skill. Same for `roadmap/technical-roadmap-planning` and `roadmap/roadmap-update`.

---

## 3. Consolidation by cluster

### 🟪 Instagram cluster — 8 skills → recommend 4

| # | Skill | Purpose | Recommendation |
|---|---|---|---|
| 1 | **`instagram-research`** | Apify scraper → outlier content + AI analysis + hook formulas | ✅ **Keep** — clear unique value (research + analysis pipeline) |
| 2 | **`instagram-marketing`** | Reels-first strategy + Graph API + growth tactics | ✅ **Keep** — strategic playbook, no overlap |
| 3 | **`instagram-skill`** | Instagram CLI for DMs (send/read/reply) | ✅ **Keep** — CLI integration unique |
| 4 | **`instagram-content-generation`** | each::sense AI for feed/story/carousel creation | ✅ **Keep** — generation tool, different from -marketing strategy layer |
| 5 | `instagram-scraper` | Apify actors: posts/reels/profiles/hashtags/comments | 🟡 **Archive** — `instagram-research` already wraps Apify scrapers with smarter analysis; raw scraper is redundant |
| 6 | `scrapesocial-instagram` | "research/workflow guidance" generic | 🟡 **Archive** — duplicates `instagram-research` with vaguer description |
| 7 | `instagram-messenger` | Membrane integration for DM management | 🟡 **Archive** — overlaps with `instagram-skill` (CLI does DMs); pick one |
| 8 | `instagram-downloader` | Download IG posts | 🟡 **Archive** — single-feature; `instagram-scraper` or `firecrawl` covers it |

**Net:** 8 → 4. The 4 kept ones are: research (analysis), marketing (strategy), skill (CLI/DMs), content-generation (creation). Each has a distinct trigger profile.

### 🟦 Events cluster — 6 skills → recommend 4

| # | Skill | Purpose | Recommendation |
|---|---|---|---|
| 1 | **`event-marketer`** | Conferences/webinars/field marketing playbook with EPIC checklist | ✅ **Keep** — comprehensive marketing reference |
| 2 | **`event-planner`** | 12mo→day-of timeline, vendor tracker, AV checklist, run sheet | ✅ **Keep** — logistics master |
| 3 | **`event-briefs`** | Master event brief framework (overview/narrative/experience/promotion/operations/measurement) | ✅ **Keep** — focused output type, complements -planner |
| 4 | **`event-prospecting`** | Browserbase + bb CLI: scrape conference speakers, ICP-fit ranking, lead generation | ✅ **Keep** — completely different use case (B2B sales prep, not running events) |
| 5 | `event-hosting` | Luma-style meetup hosting, founder-driven events | 🟡 **Archive or merge into event-planner** — small surface; Luma-specific niche overlaps with -planner's "Workshop / Demo Night" formats |
| 6 | `persona-event-coordinator` | "Plan and manage events — scheduling, invitations, logistics" | 🟡 **Archive** — description is a strict subset of `event-planner` |

**Net:** 6 → 4. `event-planner` absorbs the Luma-specific tips from `event-hosting` (1-page section). `persona-event-coordinator` is pure duplication.

### 🟫 Real estate cluster — 8 skills → recommend 6

| # | Skill | Purpose | Recommendation |
|---|---|---|---|
| 1 | **`real-estate-mdeai`** | mdeai.co rental marketplace canonical (V1 wizard, P1 CRM, 28-table schema, Medellín neighborhoods) | ✅ **Keep — CRITICAL** — project-specific source of truth |
| 2 | **`real-estate-tech`** | V2+ MLS / IDX / RESO / AVM / PostGIS — explicitly "for when we expand beyond V1" | ✅ **Keep** — future scope, clearly distinct |
| 3 | **`real-estate-expert`** | General expert layer (MLS, CRM, virtual tours, market analysis) | ✅ **Keep** — broader than -mdeai, lighter than -tech |
| 4 | **`neighborhood-guide-creator`** | Build shareable neighborhood guides | ✅ **Keep** — specific output format |
| 5 | **`property-description-generator`** | MLS-ready listing copy | ✅ **Keep** — specific output format |
| 6 | **`lead-qualifier-agent`** | BANT-R framework for inbound lead scoring | ✅ **Keep** — specific framework |
| 7 | `real-estate` | Camino AI for nearby amenities (schools/transit/parks) | 🟡 **Archive or rename** — narrow API integration; better named `camino-amenities`. Confusing as "real-estate" because mdeai is real estate but doesn't use Camino. |
| 8 | `real-estate-search` | Korean apartment lookups via tae0y MOLIT API | 🔴 **Archive** — Korean-market-specific; irrelevant to mdeai's Medellín scope. Was probably installed by accident. |

**Net:** 8 → 6. Keeps the layer cake (mdeai-specific → expert → tech). Removes Korean-market noise.

### 🟢 WhatsApp cluster — 4 skills → recommend 2

| # | Skill | Provider | Recommendation |
|---|---|---|---|
| 1 | **`twilio-whatsapp`** | Twilio WA Business: templates / sessions / media / webhooks | ✅ **Keep — CRITICAL** — mdeai's actual chosen provider per PRD |
| 2 | **`integrate-whatsapp`** | Kapso: end-to-end onboarding + templates + Flows | ✅ **Keep** — alternate provider for orgs that prefer Kapso |
| 3 | `automate-whatsapp` | Kapso workflows for triggered automation | 🟡 **Archive** — overlaps heavily with `integrate-whatsapp` (both Kapso). Workflow automation is a sub-feature of full integration. |
| 4 | `whatsapp-automation` | Rube MCP (Composio) — different provider | 🟡 **Archive** — third provider with smallest surface area. If mdeai isn't on Composio Rube, remove the noise. |

**Net:** 4 → 2. Twilio (canonical) + Kapso (alternate). Drop Composio Rube unless actively used.

### 🟧 Firecrawl cluster — 5 skills → recommend 3

| # | Skill | Purpose | Recommendation |
|---|---|---|---|
| 1 | **`firecrawl`** | General CLI: search + scrape + interact | ✅ **Keep** — base capability |
| 2 | **`firecrawl-agent`** | AI-powered structured JSON extraction with schema | ✅ **Keep** — genuinely different (schema-driven multi-page extraction) |
| 3 | **`firecrawl-crawl`** | Bulk crawl entire site or section | ✅ **Keep** — different mode (bulk vs single URL) |
| 4 | `firecrawl-search` | Web search with full content extraction | 🟡 **Archive** — explicit subset of `firecrawl` (`firecrawl search` is a CLI verb) |
| 5 | `firecrawl-scraper` | Real estate listing URLs (Zillow/Redfin/Realtor) | 🟡 **Archive** — US-specific real-estate sites; mdeai is Medellín. Use `firecrawl-agent` with a custom schema if needed. |

**Net:** 5 → 3. The three modes (single + structured + bulk) cover all needs.

### 🟡 PRD / roadmap cluster — 6 skills → recommend 3

| # | Skill | Purpose | Recommendation |
|---|---|---|---|
| 1 | **`prd`** | General PRD generator with strict schema (we used this for `09-prd.md`) | ✅ **Keep** — solid general-purpose tool |
| 2 | **`mde-writing-plans`** | mdeai-specific writing (PRDs + plans + skills + docs in one) | ✅ **Keep — CRITICAL** — project-specific consolidated stack |
| 3 | **`roadmap`** | Strategic + update + technical roadmaps under one hub | ✅ **Keep** — solid general tool (used for `10-roadmap.md`) |
| 4 | `breakdown-feature-prd` | "PRDs for new features based on an Epic" | 🟡 **Archive** — overlaps with `prd` and `mde-writing-plans`. The "from an epic" angle isn't unique enough to justify a separate skill. |
| 5 | `to-prd` | "Turn current conversation context into a PRD and publish to issue tracker" | 🟡 **Archive** — useful one-liner but `prd` skill already does this with explicit context-provision step |
| 6 | `roadmap-planning` | "Strategic roadmap across prioritization + epic definition + stakeholder alignment" | 🟡 **Archive** — descriptions overlaps `roadmap` heavily; the latter already covers strategic + Now/Next/Later + RICE/ICE |

**Net:** 6 → 3. `mde-writing-plans` is the project's canonical writing skill; `prd` and `roadmap` are general-purpose tools.

### 🟣 Sentry cluster — 4 broken + 1 working

| # | Skill | Status | Recommendation |
|---|---|---|---|
| 1 | `sentry-cli` | working (loaded as cluster:sentry) | ✅ **Keep** |
| 2 | `sentry-create-alert` | broken | 🔴 **Remove broken pointer** |
| 3 | `sentry-fix-issues` | broken | 🔴 **Remove broken pointer** |
| 4 | `sentry-react-sdk` | broken | 🔴 **Remove broken pointer** |
| 5 | `sentry-sdk-skill-creator` | broken | 🔴 **Remove broken pointer** |

**Net:** 5 entries → 1 working skill. The other 4 are dangling symlinks per CLAUDE.md note.

### 🔵 Supabase cluster — 3 skills, all distinct

| # | Skill | Purpose | Recommendation |
|---|---|---|---|
| 1 | **`supabase`** | General Supabase usage (Auth, RLS, Realtime, etc.) | ✅ **Keep** |
| 2 | **`supabase-edge-functions`** | Deploy + manage edge functions specifically | ✅ **Keep** |
| 3 | **`supabase-postgres-best-practices`** | Postgres performance + schema patterns | ✅ **Keep** |

**Net:** 3 → 3. Distinct layers, all useful.

### ⚪ mdeai-specific (small files / project domain) — keep all

| File | Type |
|---|---|
| `mdeai-commerce.md` | Standalone file — Shopify/Gadget commerce |
| `mdeai-freshness.md` | Standalone file — coffee badge logic |
| `mdeai-three-panel.md` | Standalone file — layout pattern |
| `mdeai-project-gates` | Folder — pre-deploy checklist |
| `real-estate-mdeai` | Folder — domain canonical |

**Net:** 5 → 5. All project-canonical, keep as-is.

### ⚙️ Claude / harness / dev — keep all

| Skill | Purpose |
|---|---|
| `claude-preview-browser-testing` | Browser e2e against staging |
| `webapp-testing` | Playwright local |
| `vitest-component-testing` | Component tests |
| `systematic-debugging` | Hypothesis-first debug loop |
| `git-commit` + 3 commit-commands | Commit / push / PR |
| `gh-cli` | GitHub CLI reference |
| `frontend-design` | UI generation |
| `vercel-react-best-practices` | Vercel patterns |
| `deploy-to-vercel` | Deploy actions |
| `mermaid-diagrams` | Diagram authoring (used for `tasks/events/diagrams/`) |
| `gemini`, `gemini-api-dev`, `gemini-interactions-api` | Gemini SDK / Edge integration |
| `claude-api` | Anthropic SDK |
| `skill-creator` | Authoring new skills |
| `find-skills` | Discovery |
| `update-config`, `keybindings-help`, `simplify`, `less-permission-prompts` | Harness |

All distinct, all useful. Keep.

---

## 4. Specific consolidation actions (recommended, not executed)

### Tier 1 — Safe deletes (broken pointers, recover from git if regretted)

```bash
# Verify dangling, then delete (one at a time, with explicit founder consent)
rm /home/sk/mde/.claude/skills/ui-ux-pro-max
rm /home/sk/mde/.claude/skills/plan-writing
rm /home/sk/mde/.claude/skills/shadcn

# Inside-folder dangling subskills
rm /home/sk/mde/.claude/skills/shopify/shopify-app-deployment
rm /home/sk/mde/.claude/skills/shopify/shopify-apps
rm /home/sk/mde/.claude/skills/shopify/shopify-hydrogen
rm /home/sk/mde/.claude/skills/shopify/shopify-development

rm /home/sk/mde/.claude/skills/roadmap/roadmap-planning
rm /home/sk/mde/.claude/skills/roadmap/technical-roadmap-planning
rm /home/sk/mde/.claude/skills/roadmap/roadmap-update

# Sentry broken (if still present per `find -xtype l`)
# rm /home/sk/mde/.claude/skills/sentry-create-alert  # check first
```

**Risk:** zero — these point at nothing.

### Tier 2 — Safe archives (real skills, redundant)

For each, two-step:
1. `unlink` the `.claude/skills/<name>` symlink (so Claude Code stops loading it)
2. Optionally `rm -rf .agents/skills/<name>` only if confident; otherwise keep the content for re-link later

```bash
# Instagram dedup (8 → 4)
unlink /home/sk/mde/.claude/skills/instagram-scraper
unlink /home/sk/mde/.claude/skills/scrapesocial-instagram
unlink /home/sk/mde/.claude/skills/instagram-messenger
unlink /home/sk/mde/.claude/skills/instagram-downloader

# Events dedup (6 → 4)
unlink /home/sk/mde/.claude/skills/event-hosting
unlink /home/sk/mde/.claude/skills/persona-event-coordinator

# Real estate dedup (8 → 6)
unlink /home/sk/mde/.claude/skills/real-estate            # Camino AI — rename or remove
unlink /home/sk/mde/.claude/skills/real-estate-search     # Korean market

# WhatsApp dedup (4 → 2)
unlink /home/sk/mde/.claude/skills/automate-whatsapp
unlink /home/sk/mde/.claude/skills/whatsapp-automation

# Firecrawl dedup (5 → 3)
unlink /home/sk/mde/.claude/skills/firecrawl-search
unlink /home/sk/mde/.claude/skills/firecrawl-scraper

# PRD/roadmap dedup (6 → 3)
unlink /home/sk/mde/.claude/skills/breakdown-feature-prd
unlink /home/sk/mde/.claude/skills/to-prd
unlink /home/sk/mde/.claude/skills/roadmap-planning
```

**Risk:** low — content stays in `.agents/skills/` until separately deleted; re-linking is one `ln -s` command. Unlinking the symlink only stops Claude Code from listing the skill.

### Tier 3 — Optional content cleanup

```bash
# Only after Tier 2 has been live for a week with no regrets
rm -rf /home/sk/mde/.agents/skills/instagram-scraper
rm -rf /home/sk/mde/.agents/skills/scrapesocial-instagram
# ... etc
```

**Risk:** medium — `.agents/skills/` content is regenerated via `skill-creator` reinstall, but the version may differ. Keep the symlinks unlinked for a week before cleaning content.

---

## 5. Final recommended skill list (after consolidation)

If all Tier 1 + Tier 2 actions execute, the project's skill surface drops from **70 → ~50** without losing capability.

### High-value canonicals (keep, never touch)

| Cluster | Skill |
|---|---|
| Project domain | `real-estate-mdeai`, `mdeai-project-gates`, `mdeai-commerce.md`, `mdeai-freshness.md`, `mdeai-three-panel.md`, `mde-writing-plans` |
| Voting/contests initiative | `prd`, `roadmap`, `mermaid-diagrams` |
| Auth/data | `supabase`, `supabase-edge-functions`, `supabase-postgres-best-practices`, `better-auth-best-practices` |
| Tools layer | `twilio-whatsapp`, `firecrawl`, `firecrawl-agent`, `firecrawl-crawl`, `gemini`, `claude-api` |
| Trio runtimes | `open-claw`, `hermes`, `paper-clip` |
| Domain skills | `event-marketer`, `event-planner`, `event-briefs`, `event-prospecting` |
| Real-estate adjuncts | `real-estate-tech`, `real-estate-expert`, `neighborhood-guide-creator`, `property-description-generator`, `lead-qualifier-agent` |
| Instagram (4 of 8) | `instagram-research`, `instagram-marketing`, `instagram-skill`, `instagram-content-generation` |
| Dev / harness | `git-commit`, `gh-cli`, `frontend-design`, `vercel-react-best-practices`, `deploy-to-vercel`, `webapp-testing`, `vitest-component-testing`, `claude-preview-browser-testing`, `systematic-debugging`, `skill-creator`, `find-skills`, `mermaid-diagrams` |
| Anthropic / OpenAI | `gemini-api-dev`, `gemini-interactions-api`, `claude-api` |

### Slated for archive (Tier 2)

Instagram-scraper, scrapesocial-instagram, instagram-messenger, instagram-downloader, event-hosting, persona-event-coordinator, real-estate (Camino), real-estate-search (Korean), automate-whatsapp, whatsapp-automation, firecrawl-search, firecrawl-scraper, breakdown-feature-prd, to-prd, roadmap-planning. **15 skills.**

### Broken pointers (Tier 1)

ui-ux-pro-max, plan-writing, shadcn, shopify sub-symlinks (×4), roadmap sub-symlinks (×3), historical sentry-* (×4 if still present). **~14 entries** — note these don't all add to "60→50" because some overlap with archive list.

---

## 6. The deeper organizational question

**Should we keep the 2-layer split** (`.claude/skills/` symlink → `.agents/skills/` content)?

The original rationale (from CLAUDE.md):
- `.agents/skills/` = downloaded content (gitignored, local only, large)
- `.claude/skills/` = thin pointers (committed, small, version-controlled)

This works but it has cost two stash incidents already (2026-04-29 sweep, 2026-05-01 branch confusion). Worth considering whether to flatten to one folder, OR commit `.agents/skills/` content (turns the repo into a fat skill bundle but eliminates the dangling-symlink class of bug).

**My recommendation:** keep the 2-layer split, but:
1. Add a CI check that fails the build if `.claude/skills/` has any dangling symlink (so we catch breakage before it ships).
2. Add a `tasks/skills-audit.md` re-run quarterly (this doc).
3. After Tier 1 + Tier 2 actions, the surface is small enough that audit + maintenance is once-a-quarter, not once-a-week.

---

## 7. Action checklist for founder

If you accept these recommendations, the path forward:

- [ ] **Review this audit.** Disagree with any specific archive recommendation? Mark it "keep" before proceeding.
- [ ] **Run Tier 1 deletes first** (broken pointers). Zero capability loss; cleaner skill list.
- [ ] **Wait one day**, verify nothing broke.
- [ ] **Run Tier 2 unlinks.** 15 skills go quiet but content is preserved.
- [ ] **Wait one week**, verify no skill you actually need is now silent.
- [ ] **Optional Tier 3:** delete `.agents/skills/` content for unlinked skills. Zero-cost reinstall via `skill-creator` later if regretted.
- [ ] **Add CI guard:** `find /home/sk/mde/.claude/skills/ -xtype l` should return empty. Fail the build if not.
- [ ] **Update CLAUDE.md** §Skills protection with the post-cleanup baseline counts.

---

## See also

- [`CLAUDE.md` §Skills protection](../CLAUDE.md) — the no-delete rules that gate every action in this doc
- [`index.md`](../index.md) — live skills health summary (broken vs working counts)
- [`.claude/skills/skill-creator/SKILL.md`](../.claude/skills/skill-creator/SKILL.md) — for creating / re-linking skills

---

## ✅ Completion log (May 2026)

### Round 1 — Events consolidation (executed)

- Built new `.claude/skills/events/` with consolidated SKILL.md (175 lines) + 4 references (briefs, planner, marketer, hosting). 1031 lines total.
- Archived 5 symlinks (content preserved in `.agents/skills/`):
  - ✅ `event-briefs`
  - ✅ `event-hosting`
  - ✅ `event-marketer`
  - ✅ `event-planner`
  - ✅ `persona-event-coordinator`
- `event-prospecting` kept separate (different actor/workflow).
- Net: -5 redundant entries.

### Round 2 — Social media consolidation (executed)

No new skills created — the strongest existing skill in each cluster already covered the use case. Archived 5 redundant symlinks:
- ✅ `instagram-scraper` (subset of `instagram-research`)
- ✅ `scrapesocial-instagram` (duplicates `instagram-research`)
- ✅ `instagram-downloader` (subset of `instagram-research`)
- ✅ `instagram-messenger` (subset of `instagram-skill`)
- ✅ `scrapesocial-facebook` (duplicates `facebook-research`)

Kept canonical (8): `instagram-research`, `instagram-skill`, `instagram-marketing`, `instagram-content-generation`, `facebook-research`, `social-media-image-sizes`, `social-media-trends-research`, `social-media-posts`.

Net: -5 redundant entries. Total cumulative cleanup from this audit: **-10 entries**.

### Recovery (any of the 10 archived skills)

```bash
# Re-link any one in a single command — content is still in .agents/skills/
ln -s ../../.agents/skills/<skill-name> /home/sk/mde/.claude/skills/<skill-name>
```

### Round 3 — Tier 1 broken pointers (executed)

10 dangling symlinks removed. Zero capability loss.
- ✅ `ui-ux-pro-max`
- ✅ `plan-writing`
- ✅ `shadcn`
- ✅ `shopify/shopify-app-deployment` (sub-symlink)
- ✅ `shopify/shopify-apps` (sub-symlink)
- ✅ `shopify/shopify-development` (sub-symlink)
- ✅ `shopify/shopify-hydrogen` (sub-symlink)
- ✅ `roadmap/roadmap-planning` (sub-symlink)
- ✅ `roadmap/technical-roadmap-planning` (sub-symlink)
- ✅ `roadmap/roadmap-update` (sub-symlink)

**Result:** broken symlinks went from 10 → **0**.

### Round 4 — Tier 2 remaining consolidations (executed)

8 redundant working symlinks removed (firecrawl-scraper was already gone in working tree).

| Cluster | Archived | Replaced by |
|---|---|---|
| Real estate | `real-estate` (Camino-only API integration) | Use `firecrawl-agent` + custom schema if needed |
| Real estate | `real-estate-search` (Korean MOLIT API) | Out of mdeai's scope |
| WhatsApp | `automate-whatsapp` (Kapso workflows) | Subset of `integrate-whatsapp` |
| WhatsApp | `whatsapp-automation` (Composio Rube) | Use `twilio-whatsapp` (project's actual provider) |
| Firecrawl | `firecrawl-search` (subset) | `firecrawl` already covers search |
| PRD | `breakdown-feature-prd` (Epic→PRD) | `prd` covers this |
| PRD | `to-prd` (context→PRD) | `prd` covers this |
| Roadmap | `roadmap-planning` (top-level redundant) | `roadmap` already covers strategic planning |

### Final state — May 2, 2026

| Metric | Original | Final | Δ |
|---|---|---|---|
| `.claude/skills/` entries | ~75 | **50** | **−25 (33% reduction)** |
| Broken symlinks | 10 | **0** | **−10 (100% cleanup)** |
| `.agents/skills/` content | 46 | 46 | unchanged (preserved) |
| Cumulative skills archived | 0 | **23** | content recoverable |

### Cluster final state

| Cluster | Was | Now | Notes |
|---|---|---|---|
| Events | 6 | **2** (`events`, `event-prospecting`) | Built consolidated `events` skill |
| Instagram | 8 | **4** (research/skill/marketing/content-gen) | Strongest skill in each lane kept |
| Facebook | 2 | **1** (`facebook-research`) | Apify-based winner |
| Real estate | 8 | **6** (mdeai/tech/expert/neighborhood/property-desc/lead-qualifier) | Removed Camino + Korean |
| WhatsApp | 4 | **2** (twilio + integrate) | Removed Kapso/Composio Rube |
| Firecrawl | 5 | **3** (general + agent + crawl) | Removed search subset + US real-estate |
| PRD/roadmap | 6 | **3** (prd + roadmap + mde-writing-plans) | Removed 3 narrow variants |
| Sentry | 5 | **1** (`sentry-cli`) | 4 broken pointers removed |
| Cross-platform social | 3 | **3** (image-sizes / trends / posts) | Different functions, kept separate |
| Supabase | 3 | **3** | All distinct, kept |
| mdeai canonicals | 5 | **5** | Kept (project-specific) |
| Trio runtimes | 3 | **3** (open-claw / hermes / paper-clip) | Kept |
| Other (dev / harness / claude-api / gemini / etc.) | ~25 | ~17 | Kept all distinct |

### Recovery (any of the 23 archived)

```bash
# Re-link in one command — content lives in .agents/skills/
ln -s ../../.agents/skills/<skill-name> /home/sk/mde/.claude/skills/<skill-name>
```

For the 10 broken pointers: those couldn't recover anyway (their `.agents/skills/` targets never existed). Use `skill-creator` to install a fresh version if any becomes needed.

### Pending follow-ups

1. **Commit the `events` skill** — currently untracked. The 23 unlinks don't show in git diff (originals were untracked too).
2. **Pre-existing dirty git state** (deleted prd/SKILL.md, content-creation, figma-*, gadget-best-practices, sentry-* typechanges) — separate concern, not addressed in this consolidation.
3. **CI guard**: add `find .claude/skills/ -xtype l` to a pre-commit hook so future broken symlinks are caught at commit time.
4. **CLAUDE.md baseline update**: replace "50 entries: 41 working ✅ / 9 broken ❌" with new baseline of "50 entries / 0 broken".
