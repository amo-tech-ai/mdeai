---
title: Mastra Modules — Verified Reference Catalogue
status: Reference
created: 2026-05-10
verified: 2026-05-10 via WebFetch (each URL probed, content confirmed)
companions:
  - 21-mastra-repos-templates.md   # pattern map
  - 22-mastra-repos-extract-tasks.md  # extract tasks
scope: Authoritative list of every Mastra repo/template/guide we may reference, with verified status, license, maintainer, and extract decision
---

# Mastra Modules — Verified Reference Catalogue

> Every URL below was probed live on 2026-05-10. Verification column shows what was actually found vs what was claimed in earlier notes. Use this as the single source of truth before writing any code that vendors or references external Mastra material.

---

## A0. Global Rules (apply to every module below)

These rules are non-negotiable and override anything inferred from a source repo. They exist because every Mastra-adjacent repo is **someone else's product context** and must be re-evaluated against mdeAI's propose-only, RLS-first, Gemini-only stack before any code crosses the boundary.

| # | Rule | Why |
|---|---|---|
| 1 | **No Vendoring Community Repos.** Any repo without an explicit license, or maintained by an individual hackathon contributor, is **study-only**. We may copy *patterns* into our own files; we never `git clone` and merge their code. | Hackathon POCs (1–8 commits, no review) carry unknown bugs, unknown deps, unknown security posture. Mastra org repos and official templates are the only sources we vendor from. |
| 2 | **No License = No Use.** If the repo's GitHub page does not show a license badge, we treat it as "all rights reserved" — read for ideas only, no code reuse, even snippets. | Copyright defaults to the author. Re-publishing without a license is a legal risk, regardless of the source being public. |
| 3 | **No Autonomous Writes.** No agent, tool, or workflow ever writes directly to Supabase, Stripe, Infobip/WhatsApp, or OpenClaw. Every mutation goes through a typed Mastra tool wrapped in `withAudit()` and (for high-risk ops) gated by Paperclip approval. | mdeAI's propose-only contract is what protects bookings, payments, and customer messages. A single autonomous write erodes the whole trust model. |
| 4 | **No New Infrastructure (Week 1).** No Redis, Temporal, LangGraph, external vector DBs, Kubernetes, or new background-job runtimes. Stack stays Mastra + Supabase + Vercel. | Reviewer's #1 risk call. Adding a new system before product-market fit doubles ops cost without doubling user value. |
| 5 | **Canonical Priority Order.** When two sources teach the same pattern, pull from the higher-ranked source: |   |
|   | &nbsp;&nbsp;1. Official Mastra docs (`mastra.ai/docs`, `mastra.ai/guides`, `mastra.ai/reference`) | Authoritative, kept current with releases |
|   | &nbsp;&nbsp;2. Official Mastra repos (`github.com/mastra-ai/*`) | Maintained, reviewed, signed by core team |
|   | &nbsp;&nbsp;3. Official template hub (`mastra.ai/templates`) | Curated by Mastra; safe to reference |
|   | &nbsp;&nbsp;4. Official examples (`mastra-ai/mastra/examples/*`) | Living examples in the monorepo |
|   | &nbsp;&nbsp;5. Mastra-run workshops (`mastra-ai/*-workshop`) | Educational; learn from, don't depend on |
|   | &nbsp;&nbsp;6. Community repos with permissive license + commit count > 20 | Pattern reference only; never vendor |
|   | &nbsp;&nbsp;7. Hackathon POCs (any commit count, regardless of license) | Read once for inspiration; close the tab |

If a pattern is not present at tier 1–4 and only appears at tier 6–7, default behaviour is **build it ourselves** rather than vendor someone else's hackathon code.

---

## A. Verification Findings (the corrections that matter)

