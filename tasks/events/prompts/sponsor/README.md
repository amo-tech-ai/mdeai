# Sponsor System — Task Index

> **Master plan:** [104-master-implementation-plan.md](./104-master-implementation-plan.md) — canonical reference, supersedes contradictions.
> **Last updated:** 2026-05-04 | **Audit status:** Complete

---

## Phase 1 — MVP Core (ALL DONE ✅)

| Task | Title | Status |
|---|---|---|
| [045](./045-sponsor-schema-migration.md) | Schema migration (10 tables + RLS) | ✅ Done |
| [046](./046-sponsor-apply-wizard.md) | Apply wizard (4-step) | ✅ Done |
| [047](./047-sponsor-admin-queue.md) | Admin approval queue | ✅ Done |
| [048](./048-sponsor-stripe-checkout.md) | Stripe checkout + webhook | ✅ Done |
| [049](./049-sponsor-surface-component.md) | SponsoredSurface component | ✅ Done |
| [050](./050-sponsor-impression-click-edge-fns.md) | Impression + click edge fns | ✅ Done |
| [051](./051-sponsor-attribution-trigger.md) | Attribution trigger (last-click 24h) | ✅ Done |
| [053](./053-sponsor-roi-rollup-cron.md) | ROI rollup cron (pg_cron every 5 min) | ✅ Done |
| [055](./055-sponsor-contracts-schema.md) | Contracts schema | ✅ Done |
| [056](./056-sponsor-contract-generate-edge-fn.md) | Contract generate edge fn | ✅ Done |
| [057](./057-sponsor-contract-sign-page.md) | Contract sign page | ✅ Done |
| [058](./058-sponsor-dispute-ui.md) | Dispute UI + cancel edge fn | ✅ Done |

---

## Phase 2 — Sponsor Self-Serve (NEXT 🔵)

| Task | Title | Status | Depends On |
|---|---|---|---|
| [052](./052-sponsor-dashboard.md) → impl: **065** | Sponsor ROI Dashboard spec | 📋 Spec | — |
| **065** | Sponsor ROI Dashboard — BUILD | 🔵 Next | 045, 050, 051, 053 |
| **066** | AI Edge Fns Phase A (roi-explain, creative-gen, moderate, optimize) | 🔵 Next | 045, 065 |
| **067** | Chat Integration — Sponsor Concierge (ai-router + ai-chat) | 🔵 Next | 065, 066 |
| **068** | Schema.org Event markup (2-hour quick win — 4.4× conversion) | 🔵 Next | — |
| [054](./054-sponsor-ai-edge-fns.md) → impl: **066** | AI edge fns spec | 📋 Spec | — |
| **069** | Sponsor Report Export (PDF + CSV) | 📋 Design | 065, 066 |

---

## Phase 3 — Marketplace (Week 3-4)

| Task | Title | Status | Depends On |
|---|---|---|---|
| **070** | Unified Marketing + Campaign schema migration (13 tables) | 📋 Design | 045 |
| **071** | Marketplace tables + vector embeddings (5 new sponsor.* tables) | 📋 Design | 045, 070 |
| **072** | Brand profile UI (/sponsor/profile) | 📋 Design | 071 |
| **073** | Event marketplace listing (/marketplace/events/:id) | 📋 Design | 071 |
| **074** | Marketplace browse + search (/sponsor/marketplace) | 📋 Design | 071, 073 |
| **075** | Proposal + in-platform messaging system | 📋 Design | 071, 074 |

---

## Phase 4 — Discovery (Month 2)

| Task | Title | Status | Depends On |
|---|---|---|---|
| [060](./060-sponsor-discovery-qualification-module.md) | Discovery & qualification module spec | 📋 Spec | — |
| **076** | Discovery schema migration (sponsor_discovery.* — 4 tables) | 📋 Design | 045 |
| **077** | Discovery admin UI (/admin/sponsor-discovery) | 📋 Design | 076 |
| **078** | Enrichment edge fn (Firecrawl + Fire Enrich) | 📋 Design | 076 |
| **079** | Scoring edge fn (5-factor formula via Hermes bridge) | 📋 Design | 076, 078 |
| **080** | Outreach edge fn (Infobip WA + Resend email) | 📋 Design | 076, 079 |
| **081** | Contact extraction edge fn | 📋 Design | 076, 078 |

---

## Phase 5 — AI Automation + OpenClaw + Postiz + Hermes (Month 2-3)