| Claim being corrected | Reality | Action |
|---|---|---|
| `mastra-ai/docs-chatbot-example` is the RAG reference | It's actually a **Next.js + CopilotKit** integration sample. RAG details NOT in README. | The proper RAG reference is `mastra-ai/template-docs-chatbot` (MCP-based). Use that. |
| `mastra-ai/template-deep-research` and `template-deep-search` are interchangeable | **Both URLs return content.** The official templates hub lists only `template-deep-search` at `/templates/deep-search`. | **`template-deep-search` is the canonical name. All mdeAI docs reference only that name.** If `template-deep-research` surfaces, treat it as a parallel/older variant and route the reader to `template-deep-search`. |
| Text-to-SQL template ships SQL validation + allowlists | README confirms schema introspection only. **Safety patterns are NOT documented.** | mdeAI must build its own allowlist + SELECT-only enforcement. Don't assume the template handles it. |
| `mastra-ai/template-docs-chatbot` does pgvector RAG | It uses an **MCP server** that retrieves from a static `functions.json` file via a `docs-tool`. **No vector store, no chunking, no embeddings out of the box.** | Use as MCP integration pattern only. Pull RAG primitives from `mastra-ai/mastra/examples/rag-*` instead. |
| `bhupesh-sf/mastra-governed-rag-template` is a production reference | It's a **hackathon proof-of-concept** (1 commit) using Qdrant. MIT license. | Excellent governance architecture to STUDY (multi-agent identity → policy → retrieval → verification). Do NOT vendor. |
| `sudo-vaibhav/mastra-template-evaluator` is production-ready | Hackathon project (8 commits, ISC license). | Useful pattern reference for MASTRA-011 evals. Treat as inspiration, not a dependency. |
| Browser Agent template is "browser session handling inspiration" | Uses **Stagehand by Browserbase** as the runtime. | Confirms reviewer's "explicit DO NOT USE" — OpenClaw owns browser execution in mdeAI. |
| WhatsApp guide uses Twilio | Uses **Meta WhatsApp Business API directly** (`graph.facebook.com`, `WHATSAPP_ACCESS_TOKEN`). mdeAI uses **Infobip**. | Adopt the 3-step shape; replace transport with Infobip. |
| `mastra-ai/mastra-triage` is a "routing/intent classification" reference (claimed in [21-mastra-repos-templates.md](21-mastra-repos-templates.md) §7) | It's actually a **GitHub issue triage system** that classifies issues by product area, assigns engineering squads, and syncs Discord ↔ GitHub. Domain-specific, not a generic chat-intent router. | Remove from "intent routing" extraction order. For ConciergeAgent routing patterns, use Mastra Core's own examples instead. |
| `mastra-ai/repo-base` is a "starter / folder organization reference" (claimed in [21-mastra-repos-templates.md](21-mastra-repos-templates.md) §8) | It's actually a **GitHub repository Q&A chatbot** (Next.js + Postgres + Gemini 2.5 Flash). Not a starter template. | Remove. For starters, `my-mastra-app/` already covers the structure. |
| `Sri01729/template-ai-storyboard-consistent-character` value to mdeAI | Multi-agent storyboard generator (5 specialized agents) with **11 custom eval metrics** + vision-based consistency checks. MIT license, 21 commits. **Not** applicable to concierge use cases. | Study only — useful eval-pattern reference for MASTRA-011 (custom scorers + vision-based quality checks). |

---

## B. Module Catalogue — Verified

Status legend:
- ✅ **Verified live** — content matches user's claim
- ⚠ **Verified but different from claim** — exists but content/scope differs from what was described
- 🟦 **Verified, hackathon/POC** — useful as study material, not production
- ❌ **Not verified** — URL not probed yet
- 🛑 **Skip** — confirmed do-not-use

### B.1 — Official Mastra repos & templates

| # | URL | Status | License | Tech | Score (real) | mdeAI use |
|---|---|---|---|---|---|---|
| 1 | [mastra-ai/mastra](https://github.com/mastra-ai/mastra) | ✅ | Mixed (Apache 2.0 + EE dual-license) | TS monorepo, 23.7k★ | 100/100 | Foundation. EXTRACT-01. |
| 2 | [mastra-ai/ui-dojo](https://github.com/mastra-ai/ui-dojo) | ✅ | Open source | Vite + pnpm + TS | 92/100 | Frontend reference. EXTRACT-02. |
| 3 | [mastra.ai/templates](https://mastra.ai/templates) | ✅ | — | 13 official templates listed | hub | Quarterly sweep. EXTRACT-10. |
| 4 | [template-deep-search](https://github.com/mastra-ai/template-deep-search) | ✅ canonical | Open | TS, Exa, OpenAI | 92/100 | Self-eval workflow. EXTRACT-05. |
| 5 | [template-deep-research](https://github.com/mastra-ai/template-deep-research) | ⚠ duplicate-ish | Open | TS, Exa, OpenAI, vNext workflows | 90/100 | Same patterns as #4; **prefer #4**. |
| 6 | [template-text-to-sql](https://github.com/mastra-ai/template-text-to-sql) | ✅ | Open | TS + SQLite, OpenAI | 78/100 (no documented safety) | Schema introspection shape. EXTRACT-03. |
| 7 | [template-docs-chatbot](https://github.com/mastra-ai/template-docs-chatbot) | ⚠ MCP not pgvector | Open | TS + MCP server + JSON file | 68/100 | MCP wiring reference only. EXTRACT-04 (revised). |
| 8 | [docs-chatbot-example](https://github.com/mastra-ai/docs-chatbot-example) | ⚠ different repo | Open | Next.js + CopilotKit | 55/100 | UI integration sample only. **Not a RAG reference**. |
| 9 | [template-browsing-agent](https://github.com/mastra-ai/template-browsing-agent) | 🛑 | Open | TS + Stagehand | — | Skip. EXTRACT-07. |
| 10 | [template-coding-agent](https://github.com/mastra-ai/template-coding-agent) | ✅ | Open | TS + Daytona/E2B sandboxes | 70/100 | Not a fit. mdeAI doesn't run agent-generated code. |
| 11 | [WhatsApp guide](https://mastra.ai/guides/guide/whatsapp-chat-bot) | ✅ | guide | TS + Meta Graph API | 82/100 | 3-step pipeline shape (defer). EXTRACT-06. |
| 12 | [AgentBrowser reference](https://mastra.ai/reference/browser/agent-browser) | 🛑 | reference | `vercel-labs/agent-browser` | — | Skip. EXTRACT-07. |
| 13 | [AI SDK UI guide](https://mastra.ai/guides/build-your-ui/ai-sdk-ui) | ✅ | guide | `@mastra/ai-sdk` server helpers | 95/100 | Server route wiring. EXTRACT-08. |

### B.2 — Community repos

> All in this section are hackathon/POC quality. Useful for pattern study, **not for vendoring**. License + commit count noted explicitly so future contributors don't mistake them for production references.

| # | URL | Status | License | Commits | Useful for |
|---|---|---|---|---|---|
| 14 | [bhupesh-sf/mastra-governed-rag-template](https://github.com/bhupesh-sf/mastra-governed-rag-template) | 🟦 hackathon | MIT | 1 | Multi-agent governance pipeline (identity → policy → retrieval → verification). Study for Paperclip approval design. |
| 15 | [sudo-vaibhav/mastra-template-evaluator](https://github.com/sudo-vaibhav/mastra-template-evaluator) | 🟦 hackathon | ISC | 8 | Multi-agent eval workflow (claims → plan → test → score). Study for MASTRA-011. |
| 16 | [cometchat/ai-agent-mastra-examples](https://github.com/cometchat/ai-agent-mastra-examples) | 🟦 demo | no license shown | — | 4 examples: Knowledge / Frontend Actions / Backend Tools / Orchestrator. Reference only. |
| 17 | [canedy/auth-mastra-template](https://github.com/canedy/auth-mastra-template) | 🟦 demo | no license shown | 10 | JWT + Ed25519 agent-to-service auth. mdeAI uses Supabase JWT — different model, but worth a 30-min read. |
| 18 | [BunsDev/mastra-starter](https://github.com/BunsDev/mastra-starter) | 🟦 starter | MIT | 4 | Basic starter. Skip — `my-mastra-app/` already covers this. |
| 19 | [koji/mastra-app-template](https://github.com/koji/mastra-app-template) | 🟦 starter | no license shown | 7 | Next.js + Assistant UI. Skip — mdeAI is Vite. |
| 20 | [wasp-lang/recipe-agent-saas-with-mastra](https://github.com/wasp-lang/recipe-agent-saas-with-mastra) | 🟦 demo | no license shown | 26 | Wasp + Stripe + S3 SaaS skeleton. Skip — frameworks don't match. |
| 21 | [tlolkema/ai-mastra-agent-workshop](https://github.com/tlolkema/ai-mastra-agent-workshop) | 🟦 workshop | open | — | Onboarding material for new contributors. Reference only. |
| 22 | [Sri01729/template-ai-storyboard-consistent-character](https://github.com/Sri01729/template-ai-storyboard-consistent-character) | 🟦 verified | MIT | 21 | 5 specialized agents + 11 custom eval metrics + vision-based consistency checks. **Study only** — eval-pattern reference for MASTRA-011. |
| 23 | [mastra-ai/mastra-triage](https://github.com/mastra-ai/mastra-triage) | ⚠ verified, **mis-described in 21-doc** | not specified | 100 | **GitHub issue triager**, not a chat-intent router. Routes GitHub issues to engineering squads, syncs Discord. Skip for ConciergeAgent — use Mastra Core examples instead. |
| 24 | [mastra-ai/repo-base](https://github.com/mastra-ai/repo-base) | ⚠ verified, **mis-described in 21-doc** | not specified | 84 | **GitHub repo Q&A chatbot** (Next.js + Postgres + Gemini 2.5 Flash), not a starter template. Skip — `my-mastra-app/` already covers starter structure. |

### B.3 — Mastra packages (npm) — verified installed in `my-mastra-app/`

| Package | Version | Status |
|---|---|---|
| `@mastra/core` | ^1.32.1 | ✅ installed |
| `@mastra/memory` | ^1.17.5 | ✅ installed |
| `@mastra/evals` | ^1.2.2 | ✅ installed |
| `@mastra/observability` | ^1.11.1 | ✅ installed |
| `@mastra/loggers` | latest | ✅ installed |
| `@mastra/pg` | ^1.10.0 | ✅ installed (MASTRA-002) |
| `@mastra/client-js` | ^1.17.1 | ✅ installed (MASTRA-002) |
| `@mastra/duckdb` | ^1.3.0 | ⚠ installed but to be removed (replaced by pgvector) |
| `@mastra/libsql` | ^1.10.0 | ⚠ installed but to be removed (replaced by `@mastra/pg`) |
| **`@mastra/ai-sdk`** | not installed | 🟥 needed for EXTRACT-08 / MASTRA-019 |
| `@mastra/browser` | not installed | 🛑 do not install (EXTRACT-07) |

---

## C. Recommended Extraction Order (verified, with revisions)

The user's proposed extraction order was **directionally correct** but a few entries needed adjustment based on verification:

| Order | Source | Why this position | Maps to MASTRA |
|---|---|---|---|
| 1 | Mastra Core (`mastra-ai/mastra`) | Foundation; every other extract assumes these shapes | 003, 004, 005, 011, 012, 015 |
| 2 | UI Dojo (`mastra-ai/ui-dojo`) | Vite-native; only frontend reference that matches mdeAI's bundler | 009, 016 |
| 3 | AI SDK UI guide | `@mastra/ai-sdk` is the missing piece between Mastra and the Vite app | 016, 019 |
| 4 | Deep Search (canonical: `template-deep-search`) | Self-eval loop is the exact Concierge workflow shape | 005, 012, 018 |
| 5 | Text-to-SQL (`template-text-to-sql`) | Analytics agent shape **with our own safety layer added** | 013, 015, future analytics agent |
| 6 | Docs Chatbot (`template-docs-chatbot`) | MCP wiring pattern only; **not** a pgvector reference | future MCP integration |
| 7 | Governed RAG (`bhupesh-sf/mastra-governed-rag-template`) | Multi-agent governance pipeline study — informs Paperclip approval design | 003, 018 (study only) |
| 8 | Template Evaluator (`sudo-vaibhav/mastra-template-evaluator`) | Multi-agent eval pattern study | 011 (study only) |
| 9 | WhatsApp guide | Defer build to Phase 2; document pattern only | future WhatsApp workflow |
| 10 | Browser Agent + community starters | Skip / reference only | none |

**Key revisions vs user's original list:**

- The user listed "Mastra Triage" at position 6 — `mastra-ai/mastra-triage` is now **verified** but its actual purpose is **GitHub issue triage** (classify issues, assign engineering squads, sync Discord), not generic chat-intent routing. **Removed from extraction order.** For ConciergeAgent routing patterns, use Mastra Core's own routing examples instead.
- `mastra-ai/repo-base` was previously cited as a "starter / folder organization reference" — **verified to be a GitHub repo Q&A chatbot, not a starter**. Removed from extraction order. `my-mastra-app/` already covers starter structure.
- Governed RAG inserted at position 7 — the multi-agent governance pipeline is genuinely valuable for Paperclip design even if the repo itself is hackathon-grade.
- Storyboard repo (#22) added as position-7-tier study material **only for MASTRA-011 evals** (11 custom metrics + vision-based consistency pattern).
- "Community repos" merged into a single position 10 (skip / reference only) since none are production-grade.

---

## D. Per-Module Reuse Decision (final)

| Module | Reuse decision | One-line rationale |
|---|---|---|
| `mastra-ai/mastra` | **Vendor patterns** (5 reference snippets) | Foundation; no substitute |
| `mastra-ai/ui-dojo` | **Reference only** (no code copy) | Patterns documented, components stay shadcn/ui |
| `template-deep-search` | **Vendor workflow shape** | Self-eval loop is unique to this template |
| `template-text-to-sql` | **Vendor introspect shape, build own safety** | Template lacks documented safety |
| `template-docs-chatbot` | **MCP wiring reference only** | No actual RAG; pull RAG from Mastra Core examples |
| `template-browsing-agent` | **Skip** | OpenClaw owns browser execution |
| `template-coding-agent` | **Skip** | mdeAI does not run agent-generated code |
| `docs-chatbot-example` | **Skip** | Next.js+CopilotKit integration sample, not RAG |
| `bhupesh-sf/mastra-governed-rag-template` | **Study only** | Hackathon POC, but governance pipeline is informative |
| `sudo-vaibhav/mastra-template-evaluator` | **Study only** | Hackathon eval pattern reference |
| `cometchat/...` | **Skip** | No license, demo quality |
| `canedy/auth-mastra-template` | **Skip** | mdeAI auth is Supabase, not custom JWT |
| `BunsDev/mastra-starter` | **Skip** | `my-mastra-app/` covers this |
| `koji/mastra-app-template` | **Skip** | Next.js, not Vite |
| `wasp-lang/...` | **Skip** | Frameworks don't match |
| `tlolkema/...workshop` | **Onboarding material** | Link from runbook only |
| `Sri01729/...storyboard` | **Verify first, then decide** | Not yet probed |
| WhatsApp guide | **Doc pattern, defer build** | Phase 2 |
| AgentBrowser reference | **Skip** | OpenClaw owns this |
| AI SDK UI guide | **Vendor server route helpers** | Required for streaming chat |
| Mastra templates hub | **Quarterly sweep** | Reference only |

---

## D2. MVP Allowed Templates (Week 1 vs Week 2+ vs Skip)

This is the operational read of §A0 and §C. If a template isn't in column 1, it does not ship in Week 1 — full stop.

| Week 1 (vendor patterns) | Week 2+ (study, then vendor) | Skip / Reference Only |
|---|---|---|
| `mastra-ai/mastra` (Core shapes) | `template-text-to-sql` (internal/operator only — never end-user NL→SQL) | `template-browsing-agent` — OpenClaw owns browsers |
| `mastra-ai/ui-dojo` (**reference only** — patterns documented, no components copied) | `template-deep-search` (async/offline ops use only — not Concierge live path in MVP) | `template-coding-agent` — mdeAI doesn't run agent-generated code |
| AI SDK UI guide (`@mastra/ai-sdk` server helpers) | `template-docs-chatbot` (MCP wiring only, **not** RAG) | `docs-chatbot-example` (Next.js + CopilotKit only) |
|   | WhatsApp guide (3-step pipeline, **doc only**, build is Phase 2 with Infobip) | `bhupesh-sf/mastra-governed-rag-template` — hackathon POC, study Paperclip pattern only |
|   |   | `sudo-vaibhav/mastra-template-evaluator` — hackathon eval reference, study only |
|   |   | `Sri01729/template-ai-storyboard-consistent-character` — eval-pattern study for MASTRA-011 only |
|   |   | `mastra-ai/mastra-triage` — GitHub issue triager, not a chat-intent router |
|   |   | `mastra-ai/repo-base` — GitHub repo Q&A bot, not a starter |
|   |   | `cometchat/*`, `canedy/*`, `BunsDev/*`, `koji/*`, `wasp-lang/*` — license/scope mismatch |
|   |   | `tlolkema/...workshop` — onboarding link only |

**Hard rules implied by this table:**

- `template-deep-search` is the **canonical** name. The doc no longer mentions `template-deep-research` as a separate option — if/when someone surfaces it, treat it as a duplicate and route to `template-deep-search`.
- **UI Dojo is reference patterns only.** mdeAI keeps shadcn/ui as its component source of truth. We document UI Dojo's loading/streaming/HITL state ideas in our runbook; we do not import its components, its theme, its routing, or its component library.
- **Text-to-SQL** is **internal/operator-only** in Phase 2. There is no end-user natural-language-to-SQL path in MVP, ever. Any analytics agent we build serves Patricia (operator dashboards), never Camila (end user).
- **Deep Search** in Phase 2 runs **asynchronously / offline only** initially (e.g., scheduled trip-research jobs, sponsor brand-fit reports). The Concierge live chat path uses the lightweight Mastra Core search → eval shape, not the full Deep Search Exa-style loop.

---

## E. Lock-Ins (don't relitigate these)

These decisions came out of source verification + reviewer feedback. They're locked unless new evidence appears.

1. **`@mastra/ai-sdk` is the server-side glue, `@mastra/client-js` is the browser-side SDK.** The reviewer's "Mastra Client SDK + Vercel AI SDK" simplification missed `@mastra/ai-sdk`. Both Mastra packages are needed.
2. **`template-docs-chatbot` is NOT a pgvector RAG reference.** It's an MCP server retrieving from a JSON file. For RAG, use Mastra Core's `examples/rag-*` directly.
3. **`template-deep-search` is canonical.** `template-deep-research` may exist but is not on the templates hub.
4. **OpenClaw is the only browser execution layer.** No `@mastra/browser`, no Stagehand, no AgentBrowser tools.
5. **All community repos require their own verification before any code reference.** Hackathon POCs ≠ production references.
6. **`template-text-to-sql` does not enforce SELECT-only or allowlists** out of the box. mdeAI builds its own.
7. **WhatsApp transport replacement: Meta Graph API → Infobip.** Pattern shape preserved; auth + endpoint changes.
8. **Phase 1 agent set: Router + Concierge + Real-Estate + Events only.** No WhatsApp / Sponsor / Restaurants agents in MVP.

---

## F. Open Verification Tasks

All four items below are **resolved as of 2026-05-10**. Kept here as a record of what was probed and the outcome.

1. ~~Probe `Sri01729/template-ai-storyboard-consistent-character`~~ — ✅ probed; **Study only** for MASTRA-011 evals (11 custom metrics + vision-based consistency). MIT, 21 commits.
2. ~~Probe `mastra-ai/mastra-triage`~~ — ✅ probed; **Skip for ConciergeAgent.** It's a GitHub issue triager (engineering squad routing + Discord sync), not a chat-intent router. 21-doc description was wrong; corrected here.
3. ~~Confirm `mastra-ai/repo-base` URL~~ — ✅ probed; **Skip.** It's a GitHub repo Q&A chatbot (Next.js + Postgres + Gemini 2.5 Flash), not a starter template. 21-doc description was wrong; corrected here.
4. ~~Audit `cometchat/ai-agent-mastra-examples` Orchestrator example~~ — ✅ resolved; no license shown → **§A0 rule 2 applies (No License = No Use)**. Read for ideas, no code reference.

If a future verification need arises, open a fresh row above this one rather than reopening these.

---

## G. Where This Doc Plugs Into the Workflow

- **Before opening any new EXTRACT task:** Check this catalogue for verification status.
- **Before vendoring code from a repo:** Confirm "Reuse decision" column says "Vendor" not "Study only" or "Skip".
- **Before referencing a community repo in a PR:** Confirm license is shown and acceptable, and commit count > 20 (rough heuristic for "not abandoned").
- **Quarterly:** Sweep [mastra.ai/templates](https://mastra.ai/templates) and re-verify all entries here.

---

## H. Sources (verified live 2026-05-10)

- [mastra-ai/mastra](https://github.com/mastra-ai/mastra) — verified, 23.7k stars
- [mastra-ai/ui-dojo](https://github.com/mastra-ai/ui-dojo) — verified, Vite + pnpm
- [mastra.ai/templates](https://mastra.ai/templates) — verified, 13 official templates
- [mastra-ai/template-deep-search](https://github.com/mastra-ai/template-deep-search) — verified
- [mastra-ai/template-deep-research](https://github.com/mastra-ai/template-deep-research) — verified, 33 stars
- [mastra-ai/template-text-to-sql](https://github.com/mastra-ai/template-text-to-sql) — verified, 25 stars
- [mastra-ai/template-docs-chatbot](https://github.com/mastra-ai/template-docs-chatbot) — verified, MCP-based
- [mastra-ai/docs-chatbot-example](https://github.com/mastra-ai/docs-chatbot-example) — verified, Next.js + CopilotKit
- [mastra-ai/template-browsing-agent](https://github.com/mastra-ai/template-browsing-agent) — verified, Stagehand
- [mastra-ai/template-coding-agent](https://github.com/mastra-ai/template-coding-agent) — verified, 45 stars
- [mastra.ai/guides/guide/whatsapp-chat-bot](https://mastra.ai/guides/guide/whatsapp-chat-bot) — verified, Meta Graph API
- [mastra.ai/reference/browser/agent-browser](https://mastra.ai/reference/browser/agent-browser) — verified, Stagehand-adjacent
- [mastra.ai/guides/build-your-ui/ai-sdk-ui](https://mastra.ai/guides/build-your-ui/ai-sdk-ui) — verified, `@mastra/ai-sdk`
- [bhupesh-sf/mastra-governed-rag-template](https://github.com/bhupesh-sf/mastra-governed-rag-template) — verified, MIT, 1 commit
- [sudo-vaibhav/mastra-template-evaluator](https://github.com/sudo-vaibhav/mastra-template-evaluator) — verified, ISC, 8 commits
- [cometchat/ai-agent-mastra-examples](https://github.com/cometchat/ai-agent-mastra-examples) — verified, no license shown
- [canedy/auth-mastra-template](https://github.com/canedy/auth-mastra-template) — verified, no license shown, 10 commits
- [BunsDev/mastra-starter](https://github.com/BunsDev/mastra-starter) — verified, MIT, 4 commits
- [koji/mastra-app-template](https://github.com/koji/mastra-app-template) — verified, no license shown, 7 commits
- [wasp-lang/recipe-agent-saas-with-mastra](https://github.com/wasp-lang/recipe-agent-saas-with-mastra) — verified, no license shown, 26 commits
- [tlolkema/ai-mastra-agent-workshop](https://github.com/tlolkema/ai-mastra-agent-workshop) — verified