| Task | Title | Status | Depends On |
|---|---|---|---|
| [061](./061-sponsor-activations-plan.md) | Activations plan (14 types, 6 categories) | 📋 Spec | — |
| [062](./062-openclaw-hermes-paperclip-sponsorship-system.md) | OpenClaw + Hermes + Paperclip lifecycle spec | 📋 Spec | — |
| [063](./063-openclaw-sponsor-discovery-engine.md) | Discovery engine spec (5-layer pipeline) | 📋 Spec | — |
| [064](./064-postiz-openclaw-campaign-system.md) | Campaign system spec (Postiz + OpenClaw + Hermes) | 📋 Spec | — |
| **082** | AI Proposal Generator edge fn (Gemini Pro, bilingual PDF) | 📋 Design | 065, 066 |
| **083** | AI Ideas Generator edge fn (Flash, activation ideas <30s) | 📋 Design | 066 |
| **084** | AI Contract Extract edge fn (Gemini Pro + urlContext) | 📋 Design | 055, 056 |
| **085** | AI Audience Match edge fn (Pro + googleSearch) | 📋 Design | 071 |
| **086** | Campaign planner AI edge fn | 📋 Design | 070 |
| **087** | Campaign content generator edge fn | 📋 Design | 086 |
| **088** | Postiz scheduling integration | 📋 Design | 086, 087 |
| **089** | OpenClaw outreach skill integration | 📋 Design | 080, 088 |
| **090** | Hermes scoring bridge (Python CLI → edge fn HTTP bridge) | 📋 Design | 079, 089 |
| **091** | Renewal prediction edge fn + OpenClaw trigger | 📋 Design | 090 |

---

## Phase 6 — Advanced (Month 3+)

| Task | Title | Status | Depends On |
|---|---|---|---|
| **092** | Retention risk matrix admin view (2×2 quadrant) | 📋 Design | 065, 053 |
| **093** | AI Mockup Generator (Gemini Imagen 3) | 📋 Design | 082 |
| **094** | Dynamic pricing engine | 📋 Design | 065, 053 |
| **095** | Paperclip governance layer (10+ sponsors gate) | 📋 Design | 090 |
| **096** | Performance-based pricing tier (CPM/CPA billing) | 📋 Design | 094 |

---

## Strategy + Research Docs

| Task | Title | Status |
|---|---|---|
| [100](./100-sponsorship-system.md) | Master strategy — architecture, chat, V1 plan | 📋 Living |
| [101](./101-marketplace-strategy.md) | 18-platform research + mdeai build plan | 📋 Strategy |
| [102](./102-marketplace-corrections.md) | Corrections: Anvara deep dive + SponsorUnited + 6 fixes | 📋 Strategy |
| [103](./103-sponsorflo-feature-analysis.md) | SponsorFlo 9 modules + 8-stage sales process + mdeai map | 📋 Strategy |
| [104](./104-master-implementation-plan.md) | **MASTER PLAN** — audit + phases + diagrams + DB + workflows | 📋 Living |

---

## Phase Roadmap

```
Phase 0 (now):       Cleanup — Stripe secrets, WhatsApp confirm, contradictions resolved
Phase 1 (DONE ✅):  MVP Core — apply → approve → pay → sign → track → rollup
Phase 2 (Week 1-2):  Self-serve — dashboard + AI edge fns + chat + Schema.org
Phase 3 (Week 3-4):  Marketplace — browse events, brand profiles, proposals, messaging
Phase 4 (Month 2):   Discovery — sponsor_discovery schema + admin UI + enrichment pipeline
Phase 5 (Month 2-3): AI Automation — proposals + campaigns + Postiz + OpenClaw + Hermes
Phase 6 (Month 3+):  Advanced — renewals + dynamic pricing + Paperclip governance
```

## Three-Layer Automation Stack (Phase 5)

| Layer | Tool | Role |
|---|---|---|
| Intelligence | **Hermes** | 5-factor scoring + proposal gen + ROI insights + renewal prediction |
| Execution | **OpenClaw** | WhatsApp, IG DM, email sends (approved messages only) |
| Scheduling | **Postiz** | Social post scheduling (human-approved drafts only) |
| Governance | **Paperclip** | Lifecycle states + approval gates + audit log (Phase 6 only) |
| Data | **Supabase** | Single source of truth for all sponsor data |
| AI | **Gemini Flash/Pro** | All structured outputs, creative, insights |

## Critical Rules

1. **OpenClaw sends only approved messages** — approval_gates row required before any outreach
2. **Postiz schedules only approved posts** — human review required before scheduling
3. **Paperclip is Phase 6** — do not build until 10+ active paid sponsors
4. **15% commission** — no subscription; brands pay only when value delivered
5. **Supabase Storage for assets** — not Cloudinary (corrected in task 102)
6. **Spanish-first** — all AI outputs default to Colombian Spanish

## Revenue Target

| Month | Active Sponsors | MRR (15% commission) |
|---|---|---|
| 1 | 2 Bronze + 1 Silver | ~$375 |
| 2 | 5 Bronze + 3 Silver | ~$1,050 |
| 3 | 8 Bronze + 5 Silver + 2 Gold | ~$2,850 |
| 6 | 20 Bronze + 15 Silver + 10 Gold + 2 Platinum | ~$12,375 |
